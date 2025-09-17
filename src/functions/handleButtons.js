const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");
const Wallet = require("../schema/Wallet");
const TicketConfig = require("../schema/TicketConfig");
const CasinoLogger = require("../utils/logger");

const ticketHandler = require(".././buttons.js/crearTicket.js");
const moderationActions = require(".././buttons.js/moderationActions.js");
const moderationModals = require(".././buttons.js/moderationModals.js");

const ticketClaims = new Map();

/**
 * Valida que una interacción sea válida y segura de procesar
 * @param {import('discord.js').Interaction} interaction 
 * @returns {boolean}
 */
function validateInteraction(interaction) {
    try {
        // Verificar que la interacción existe
        if (!interaction) {
            console.error('❌ Interacción es null o undefined');
            return false;
        }

        // Verificar que es un botón
        if (!interaction.isButton()) {
            return false;
        }

        // Verificar datos básicos
        if (!interaction.user || !interaction.guild || !interaction.member) {
            console.error('❌ Interacción inválida - faltan datos básicos');
            return false;
        }

        // Verificar que el customId existe
        if (!interaction.customId) {
            console.error('❌ Interacción sin customId');
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Error al validar interacción:', error);
        return false;
    }
}

/**
 * Obtiene la configuración de tickets para un servidor
 * @param {string} guildId - ID del servidor
 * @returns {Promise<Object|null>} Configuración de tickets o null si no existe
 */
async function getTicketConfig(guildId) {
    try {
        // Verificar si la conexión a MongoDB está disponible
        if (!TicketConfig || !TicketConfig.findOne) {
            console.log('⚠️ TicketConfig no disponible, usando configuración por defecto');
            return null;
        }
        
        const config = await TicketConfig.findOne({ guildId });
        return config;
    } catch (error) {
        console.error('❌ Error al obtener configuración de tickets:', error);
        // En caso de error, retornar null para usar configuración por defecto
        return null;
    }
}

// Función que maneja los botones (llamada desde interactionCreate.js)
const handleButtonInteraction = async (interaction, client) => {
        try {
            // Validar la interacción antes de procesarla
            if (!validateInteraction(interaction)) {
                return;
            }

            const { customId, channel, guild, member } = interaction;
            const staffRoleId = "1350942116930654228"; // ID del rol de Staff que tiene permisos

            console.log(`🔘 Botón presionado: ${customId} por ${interaction.user.username} en ${interaction.channel?.name || 'canal desconocido'}`);

            const hasPermission = member.permissions.has(PermissionFlagsBits.Administrator) || member.roles.cache.has(staffRoleId);

            // Agregar timeout para prevenir interacciones colgadas
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout de interacción')), 30000); // 30 segundos
            });

            try {
                await Promise.race([
                    (async () => {
                        switch (customId) {
                case "crearticket":
                case "notify_ticket":
                case "contratar_ticket":
                    console.log(`🎫 Usuario ${interaction.user.username} (${interaction.user.id}) intentando crear ticket: ${customId}`);
                    await interaction.deferReply({ ephemeral: true });

                    // Obtener configuración de tickets (con valores por defecto si no existe)
                    let ticketConfig = await getTicketConfig(interaction.guild.id);
                    if (!ticketConfig) {
                        // Usar valores por defecto si no hay configuración
                        ticketConfig = {
                            ticketCategoryId: null, // Se creará en la categoría general si no existe
                            staffRoleId: "1350942116930654228", // ID del rol de Staff por defecto
                            logChannelId: null, // No se registrará en logs si no está configurado
                            transcriptChannelId: null // No se guardará transcript si no está configurado
                        };
                    }

                    // Verificar si el usuario ya tiene un ticket abierto
                    try {
                        // Buscar en caché primero
                        let existingChannel = interaction.guild.channels.cache.find(
                            (channel) => channel.name === `ticket-${interaction.user.username}`
                        );

                        // Si no se encuentra en caché, buscar en todos los canales
                        if (!existingChannel) {
                            const allChannels = await interaction.guild.channels.fetch();
                            existingChannel = allChannels.find(
                                (channel) => channel.name === `ticket-${interaction.user.username}`
                            );
                        }

                        if (existingChannel) {
                            console.log(`⚠️ Usuario ${interaction.user.username} ya tiene un ticket abierto: ${existingChannel.name}`);
                            return interaction.editReply({ 
                                content: `⚠️ Ya tienes un ticket abierto en <#${existingChannel.id}>\n\nSi no puedes verlo, contacta con un administrador.`, 
                                ephemeral: true 
                            });
                        }
                    } catch (error) {
                        console.error('❌ Error al verificar tickets existentes:', error);
                        // Continuar con la creación del ticket si hay error en la verificación
                        console.log('⚠️ Continuando con la creación del ticket a pesar del error en verificación');
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
                    let ticketChannel;
                    try {
                        console.log(`🔨 Creando canal para ticket: ticket-${interaction.user.username}`);
                        
                        // Verificar si la categoría existe antes de usarla
                        let parentCategory = null;
                        if (ticketConfig.ticketCategoryId) {
                            try {
                                const category = await interaction.guild.channels.fetch(ticketConfig.ticketCategoryId);
                                if (category && category.type === 4) { // 4 = GUILD_CATEGORY
                                    parentCategory = ticketConfig.ticketCategoryId;
                                    console.log(`✅ Usando categoría: ${category.name}`);
                                } else {
                                    console.log(`⚠️ La categoría ${ticketConfig.ticketCategoryId} no es válida, creando sin categoría`);
                                }
                            } catch (categoryError) {
                                console.log(`⚠️ Error al verificar categoría ${ticketConfig.ticketCategoryId}:`, categoryError.message);
                            }
                        }
                        
                        ticketChannel = await interaction.guild.channels.create({
                            name: `ticket-${interaction.user.username}`,
                            type: 0, // Canal de texto
                            parent: parentCategory, // Categoría de tickets (solo si es válida)
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
                                    id: ticketConfig.staffRoleId, // ID del rol de staff
                                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                                }
                            ],
                        });
                    } catch (error) {
                        console.error('❌ Error al crear el canal del ticket:', error);
                        console.error('Stack trace:', error.stack);
                        return interaction.editReply({ 
                            content: `❌ Error al crear el canal del ticket: ${error.message}\n\nVerifica que el bot tenga permisos para crear canales.`, 
                            ephemeral: true 
                        });
                    }

                    // Crear embed de bienvenida con el motivo del ticket
                    const embed = new EmbedBuilder()
                        .setTitle(`🎫 Ticket creado - ${interaction.user.username}`)
                        .setDescription(`**Motivo:** ${ticketReason}\n\n🔹 Un miembro del equipo te atenderá pronto.\n\n**Botones disponibles:**\n📑 **Transcript** - Generar transcripción del ticket\n👋 **Claim** - Reclamar el ticket (solo staff)\n❌ **Close** - Cerrar el ticket (solo staff)`)
                        .setColor(0x0099ff)
                        .setTimestamp()
                        .setFooter({ text: 'Sistema de Tickets bet365', iconURL: 'https://i.imgur.com/SuTgawd.png' });

                    // Enviar mensaje en el canal del ticket con botones de gestión
                    try {
                        console.log(`📤 Enviando mensaje con botones al canal ${ticketChannel.name}`);
                        await ticketChannel.send({ 
                            content: `<@${interaction.user.id}>`, 
                            embeds: [embed], 
                            components: [buttons]
                        });
                        console.log(`✅ Mensaje enviado correctamente al canal ${ticketChannel.name}`);
                    } catch (error) {
                        console.error('❌ Error al enviar mensaje en el ticket:', error);
                        // El canal se creó pero no se pudo enviar el mensaje, intentar enviar un mensaje simple
                        try {
                            await ticketChannel.send(`🎫 **Ticket creado para ${interaction.user.username}**\n**Motivo:** ${ticketReason}\n\nUn miembro del equipo te atenderá pronto.`);
                        } catch (secondError) {
                            console.error('❌ Error crítico al enviar mensaje en el ticket:', secondError);
                        }
                    }

                    // Confirmar la creación del ticket
                    await interaction.editReply({ 
                        content: `✅ Ticket de **${ticketReason}** creado en <#${ticketChannel.id}>`, 
                        ephemeral: true 
                    });
                    break;

                case "transcript":
                    console.log(`📑 Usuario ${interaction.user.username} intentando generar transcript`);
                    if (!hasPermission) {
                        return interaction.reply({ content: "❌ No tienes permisos para usar este botón.", ephemeral: true });
                    }

                    try {
                        if (!interaction.deferred) {
                            await interaction.deferReply({ ephemeral: true });
                        }
                        await interaction.editReply({ content: "📑 Generando transcript, por favor espera..." });

                        // Obtener configuración de tickets
                        const ticketConfig = await getTicketConfig(interaction.guild.id);
                        if (!ticketConfig || !ticketConfig.transcriptChannelId) {
                            return interaction.editReply({ 
                                content: "⚠️ El sistema de transcripts no está configurado. Contacta con un administrador." 
                            });
                        }

                        const transcriptChannel = await client.channels.fetch(ticketConfig.transcriptChannelId);

                        if (!transcriptChannel) {
                            return interaction.editReply({ 
                                content: "⚠️ No se encontró el canal de transcripts. Contacta con un administrador." 
                            });
                        }

                        const attachment = await createTranscript(interaction.channel, {
                            limit: 100, 
                            returnBuffer: false,
                            filename: `transcript-${interaction.channel.name}.html`
                        });

                        const transcriptEmbed = new EmbedBuilder()
                            .setTitle("📜 Nuevo Transcript")
                            .setDescription(`Aquí está la transcripción del ticket: **${interaction.channel.name}**`)
                            .setColor(0x0099ff)
                            .setTimestamp()
                            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

                        await transcriptChannel.send({ embeds: [transcriptEmbed], files: [attachment] });

                        await interaction.editReply({ content: `✅ Transcript enviado a <#${ticketConfig.transcriptChannelId}>.` });

                    } catch (error) {
                        console.error("❌ Error al generar el transcript:", error);
                        await interaction.followUp({ content: "⚠️ Ocurrió un error al generar el transcript.", ephemeral: true });
                    }
                    break;

                    case "claim":
                        console.log(`👋 Usuario ${interaction.user.username} intentando reclamar ticket`);
                        if (!hasPermission) {
                            return interaction.reply({ content: "❌ No tienes permisos para reclamar este ticket.", ephemeral: true });
                        }
                    
                        if (!interaction.deferred) {
                            await interaction.deferReply({ ephemeral: true });
                        }
                    
                        const claimMessage = interaction.channel.topic;
                        if (claimMessage && claimMessage.includes("Asistente")) {
                            return interaction.editReply({ content: "⚠️ Este ticket ya ha sido reclamado por otro asistente.", ephemeral: true });
                        }
                    
                        // Guardar quién lo claimeó en la variable global
                        ticketClaims.set(interaction.channel.id, interaction.user.id);
                    
                        await interaction.channel.setTopic(`🎟️ Asistente asignado: ${interaction.user.tag}`);
                    
                        await interaction.editReply({ content: `✅ Has sido asignado a este ticket.`, ephemeral: true });
                        await interaction.channel.send(`👤 **El Asistente ${interaction.user} ha sido asignado a este ticket de soporte.**`);
                        break;
                                                                                

                        case "close":
                            console.log(`❌ Usuario ${interaction.user.username} intentando cerrar ticket`);
                            if (!hasPermission) {
                                return interaction.reply({ content: "❌ No tienes permisos para usar este botón.", ephemeral: true });
                            }
                        
                            if (!interaction.deferred) {
                                await interaction.deferReply({ ephemeral: true });
                            }
                        
                            await interaction.editReply({ content: "⚠️ Cerrando ticket en 5 segundos...", ephemeral: true });
                        
                            // Obtener quién lo claimeó (si nadie lo hizo, será "N/A")
                            const claimedBy = ticketClaims.get(interaction.channel.id) ? `<@${ticketClaims.get(interaction.channel.id)}>` : "N/A";
                        
                            // Obtener configuración de tickets para el canal de logs
                            const closeTicketConfig = await getTicketConfig(interaction.guild.id);
                            if (closeTicketConfig && closeTicketConfig.logChannelId) {
                                const logChannel = client.channels.cache.get(closeTicketConfig.logChannelId);
                                if (logChannel) {
                                    const embed = new EmbedBuilder()
                                        .setTitle("📌 Ticket Cerrado")
                                        .setColor("#ff0000")
                                        .addFields(
                                            { name: "🎫 Ticket", value: interaction.channel.name, inline: true },
                                            { name: "👤 Usuario", value: `@${interaction.channel.name.split('-')[1]}`, inline: true },
                                            { name: "🛠️ Soporte", value: claimedBy !== "N/A" ? `${claimedBy}` : "N/A", inline: true },
                                            { name: "📅 Fecha de Cierre", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                                        )
                                        .setFooter({ text: "Sistema de Tickets bet365", iconURL: "https://i.imgur.com/SuTgawd.png" });
                                
                                    await logChannel.send({ embeds: [embed] });
                                }
                            }
                        
                            setTimeout(async () => {
                                await interaction.channel.delete();
                            }, 5000);
                            break;
                        

                // Manejo de botones de Blackjack
                case "blackjack_hit":
                case "blackjack_stand":
                case "blackjack_new":
                    await handleBlackjackButton(interaction, client);
                    break;

                // Manejo de botones de moderación
                default:
                    if (customId.startsWith('mod_')) {
                        await moderationActions.execute(interaction, client);
                    } else {
                        await interaction.reply({ content: "⚠️ Botón no reconocido.", ephemeral: true });
                    }
                        }
                    })(),
                    timeoutPromise
                ]);
            } catch (error) {
                console.error(`🔴 Error en handleButtons para ${customId}:`, error);
                console.error('Stack trace:', error.stack);
                
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: "❌ Hubo un error al ejecutar la acción.", ephemeral: true });
                    } else if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({ content: "❌ Hubo un error al ejecutar la acción." });
                    } else {
                        await interaction.followUp({ content: "❌ Hubo un error al ejecutar la acción.", ephemeral: true });
                    }
                } catch (replyError) {
                    console.error('❌ Error al enviar mensaje de error:', replyError);
                }
            }
        } catch (outerError) {
            console.error('🔴 Error crítico en handleButtons:', outerError);
            console.error('Stack trace:', outerError.stack);
            
            // Intentar responder con un mensaje de error básico
            try {
                if (interaction && !interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: "❌ Error crítico del sistema.", ephemeral: true });
                }
            } catch (finalError) {
                console.error('❌ Error final al enviar mensaje de error:', finalError);
            }
        }
};

/**
 * Maneja las interacciones de botones del juego de Blackjack
 */
async function handleBlackjackButton(interaction, client) {
    const userId = interaction.user.id;
    const customId = interaction.customId;
    
    try {
        // Verificar si hay una partida activa
        if (!client.activeGames || !client.activeGames.has(userId)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ No hay partida activa')
                .setDescription('No tienes una partida de blackjack en curso. Usa `/blackjack` para empezar una nueva partida.')
                .setFooter({ text: 'bet365 - Blackjack', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const game = client.activeGames.get(userId);
        let gameUpdated = false;

        // Manejar acciones del juego
        switch (customId) {
            case 'blackjack_hit':
                gameUpdated = game.hit();
                break;
            case 'blackjack_stand':
                gameUpdated = game.stand();
                break;
            case 'blackjack_new':
                // Eliminar partida actual y permitir nueva
                client.activeGames.delete(userId);
                const newGameEmbed = new EmbedBuilder()
                    .setColor('#007c5a')
                    .setTitle('🃏 Nueva Partida Disponible')
                    .setDescription('Tu partida anterior ha sido finalizada. Usa `/blackjack` para empezar una nueva partida.')
                    .setFooter({ text: 'bet365 - Blackjack', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [newGameEmbed], ephemeral: true });
        }

        if (!gameUpdated) {
            return interaction.reply({ content: '⚠️ No se pudo realizar esa acción en este momento.', ephemeral: true });
        }

        // Si el juego terminó, procesar ganancias
        if (game.gameStatus !== 'playing') {
            const winnings = game.getWinnings();
            
            if (winnings > 0) {
                // Buscar cartera del usuario
                const userWallet = await Wallet.findOne({ discordId: userId });
                if (userWallet) {
                    userWallet.balance += winnings;
                    userWallet.transactions.push({
                        type: winnings > game.betAmount ? 'win' : 'bet',
                        amount: winnings,
                        date: new Date()
                    });
                    await userWallet.save();

                    // Log de ganancia
                    const logger = new CasinoLogger(client);
                    await logger.logBet({
                        userId,
                        username: userWallet.username,
                        amount: winnings,
                        type: 'Blackjack Win',
                        details: `Ganancia de $${winnings.toLocaleString()} (Apuesta: $${game.betAmount.toLocaleString()})`
                    });
                }
            }

            // Eliminar partida después de un tiempo
            setTimeout(() => {
                if (client.activeGames) {
                    client.activeGames.delete(userId);
                }
            }, 300000); // 5 minutos
        }

        // Actualizar mensaje con nuevo estado del juego
        const gameEmbed = game.getGameEmbed();
        const gameButtons = game.getGameButtons();

        await interaction.update({ 
            embeds: [gameEmbed], 
            components: [gameButtons] 
        });

    } catch (error) {
        console.error('❌ Error en handleBlackjackButton:', error);
        console.error('Stack trace:', error.stack);
        
        try {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado en el juego. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Blackjack', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            } else if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            }
        } catch (replyError) {
            console.error('❌ Error al enviar mensaje de error en Blackjack:', replyError);
        }
    }
}

// Exportar la función para ser llamada desde interactionCreate.js
module.exports = (client) => {
    return handleButtonInteraction;
};