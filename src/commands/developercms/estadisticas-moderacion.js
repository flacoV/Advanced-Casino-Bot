/**
 * Comando para ver estadísticas de moderación del servidor
 */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationLog = require('../../schema/ModerationLog');
const UserModerationStats = require('../../schema/UserModerationStats');
const ModerationConfig = require('../../schema/ModerationConfig');
const { validateAdminPermissions } = require('../../utils/validators');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('estadisticas-moderacion')
        .setDescription('Muestra las estadísticas del sistema de moderación')
        .addSubcommand(subcommand =>
            subcommand
                .setName('servidor')
                .setDescription('Estadísticas generales del servidor'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('usuario')
                .setDescription('Estadísticas de moderación de un usuario específico')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a consultar')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('moderador')
                .setDescription('Estadísticas de un moderador específico')
                .addUserOption(option =>
                    option.setName('moderador')
                        .setDescription('Moderador a consultar')
                        .setRequired(true)))
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

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'servidor':
                    await this.handleServerStats(interaction);
                    break;
                case 'usuario':
                    await this.handleUserStats(interaction);
                    break;
                case 'moderador':
                    await this.handleModeratorStats(interaction);
                    break;
            }

        } catch (error) {
            console.error('❌ Error en comando estadisticas-moderacion:', error);
            await interaction.reply({
                content: '❌ Error al obtener las estadísticas de moderación.',
                ephemeral: true
            });
        }
    },

    async handleServerStats(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Obtener estadísticas generales del servidor
            const totalActions = await ModerationLog.countDocuments({ guildId: interaction.guild.id });
            const totalUsers = await UserModerationStats.countDocuments({ guildId: interaction.guild.id });
            
            // Estadísticas por tipo de acción
            const actionStats = await ModerationLog.aggregate([
                { $match: { guildId: interaction.guild.id } },
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            // Usuarios más moderados
            const mostModeratedUsers = await UserModerationStats.find({ guildId: interaction.guild.id })
                .sort({ 
                    strikes: -1, 
                    warnings: -1, 
                    kicks: -1, 
                    mutes: -1, 
                    bans: -1 
                })
                .limit(5);

            // Moderadores más activos
            const mostActiveModerators = await ModerationLog.aggregate([
                { $match: { guildId: interaction.guild.id } },
                { $group: { _id: '$moderatorId', count: { $sum: 1 }, username: { $first: '$moderatorUsername' } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            // Acciones recientes
            const recentActions = await ModerationLog.find({ guildId: interaction.guild.id })
                .sort({ timestamp: -1 })
                .limit(5);

            // Crear embed principal
            const embed = new EmbedBuilder()
                .setTitle('📊 Estadísticas de Moderación del Servidor')
                .setColor('#097b5a')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .addFields(
                    {
                        name: '📈 Resumen General',
                        value: `**Total de acciones:** ${totalActions.toLocaleString()}\n**Usuarios moderados:** ${totalUsers.toLocaleString()}\n**Servidor:** ${interaction.guild.name}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Solicitado por ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });

            // Agregar estadísticas por tipo de acción
            if (actionStats.length > 0) {
                const actionText = actionStats.map(stat => 
                    `**${stat._id.toUpperCase()}:** ${stat.count}`
                ).join('\n');
                
                embed.addFields({
                    name: '🔨 Acciones por Tipo',
                    value: actionText,
                    inline: true
                });
            }

            // Agregar usuarios más moderados
            if (mostModeratedUsers.length > 0) {
                const usersText = mostModeratedUsers.map((user, index) => 
                    `**${index + 1}.** ${user.username}\n   Strikes: ${user.strikes} | Warnings: ${user.warnings}`
                ).join('\n');
                
                embed.addFields({
                    name: '👥 Usuarios Más Moderados',
                    value: usersText.length > 1024 ? usersText.substring(0, 1021) + '...' : usersText,
                    inline: false
                });
            }

            // Agregar moderadores más activos
            if (mostActiveModerators.length > 0) {
                const moderatorsText = mostActiveModerators.map((mod, index) => 
                    `**${index + 1}.** ${mod.username}\n   Acciones: ${mod.count}`
                ).join('\n');
                
                embed.addFields({
                    name: '👨‍💼 Moderadores Más Activos',
                    value: moderatorsText,
                    inline: true
                });
            }

            // Agregar acciones recientes
            if (recentActions.length > 0) {
                const recentText = recentActions.map(action => 
                    `**${action.action.toUpperCase()}** - ${action.username}\n   Por: ${action.moderatorUsername}`
                ).join('\n');
                
                embed.addFields({
                    name: '🕒 Acciones Recientes',
                    value: recentText.length > 1024 ? recentText.substring(0, 1021) + '...' : recentText,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener estadísticas del servidor:', error);
            await interaction.editReply({
                content: '❌ Error al obtener las estadísticas del servidor.'
            });
        }
    },

    async handleUserStats(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        
        await interaction.deferReply({ ephemeral: true });

        try {
            // Obtener estadísticas del usuario
            const userStats = await UserModerationStats.findOne({ 
                guildId: interaction.guild.id, 
                userId: targetUser.id 
            });

            if (!userStats) {
                return interaction.editReply({
                    content: '📊 Este usuario no tiene historial de moderación.'
                });
            }

            // Obtener historial completo del usuario
            const userHistory = await ModerationLog.find({
                guildId: interaction.guild.id,
                userId: targetUser.id
            }).sort({ timestamp: -1 });

            // Crear embed
            const embed = new EmbedBuilder()
                .setTitle(`📊 Estadísticas de Moderación - ${targetUser.username}`)
                .setColor('#097b5a')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    {
                        name: '📈 Estadísticas Totales',
                        value: `**Strikes:** ${userStats.strikes}\n**Advertencias:** ${userStats.warnings}\n**Kicks:** ${userStats.kicks}\n**Mutes:** ${userStats.mutes}\n**Timeouts:** ${userStats.timeouts}\n**Bans:** ${userStats.bans}`,
                        inline: true
                    },
                    {
                        name: '⚠️ Estado Actual',
                        value: `**Muteado:** ${userStats.isMuted ? '✅ Sí' : '❌ No'}\n**Baneado:** ${userStats.isBanned ? '✅ Sí' : '❌ No'}\n**Última acción:** ${userStats.lastAction || 'Ninguna'}\n**Última fecha:** ${userStats.lastActionDate ? `<t:${Math.floor(userStats.lastActionDate.getTime() / 1000)}:R>` : 'Nunca'}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Total de acciones: ${userHistory.length}`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });

            // Agregar historial reciente si existe
            if (userHistory.length > 0) {
                const recentHistory = userHistory.slice(0, 5);
                const historyText = recentHistory.map(action => 
                    `**${action.action.toUpperCase()}** - ${action.reason}\n   Por: ${action.moderatorUsername} - <t:${Math.floor(action.timestamp.getTime() / 1000)}:R>`
                ).join('\n\n');
                
                embed.addFields({
                    name: '📜 Historial Reciente',
                    value: historyText.length > 1024 ? historyText.substring(0, 1021) + '...' : historyText,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener estadísticas del usuario:', error);
            await interaction.editReply({
                content: '❌ Error al obtener las estadísticas del usuario.'
            });
        }
    },

    async handleModeratorStats(interaction) {
        const targetModerator = interaction.options.getUser('moderador');
        
        await interaction.deferReply({ ephemeral: true });

        try {
            // Obtener estadísticas del moderador
            const moderatorStats = await ModerationLog.aggregate([
                { $match: { guildId: interaction.guild.id, moderatorId: targetModerator.id } },
                { $group: { 
                    _id: '$action', 
                    count: { $sum: 1 },
                    total: { $sum: 1 }
                }},
                { $sort: { count: -1 } }
            ]);

            // Obtener total de acciones del moderador
            const totalActions = await ModerationLog.countDocuments({ 
                guildId: interaction.guild.id, 
                moderatorId: targetModerator.id 
            });

            // Obtener acciones recientes del moderador
            const recentActions = await ModerationLog.find({
                guildId: interaction.guild.id,
                moderatorId: targetModerator.id
            }).sort({ timestamp: -1 }).limit(5);

            if (totalActions === 0) {
                return interaction.editReply({
                    content: '📊 Este moderador no ha realizado acciones de moderación.'
                });
            }

            // Crear embed
            const embed = new EmbedBuilder()
                .setTitle(`📊 Estadísticas del Moderador - ${targetModerator.username}`)
                .setColor('#097b5a')
                .setThumbnail(targetModerator.displayAvatarURL({ dynamic: true }))
                .addFields(
                    {
                        name: '📈 Resumen General',
                        value: `**Total de acciones:** ${totalActions.toLocaleString()}\n**Moderador:** ${targetModerator.username}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: `Solicitado por ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });

            // Agregar estadísticas por tipo de acción
            if (moderatorStats.length > 0) {
                const actionText = moderatorStats.map(stat => 
                    `**${stat._id.toUpperCase()}:** ${stat.count}`
                ).join('\n');
                
                embed.addFields({
                    name: '🔨 Acciones por Tipo',
                    value: actionText,
                    inline: true
                });
            }

            // Agregar acciones recientes
            if (recentActions.length > 0) {
                const recentText = recentActions.map(action => 
                    `**${action.action.toUpperCase()}** - ${action.username}\n   Razón: ${action.reason.substring(0, 50)}${action.reason.length > 50 ? '...' : ''}`
                ).join('\n');
                
                embed.addFields({
                    name: '🕒 Acciones Recientes',
                    value: recentText.length > 1024 ? recentText.substring(0, 1021) + '...' : recentText,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener estadísticas del moderador:', error);
            await interaction.editReply({
                content: '❌ Error al obtener las estadísticas del moderador.'
            });
        }
    }
};
