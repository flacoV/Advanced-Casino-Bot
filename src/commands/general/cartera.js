const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');
const { validateWallet } = require('../../utils/validators');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cartera')
        .setDescription('Muestra la información de tu cartera.'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;

            // Buscar la wallet del usuario
            const existingWallet = await Wallet.findOne({ discordId: userId });
            const walletValidation = validateWallet(existingWallet, interaction.user.username);
            if (!walletValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Cartera No Encontrada')
                    .setDescription(walletValidation.error)
                    .setFooter({ text: 'bet365 - Información de Cartera', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const { username, balance, promoCode, usedPromoCode, dineroApostado, transactions } = existingWallet;
            
            // Calcular estadísticas
            const totalDeposits = transactions
                .filter(t => t.type === 'deposit')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const totalWins = transactions
                .filter(t => t.type === 'win')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const totalBets = transactions
                .filter(t => t.type === 'bet')
                .reduce((sum, t) => sum + t.amount, 0);
            
            // Crear el embed
            const walletEmbed = new EmbedBuilder()
                .setColor('#007c5a')
                .setTitle('🪪 Información de Cartera bet365')
                .setThumbnail('https://i.imgur.com/vclIRjE.png')
                .setDescription('Recuerda que puedes generar ingresos con el **Business Partner Program**. ¡Contacta con nosotros si estás interesado en ser parte de **bet365**!\n\nCrea tu referido con **/codigo365**, gana **$15,000** con cada cartera creada con tu código y recibe a tus referidos con **$20,000** de bienvenida.')
                .addFields(
                    { name: '👤 Usuario', value: username, inline: true },
                    { name: '💰 Balance Actual', value: `$${balance.toLocaleString()}`, inline: true },
                    { name: '💳 Total Apostado', value: `$${dineroApostado.toLocaleString()}`, inline: true },
                    { name: '📈 Total Depositos', value: `$${totalDeposits.toLocaleString()}`, inline: true },
                    { name: '🏆 Total Ganancias', value: `$${totalWins.toLocaleString()}`, inline: true },
                    { name: '🎯 Total Apuestas', value: `$${totalBets.toLocaleString()}`, inline: true }
                )
                .setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' })
                .setTimestamp();

            // Agregar código promocional si existe
            if (promoCode && promoCode.trim() !== "") {
                walletEmbed.addFields({ 
                    name: '🎟️ Código de Referido', 
                    value: `**${promoCode}**`, 
                    inline: false 
                });
            }

            // Agregar código usado si existe
            if (usedPromoCode && usedPromoCode.trim() !== "") {
                walletEmbed.addFields({ 
                    name: '🎫 Código Usado', 
                    value: `**${usedPromoCode}**`, 
                    inline: false 
                });
            }

            return interaction.reply({ embeds: [walletEmbed] });
            
        } catch (error) {
            console.error('❌ Error en comando cartera:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado al obtener la información de tu cartera. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Información de Cartera', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};