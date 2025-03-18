const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('combinada')
        .setDescription('Calcula las ganancias de una apuesta combinada.')
        .addIntegerOption(option => 
            option.setName('monto')
                .setDescription('Monto apostado')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('multiplicadores')
                .setDescription('Multiplicadores de los partidos, separados por espacios')
                .setRequired(true)),

    async execute(interaction) {
        const monto = interaction.options.getInteger('monto');
        const multiplicadoresStr = interaction.options.getString('multiplicadores');
        
        // Convertir los multiplicadores a un array de números
        const multiplicadores = multiplicadoresStr.split(' ').map(num => parseFloat(num));
        
        if (multiplicadores.some(isNaN)) {
            return interaction.reply({ content: '❌ Uno o más multiplicadores no son válidos. Asegúrate de ingresar números separados por espacios.', ephemeral: true });
        }
        
        // Calcular las ganancias
        const ganancias = multiplicadores.reduce((acc, mult) => acc * mult, monto);
        
        // Crear embed para mostrar el resultado
        const embed = new EmbedBuilder()
            .setColor('#097b5a')
            .setTitle('⚽ ¡Realiza tus combinadas!')
            .setDescription('Calcula las ganancias con los multiplicadores de tus partidos.\nRecorda que por el momento el **maximo de partidos**\npara una **combinada** es de **4** y el **monto maximo** es de **$1.000.000**\n')
            .setThumbnail('https://i.imgur.com/vclIRjE.png')
            .addFields(
                { name: '💵 || Monto a Apostar', value: `$${monto.toLocaleString()}`, inline: false },
                { name: '📈 || Multiplicadores', value: multiplicadores.join(' x '), inline: false },
                { name: '🏆 || Ganancias Potenciales', value: `$${ganancias.toLocaleString()}`, inline: false }
            )
            .setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' });
        
        return interaction.reply({ embeds: [embed], ephemeral: false });
    }
};
