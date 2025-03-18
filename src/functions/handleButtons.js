const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");

const ticketHandler = require(".././buttons.js/crearTicket.js");

const ticketClaims = new Map();

module.exports = (client) => {
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        const { customId, channel, guild, member } = interaction;
        const staffRoleId = "1350942116930654228"; // ID del rol de Staff que tiene permisos

        const hasPermission = member.permissions.has(PermissionFlagsBits.Administrator) || member.roles.cache.has(staffRoleId);

        try {
            switch (customId) {
                case "crearticket":
                case "notify_ticket":
                case "contratar_ticket":
                    await interaction.deferReply({ ephemeral: true });

                    // Verificar si el usuario ya tiene un ticket abierto
                    const existingChannel = interaction.guild.channels.cache.find(
                        (channel) => channel.name === `ticket-${interaction.user.username}`
                    );

                    if (existingChannel) {
                        return interaction.editReply({ 
                            content: `⚠️ Ya tienes un ticket abierto en <#${existingChannel.id}>`, 
                            ephemeral: true 
                        });
                    }

                    // Definir el motivo del ticket
                    let ticketReason = "💻 Soporte Técnico";
                    if (customId === "notify_ticket") ticketReason = "📢 Notify | Notificaciones";
                    if (customId === "contratar_ticket") ticketReason = "🤝 Contratar Servicios";

                    // Crear los botones de gestión
                    const buttons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel("📑 Transcript").setCustomId("transcript").setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setLabel("👋 Claim").setCustomId("claim").setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setLabel("❌ Close").setCustomId("close").setStyle(ButtonStyle.Danger)
                    );

                    // Crear el canal del ticket
                    const ticketChannel = await interaction.guild.channels.create({
                        name: `ticket-${interaction.user.username}`,
                        type: 0, // Canal de texto
                        parent: process.env.TICKET_CATEGORY_ID, // Categoría de tickets
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
                                id: process.env.STAFF_ROLE_ID, // ID del rol de staff
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                            }
                        ],
                    });

                    // Crear embed de bienvenida con el motivo del ticket
                    const embed = new EmbedBuilder()
                        .setTitle(`🎫 Ticket creado - ${interaction.user.username}`)
                        .setDescription(`**Motivo:** ${ticketReason}\n\n🔹 Un miembro del equipo te atenderá pronto.`)
                        .setColor(0x0099ff);

                    // Enviar mensaje en el canal del ticket con botones de gestión
                    await ticketChannel.send({ 
                        content: `<@${interaction.user.id}>`, 
                        embeds: [embed], 
                        components: [buttons]
                    });

                    // Confirmar la creación del ticket
                    await interaction.editReply({ 
                        content: `✅ Ticket de **${ticketReason}** creado en <#${ticketChannel.id}>`, 
                        ephemeral: true 
                    });
                    break;

                case "transcript":
                    if (!hasPermission) {
                        return interaction.reply({ content: "❌ No tienes permisos para usar este botón.", ephemeral: true });
                    }

                    try {
                        await interaction.reply({ content: "📑 Generando transcript, por favor espera...", ephemeral: true });

                        const transcriptChannelId = "11350986257399812199"; 
                        const transcriptChannel = await client.channels.fetch(transcriptChannelId);

                        if (!transcriptChannel) {
                            return interaction.editReply({ content: "⚠️ No se encontró el canal de transcripts. Contacta con un administrador." });
                        }

                        const attachment = await createTranscript(channel, {
                            limit: 100, 
                            returnBuffer: false,
                            filename: `transcript-${channel.name}.html`
                        });

                        const transcriptEmbed = new EmbedBuilder()
                            .setTitle("📜 Nuevo Transcript")
                            .setDescription(`Aquí está la transcripción del ticket: **${channel.name}**`)
                            .setColor(0x0099ff)
                            .setTimestamp()
                            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

                        await transcriptChannel.send({ embeds: [transcriptEmbed], files: [attachment] });

                        await interaction.editReply({ content: `✅ Transcript enviado a <#${transcriptChannelId}>.` });

                    } catch (error) {
                        console.error("❌ Error al generar el transcript:", error);
                        await interaction.followUp({ content: "⚠️ Ocurrió un error al generar el transcript.", ephemeral: true });
                    }
                    break;

                    case "claim":
                        if (!hasPermission) {
                            return interaction.reply({ content: "❌ No tienes permisos para reclamar este ticket.", ephemeral: true });
                        }
                    
                        await interaction.deferReply({ ephemeral: true });
                    
                        const claimMessage = channel.topic;
                        if (claimMessage && claimMessage.includes("Asistente")) {
                            return interaction.editReply({ content: "⚠️ Este ticket ya ha sido reclamado por otro asistente.", ephemeral: true });
                        }
                    
                        // Guardar quién lo claimeó en la variable global
                        ticketClaims.set(channel.id, interaction.user.id);
                    
                        await channel.setTopic(`🎟️ Asistente asignado: ${interaction.user.tag}`);
                    
                        await interaction.editReply({ content: `✅ Has sido asignado a este ticket.`, ephemeral: true });
                        await channel.send(`👤 **El Asistente ${interaction.user} ha sido asignado a este ticket de soporte.**`);
                        break;
                                                                                

                        case "close":
                            if (!hasPermission) {
                                return interaction.reply({ content: "❌ No tienes permisos para usar este botón.", ephemeral: true });
                            }
                        
                            await interaction.deferReply({ ephemeral: true });
                        
                            await interaction.editReply({ content: "⚠️ Cerrando ticket en 5 segundos...", ephemeral: true });
                        
                            // Obtener quién lo claimeó (si nadie lo hizo, será "N/A")
                            const claimedBy = ticketClaims.get(channel.id) ? `<@${ticketClaims.get(channel.id)}>` : "N/A";
                        
                            const logChannel = client.channels.cache.get("1350986216606138521"); // Reemplazá con el ID real del canal de logs
                            if (logChannel) {
                                const embed = new EmbedBuilder()
                                    .setTitle("📌 Ticket Cerrado")
                                    .setColor("#ff0000")
                                    .addFields(
                                        { name: "🎫 Ticket", value: channel.name, inline: true },
                                        { name: "👤 Usuario", value: `@${channel.name.split('-')[1]}`, inline: true },
                                        { name: "🛠️ Soporte", value: claimedBy !== "N/A" ? `${claimedBy}` : "N/A", inline: true },
                                        { name: "📅 Fecha de Cierre", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                                    )
                                    .setFooter({ text: "Sistema de Tickets", iconURL: "https://your-bot-icon-url.com" });
                        
                                await logChannel.send({ embeds: [embed] });
                            }
                        
                            setTimeout(async () => {
                                await channel.delete();
                            }, 5000);
                            break;
                        

                default:
                    await interaction.reply({ content: "⚠️ Botón no reconocido.", ephemeral: true });
            }
        } catch (error) {
            console.error(`🔴 Error en handleButtons:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "❌ Hubo un error al ejecutar la acción.", ephemeral: true });
            }
        }
    });
};