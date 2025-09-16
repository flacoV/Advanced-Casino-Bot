/**
 * Comando para pagar ganancias de apuestas deportivas
 * Diferente del comando /agregar, este registra específicamente ganancias de apuestas
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Wallet = require('../../schema/Wallet');
const { validateAmount, validateWallet } = require('../../utils/validators');
const CasinoLogger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pagar-ganancia')
        .setDescription('Paga ganancias de apuestas deportivas a un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario al que se le pagará la ganancia')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('monto')
                .setDescription('Monto de la ganancia a pagar')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('Descripción de la apuesta ganada (opcional)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Verificar permisos
            const managerRole = process.env.rolceo;
            const ceoNotifyRole = process.env.ceonotify;
            
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
                !interaction.member.roles.cache.has(managerRole) && 
                !interaction.member.roles.cache.has(ceoNotifyRole)) {
                return interaction.reply({
                    content: '🚫 No tienes permisos para usar este comando.',
                    ephemeral: true
                });
            }

            const targetUser = interaction.options.getUser('usuario');
            const monto = interaction.options.getInteger('monto');
            const descripcion = interaction.options.getString('descripcion') || 'Ganancia de apuesta deportiva';

            // Validar monto
            const amountValidation = validateAmount(monto, 1, 10000000); // Máximo 10 millones
            if (!amountValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Monto Inválido')
                    .setDescription(amountValidation.error)
                    .setFooter({ text: 'bet365 - Sistema de Pagos', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Buscar cartera del usuario
            const userWallet = await Wallet.findOne({ discordId: targetUser.id });
            const walletValidation = validateWallet(userWallet, targetUser.username);
            if (!walletValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Cartera No Encontrada')
                    .setDescription(walletValidation.error)
                    .setFooter({ text: 'bet365 - Sistema de Pagos', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Agregar ganancia a la cartera
            userWallet.balance += monto;
            
            // Registrar transacción de ganancia
            userWallet.transactions.push({
                type: 'win',
                amount: monto,
                date: new Date(),
                description: descripcion,
                gameType: 'sports'
            });

            await userWallet.save();

            // Actualizar estadísticas del sistema
            const logger = new CasinoLogger(interaction.client);
            await logger.updateSystemStats();

            // Crear embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setTitle('💰 Ganancia Pagada')
                .setColor('#097b5a')
                .setDescription(`Se ha pagado exitosamente la ganancia a <@${targetUser.id}>`)
                .addFields(
                    { name: '👤 Usuario', value: `${targetUser.username} (${targetUser.id})`, inline: true },
                    { name: '💰 Monto Pagado', value: `$${monto.toLocaleString()}`, inline: true },
                    { name: '💳 Nuevo Balance', value: `$${userWallet.balance.toLocaleString()}`, inline: true },
                    { name: '📝 Descripción', value: descripcion, inline: false },
                    { name: '👨‍💼 Pagado por', value: `<@${interaction.user.id}>`, inline: true }
                )
                .setFooter({ text: 'bet365 - Sistema de Pagos', iconURL: 'https://i.imgur.com/SuTgawd.png' })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

            // Log de la transacción
            await logger.logTransaction({
                userId: targetUser.id,
                username: userWallet.username,
                amount: monto,
                type: 'win',
                adminId: interaction.user.id,
                description: descripcion
            });

        } catch (error) {
            console.error('❌ Error en comando pagar-ganancia:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado al procesar el pago. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Sistema de Pagos', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
