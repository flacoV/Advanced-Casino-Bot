/**
 * Comando para remover sanciones de moderación
 */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationLog = require('../../schema/ModerationLog');
const UserModerationStats = require('../../schema/UserModerationStats');
const ModerationConfig = require('../../schema/ModerationConfig');
const { validateAdminPermissions } = require('../../utils/validators');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remover-sancion')
        .setDescription('Remueve una sanción de moderación')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario al que remover la sanción')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de sanción a remover')
                .setRequired(true)
                .addChoices(
                    { name: 'Mute', value: 'mute' },
                    { name: 'Ban', value: 'ban' },
                    { name: 'Timeout', value: 'timeout' }
                ))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón para remover la sanción')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Verificar permisos de administrador
            const managerRole = process.env.rolceo;
            if (!validateAdminPermissions(interaction.member, [managerRole])) {
                return interaction.reply({
                    content: '🚫 No tienes permisos para usar este comando.',
                    ephemeral: true
                });
            }

            const targetUser = interaction.options.getUser('usuario');
            const sanctionType = interaction.options.getString('tipo');
            const reason = interaction.options.getString('razon');

            await interaction.deferReply({ ephemeral: true });

            // Verificar que el usuario objetivo existe
            const targetMember = interaction.guild.members.cache.get(targetUser.id);
            if (!targetMember && sanctionType !== 'ban') {
                return interaction.editReply({
                    content: '❌ El usuario no está en el servidor.'
                });
            }

            // Verificar jerarquía
            if (targetMember && targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.editReply({
                    content: '❌ No puedes remover sanciones de un usuario con igual o mayor jerarquía.'
                });
            }

            // Procesar la remoción según el tipo
            switch (sanctionType) {
                case 'mute':
                    await this.removeMute(interaction, targetUser, targetMember, reason);
                    break;
                case 'ban':
                    await this.removeBan(interaction, targetUser, reason);
                    break;
                case 'timeout':
                    await this.removeTimeout(interaction, targetUser, targetMember, reason);
                    break;
            }

        } catch (error) {
            console.error('❌ Error en comando remover-sancion:', error);
            await interaction.editReply({
                content: '❌ Error al remover la sanción.'
            });
        }
    },

    async removeMute(interaction, targetUser, targetMember, reason) {
        try {
            // Obtener configuración para el rol de mute
            const config = await ModerationConfig.findOne({ guildId: interaction.guild.id });
            const muteRoleId = config?.roles?.muted;

            if (!muteRoleId) {
                return interaction.editReply({
                    content: '❌ No se ha configurado un rol de mute. Usa `/configurar-moderacion roles` para configurarlo.'
                });
            }

            const muteRole = interaction.guild.roles.cache.get(muteRoleId);
            if (!muteRole) {
                return interaction.editReply({
                    content: '❌ El rol de mute configurado no existe.'
                });
            }

            // Verificar si el usuario tiene el rol de mute
            if (!targetMember.roles.cache.has(muteRoleId)) {
                return interaction.editReply({
                    content: '❌ El usuario no está muteado.'
                });
            }

            // Remover el rol de mute
            await targetMember.roles.remove(muteRole, reason);

            // Actualizar estadísticas del usuario
            let userStats = await UserModerationStats.findOne({ 
                guildId: interaction.guild.id, 
                userId: targetUser.id 
            });

            if (userStats) {
                userStats.isMuted = false;
                userStats.muteExpiresAt = null;
                await userStats.save();
            }

            // Crear log de remoción
            const caseId = `UNMUTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const moderationLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.username,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                action: 'unmute',
                reason: reason,
                caseId: caseId
            });
            await moderationLog.save();

            // Enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔓 Mute Removido')
                    .setDescription(`Tu mute ha sido removido en **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Razón', value: reason, inline: false },
                        { name: 'Moderador', value: interaction.user.username, inline: true },
                        { name: 'Caso', value: caseId, inline: true }
                    )
                    .setColor('#097b5a')
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Log en canal configurado
            await this.logSanctionRemoval(interaction, targetUser, 'unmute', reason, caseId);

            // Respuesta al moderador
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Mute Removido')
                .setDescription(`El mute de **${targetUser.username}** ha sido removido`)
                .addFields(
                    { name: 'Razón', value: reason, inline: false },
                    { name: 'Caso', value: caseId, inline: true }
                )
                .setColor('#097b5a')
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error al remover mute:', error);
            await interaction.editReply({
                content: '❌ Error al remover el mute del usuario.'
            });
        }
    },

    async removeBan(interaction, targetUser, reason) {
        try {
            // Verificar si el usuario está baneado
            const banList = await interaction.guild.bans.fetch();
            const isBanned = banList.has(targetUser.id);

            if (!isBanned) {
                return interaction.editReply({
                    content: '❌ El usuario no está baneado.'
                });
            }

            // Remover el ban
            await interaction.guild.members.unban(targetUser, reason);

            // Actualizar estadísticas del usuario
            let userStats = await UserModerationStats.findOne({ 
                guildId: interaction.guild.id, 
                userId: targetUser.id 
            });

            if (userStats) {
                userStats.isBanned = false;
                await userStats.save();
            }

            // Crear log de remoción
            const caseId = `UNBAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const moderationLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.username,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                action: 'unban',
                reason: reason,
                caseId: caseId
            });
            await moderationLog.save();

            // Enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔓 Ban Removido')
                    .setDescription(`Tu ban ha sido removido en **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Razón', value: reason, inline: false },
                        { name: 'Moderador', value: interaction.user.username, inline: true },
                        { name: 'Caso', value: caseId, inline: true }
                    )
                    .setColor('#097b5a')
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Log en canal configurado
            await this.logSanctionRemoval(interaction, targetUser, 'unban', reason, caseId);

            // Respuesta al moderador
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Ban Removido')
                .setDescription(`El ban de **${targetUser.username}** ha sido removido`)
                .addFields(
                    { name: 'Razón', value: reason, inline: false },
                    { name: 'Caso', value: caseId, inline: true }
                )
                .setColor('#097b5a')
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error al remover ban:', error);
            await interaction.editReply({
                content: '❌ Error al remover el ban del usuario.'
            });
        }
    },

    async removeTimeout(interaction, targetUser, targetMember, reason) {
        try {
            // Verificar si el usuario está en timeout
            if (!targetMember.communicationDisabledUntil || targetMember.communicationDisabledUntil < new Date()) {
                return interaction.editReply({
                    content: '❌ El usuario no está en timeout.'
                });
            }

            // Remover el timeout
            await targetMember.timeout(null, reason);

            // Crear log de remoción
            const caseId = `UNTIMEOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const moderationLog = new ModerationLog({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.username,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                action: 'untimeout',
                reason: reason,
                caseId: caseId
            });
            await moderationLog.save();

            // Enviar DM al usuario
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🔓 Timeout Removido')
                    .setDescription(`Tu timeout ha sido removido en **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Razón', value: reason, inline: false },
                        { name: 'Moderador', value: interaction.user.username, inline: true },
                        { name: 'Caso', value: caseId, inline: true }
                    )
                    .setColor('#097b5a')
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario');
            }

            // Log en canal configurado
            await this.logSanctionRemoval(interaction, targetUser, 'untimeout', reason, caseId);

            // Respuesta al moderador
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Timeout Removido')
                .setDescription(`El timeout de **${targetUser.username}** ha sido removido`)
                .addFields(
                    { name: 'Razón', value: reason, inline: false },
                    { name: 'Caso', value: caseId, inline: true }
                )
                .setColor('#097b5a')
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error al remover timeout:', error);
            await interaction.editReply({
                content: '❌ Error al remover el timeout del usuario.'
            });
        }
    },

    async logSanctionRemoval(interaction, targetUser, action, reason, caseId) {
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
                .setTitle(`✅ ${action.toUpperCase()} - ${targetUser.username}`)
                .setColor('#097b5a')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Usuario', value: `${targetUser.username}#${targetUser.discriminator}\n<@${targetUser.id}>`, inline: true },
                    { name: '👨‍💼 Moderador', value: `${interaction.user.username}\n<@${interaction.user.id}>`, inline: true },
                    { name: '📝 Razón', value: reason, inline: false },
                    { name: '🆔 Caso', value: caseId, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Sistema de Moderación', iconURL: interaction.client.user.displayAvatarURL() });

            await logChannel.send({ embeds: [logEmbed] });

        } catch (error) {
            console.error('Error al enviar log de remoción de sanción:', error);
        }
    }
};
