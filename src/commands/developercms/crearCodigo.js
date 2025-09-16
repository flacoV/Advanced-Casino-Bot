/**
 * Comando para crear códigos promocionales (solo CEO)
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const PromoCode = require('../../schema/PromoCode');
const Wallet = require('../../schema/Wallet');
const { validateWallet } = require('../../utils/validators');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-codigo')
        .setDescription('Crea un código promocional para un usuario específico (solo CEO)')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario que será propietario del código promocional')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('codigo')
                .setDescription('Código promocional personalizado (opcional, se genera automáticamente si no se especifica)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('dias_expiracion')
                .setDescription('Días hasta que expire el código (opcional, 0 = no expira)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(365)),

    async execute(interaction) {
        try {
            // Verificar que sea CEO
            const ceoRole = process.env.ceonotify;
            if (!interaction.member.roles.cache.has(ceoRole)) {
                return interaction.reply({
                    content: '🚫 Solo el CEO puede crear códigos promocionales.',
                    ephemeral: true
                });
            }

            const targetUser = interaction.options.getUser('usuario');
            const customCode = interaction.options.getString('codigo');
            const expirationDays = interaction.options.getInteger('dias_expiracion') || 0;

            // Verificar que el usuario tenga una cartera
            const userWallet = await Wallet.findOne({ discordId: targetUser.id });
            const walletValidation = validateWallet(userWallet, targetUser.username);
            if (!walletValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Cartera No Encontrada')
                    .setDescription(`El usuario ${targetUser.username} no tiene una cartera. Debe crear una cartera primero.`)
                    .setFooter({ text: 'bet365 - Sistema de Códigos', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Generar código si no se especifica uno personalizado
            let promoCode;
            if (customCode) {
                promoCode = customCode.toUpperCase().trim();
                
                // Verificar que el código personalizado no exista
                const existingCode = await PromoCode.findOne({ code: promoCode });
                if (existingCode) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4444')
                        .setTitle('❌ Código Ya Existe')
                        .setDescription(`El código "${promoCode}" ya está en uso.`)
                        .setFooter({ text: 'bet365 - Sistema de Códigos', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } else {
                // Generar código automático
                promoCode = await generateUniqueCode();
            }

            // Calcular fecha de expiración
            let expiresAt = null;
            if (expirationDays > 0) {
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + expirationDays);
            }

            // Crear el código promocional
            const newPromoCode = new PromoCode({
                code: promoCode,
                ownerId: targetUser.id,
                ownerUsername: targetUser.username,
                expiresAt: expiresAt
            });

            await newPromoCode.save();

            // Crear embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setTitle('🎟️ Código Promocional Creado')
                .setColor('#097b5a')
                .setDescription(`Se ha creado exitosamente un código promocional para <@${targetUser.id}>`)
                .addFields(
                    { name: '👤 Propietario', value: `${targetUser.username} (${targetUser.id})`, inline: true },
                    { name: '🎟️ Código', value: `\`${promoCode}\``, inline: true },
                    { name: '📊 Usos', value: '0', inline: true },
                    { name: '💰 Bono por Referido', value: '$20,000', inline: true },
                    { name: '🎁 Bono para Referidor', value: '$15,000', inline: true },
                    { name: '📅 Expira', value: expiresAt ? expiresAt.toLocaleDateString() : 'Nunca', inline: true }
                )
                .setFooter({ text: 'bet365 - Sistema de Códigos', iconURL: 'https://i.imgur.com/SuTgawd.png' })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('❌ Error en comando crear-codigo:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado al crear el código promocional. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Sistema de Códigos', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};

/**
 * Genera un código promocional único
 */
async function generateUniqueCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let isUnique = false;
    
    while (!isUnique) {
        code = '';
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        // Verificar que el código sea único
        const existingCode = await PromoCode.findOne({ code: code });
        if (!existingCode) {
            isUnique = true;
        }
    }
    
    return code;
}
