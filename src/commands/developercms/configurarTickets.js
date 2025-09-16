/**
 * Comando para configurar el sistema de tickets
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TicketConfig = require('../../schema/TicketConfig');
const { validateAdminPermissions } = require('../../utils/validators');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurartickets')
        .setDescription('Configura el sistema de tickets del servidor')
        .addChannelOption(option =>
            option.setName('categoria')
                .setDescription('Categoría donde se crearán los tickets')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rolstaff')
                .setDescription('Rol que tendrá permisos para gestionar tickets')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('canallogs')
                .setDescription('Canal donde se registrarán los logs de tickets')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('canaltranscript')
                .setDescription('Canal donde se enviarán los transcripts de tickets')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Verificar permisos de administrador
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Permisos Insuficientes')
                    .setDescription('Necesitas permisos de **Administrador** para configurar el sistema de tickets.')
                    .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const categoria = interaction.options.getChannel('categoria');
            const rolStaff = interaction.options.getRole('rolstaff');
            const canalLogs = interaction.options.getChannel('canallogs');
            const canalTranscript = interaction.options.getChannel('canaltranscript');

            // Validar que la categoría sea realmente una categoría
            if (categoria.type !== 4) { // 4 = GUILD_CATEGORY
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Categoría Inválida')
                    .setDescription('El canal seleccionado debe ser una **categoría**, no un canal de texto.')
                    .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Validar que los canales sean de texto
            if (canalLogs.type !== 0 || canalTranscript.type !== 0) { // 0 = GUILD_TEXT
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Canal Inválido')
                    .setDescription('Los canales de logs y transcript deben ser **canales de texto**.')
                    .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Verificar permisos del bot en los canales
            const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
            
            if (!categoria.permissionsFor(botMember).has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ViewChannel])) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Permisos Insuficientes')
                    .setDescription(`El bot no tiene permisos suficientes en la categoría **${categoria.name}**. Necesita permisos de **Gestionar Canales** y **Ver Canal**.`)
                    .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (!canalLogs.permissionsFor(botMember).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel])) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Permisos Insuficientes')
                    .setDescription(`El bot no tiene permisos suficientes en el canal de logs **${canalLogs.name}**. Necesita permisos de **Enviar Mensajes** y **Ver Canal**.`)
                    .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (!canalTranscript.permissionsFor(botMember).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel])) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Permisos Insuficientes')
                    .setDescription(`El bot no tiene permisos suficientes en el canal de transcript **${canalTranscript.name}**. Necesita permisos de **Enviar Mensajes** y **Ver Canal**.`)
                    .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Buscar configuración existente
            const existingConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });

            if (existingConfig) {
                // Actualizar configuración existente
                existingConfig.ticketCategoryId = categoria.id;
                existingConfig.staffRoleId = rolStaff.id;
                existingConfig.logChannelId = canalLogs.id;
                existingConfig.transcriptChannelId = canalTranscript.id;
                existingConfig.updatedAt = new Date();
                await existingConfig.save();
            } else {
                // Crear nueva configuración
                const newConfig = new TicketConfig({
                    guildId: interaction.guild.id,
                    ticketCategoryId: categoria.id,
                    staffRoleId: rolStaff.id,
                    logChannelId: canalLogs.id,
                    transcriptChannelId: canalTranscript.id
                });
                await newConfig.save();
            }

            // Embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setColor('#097b5a')
                .setTitle('✅ Sistema de Tickets Configurado')
                .setDescription('El sistema de tickets ha sido configurado correctamente para este servidor.')
                .addFields(
                    { name: '📁 Categoría de Tickets', value: `${categoria}`, inline: true },
                    { name: '👥 Rol de Staff', value: `${rolStaff}`, inline: true },
                    { name: '📝 Canal de Logs', value: `${canalLogs}`, inline: true },
                    { name: '📄 Canal de Transcripts', value: `${canalTranscript}`, inline: true }
                )
                .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' })
                .setTimestamp();

            return interaction.reply({ embeds: [successEmbed], ephemeral: false });

        } catch (error) {
            console.error('❌ Error en comando configurarTickets:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado al configurar el sistema de tickets. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Configuración de Tickets', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
