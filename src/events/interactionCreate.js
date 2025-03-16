const { Interaction } = require("discord.js");

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return

        if (command.permisorol) {
            const requiredRoles = command.permisorol;
            if (!interaction.member.roles.cache.some(r => requiredRoles.includes(r.id))) {
                await interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
                return;
            }
        }
        
        try{
            await command.execute(interaction, client);
        } catch (error) {
            console.log(error);
            await interaction.reply({
                content: 'No se logró ejecutar el comando.', 
                ephemeral: true
            });
        } 

    },
    


};