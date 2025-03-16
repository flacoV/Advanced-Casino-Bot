const { SlashCommandBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('codigo365')
        .setDescription('Elige un código promocional único de 4 letras.')
        .addStringOption(option => 
            option.setName('codigo')
                .setDescription('Elige un código de 4 letras')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const chosenCode = interaction.options.getString('codigo').toUpperCase();

        // Validar que el código tiene exactamente 4 letras
        if (!/^[A-Z]{4}$/.test(chosenCode)) {
            return interaction.reply({ content: '❌ El código debe contener exactamente 4 letras mayúsculas (A-Z).', ephemeral: true });
        }

        // Verificar si la wallet existe usando el ID de Discord en lugar del nombre de usuario
        const existingWallet = await Wallet.findOne({ discordId: userId });
        if (!existingWallet) {
            return interaction.reply({ content: '❌ No tienes una cartera registrada. Usa /crear para generar una.', ephemeral: true });
        }

        if (existingWallet.promoCode) {
            return interaction.reply({ content: `⚠️ Ya tienes un código asignado: **${existingWallet.promoCode}**`, ephemeral: true });
        }

        // Verificar si el código ya está en uso
        const existingCode = await Wallet.findOne({ promoCode: chosenCode });
        if (existingCode) {
            return interaction.reply({ content: '❌ Este código ya está en uso. Intenta con otro.', ephemeral: true });
        }

        // Guardar el código en la base de datos
        await Wallet.findByIdAndUpdate(existingWallet._id, { promoCode: chosenCode });

        return interaction.reply({ content: `✅ Tu código promocional ahora es: **${chosenCode}**. Comparte este código y gana recompensas cuando otros lo usen en /crear.`, ephemeral: false });
    }
};
