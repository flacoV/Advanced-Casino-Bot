const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');
const { validateAdminPermissions, validatePromoCode } = require('../../utils/validators');
const CasinoLogger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear')
        .setDescription('Crea una cartera para el usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario al que se le creará la wallet')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('codigo')
                .setDescription('Código promocional (opcional)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const managerRole = process.env.rolceo;
            const ceoNotifyRole = process.env.ceonotify;
            const requiredRoles = [managerRole, ceoNotifyRole].filter(Boolean);
            
            if (!validateAdminPermissions(interaction.member, requiredRoles)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Permisos Insuficientes')
                    .setDescription('No tienes permisos para usar este comando.')
                    .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const user = interaction.options.getUser('usuario');
            const username = interaction.guild.members.cache.get(user.id)?.displayName || user.username;
            const discordId = user.id;
            const promoCode = interaction.options.getString('codigo');

            // Verificar si la cartera ya existe
            const existingWallet = await Wallet.findOne({ discordId });
            if (existingWallet) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Cartera Ya Existe')
                    .setDescription(`El usuario **${username}** ya tiene una cartera registrada.`)
                    .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            let balance = 0;
            let bonusGiven = false;
            let promoOwner = null;
            let usedPromoCode = null;

            // Verificar si se ingresó un código promocional
            if (promoCode && promoCode.trim() !== "") {
                const promoValidation = validatePromoCode(promoCode);
                if (!promoValidation.valid) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4444')
                        .setTitle('❌ Código Promocional Inválido')
                        .setDescription(promoValidation.error)
                        .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                // Buscar si el código promocional pertenece a alguien
                promoOwner = await Wallet.findOne({ promoCode: promoValidation.cleanCode });

                if (!promoOwner) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4444')
                        .setTitle('❌ Código Promocional No Encontrado')
                        .setDescription('El código promocional ingresado no existe en el sistema.')
                        .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                // Aplicar bono al usuario que usa el código
                balance = 20000; // 20K al usuario nuevo
                usedPromoCode = promoValidation.cleanCode;

                // Aplicar bono al dueño del código promocional
                promoOwner.balance += 15000;
                promoOwner.transactions.push({
                    type: 'win',
                    amount: 15000,
                    date: new Date()
                });
                await promoOwner.save();
                bonusGiven = true;
            }

            // Crear la nueva cartera
            const newWallet = new Wallet({
                discordId,
                username,
                balance,
                usedPromoCode,
                transactions: balance > 0 ? [{
                    type: 'deposit',
                    amount: balance,
                    date: new Date()
                }] : []
            });

            await newWallet.save();

            // Log de creación de cartera y actualizar estadísticas
            const logger = new CasinoLogger(interaction.client);
            await logger.logWalletCreation({
                userId: discordId,
                username,
                initialBalance: balance,
                adminId: interaction.user.id,
                promoCode: usedPromoCode
            });
            
            // Actualizar estadísticas del sistema
            await logger.updateSystemStats();

            const successEmbed = new EmbedBuilder()
                .setColor('#097b5a')
                .setTitle('✅ Cartera Creada Exitosamente')
                .setDescription(`Cartera creada para **${username}**`)
                .addFields(
                    { name: '💰 Balance Inicial', value: `$${balance.toLocaleString()}`, inline: true },
                    { name: '🎟️ Código Usado', value: usedPromoCode || 'Ninguno', inline: true },
                    { name: '👨‍💼 Administrador', value: `<@${interaction.user.id}>`, inline: true }
                )
                .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' })
                .setTimestamp();

            if (bonusGiven) {
                successEmbed.addFields({ 
                    name: '🏆 Bono Aplicado', 
                    value: 'Código promocional aplicado con éxito', 
                    inline: false 
                });
            }

            return interaction.reply({ embeds: [successEmbed], ephemeral: false });

        } catch (error) {
            console.error('❌ Error en comando crear:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado al crear la cartera. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};