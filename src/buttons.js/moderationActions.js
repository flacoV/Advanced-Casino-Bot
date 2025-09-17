/**
 * Botones para acciones de moderación
 */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const ModerationLog = require('../schema/ModerationLog');
const UserModerationStats = require('../schema/UserModerationStats');
const ModerationConfig = require('../schema/ModerationConfig');
const { validateAdminPermissions } = require('../utils/validators');

module.exports = {
    data: {
        name: "moderationActions",
    },

    /**
     * Maneja las acciones de moderación desde los botones
     * @param {import('discord.js').ButtonInteraction} interaction 
     * @param {import('discord.js').Client} client 
     */
    async execute(interaction, client) {
        try {
            const [action, targetUserId] = interaction.customId.split('_').slice(1);
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
                    await this.handleStrike(interaction, targetUser, targetMember);
                    break;
                case 'kick':
                    await this.handleKick(interaction, targetUser, targetMember);
                    break;
                case 'mute':
                    await this.handleMute(interaction, targetUser, targetMember);
                    break;
                case 'ban':
                    await this.handleBan(interaction, targetUser, targetMember);
                    break;
                case 'warn':
                    await this.handleWarn(interaction, targetUser, targetMember);
                    break;
                case 'timeout':
                    await this.handleTimeout(interaction, targetUser, targetMember);
                    break;
                case 'refresh':
                    await this.handleRefresh(interaction, targetUser, targetMember);
                    break;
                case 'history':
                    await this.handleHistory(interaction, targetUser, targetMember);
                    break;
            }

        } catch (error) {
            console.error('❌ Error en moderationActions:', error);
            await interaction.reply({
                content: '❌ Error al procesar la acción de moderación.',
                ephemeral: true
            });
        }
    },

    async handleStrike(interaction, targetUser, targetMember) {
        const modal = new ModalBuilder()
            .setCustomId(`strike_modal_${targetUser.id}`)
            .setTitle('⚡ Dar Strike');

        const reasonInput = new TextInputBuilder()
            .setCustomId('strike_reason')
            .setLabel('Razón del strike')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe la razón del strike...')
            .setRequired(true)
            .setMaxLength(1000);

        const durationInput = new TextInputBuilder()
            .setCustomId('strike_duration')
            .setLabel('Duración (minutos) - Opcional')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Dejar vacío para strike permanente')
            .setRequired(false)
            .setMaxLength(10);

        modal.addComponents(
            new ActionRowBuilder().addComponents(reasonInput),
            new ActionRowBuilder().addComponents(durationInput)
        );

        await interaction.showModal(modal);
    },

    async handleKick(interaction, targetUser, targetMember) {
        const modal = new ModalBuilder()
            .setCustomId(`kick_modal_${targetUser.id}`)
            .setTitle('👢 Expulsar Usuario');

        const reasonInput = new TextInputBuilder()
            .setCustomId('kick_reason')
            .setLabel('Razón del kick')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe la razón del kick...')
            .setRequired(true)
            .setMaxLength(1000);

        modal.addComponents(
            new ActionRowBuilder().addComponents(reasonInput)
        );

        await interaction.showModal(modal);
    },

    async handleMute(interaction, targetUser, targetMember) {
        const modal = new ModalBuilder()
            .setCustomId(`mute_modal_${targetUser.id}`)
            .setTitle('🔇 Mute Usuario');

        const reasonInput = new TextInputBuilder()
            .setCustomId('mute_reason')
            .setLabel('Razón del mute')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe la razón del mute...')
            .setRequired(true)
            .setMaxLength(1000);

        const durationInput = new TextInputBuilder()
            .setCustomId('mute_duration')
            .setLabel('Duración (minutos)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ej: 60 para 1 hora')
            .setRequired(true)
            .setMaxLength(10);

        modal.addComponents(
            new ActionRowBuilder().addComponents(reasonInput),
            new ActionRowBuilder().addComponents(durationInput)
        );

        await interaction.showModal(modal);
    },

    async handleBan(interaction, targetUser, targetMember) {
        const modal = new ModalBuilder()
            .setCustomId(`ban_modal_${targetUser.id}`)
            .setTitle('🔨 Banear Usuario');

        const reasonInput = new TextInputBuilder()
            .setCustomId('ban_reason')
            .setLabel('Razón del ban')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe la razón del ban...')
            .setRequired(true)
            .setMaxLength(1000);

        const durationInput = new TextInputBuilder()
            .setCustomId('ban_duration')
            .setLabel('Duración (días) - Opcional')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Dejar vacío para ban permanente')
            .setRequired(false)
            .setMaxLength(10);

        modal.addComponents(
            new ActionRowBuilder().addComponents(reasonInput),
            new ActionRowBuilder().addComponents(durationInput)
        );

        await interaction.showModal(modal);
    },

    async handleWarn(interaction, targetUser, targetMember) {
        const modal = new ModalBuilder()
            .setCustomId(`warn_modal_${targetUser.id}`)
            .setTitle('⚠️ Advertir Usuario');

        const reasonInput = new TextInputBuilder()
            .setCustomId('warn_reason')
            .setLabel('Razón de la advertencia')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe la razón de la advertencia...')
            .setRequired(true)
            .setMaxLength(1000);

        modal.addComponents(
            new ActionRowBuilder().addComponents(reasonInput)
        );

        await interaction.showModal(modal);
    },

    async handleTimeout(interaction, targetUser, targetMember) {
        const modal = new ModalBuilder()
            .setCustomId(`timeout_modal_${targetUser.id}`)
            .setTitle('⏰ Timeout Usuario');

        const reasonInput = new TextInputBuilder()
            .setCustomId('timeout_reason')
            .setLabel('Razón del timeout')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe la razón del timeout...')
            .setRequired(true)
            .setMaxLength(1000);

        const durationInput = new TextInputBuilder()
            .setCustomId('timeout_duration')
            .setLabel('Duración (minutos)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Máximo 40320 minutos (28 días)')
            .setRequired(true)
            .setMaxLength(10);

        modal.addComponents(
            new ActionRowBuilder().addComponents(reasonInput),
            new ActionRowBuilder().addComponents(durationInput)
        );

        await interaction.showModal(modal);
    },

    async handleRefresh(interaction, targetUser, targetMember) {
        // Recrear el panel de moderación con información actualizada
        const userStats = await UserModerationStats.findOne({ 
            guildId: interaction.guild.id, 
            userId: targetUser.id 
        });

        if (!userStats) {
            return interaction.reply({
                content: '❌ No se encontraron estadísticas para este usuario.',
                ephemeral: true
            });
        }

        // Obtener historial reciente
        const recentActions = await ModerationLog.find({
            guildId: interaction.guild.id,
            userId: targetUser.id
        }).sort({ timestamp: -1 }).limit(5);

        // Crear embed actualizado
        const embed = new EmbedBuilder()
            .setTitle(`🔨 Panel de Moderación - ${targetUser.username}`)
            .setColor('#ff4444')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '👤 Información del Usuario',
                    value: `**Usuario:** ${targetUser.username}#${targetUser.discriminator}\n**ID:** ${targetUser.id}\n**Cuenta creada:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>\n**Se unió:** <t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`,
                    inline: true
                },
                {
                    name: '📊 Estadísticas de Moderación',
                    value: `**Strikes:** ${userStats.strikes}\n**Advertencias:** ${userStats.warnings}\n**Kicks:** ${userStats.kicks}\n**Mutes:** ${userStats.mutes}\n**Timeouts:** ${userStats.timeouts}\n**Bans:** ${userStats.bans}`,
                    inline: true
                },
                {
                    name: '⚠️ Estado Actual',
                    value: `**Muteado:** ${userStats.isMuted ? '✅ Sí' : '❌ No'}\n**Baneado:** ${userStats.isBanned ? '✅ Sí' : '❌ No'}\n**Última acción:** ${userStats.lastAction || 'Ninguna'}\n**Última fecha:** ${userStats.lastActionDate ? `<t:${Math.floor(userStats.lastActionDate.getTime() / 1000)}:R>` : 'Nunca'}`,
                    inline: false
                }
            )
            .setFooter({ 
                text: `Moderador: ${interaction.user.username} • Actualizado: ${new Date().toLocaleString()}`, 
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Agregar historial reciente si existe
        if (recentActions.length > 0) {
            const historyText = recentActions.map(action => 
                `**${action.action.toUpperCase()}** - ${action.reason} (${action.moderatorUsername})`
            ).join('\n');
            
            embed.addFields({
                name: '📜 Historial Reciente',
                value: historyText.length > 1024 ? historyText.substring(0, 1021) + '...' : historyText,
                inline: false
            });
        }

        // Recrear botones
        const actionRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`mod_strike_${targetUser.id}`)
                    .setLabel('⚡ Strike')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚡'),
                new ButtonBuilder()
                    .setCustomId(`mod_kick_${targetUser.id}`)
                    .setLabel('👢 Kick')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('👢'),
                new ButtonBuilder()
                    .setCustomId(`mod_mute_${targetUser.id}`)
                    .setLabel('🔇 Mute')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔇'),
                new ButtonBuilder()
                    .setCustomId(`mod_ban_${targetUser.id}`)
                    .setLabel('🔨 Ban')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔨')
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`mod_warn_${targetUser.id}`)
                    .setLabel('⚠️ Advertencia')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚠️'),
                new ButtonBuilder()
                    .setCustomId(`mod_timeout_${targetUser.id}`)
                    .setLabel('⏰ Timeout')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏰'),
                new ButtonBuilder()
                    .setCustomId(`mod_refresh_${targetUser.id}`)
                    .setLabel('🔄 Actualizar')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId(`mod_history_${targetUser.id}`)
                    .setLabel('📜 Historial')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📜')
            );

        await interaction.update({
            embeds: [embed],
            components: [actionRow1, actionRow2]
        });
    },

    async handleHistory(interaction, targetUser, targetMember) {
        const allActions = await ModerationLog.find({
            guildId: interaction.guild.id,
            userId: targetUser.id
        }).sort({ timestamp: -1 }).limit(10);

        if (allActions.length === 0) {
            return interaction.reply({
                content: '📜 Este usuario no tiene historial de moderación.',
                ephemeral: true
            });
        }

        const historyText = allActions.map((action, index) => 
            `**${index + 1}.** ${action.action.toUpperCase()} - ${action.reason}\n` +
            `   Moderador: ${action.moderatorUsername}\n` +
            `   Fecha: <t:${Math.floor(action.timestamp.getTime() / 1000)}:R>\n` +
            `   Caso: ${action.caseId}`
        ).join('\n\n');

        const embed = new EmbedBuilder()
            .setTitle(`📜 Historial Completo - ${targetUser.username}`)
            .setDescription(historyText.length > 4000 ? historyText.substring(0, 3997) + '...' : historyText)
            .setColor('#097b5a')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setFooter({ 
                text: `Total de acciones: ${allActions.length}`, 
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
