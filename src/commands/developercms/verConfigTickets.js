/**
 * Comando para ver la configuración actual del sistema de tickets
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TicketConfig = require('../../schema/TicketConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verconfigtickets')
        .setDescription('Muestra la configuración actual del sistema de tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Buscar configuración del servidor
            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });

            if (!config) {
                const noConfigEmbed = new EmbedBuilder()
                    .setColor('#ffa500')
                    .setTitle('⚠️ Sistema de Tickets No Configurado')
                    .setDescription('El sistema de tickets no ha sido configurado para este servidor.\n\nUsa `/configurartickets` para configurar el sistema.')
                    .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [noConfigEmbed], ephemeral: true });
            }

            // Obtener referencias a los canales y roles
            const categoria = interaction.guild.channels.cache.get(config.ticketCategoryId);
            const rolStaff = interaction.guild.roles.cache.get(config.staffRoleId);
            const canalLogs = interaction.guild.channels.cache.get(config.logChannelId);
            const canalTranscript = interaction.guild.channels.cache.get(config.transcriptChannelId);

            // Verificar si los canales/roles aún existen
            const categoriaStatus = categoria ? '✅' : '❌';
            const rolStatus = rolStaff ? '✅' : '❌';
            const canalLogsStatus = canalLogs ? '✅' : '❌';
            const canalTranscriptStatus = canalTranscript ? '✅' : '❌';

            const configEmbed = new EmbedBuilder()
                .setColor('#007c5a')
                .setTitle('📋 Configuración del Sistema de Tickets')
                .setDescription('Configuración actual del sistema de tickets para este servidor.')
                .addFields(
                    { 
                        name: '📁 Categoría de Tickets', 
                        value: `${categoriaStatus} ${categoria ? categoria.name : 'No encontrada'}`, 
                        inline: true 
                    },
                    { 
                        name: '👥 Rol de Staff', 
                        value: `${rolStatus} ${rolStaff ? rolStaff.name : 'No encontrado'}`, 
                        inline: true 
                    },
                    { 
                        name: '📝 Canal de Logs', 
                        value: `${canalLogsStatus} ${canalLogs ? canalLogs.name : 'No encontrado'}`, 
                        inline: true 
                    },
                    { 
                        name: '📄 Canal de Transcripts', 
                        value: `${canalTranscriptStatus} ${canalTranscript ? canalTranscript.name : 'No encontrado'}`, 
                        inline: true 
                    },
                    { 
                        name: '📅 Última Actualización', 
                        value: `<t:${Math.floor(config.updatedAt.getTime() / 1000)}:F>`, 
                        inline: false 
                    }
                )
                .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' })
                .setTimestamp();

            // Agregar advertencia si hay elementos no encontrados
            if (!categoria || !rolStaff || !canalLogs || !canalTranscript) {
                configEmbed.addFields({
                    name: '⚠️ Advertencia',
                    value: 'Algunos elementos configurados ya no existen. Usa `/configurartickets` para actualizar la configuración.',
                    inline: false
                });
                configEmbed.setColor('#ffa500');
            }

            return interaction.reply({ embeds: [configEmbed], ephemeral: true });

        } catch (error) {
            console.error('❌ Error en comando verConfigTickets:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado al obtener la configuración de tickets. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
