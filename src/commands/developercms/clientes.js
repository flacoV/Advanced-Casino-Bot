const { SlashCommandBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clientes')
        .setDescription('Muestra la lista de clientes con su saldo actual.'),

    async execute(interaction) {
        const managerRole = process.env.rolceo;
        const ceoNotifyRole = process.env.ceonotify;
        if (!interaction.member.roles.cache.has(managerRole) && !interaction.member.roles.cache.has(ceoNotifyRole)) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
        }

        try {
            const wallets = await Wallet.find().sort({ balance: -1 }); // Ordena por saldo descendente
            
            if (wallets.length === 0) {
                return interaction.reply({ content: '📭 No hay clientes registrados aún.', ephemeral: true });
            }
            
            let response = '📋 **Lista de clientes y saldo:**\n\n';
            wallets.forEach(wallet => {
                response += `👤 **${wallet.username}** - 💰 $${wallet.balance.toLocaleString()}\n`;
            });

            return interaction.reply({ content: response, ephemeral: false });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Ocurrió un error al obtener la lista de clientes.', ephemeral: true });
        }
    }
};
