const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { validateMultipliers } = require('../../utils/validators');

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
        try {
            const monto = interaction.options.getInteger('monto');
            const multiplicadoresStr = interaction.options.getString('multiplicadores');
            
            // Validar multiplicadores
            const multipliersValidation = validateMultipliers(multiplicadoresStr);
            if (!multipliersValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Multiplicadores Inválidos')
                    .setDescription(multipliersValidation.error)
                    .setFooter({ text: 'bet365 - Calculadora de Combinadas', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            const multiplicadores = multipliersValidation.multipliers;
            
            // Calcular las ganancias
            const ganancias = multiplicadores.reduce((acc, mult) => acc * mult, monto);
            const gananciaNeta = ganancias - monto;
            const porcentajeGanancia = ((ganancias / monto - 1) * 100).toFixed(2);
            
            // Crear embed para mostrar el resultado
            const embed = new EmbedBuilder()
                .setColor('#097b5a')
                .setTitle('⚽ Calculadora de Combinadas')
                .setDescription('Calcula las ganancias con los multiplicadores de tus partidos.\n\n**Límites:**\n• Máximo de partidos: **4**\n• Monto máximo: **$1,000,000**\n• Monto mínimo: **$20,000**')
                .setThumbnail('https://i.imgur.com/vclIRjE.png')
                .addFields(
                    { name: '💵 Monto a Apostar', value: `$${monto.toLocaleString()}`, inline: true },
                    { name: '📈 Multiplicadores', value: multiplicadores.join(' × '), inline: true },
                    { name: '🎯 Partidos', value: `${multiplicadores.length}`, inline: true },
                    { name: '🏆 Ganancias Potenciales', value: `$${ganancias.toLocaleString()}`, inline: true },
                    { name: '💰 Ganancia Neta', value: `$${gananciaNeta.toLocaleString()}`, inline: true },
                    { name: '📊 Porcentaje', value: `+${porcentajeGanancia}%`, inline: true }
                )
                .setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: false });
            
        } catch (error) {
            console.error('❌ Error en comando combinada:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado al calcular la combinada. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Calculadora de Combinadas', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
