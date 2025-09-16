const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const CasinoLogger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('estadisticas')
        .setDescription('Muestra las estadísticas del sistema de casino'),

    async execute(interaction) {
        try {
            // Verificar permisos de administrador
            const managerRole = process.env.rolceo;
            if (!interaction.member.roles.cache.has(managerRole)) {
                return interaction.reply({
                    content: '🚫 No tienes permisos para usar este comando.',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            // Obtener estadísticas del sistema
            const logger = new CasinoLogger(interaction.client);
            const stats = await logger.getSystemStats();

            if (!stats) {
                return interaction.editReply({
                    content: '❌ Error al obtener las estadísticas del sistema.',
                    ephemeral: true
                });
            }

            // Crear embed con las estadísticas
            const statsEmbed = new EmbedBuilder()
                .setTitle('📊 Estadísticas del Sistema bet365')
                .setColor('#097b5a')
                .addFields(
                    {
                        name: '👥 Carteras',
                        value: `**Total de carteras:** ${stats.totalWallets.toLocaleString()}\n**Total depositado:** $${stats.totalDeposited.toLocaleString()}\n**Total apostado:** $${stats.totalBetAmount.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '🎯 Apuestas Deportivas',
                        value: `**Total de apuestas:** ${stats.totalSportsBets.toLocaleString()}\n**Monto total:** $${stats.totalSportsBetAmount.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '🃏 Blackjack',
                        value: `**Total de partidas:** ${stats.totalBlackjackGames.toLocaleString()}\n**Monto total:** $${stats.totalBlackjackBetAmount.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '💰 Ganancias Totales',
                        value: `$${stats.totalWinnings.toLocaleString()}`,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Última actualización: ${new Date(stats.lastUpdated).toLocaleString()}`, 
                    iconURL: 'https://i.imgur.com/SuTgawd.png' 
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [statsEmbed] });

        } catch (error) {
            console.error('❌ Error en comando estadísticas:', error);
            await interaction.editReply({
                content: '❌ Error al obtener las estadísticas del sistema.',
                ephemeral: true
            });
        }
    }
};
