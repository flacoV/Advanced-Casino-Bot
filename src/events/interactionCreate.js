const { EmbedBuilder, Events } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // 🔹 Manejo de Slash Commands (No tocar)
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
    },
};