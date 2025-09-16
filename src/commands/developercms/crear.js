const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');
const PromoCode = require('../../schema/PromoCode');
const { validateAdminPermissions } = require('../../utils/validators');
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
            
            // Inicializar logger
            const logger = new CasinoLogger(interaction.client);

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
            let promoCodeData = null;

            // Verificar si se ingresó un código promocional
            if (promoCode && promoCode.trim() !== "") {
                // Buscar el código promocional activo
                promoCodeData = await PromoCode.findActiveCode(promoCode.trim());

                if (!promoCodeData) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4444')
                        .setTitle('❌ Código Promocional No Válido')
                        .setDescription('El código promocional no existe, está inactivo o ha expirado.')
                        .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                // Verificar si el usuario ya usó este código
                if (promoCodeData.hasUserUsed(discordId)) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4444')
                        .setTitle('❌ Código Ya Utilizado')
                        .setDescription('Este usuario ya ha usado este código promocional anteriormente.')
                        .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                // Buscar la cartera del propietario del código
                promoOwner = await Wallet.findOne({ discordId: promoCodeData.ownerId });

                if (!promoOwner) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff4444')
                        .setTitle('❌ Error del Sistema')
                        .setDescription('El propietario del código promocional no tiene una cartera válida.')
                        .setFooter({ text: 'bet365 - Sistema Administrativo', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                    
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                // Aplicar bono al usuario que usa el código (cliente nuevo)
                balance = 20000; // 20K de bono al usuario nuevo
                usedPromoCode = promoCodeData.code;

                // Aplicar bono al dueño del código promocional (referidor)
                promoOwner.balance += 15000;
                promoOwner.transactions.push({
                    type: 'win',
                    amount: 15000,
                    date: new Date(),
                    description: `Bono por referido: ${username} usó código ${promoCodeData.code}`,
                    gameType: 'referral'
                });
                await promoOwner.save();

                // Registrar el uso del código
                await promoCodeData.recordUsage(discordId, username);
                
                // Log del bono para el referidor
                await logger.logTransaction({
                    userId: promoOwner.discordId,
                    username: promoOwner.username,
                    amount: 15000,
                    type: 'win',
                    adminId: interaction.user.id,
                    description: `Bono por referido: ${username} usó código ${promoCodeData.code}`
                });
                
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
                    date: new Date(),
                    description: usedPromoCode ? `Bono de bienvenida + código promocional: ${usedPromoCode}` : 'Depósito inicial',
                    gameType: usedPromoCode ? 'referral' : 'deposit'
                }] : []
            });

            await newWallet.save();

            // Log de creación de cartera y actualizar estadísticas
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

            if (bonusGiven && promoCodeData) {
                successEmbed.addFields(
                    { 
                        name: '🏆 Bonos Aplicados', 
                        value: `**Usuario nuevo:** $20,000\n**Referidor:** $15,000`, 
                        inline: false 
                    },
                    { 
                        name: '👤 Propietario del Código', 
                        value: `${promoCodeData.ownerUsername}`, 
                        inline: true 
                    },
                    { 
                        name: '📊 Usos del Código', 
                        value: `${promoCodeData.totalUses}`, 
                        inline: true 
                    }
                );
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