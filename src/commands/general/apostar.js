const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');
const { validateAmount, validateBalance, validateWallet } = require('../../utils/validators');
const CasinoLogger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apostar')
        .setDescription('Registra una apuesta en el canal de logs')
        .addIntegerOption(option =>
            option.setName('monto')
                .setDescription('Monto de la apuesta (mínimo: 20,000, máximo: 1,000,000)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('partidos')
                .setDescription('Lista de partidos apostados')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const monto = interaction.options.getInteger('monto');
            const partidos = interaction.options.getString('partidos');
            const userId = interaction.user.id;
            
            // Validar monto de apuesta
            const amountValidation = validateAmount(monto, 20000, 1000000);
            if (!amountValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Apuesta Inválida')
                    .setDescription(amountValidation.error)
                    .setFooter({ text: 'bet365 - Apuestas Deportivas', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Buscar cartera del usuario
            const userWallet = await Wallet.findOne({ discordId: userId });
            const walletValidation = validateWallet(userWallet, interaction.user.username);
            if (!walletValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Cartera No Encontrada')
                    .setDescription(walletValidation.error)
                    .setFooter({ text: 'bet365 - Apuestas Deportivas', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Validar saldo suficiente
            const balanceValidation = validateBalance(userWallet.balance, monto);
            if (!balanceValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❗️ Saldo Insuficiente')
                    .setDescription(balanceValidation.error)
                    .setFooter({ text: 'bet365 - Apuestas Deportivas', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            // Procesar apuesta
            userWallet.balance -= monto;
            userWallet.dineroApostado += monto;
            userWallet.transactions.push({ 
                type: 'bet', 
                amount: monto,
                date: new Date(),
                gameType: 'sports'
            });
            await userWallet.save();

            // Embed para el usuario
            const userEmbed = new EmbedBuilder()
                .setTitle('🎯 ¡Apuesta Realizada!')
                .setDescription(`Felicidades <@${userId}>, tu apuesta fue realizada con éxito. Una vez determinada la apuesta recibirás el dinero dentro de un período de **24hs**.\n\n**⌚️ Apuesta:** ${partidos}\n**🪙 Monto:** $${monto.toLocaleString()}\n\nRecuerda que las **apuestas deportivas** son **1X2** y **se definen** en los **90'** reglamentarios más adicionales, no se toman en cuenta ni alargue ni penales.`)
                .setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' })
                .setColor('#097b5a')
                .setTimestamp();
            
            await interaction.reply({ embeds: [userEmbed] });
            
            // Log de la apuesta usando el sistema mejorado
            const logger = new CasinoLogger(interaction.client);
            await logger.logBet({
                userId,
                username: userWallet.username,
                amount: monto,
                type: 'Apuestas Deportivas',
                details: `Partidos: ${partidos} | Canal: ${interaction.channel.name}`
            });

            // Actualizar estadísticas del sistema
            await logger.updateSystemStats();

        } catch (error) {
            console.error('❌ Error en comando apostar:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado al procesar tu apuesta. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Apuestas Deportivas', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};