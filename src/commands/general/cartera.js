const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cartera')
        .setDescription('Muestra la información de tu cartera.'),

    async execute(interaction) {
        const userId = interaction.user.id;

        // Buscar la wallet del usuario
        const existingWallet = await Wallet.findOne({ discordId: userId });
        if (!existingWallet) {
            return interaction.reply({ content: '❌ No tienes una cartera registrada. Usa /crear para generar una.', ephemeral: true });
        }

        const { username, balance, promoCode, usedPromoCode, dineroApostado } = existingWallet;
        
        // Crear el embed
        const walletEmbed = new EmbedBuilder()
            .setColor('#007c5a') // Color oscuro para que se vea profesional
            .setTitle('🪪 Información del usuario')
            .setThumbnail('https://i.imgur.com/vclIRjE.png') // Agregar avatar del usuario
            .setDescription(`\n\nRecuerda que puedes generar ingresos con el **Bussiness Partner Program**, contacta con nosotros si estas interesado en ser parte de **bet365**!\nCrea tu referido con **/codigo365**, gana **$15.000**\ncon cada cartera creada con tu codigo y recibe a tus referidos con **$20.000** de bienvenida.\n\n\n\n**Cartera bet365**\n\n👤 **|| Nombre:** ${username}\n💰 **|| Balance:** $${balance.toLocaleString()}\n💳 **|| Apuestas Deportivas:** $${dineroApostado.toLocaleString()}`)

            if (promoCode && promoCode.trim() !== "") {
                walletEmbed.setDescription(walletEmbed.data.description + `\n️🪪 **|| Código de Referido:** ${promoCode}`);
            }
        // Solo agregar si usó un código promocional
        if (usedPromoCode && usedPromoCode.trim() !== "") {
            walletEmbed.addFields(
                { name: '🎟️ Código Usado', value: `**${usedPromoCode}**`, inline: false }
            );
        }


        walletEmbed.setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' });

        return interaction.reply({ embeds: [walletEmbed] });
    }
};