/**
 * Comando principal de moderación - Panel estilo MEE6
 */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ModerationConfig = require('../../schema/ModerationConfig');
const UserModerationStats = require('../../schema/UserModerationStats');
const ModerationLog = require('../../schema/ModerationLog');
const { validateAdminPermissions } = require('../../utils/validators');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moderar')
        .setDescription('Panel de moderación estilo MEE6')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a moderar')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            // Verificar permisos de moderador
            const managerRole = process.env.rolceo;
            if (!validateAdminPermissions(interaction.member, [managerRole])) {
                return interaction.reply({
                    content: '🚫 No tienes permisos para usar este comando.',
                    ephemeral: true
                });
            }

            const targetUser = interaction.options.getUser('usuario');
            const targetMember = interaction.guild.members.cache.get(targetUser.id);

            if (!targetMember) {
                return interaction.reply({
                    content: '❌ El usuario no está en el servidor.',
                    ephemeral: true
                });
            }

            // Verificar que no se pueda moderar a sí mismo
            if (targetUser.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ No puedes moderarte a ti mismo.',
                    ephemeral: true
                });
            }

            // Verificar jerarquía de roles
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    content: '❌ No puedes moderar a un usuario con igual o mayor jerarquía.',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            // Obtener o crear estadísticas del usuario
            let userStats = await UserModerationStats.findOne({ 
                guildId: interaction.guild.id, 
                userId: targetUser.id 
            });

            if (!userStats) {
                userStats = new UserModerationStats({
                    guildId: interaction.guild.id,
                    userId: targetUser.id,
                    username: targetUser.username
                });
                await userStats.save();
            }

            // Obtener configuración de moderación
            let config = await ModerationConfig.findOne({ guildId: interaction.guild.id });
            if (!config) {
                config = new ModerationConfig({ guildId: interaction.guild.id });
                await config.save();
            }

            // Obtener historial reciente de moderación
            const recentActions = await ModerationLog.find({
                guildId: interaction.guild.id,
                userId: targetUser.id
            }).sort({ timestamp: -1 }).limit(5);

            // Crear embed principal
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
                    text: `Moderador: ${interaction.user.username} • ${new Date().toLocaleString()}`, 
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

            // Crear botones de acción
            const actionRow1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`mod_strike_${targetUser.id}`)
                        .setLabel('Strike')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⚡'),
                    new ButtonBuilder()
                        .setCustomId(`mod_kick_${targetUser.id}`)
                        .setLabel('Kick')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('👢'),
                    new ButtonBuilder()
                        .setCustomId(`mod_mute_${targetUser.id}`)
                        .setLabel('Mute')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔇'),
                    new ButtonBuilder()
                        .setCustomId(`mod_ban_${targetUser.id}`)
                        .setLabel('Ban')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔨')
                );

            const actionRow2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`mod_warn_${targetUser.id}`)
                        .setLabel('Advertencia')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⚠️'),
                    new ButtonBuilder()
                        .setCustomId(`mod_timeout_${targetUser.id}`)
                        .setLabel('Timeout')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⏰'),
                    new ButtonBuilder()
                        .setCustomId(`mod_refresh_${targetUser.id}`)
                        .setLabel('Actualizar')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔄'),
                    new ButtonBuilder()
                        .setCustomId(`mod_history_${targetUser.id}`)
                        .setLabel('Historial')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📜')
                );

            await interaction.editReply({
                embeds: [embed],
                components: [actionRow1, actionRow2]
            });

        } catch (error) {
            console.error('❌ Error en comando moderar:', error);
            await interaction.editReply({
                content: '❌ Error al mostrar el panel de moderación.'
            });
        }
    }
};
