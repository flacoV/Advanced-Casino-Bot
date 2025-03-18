const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');

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
        const monto = interaction.options.getInteger('monto');
        const partidos = interaction.options.getString('partidos');
        const userId = interaction.user.id;
        const userWallet = await Wallet.findOne({ discordId: userId });

        const { username } = userWallet
        
        if (!userWallet) {
            return interaction.reply({ content: 'No tienes una cartera registrada.', ephemeral: true });
        }

        if (userWallet.balance <= 0) {
            const embed = new EmbedBuilder()
                .setColor('#ffe417') // Rojo para indicar error
                .setTitle('❗️ Saldo Insuficiente')
                .setDescription(`Parece que **no** tienes saldo suficiente. Debes depositar fondos antes de apostar.\n\n💰 **|| Balance:**${userWallet.balance}\n\n`)
                .setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' });
        
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (monto < 20000 || monto > 1000000) {
            const embed = new EmbedBuilder()
                .setColor('#ffe417') // Rojo para indicar error
                .setTitle('❌ Importe no Válido')
                .setDescription(`Hey! **${username}** no tan rapido, recuerda que los limites de apuestas deportivas tienen un limite de **$20,000** & **$1,000,000**.\n\n💰 **|| Balance:**$${userWallet.balance.toLocaleString()}\n\n`)
                .setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' });
        
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userWallet.balance -= monto;
        userWallet.dineroApostado += monto; // Actualizar dinero apostado
        userWallet.transactions.push({ type: 'bet', amount: monto });
        await userWallet.save();

        const logChannel = interaction.client.channels.cache.get('1351318876775776388');
        if (!logChannel) {
            return interaction.reply({ content: 'No se pudo encontrar el canal de logs.', ephemeral: true });
        }
        
        // Embed para el usuario
        const userEmbed = new EmbedBuilder()
            .setTitle('¡Apuesta realizada!')
            .setDescription(`Felicidades <@${userId}>, tu apuesta fue realizada con exito, una vez determinada la apuesta recibiras el dinero dentro de un periodo de **24hs**.\n\n **⌚️|| Apuesta:** ${partidos}\n **🪙|| Monto:** $${monto.toLocaleString()}\n\nRecuerde que las **apuestas deportivas** son **1X2** y **se definen** en los **90’** reglamentarios más adicionales, no se toman en cuenta ni alargue ni penales.`)
            .setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' })
            .setColor('#097b5a')
            .setTimestamp();
        
        await interaction.reply({ embeds: [userEmbed] });
        
        // Embed para el canal de logs
        const logEmbed = new EmbedBuilder()
            .setTitle('Registro de Apuesta')
            .setDescription(` **Usuario:** <@${userId}>
             **Monto:** $${monto.toLocaleString()}
            ️ **Canal de Ticket:** ${interaction.channel}`)
            .setColor('#ffe417')
            .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] });
    }
};