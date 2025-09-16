/**
 * Sistema de logging mejorado para el bot de casino
 */

const { EmbedBuilder } = require('discord.js');

/**
 * Clase para manejar logs de transacciones y eventos del casino
 */
class CasinoLogger {
    constructor(client) {
        this.client = client;
        this.logChannelId = process.env.LOG_CHANNEL_ID || '1351318876775776388';
    }

    /**
     * Obtiene el canal de logs
     * @returns {Promise<Channel|null>} Canal de logs o null si no se encuentra
     */
    async getLogChannel() {
        try {
            return await this.client.channels.fetch(this.logChannelId);
        } catch (error) {
            console.error('❌ Error al obtener el canal de logs:', error);
            return null;
        }
    }

    /**
     * Registra una transacción de apuesta
     * @param {Object} data - Datos de la transacción
     * @param {string} data.userId - ID del usuario
     * @param {string} data.username - Nombre del usuario
     * @param {number} data.amount - Monto de la apuesta
     * @param {string} data.type - Tipo de apuesta (sports, blackjack, etc.)
     * @param {string} data.details - Detalles adicionales
     */
    async logBet(data) {
        const { userId, username, amount, type, details } = data;
        
        const logChannel = await this.getLogChannel();
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle('🎲 Registro de Apuesta')
            .setColor('#ffe417')
            .addFields(
                { name: '👤 Usuario', value: `<@${userId}> (${username})`, inline: true },
                { name: '💰 Monto', value: `$${amount.toLocaleString()}`, inline: true },
                { name: '🎯 Tipo', value: type, inline: true },
                { name: '📝 Detalles', value: details || 'Sin detalles adicionales', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'bet365 - Sistema de Logs', iconURL: 'https://i.imgur.com/SuTgawd.png' });

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Error al enviar log de apuesta:', error);
        }
    }

    /**
     * Registra una transacción de depósito/retiro
     * @param {Object} data - Datos de la transacción
     * @param {string} data.userId - ID del usuario
     * @param {string} data.username - Nombre del usuario
     * @param {number} data.amount - Monto de la transacción
     * @param {string} data.type - Tipo de transacción (deposit, withdraw)
     * @param {string} data.adminId - ID del administrador que realizó la acción
     */
    async logTransaction(data) {
        const { userId, username, amount, type, adminId } = data;
        
        const logChannel = await this.getLogChannel();
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle(`💰 Registro de ${type === 'deposit' ? 'Depósito' : 'Retiro'}`)
            .setColor(type === 'deposit' ? '#097b5a' : '#ff4444')
            .addFields(
                { name: '👤 Usuario', value: `<@${userId}> (${username})`, inline: true },
                { name: '💰 Monto', value: `$${amount.toLocaleString()}`, inline: true },
                { name: '👨‍💼 Administrador', value: `<@${adminId}>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'bet365 - Sistema de Logs', iconURL: 'https://i.imgur.com/SuTgawd.png' });

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Error al enviar log de transacción:', error);
        }
    }

    /**
     * Registra la creación de una nueva cartera
     * @param {Object} data - Datos de la cartera
     * @param {string} data.userId - ID del usuario
     * @param {string} data.username - Nombre del usuario
     * @param {number} data.initialBalance - Balance inicial
     * @param {string} data.adminId - ID del administrador que creó la cartera
     * @param {string} data.promoCode - Código promocional usado (opcional)
     */
    async logWalletCreation(data) {
        const { userId, username, initialBalance, adminId, promoCode } = data;
        
        const logChannel = await this.getLogChannel();
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle('🆕 Nueva Cartera Creada')
            .setColor('#007c5a')
            .addFields(
                { name: '👤 Usuario', value: `<@${userId}> (${username})`, inline: true },
                { name: '💰 Balance Inicial', value: `$${initialBalance.toLocaleString()}`, inline: true },
                { name: '👨‍💼 Administrador', value: `<@${adminId}>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'bet365 - Sistema de Logs', iconURL: 'https://i.imgur.com/SuTgawd.png' });

        if (promoCode) {
            embed.addFields({ name: '🎟️ Código Promocional', value: promoCode, inline: false });
        }

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Error al enviar log de creación de cartera:', error);
        }
    }
}

module.exports = CasinoLogger;
