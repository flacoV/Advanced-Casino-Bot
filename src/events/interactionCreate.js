const { EmbedBuilder, Events } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        try {
            // 🔹 Manejo de Slash Commands
            if (interaction.isCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                if (command.permisorol) {
                    const requiredRoles = command.permisorol;
                    if (!interaction.member.roles.cache.some(r => requiredRoles.includes(r.id))) {
                        await interaction.reply({ content: '🚫 No tienes permiso para usar este comando.', ephemeral: true });
                        return;
                    }
                }

                try {
                    await command.execute(interaction, client);
                } catch (error) {
                    console.error('❌ Error al ejecutar el comando:', error);
                    await interaction.reply({
                        content: '❌ No se logró ejecutar el comando.',
                        ephemeral: true
                    }).catch(() => console.error("❌ No se pudo enviar la respuesta al usuario."));
                }
                return;
            }

            // 🔹 Manejo de Botones - Delegar al manejador de botones
            if (interaction.isButton()) {
                // Importar y ejecutar el manejador de botones
                const handleButtons = require('../functions/handleButtons');
                const buttonHandler = handleButtons(client);
                await buttonHandler(interaction, client);
                return;
            }

        } catch (error) {
            console.error('❌ Error crítico en interactionCreate:', error);
            console.error('Stack trace:', error.stack);
            
            try {
                if (interaction && !interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: "❌ Error crítico del sistema.", ephemeral: true });
                }
            } catch (replyError) {
                console.error('❌ Error al enviar mensaje de error crítico:', replyError);
            }
        }
    },
};