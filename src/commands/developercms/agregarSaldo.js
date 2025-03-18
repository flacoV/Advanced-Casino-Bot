const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('agregar')
        .setDescription('Añadir saldo a la cartera de un usuario por pago de apuestas deportivas.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario que recibirá el saldo')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('monto')
                .setDescription('Monto a añadir')
                .setRequired(true)),

    async execute(interaction) {
        const managerRole = process.env.rolceo;
        const ceoNotifyRole = process.env.ceonotify;
        if (!interaction.member.roles.cache.has(managerRole) && !interaction.member.roles.cache.has(ceoNotifyRole)) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
        }

        const user = interaction.options.getUser('usuario');
        const amount = interaction.options.getInteger('monto');
        // Buscar la wallet del usuario
        const wallet = await Wallet.findOne({ discordId: user.id });
        if (!wallet) {
            return interaction.reply({ content: `❌ El usuario **${user.username}** no tiene una cartera registrada.`, ephemeral: true });
        }

        const { username, balance, promoCode } = wallet 

        // Agregar saldo
        wallet.balance += amount;
        await wallet.save();

        const embed = new EmbedBuilder()
        .setColor('#007c5a') // Naranja para advertencia
        .setTitle('¡Deposito Realizado!')
        .setDescription(`Gracias por contar con nosotros! **${username}**.\n💰 **|| Balance Actual:** $${balance.toLocaleString()}\n🎟️ **|| Codigo de Referido:** ${promoCode}\n\nComparte tu **código** de referido con tus amigos para que reciban un bono de **$20,000** al unirse al casino. Tú también ganarás **$15,000**.`)
        .setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' });

    return interaction.reply({ embeds: [embed], ephemeral: false });
    }
};
