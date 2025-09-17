/**
 * Modales para acciones de moderación
 */
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationLog = require('../schema/ModerationLog');
const UserModerationStats = require('../schema/UserModerationStats');
const ModerationConfig = require('../schema/ModerationConfig');
const { validateAdminPermissions } = require('../utils/validators');

module.exports = {
    data: {
        name: "moderationModals",
    },

    /**
     * Maneja los modales de moderación
     * @param {import('discord.js').ModalSubmitInteraction} interaction 
     * @param {import('discord.js').Client} client 
     */
    async execute(interaction, client) {
        try {
            const [action, modalType, targetUserId] = interaction.customId.split('_');
            const targetUser = await client.users.fetch(targetUserId);
            const targetMember = interaction.guild.members.cache.get(targetUserId);

            // Verificar permisos
            const managerRole = process.env.rolceo;
            if (!validateAdminPermissions(interaction.member, [managerRole])) {
                return interaction.reply({
                    content: '🚫 No tienes permisos para realizar esta acción.',
                    ephemeral: true
                });
            }

            // Verificar que el usuario objetivo existe
            if (!targetMember) {
                return interaction.reply({
                    content: '❌ El usuario no está en el servidor.',
                    ephemeral: true
                });
            }

            // Verificar jerarquía
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    content: '❌ No puedes moderar a un usuario con igual o mayor jerarquía.',
                    ephemeral: true
                });
            }

            switch (action) {
                case 'strike':
                    await this.processStrike(interaction, targetUser, targetMember);
                    break;
                case 'kick':
                    await this.processKick(interaction, targetUser, targetMember);
                    break;
                case 'mute':
                    await this.processMute(interaction, targetUser, targetMember);
                    break;
                case 'ban':
                    await this.processBan(interaction, targetUser, targetMember);
                    break;
                case 'warn':
                    await this.processWarn(interaction, targetUser, targetMember);
                    break;
                case 'timeout':
                    await this.processTimeout(interaction, targetUser, targetMember);
                    break;
            }

        } catch (error) {
            console.error('❌ Error en moderationModals:', error);
            await interaction.reply({
                content: '❌ Error al procesar la acción de moderación.',
                ephemeral: true
            });
        }
    },

    async processStrike(interaction, targetUser, targetMember) {
        const reason = interaction.fields.getTextInputValue('strike_reason');
        const durationStr = interaction.fields.getTextInputValue('strike_duration');
        const duration = durationStr ? parseInt(durationStr) : null;

        // Generar ID de caso único
        const caseId = `STRIKE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Defer reply para evitar timeout de interacción
            await interaction.deferReply({ ephemeral: true });
            // Crear log de moderación
            const moderationLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.username,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                action: 'strike',
                reason: reason,
                duration: duration,
                caseId: caseId
            });
            await moderationLog.save();

            // Actualizar estadísticas del usuario
            await this.updateUserStats(interaction.guild.id, targetUser.id, 'strike', interaction.client, interaction.user.id);

            // Enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⚡ Has recibido un Strike')
                    .setDescription(`Has recibido un strike en **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Razón', value: reason, inline: false },
                        { name: 'Moderador', value: interaction.user.username, inline: true },
                        { name: 'Caso', value: caseId, inline: true }
                    )
                    .setColor('#ff4444')
                    .setTimestamp();

                if (duration) {
                    dmEmbed.addFields({ name: 'Duración', value: `${duration} minutos`, inline: true });
                }

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Log en canal configurado
            await this.logModerationAction(interaction, targetUser, 'strike', reason, caseId, duration);

            // Respuesta al moderador
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Strike Aplicado')
                .setDescription(`Se ha aplicado un strike a **${targetUser.username}**`)
                .addFields(
                    { name: 'Razón', value: reason, inline: false },
                    { name: 'Caso', value: caseId, inline: true }
                )
                .setColor('#097b5a')
                .setTimestamp();

            if (duration) {
                successEmbed.addFields({ name: 'Duración', value: `${duration} minutos`, inline: true });
            }

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error al procesar strike:', error);
            await interaction.editReply({
                content: '❌ Error al aplicar el strike.'
            });
        }
    },

    async processKick(interaction, targetUser, targetMember) {
        const reason = interaction.fields.getTextInputValue('kick_reason');
        const caseId = `KICK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Defer reply para evitar timeout de interacción
            await interaction.deferReply({ ephemeral: true });
            // Crear log de moderación
            const moderationLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.username,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                action: 'kick',
                reason: reason,
                caseId: caseId
            });
            await moderationLog.save();

            // Actualizar estadísticas del usuario
            await this.updateUserStats(interaction.guild.id, targetUser.id, 'kick', interaction.client, interaction.user.id);

            // Enviar DM al usuario antes del kick
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('👢 Has sido expulsado')
                    .setDescription(`Has sido expulsado de **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Razón', value: reason, inline: false },
                        { name: 'Moderador', value: interaction.user.username, inline: true },
                        { name: 'Caso', value: caseId, inline: true }
                    )
                    .setColor('#ff4444')
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Expulsar al usuario
            await targetMember.kick(reason);

            // Log en canal configurado
            await this.logModerationAction(interaction, targetUser, 'kick', reason, caseId);

            // Respuesta al moderador
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Usuario Expulsado')
                .setDescription(`**${targetUser.username}** ha sido expulsado del servidor`)
                .addFields(
                    { name: 'Razón', value: reason, inline: false },
                    { name: 'Caso', value: caseId, inline: true }
                )
                .setColor('#097b5a')
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error al procesar kick:', error);
            await interaction.editReply({
                content: '❌ Error al expulsar al usuario.'
            });
        }
    },

    async processMute(interaction, targetUser, targetMember) {
        const reason = interaction.fields.getTextInputValue('mute_reason');
        const duration = parseInt(interaction.fields.getTextInputValue('mute_duration'));
        const caseId = `MUTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Defer reply para evitar timeout de interacción
            await interaction.deferReply({ ephemeral: true });
            // Obtener configuración para el rol de mute
            const config = await ModerationConfig.findOne({ guildId: interaction.guild.id });
            const muteRoleId = config?.roles?.muted;

            let muteMethod = 'timeout'; // Por defecto usar timeout nativo

            if (muteRoleId) {
                const muteRole = interaction.guild.roles.cache.get(muteRoleId);
                if (muteRole) {
                    muteMethod = 'role'; // Usar rol si está configurado
                }
            }

            // Crear log de moderación
            const moderationLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.username,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                action: 'mute',
                reason: reason,
                duration: duration,
                caseId: caseId
            });
            await moderationLog.save();

            // Actualizar estadísticas del usuario
            await this.updateUserStats(interaction.guild.id, targetUser.id, 'mute', interaction.client, interaction.user.id);

            // Aplicar mute según el método configurado
            if (muteMethod === 'role') {
                const muteRole = interaction.guild.roles.cache.get(muteRoleId);
                await targetMember.roles.add(muteRole, reason);
            } else {
                // Usar timeout nativo de Discord (más confiable)
                const timeoutDuration = duration * 60 * 1000; // Convertir a milisegundos
                await targetMember.timeout(timeoutDuration, reason);
            }

            // Enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔇 Has sido muteado')
                    .setDescription(`Has sido muteado en **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Razón', value: reason, inline: false },
                        { name: 'Duración', value: `${duration} minutos`, inline: true },
                        { name: 'Moderador', value: interaction.user.username, inline: true },
                        { name: 'Caso', value: caseId, inline: true }
                    )
                    .setColor('#ff4444')
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Log en canal configurado
            await this.logModerationAction(interaction, targetUser, 'mute', reason, caseId, duration);

            // Respuesta al moderador
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Usuario Muteado')
                .setDescription(`**${targetUser.username}** ha sido muteado usando ${muteMethod === 'role' ? 'rol personalizado' : 'timeout nativo'}`)
                .addFields(
                    { name: 'Razón', value: reason, inline: false },
                    { name: 'Duración', value: `${duration} minutos`, inline: true },
                    { name: 'Método', value: muteMethod === 'role' ? 'Rol de Mute' : 'Timeout Nativo', inline: true },
                    { name: 'Caso', value: caseId, inline: true }
                )
                .setColor('#097b5a')
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error al procesar mute:', error);
            await interaction.editReply({
                content: '❌ Error al mutear al usuario.'
            });
        }
    },

    async processBan(interaction, targetUser, targetMember) {
        const reason = interaction.fields.getTextInputValue('ban_reason');
        const durationStr = interaction.fields.getTextInputValue('ban_duration');
        const duration = durationStr ? parseInt(durationStr) : null;
        const caseId = `BAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Defer reply para evitar timeout de interacción
            await interaction.deferReply({ ephemeral: true });
            // Crear log de moderación
            const moderationLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.username,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                action: 'ban',
                reason: reason,
                duration: duration,
                caseId: caseId
            });
            await moderationLog.save();

            // Actualizar estadísticas del usuario
            await this.updateUserStats(interaction.guild.id, targetUser.id, 'ban', interaction.client, interaction.user.id);

            // Enviar DM al usuario antes del ban
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔨 Has sido baneado')
                    .setDescription(`Has sido baneado de **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Razón', value: reason, inline: false },
                        { name: 'Moderador', value: interaction.user.username, inline: true },
                        { name: 'Caso', value: caseId, inline: true }
                    )
                    .setColor('#ff4444')
                    .setTimestamp();

                if (duration) {
                    dmEmbed.addFields({ name: 'Duración', value: `${duration} días`, inline: true });
                }

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Banear al usuario
            await targetMember.ban({ reason: reason, deleteMessageDays: 7 });

            // Log en canal configurado
            await this.logModerationAction(interaction, targetUser, 'ban', reason, caseId, duration);

            // Respuesta al moderador
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Usuario Baneado')
                .setDescription(`**${targetUser.username}** ha sido baneado del servidor`)
                .addFields(
                    { name: 'Razón', value: reason, inline: false },
                    { name: 'Caso', value: caseId, inline: true }
                )
                .setColor('#097b5a')
                .setTimestamp();

            if (duration) {
                successEmbed.addFields({ name: 'Duración', value: `${duration} días`, inline: true });
            }

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error al procesar ban:', error);
            await interaction.editReply({
                content: '❌ Error al banear al usuario.'
            });
        }
    },

    async processWarn(interaction, targetUser, targetMember) {
        const reason = interaction.fields.getTextInputValue('warn_reason');
        const caseId = `WARN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Defer reply para evitar timeout de interacción
            await interaction.deferReply({ ephemeral: true });
            // Crear log de moderación
            const moderationLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.username,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                action: 'warn',
                reason: reason,
                caseId: caseId
            });
            await moderationLog.save();

            // Actualizar estadísticas del usuario
            await this.updateUserStats(interaction.guild.id, targetUser.id, 'warn', interaction.client, interaction.user.id);

            // Enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Has recibido una advertencia')
                    .setDescription(`Has recibido una advertencia en **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Razón', value: reason, inline: false },
                        { name: 'Moderador', value: interaction.user.username, inline: true },
                        { name: 'Caso', value: caseId, inline: true }
                    )
                    .setColor('#ffaa00')
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Log en canal configurado
            await this.logModerationAction(interaction, targetUser, 'warn', reason, caseId);

            // Respuesta al moderador
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Advertencia Aplicada')
                .setDescription(`Se ha aplicado una advertencia a **${targetUser.username}**`)
                .addFields(
                    { name: 'Razón', value: reason, inline: false },
                    { name: 'Caso', value: caseId, inline: true }
                )
                .setColor('#097b5a')
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error al procesar warn:', error);
            await interaction.editReply({
                content: '❌ Error al aplicar la advertencia.'
            });
        }
    },

    async processTimeout(interaction, targetUser, targetMember) {
        const reason = interaction.fields.getTextInputValue('timeout_reason');
        const duration = parseInt(interaction.fields.getTextInputValue('timeout_duration'));
        const caseId = `TIMEOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Validar duración (máximo 28 días)
        if (duration > 40320) {
            return interaction.reply({
                content: '❌ La duración máxima para timeout es 40320 minutos (28 días).',
                ephemeral: true
            });
        }

        try {
            // Defer reply para evitar timeout de interacción
            await interaction.deferReply({ ephemeral: true });
            
            
            // Crear log de moderación
            const moderationLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.username,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                action: 'timeout',
                reason: reason,
                duration: duration,
                caseId: caseId
            });
            await moderationLog.save();

            // Actualizar estadísticas del usuario
            await this.updateUserStats(interaction.guild.id, targetUser.id, 'timeout', interaction.client, interaction.user.id);

            // Aplicar timeout
            const timeoutUntil = new Date(Date.now() + duration * 60 * 1000);
            await targetMember.timeout(duration * 60 * 1000, reason);

            // Enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⏰ Has sido puesto en timeout')
                    .setDescription(`Has sido puesto en timeout en **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Razón', value: reason, inline: false },
                        { name: 'Duración', value: `${duration} minutos`, inline: true },
                        { name: 'Moderador', value: interaction.user.username, inline: true },
                        { name: 'Caso', value: caseId, inline: true }
                    )
                    .setColor('#ff4444')
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Log en canal configurado
            await this.logModerationAction(interaction, targetUser, 'timeout', reason, caseId, duration);

            // Respuesta al moderador
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Usuario en Timeout')
                .setDescription(`**${targetUser.username}** ha sido puesto en timeout`)
                .addFields(
                    { name: 'Razón', value: reason, inline: false },
                    { name: 'Duración', value: `${duration} minutos`, inline: true },
                    { name: 'Caso', value: caseId, inline: true }
                )
                .setColor('#097b5a')
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error al procesar timeout:', error);
            await interaction.editReply({
                content: '❌ Error al poner en timeout al usuario.'
            });
        }
    },

    async updateUserStats(guildId, userId, action, client, moderatorId) {
        let userStats = await UserModerationStats.findOne({ guildId, userId });
        
        if (!userStats) {
            const user = await client.users.fetch(userId);
            userStats = new UserModerationStats({
                guildId,
                userId,
                username: user.username
            });
        }

        // Mapeo de acciones a campos de estadísticas
        const actionFieldMap = {
            'strike': 'strikes',
            'warn': 'warnings',
            'kick': 'kicks',
            'mute': 'mutes',
            'timeout': 'timeouts',
            'ban': 'bans'
        };

        // Incrementar contador de la acción
        const fieldName = actionFieldMap[action] || action + 's';
        userStats[fieldName] = (userStats[fieldName] || 0) + 1;
        
        userStats.lastAction = action;
        userStats.lastActionDate = new Date();
        userStats.lastModerator = moderatorId;

        // Actualizar estado según la acción
        if (action === 'mute') {
            userStats.isMuted = true;
        } else if (action === 'ban') {
            userStats.isBanned = true;
        }

        await userStats.save();
    },

    async logModerationAction(interaction, targetUser, action, reason, caseId, duration = null) {
        try {
            const config = await ModerationConfig.findOne({ guildId: interaction.guild.id });
            if (!config) return;

            // Determinar canal de log
            let logChannelId = config.logChannels[action] || config.logChannels.general;
            if (!logChannelId) return;

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            // Crear embed de log
            const logEmbed = new EmbedBuilder()
                .setTitle(`🔨 ${action.toUpperCase()} - ${targetUser.username}`)
                .setColor(this.getActionColor(action))
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Usuario', value: `${targetUser.username}#${targetUser.discriminator}\n<@${targetUser.id}>`, inline: true },
                    { name: '👨‍💼 Moderador', value: `${interaction.user.username}\n<@${interaction.user.id}>`, inline: true },
                    { name: '📝 Razón', value: reason, inline: false },
                    { name: '🆔 Caso', value: caseId, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de Moderación', iconURL: interaction.client.user.displayAvatarURL() });

            if (duration) {
                const durationText = action === 'ban' ? `${duration} días` : `${duration} minutos`;
                logEmbed.addFields({ name: '⏰ Duración', value: durationText, inline: true });
            }

            await logChannel.send({ embeds: [logEmbed] });

        } catch (error) {
            console.error('Error al enviar log de moderación:', error);
        }
    },

    getActionColor(action) {
        const colors = {
            strike: '#ff4444',
            kick: '#ff8800',
            mute: '#ffaa00',
            ban: '#cc0000',
            warn: '#ffaa00',
            timeout: '#ff4444',
            unmute: '#097b5a',
            unban: '#097b5a',
            untimeout: '#097b5a'
        };
        return colors[action] || '#ff4444';
    }
};
