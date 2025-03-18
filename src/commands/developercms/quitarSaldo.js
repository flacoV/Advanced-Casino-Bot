const { SlashCommandBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quitar')
        .setDescription('Quitar saldo de la cartera de un usuario.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario al que se le quitará saldo')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('monto')
                .setDescription('Monto a quitar')
                .setRequired(true)),

    async execute(interaction) {
        const ceoNotifyRole = process.env.ceonotify;
        if (interaction.user.id !== process.env.ceonotify) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
        }

        const user = interaction.options.getUser('usuario');
        const amount = interaction.options.getInteger('monto');
        // Buscar la wallet del usuario
        const wallet = await Wallet.findOne({ discordId: user.id });
        if (!wallet) {
            return interaction.reply({ content: `❌ El usuario **${user.username}** no tiene una cartera registrada.`, ephemeral: true });
        }

        // Verificar si tiene suficiente saldo
        if (wallet.balance < amount) {
            return interaction.reply({ content: `⚠️ El usuario **${user.username}** no tiene suficiente saldo para esta transacción.`, ephemeral: true });
        }

        // Restar saldo
        wallet.balance -= amount;
        await wallet.save();

        return interaction.reply({
            content: `✅ Se han quitado **$${amount.toLocaleString()}** de la cartera de **${user}**.`,
            ephemeral: true
        });
    }
};
