const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Muestra el panel de tickets de soporte")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    /**
     * 
     *  @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const allowedUserId = "207224852673724416"; // Reemplaza con tu ID

        if (interaction.user.id !== allowedUserId) {
            return interaction.reply({ 
                content: "❌ No tienes permiso para ejecutar este comando.", 
                ephemeral: true 
            });
        }

        // Crear los botones con nombres más específicos
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("💻 Soporte Técnico")
                .setCustomId("crearticket")
                .setEmoji("🛠️")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setLabel("📩 Notify | SaaS")
                .setCustomId("notify_ticket")
                .setEmoji("📢")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setLabel("💼 Contratar Servicios")
                .setCustomId("contratar_ticket")
                .setEmoji("🤝")
                .setStyle(ButtonStyle.Success)
        );

        // Crear un Embed profesional
        const embed = new EmbedBuilder()
            .setTitle("📨 **Centro de Soporte | Reinnova**")
            .setDescription(
                "Bienvenido al sistema de soporte de **Reinnova**.\n\n" +
                "Aquí puedes abrir un ticket para:\n" +
                "🔹 **Soporte Técnico**: Solucionar problemas con software o integraciones.\n" +
                "🔹 **Notify | Notificaciones**: Asistencia sobre notificaciones automáticas.\n" +
                "🔹 **Contratar Servicios**: Consultas sobre nuestros planes y desarrollo de software.\n\n" +
                "📩 **Haz clic en el botón correspondiente para crear un ticket!**"
            )
            .setColor("#0099ff")
            .setThumbnail("https://i.imgur.com/e76ku5l.png") // Puedes cambiar esta URL por el logo de Reinnova
            .setFooter({ text: "Reinnova - Innovando tu empresa", iconURL: "https://i.imgur.com/C6GXDqO.png" });

        await interaction.channel.send({ embeds: [embed], components: [buttons] });
        await interaction.reply({ content: "✅ Panel de soporte enviado.", ephemeral: true });
    },
};





/** const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Muestra el panel de tickets de soporte")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    /**
     * 
     *  @param {ChatInputCommandInteraction} interaction
     */
    /** 
    async execute(interaction) {
        const allowedUserId = "207224852673724416"; // Reemplaza con tu ID

        if (interaction.user.id !== allowedUserId) {
            return interaction.reply({ 
                content: "❌ No tienes permiso para ejecutar este comando.", 
                ephemeral: true 
            });
        }

        // Crear los botones con nombres más específicos
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("🎰 Cartera/Apuesta")
                .setCustomId("crearticket")
                .setEmoji("🪪")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
               .setLabel("💷 Inversiones 365")
               .setCustomId("inversiones365")
                .setEmoji("📊")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
               .setLabel("💼 Trabaja con Nosotros")
               .setCustomId("contratar_ticket")
               .setEmoji("🤝")
               .setStyle(ButtonStyle.Success),
        );

        // Crear un Embed profesional
        const embed = new EmbedBuilder()
            .setTitle("📨 **Centro de Soporte | bet365**")
            .setDescription(
                "Bienvenido al sistema de soporte de **bet365**.\n\n" +
                "Aquí puedes abrir un ticket para crear tu cartera\n" + 
                "o realizar depositos para cualquiera de tus apuestas\n\n" +
                "📩 **Haz clic en el botón correspondiente para crear un ticket!**"
            )
            .setColor("#0099ff")
            .setThumbnail('https://i.imgur.com/vclIRjE.png') // Puedes cambiar esta URL por el logo de Reinnova
            .setFooter({ text: 'bet365 - Haz tu jugada, cambia tu destino', iconURL: 'https://i.imgur.com/SuTgawd.png' });

        await interaction.channel.send({ embeds: [embed], components: [buttons] });
        await interaction.reply({ content: "✅ Panel de soporte enviado.", ephemeral: true });
    },
};

*/