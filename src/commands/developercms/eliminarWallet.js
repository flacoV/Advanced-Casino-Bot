const { SlashCommandBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eliminarwallet')
        .setDescription('Elimina una wallet específica por nombre de usuario.')
        .addStringOption(option => 
            option.setName('usuario')
                .setDescription('Nombre del usuario cuya wallet será eliminada')
                .setRequired(true)),

    async execute(interaction) {
        const managerRole = process.env.rolceo;
        const ceoNotifyRole = process.env.ceonotify;
        if (!interaction.member.roles.cache.has(managerRole) && !interaction.member.roles.cache.has(ceoNotifyRole)) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
        }


        const username = interaction.options.getString('usuario');

        // Verificar si la wallet existe
        const existingWallet = await Wallet.findOne({ username });
        if (!existingWallet) {
            return interaction.reply({ content: `❌ No se encontró una wallet para **${username}**.`, ephemeral: true });
        }

        // Eliminar la wallet
        await Wallet.deleteOne({ username });

        return interaction.reply({ content: `✅ La wallet de **${username}** ha sido eliminada correctamente.`, ephemeral: false });
    }
};