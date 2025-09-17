/**
 * Comando para configurar automáticamente los permisos del rol de mute
 */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationConfig = require('../../schema/ModerationConfig');
const { validateAdminPermissions } = require('../../utils/validators');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar-mute')
        .setDescription('Configura automáticamente los permisos del rol de mute en todos los canales')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Verificar permisos de administrador
            const managerRole = process.env.rolceo;
            if (!validateAdminPermissions(interaction.member, [managerRole])) {
                return interaction.reply({
                    content: '🚫 No tienes permisos para usar este comando.',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            // Obtener configuración de moderación
            const config = await ModerationConfig.findOne({ guildId: interaction.guild.id });
            if (!config || !config.roles.muted) {
                return interaction.editReply({
                    content: '❌ No se ha configurado un rol de mute. Usa `/configurar-moderacion roles` para configurarlo primero.'
                });
            }

            const muteRole = interaction.guild.roles.cache.get(config.roles.muted);
            if (!muteRole) {
                return interaction.editReply({
                    content: '❌ El rol de mute configurado no existe.'
                });
            }

            let channelsUpdated = 0;
            let channelsSkipped = 0;
            const errors = [];

            // Configurar permisos en todos los canales de texto
            const textChannels = interaction.guild.channels.cache.filter(channel => 
                channel.type === 0 && channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)
            );

            for (const [channelId, channel] of textChannels) {
                try {
                    await channel.permissionOverwrites.edit(muteRole, {
                        SendMessages: false,
                        AddReactions: false,
                        CreatePublicThreads: false,
                        CreatePrivateThreads: false,
                        SendMessagesInThreads: false,
                        UseApplicationCommands: false
                    });
                    channelsUpdated++;
                } catch (error) {
                    channelsSkipped++;
                    errors.push(`${channel.name}: ${error.message}`);
                }
            }

            // Configurar permisos en canales de voz
            const voiceChannels = interaction.guild.channels.cache.filter(channel => 
                channel.type === 2 && channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)
            );

            for (const [channelId, channel] of voiceChannels) {
                try {
                    await channel.permissionOverwrites.edit(muteRole, {
                        Connect: false,
                        Speak: false,
                        UseVAD: false,
                        Stream: false
                    });
                    channelsUpdated++;
                } catch (error) {
                    channelsSkipped++;
                    errors.push(`${channel.name}: ${error.message}`);
                }
            }

            // Crear embed de resultado
            const embed = new EmbedBuilder()
                .setTitle('✅ Configuración de Mute Completada')
                .setColor('#097b5a')
                .addFields(
                    { name: '🔇 Rol de Mute', value: `${muteRole}`, inline: true },
                    { name: '📊 Canales Actualizados', value: channelsUpdated.toString(), inline: true },
                    { name: '⚠️ Canales Omitidos', value: channelsSkipped.toString(), inline: true }
                )
                .setTimestamp()
                .setFooter({ 
                    text: 'Sistema de Moderación', 
                    iconURL: interaction.client.user.displayAvatarURL() 
                });

            // Agregar errores si los hay
            if (errors.length > 0) {
                const errorText = errors.slice(0, 5).join('\n');
                embed.addFields({
                    name: '❌ Errores (primeros 5)',
                    value: errorText.length > 1024 ? errorText.substring(0, 1021) + '...' : errorText,
                    inline: false
                });
            }

            // Agregar información sobre permisos configurados
            embed.addFields({
                name: '🔒 Permisos Configurados',
                value: `**Canales de Texto:**\n• Enviar mensajes: ❌\n• Reaccionar: ❌\n• Crear hilos: ❌\n• Usar comandos: ❌\n\n**Canales de Voz:**\n• Conectar: ❌\n• Hablar: ❌\n• Usar VAD: ❌\n• Transmitir: ❌`,
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Error en comando configurar-mute:', error);
            await interaction.editReply({
                content: '❌ Error al configurar los permisos de mute.'
            });
        }
    }
};
