const { EmbedBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const TicketConfig = require("../schema/TicketConfig");

module.exports = {
    data: {
        name: "crearticket",
    },

    /**
     * 
     * @param {import('discord.js').ButtonInteraction} interaction 
     * @param {import('discord.js').Client} client 
     */
    async execute(interaction, client) {
        try {
            // Obtener configuración de tickets
            const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
            if (!ticketConfig) {
                return interaction.reply({
                    content: '❌ El sistema de tickets no está configurado. Contacta con un administrador.',
                    ephemeral: true
                });
            }

            // Verificar si el usuario ya tiene un ticket abierto
            const existingChannel = interaction.guild.channels.cache.find(
                (channel) => channel.name === `ticket-${interaction.user.username}`
            );
            if (existingChannel) {
                return interaction.reply({ 
                    content: "⚠️ Ya tienes un ticket abierto en <#" + existingChannel.id + ">", 
                    ephemeral: true 
                });
            }

            // Crear botones para las opciones dentro del ticket
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("📑 Transcript")
                    .setCustomId("transcript")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setLabel("👋 Claim")
                    .setCustomId("claim")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setLabel("❌ Close")
                    .setCustomId("close")
                    .setStyle(ButtonStyle.Danger)
            );

            // Crear el canal de ticket
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: ticketConfig.ticketCategoryId, // Categoría de tickets desde la configuración
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    },
                    {
                        id: ticketConfig.staffRoleId, // ID del rol de staff desde la configuración
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    }
                ],
            });

            // Crear embed de bienvenida al ticket
            const embed = new EmbedBuilder()
                .setTitle(`🎫 Ticket creado - ${interaction.user.username}`)
                .setDescription("Bienvenido, el equipo de soporte te atenderá pronto.\nPuedes usar los botones de abajo para gestionar tu ticket.")
                .setColor(0x0099ff);

            // Enviar mensaje en el canal del ticket con botones
            await ticketChannel.send({ 
                content: `<@${interaction.user.id}>`, 
                embeds: [embed], 
                components: [buttons] 
            });

            // Responder a la interacción
            await interaction.reply({ 
                content: `✅ Ticket creado en <#${ticketChannel.id}>`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error("❌ Error al crear el ticket:", error);
            await interaction.reply({
                content: "⚠️ Ocurrió un error al crear tu ticket. Inténtalo de nuevo más tarde.",
                ephemeral: true
            });
        }
    },
};