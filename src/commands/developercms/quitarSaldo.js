const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');
const CasinoLogger = require('../../utils/logger');

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
        const managerRole = process.env.rolceo;
        const ceoNotifyRole = process.env.ceonotify;
        
        // Verificar si el usuario tiene el rol de manager o el rol de CEO notify
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

        // Verificar si tiene suficiente saldo
        if (wallet.balance < amount) {
            return interaction.reply({ content: `⚠️ El usuario **${user.username}** no tiene suficiente saldo para esta transacción.`, ephemeral: true });
        }

        // Restar saldo y registrar transacción
        wallet.balance -= amount;
        wallet.transactions.push({
            type: 'withdraw',
            amount: amount,
            date: new Date()
        });
        await wallet.save();

        // Actualizar estadísticas del sistema
        const logger = new CasinoLogger(interaction.client);
        await logger.updateSystemStats();

        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('💰 Saldo Retirado')
            .setDescription(`Se han quitado **$${amount.toLocaleString()}** de la cartera de **${user.username}**`)
            .addFields(
                { name: '👤 Usuario', value: `${user.username}`, inline: true },
                { name: '💰 Monto Retirado', value: `$${amount.toLocaleString()}`, inline: true },
                { name: '💳 Balance Actual', value: `$${wallet.balance.toLocaleString()}`, inline: true },
                { name: '👨‍💼 Administrador', value: `<@${interaction.user.id}>`, inline: false }
            )
            .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
