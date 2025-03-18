const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');

const walletsPerPage = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clientes')
        .setDescription('Muestra la lista de clientes con su saldo actual.'),

    async execute(interaction) {
        const managerRole = process.env.rolceo;
        const ceoNotifyRole = process.env.ceonotify;
        if (!interaction.member.roles.cache.has(managerRole) && !interaction.member.roles.cache.has(ceoNotifyRole)) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
        }

        try {
            const wallets = await Wallet.find().sort({ balance: -1 }); // Ordena por saldo descendente
            if (wallets.length === 0) {
                return interaction.reply({ content: '📭 No hay clientes registrados aún.', ephemeral: true });
            }

            const pages = [];
            for (let i = 0; i < wallets.length; i += walletsPerPage) {
                const page = wallets.slice(i, i + walletsPerPage).map(wallet => `👤 **${wallet.username}** - 💰 $${wallet.balance.toLocaleString()}`).join('\n');
                pages.push(page);
            }

            let currentPage = 0;
            const embed = new EmbedBuilder()
                .setTitle('📋 Lista de clientes y saldo')
                .setDescription(pages[currentPage])
                .setFooter({ text: `Página ${currentPage + 1} de ${pages.length}` })
                .setColor('#00BFFF');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('⬅️ Anterior').setStyle(1).setDisabled(currentPage === 0),
                new ButtonBuilder().setCustomId('next').setLabel('Siguiente ➡️').setStyle(1).setDisabled(currentPage === pages.length - 1)
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

                embed.setDescription(pages[currentPage]);
                embed.setFooter({ text: `Página ${currentPage + 1} de ${pages.length}` });

                row.components[0].setDisabled(currentPage === 0);
                row.components[1].setDisabled(currentPage === pages.length - 1);

                await i.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', () => {
                row.components.forEach(component => component.setDisabled(true));
                message.edit({ components: [row] }).catch(console.error);
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: '❌ Ocurrió un error al obtener la lista de clientes.', ephemeral: true });
        }
    }
};
