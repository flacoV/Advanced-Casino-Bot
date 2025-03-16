const { SlashCommandBuilder } = require("@discordjs/builders");
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const devusers = process.env.devusers;
const serversPerPage = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clientes")
        .setDescription("Lista de los clientes con el servicio activo."),
    async execute(interaction) {
        await client.login(process.env.token);
        try {
            const userId = interaction.user.id;

            if (!devusers.includes(userId)) {
                await interaction.reply({ content: "No tienes permiso para ejecutar este comando. Contacta con el proveedor!", ephemeral: true });
                return;
              }

            await client.guilds.fetch();

            const servers = client.guilds.cache.map((guild) => {
                return `${guild.name} (ID: ${guild.id})`;
            });

            const pages = [];
            for (let i = 0; i < servers.length; i += serversPerPage) {
                const page = servers.slice(i, i + serversPerPage);
                pages.push(page);
            }

            let currentPage = 0;

            const embed = {
                title: "Lista de clientes (servidores)",
                description: pages[currentPage].join("\n"),
                footer: {
                    text: `Página ${currentPage + 1} de ${pages.length}`,
                },
            };

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Anterior')
                        .setStyle('1'),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Siguiente')
                        .setStyle('1')
                );

            const message = await interaction.reply({ embeds: [embed], components: [row] });

            const filter = (i) => i.customId === 'prev' || i.customId === 'next';
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev' && currentPage > 0) {
                    currentPage--;
                } else if (i.customId === 'next' && currentPage < pages.length - 1) {
                    currentPage++;
                }

                embed.description = pages[currentPage].join("\n");
                embed.footer.text = `Página ${currentPage + 1} de ${pages.length}`;

                await i.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', () => {
                row.components.forEach(component => {
                    component.setDisabled(true);
                });
                message.edit({ components: [row] }).catch(console.error);
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "Se produjo un error al obtener la lista de servidores.", ephemeral: true });
        }
    },
};