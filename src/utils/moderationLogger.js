/**
 * Sistema de logging para moderación
 */
const { EmbedBuilder } = require('discord.js');
const ModerationConfig = require('../schema/ModerationConfig');

/**
 * Clase para manejar logs de moderación
 */
class ModerationLogger {
    constructor(client) {
        this.client = client;
    }

    /**
     * Obtiene el canal de logs para una acción específica
     * @param {string} guildId - ID del servidor
     * @param {string} action - Tipo de acción
     * @returns {Promise<Channel|null>} Canal de logs o null si no se encuentra
     */
    async getLogChannel(guildId, action) {
        try {
            const config = await ModerationConfig.findOne({ guildId });
            if (!config) return null;

            // Buscar canal específico para la acción
            let channelId = config.logChannels[action];
            
            // Si no hay canal específico, usar canal general
            if (!channelId) {
                channelId = config.logChannels.general;
            }

            if (!channelId) return null;

            return await this.client.channels.fetch(channelId);
        } catch (error) {
            console.error('❌ Error al obtener canal de logs de moderación:', error);
            return null;
        }
    }

    /**
     * Registra una acción de moderación
     * @param {Object} data - Datos de la acción
     * @param {string} data.guildId - ID del servidor
     * @param {string} data.userId - ID del usuario moderado
     * @param {string} data.username - Nombre del usuario moderado
     * @param {string} data.moderatorId - ID del moderador
     * @param {string} data.moderatorUsername - Nombre del moderador
     * @param {string} data.action - Tipo de acción
     * @param {string} data.reason - Razón de la acción
     * @param {string} data.caseId - ID del caso
     * @param {number} data.duration - Duración (opcional)
     * @param {string} data.evidence - Evidencia (opcional)
     */
    async logModerationAction(data) {
        const { guildId, userId, username, moderatorId, moderatorUsername, action, reason, caseId, duration, evidence } = data;
        
        const logChannel = await this.getLogChannel(guildId, action);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle(`${this.getActionEmoji(action)} ${action.toUpperCase()} - ${username}`)
            .setColor(this.getActionColor(action))
            .setThumbnail(`https://cdn.discordapp.com/avatars/${userId}/${this.client.users.cache.get(userId)?.avatar}.png?size=256`)
            .addFields(
                { name: '👤 Usuario', value: `${username}\n<@${userId}>`, inline: true },
                { name: '👨‍💼 Moderador', value: `${moderatorUsername}\n<@${moderatorId}>`, inline: true },
                { name: '📝 Razón', value: reason, inline: false },
                { name: '🆔 Caso', value: caseId, inline: true }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Sistema de Moderación', 
                iconURL: this.client.user.displayAvatarURL() 
            });

        // Agregar duración si existe
        if (duration) {
            const durationText = action === 'ban' ? `${duration} días` : `${duration} minutos`;
            embed.addFields({ name: '⏰ Duración', value: durationText, inline: true });
        }

        // Agregar evidencia si existe
        if (evidence) {
            embed.addFields({ name: '📎 Evidencia', value: evidence, inline: false });
        }

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Error al enviar log de moderación:', error);
        }
    }

    /**
     * Registra el inicio de una sesión de moderación
     * @param {Object} data - Datos de la sesión
     */
    async logModerationSession(data) {
        const { guildId, moderatorId, moderatorUsername, targetUserId, targetUsername } = data;
        
        const logChannel = await this.getLogChannel(guildId, 'general');
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle('🔨 Sesión de Moderación Iniciada')
            .setColor('#097b5a')
            .addFields(
                { name: '👨‍💼 Moderador', value: `${moderatorUsername}\n<@${moderatorId}>`, inline: true },
                { name: '👤 Usuario Objetivo', value: `${targetUsername}\n<@${targetUserId}>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Sistema de Moderación', 
                iconURL: this.client.user.displayAvatarURL() 
            });

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Error al enviar log de sesión de moderación:', error);
        }
    }

    /**
     * Registra una acción automática del sistema
     * @param {Object} data - Datos de la acción automática
     */
    async logAutoModAction(data) {
        const { guildId, userId, username, action, reason, triggerCount } = data;
        
        const logChannel = await this.getLogChannel(guildId, 'general');
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle(`🤖 Acción Automática - ${action.toUpperCase()}`)
            .setColor('#ff8800')
            .addFields(
                { name: '👤 Usuario', value: `${username}\n<@${userId}>`, inline: true },
                { name: '📝 Razón', value: reason, inline: false },
                { name: '🔢 Trigger Count', value: triggerCount.toString(), inline: true }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'AutoMod System', 
                iconURL: this.client.user.displayAvatarURL() 
            });

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Error al enviar log de AutoMod:', error);
        }
    }

    /**
     * Registra la remoción de una sanción
     * @param {Object} data - Datos de la remoción
     */
    async logSanctionRemoval(data) {
        const { guildId, userId, username, moderatorId, moderatorUsername, action, caseId, reason } = data;
        
        const logChannel = await this.getLogChannel(guildId, action);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle(`✅ Sanción Removida - ${action.toUpperCase()}`)
            .setColor('#097b5a')
            .addFields(
                { name: '👤 Usuario', value: `${username}\n<@${userId}>`, inline: true },
                { name: '👨‍💼 Moderador', value: `${moderatorUsername}\n<@${moderatorId}>`, inline: true },
                { name: '📝 Razón', value: reason || 'Sin razón especificada', inline: false },
                { name: '🆔 Caso Original', value: caseId, inline: true }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Sistema de Moderación', 
                iconURL: this.client.user.displayAvatarURL() 
            });

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Error al enviar log de remoción de sanción:', error);
        }
    }

    /**
     * Obtiene el emoji para una acción
     * @param {string} action - Tipo de acción
     * @returns {string} Emoji correspondiente
     */
    getActionEmoji(action) {
        const emojis = {
            strike: '⚡',
            kick: '👢',
            mute: '🔇',
            ban: '🔨',
            warn: '⚠️',
            timeout: '⏰',
            unmute: '🔓',
            unban: '🔓',
            untimeout: '🔓'
        };
        return emojis[action] || '🔨';
    }

    /**
     * Obtiene el color para una acción
     * @param {string} action - Tipo de acción
     * @returns {string} Color en hexadecimal
     */
    getActionColor(action) {
        const colors = {
            strike: '#ff4444',
            kick: '#ff8800',
            mute: '#ffaa00',
            ban: '#cc0000',
            warn: '#ffaa00',
            timeout: '#ff4444',
            unmute: '#097b5a',
            unban: '#097b5a',
            untimeout: '#097b5a'
        };
        return colors[action] || '#ff4444';
    }

    /**
     * Crea un resumen de moderación para un usuario
     * @param {Object} data - Datos del usuario
     * @returns {EmbedBuilder} Embed con el resumen
     */
    createUserSummary(data) {
        const { username, userId, stats, recentActions } = data;
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 Resumen de Moderación - ${username}`)
            .setColor('#097b5a')
            .setThumbnail(`https://cdn.discordapp.com/avatars/${userId}/${this.client.users.cache.get(userId)?.avatar}.png?size=256`)
            .addFields(
                {
                    name: '📈 Estadísticas Totales',
                    value: `**Strikes:** ${stats.strikes}\n**Advertencias:** ${stats.warnings}\n**Kicks:** ${stats.kicks}\n**Mutes:** ${stats.mutes}\n**Timeouts:** ${stats.timeouts}\n**Bans:** ${stats.bans}`,
                    inline: true
                },
                {
                    name: '⚠️ Estado Actual',
                    value: `**Muteado:** ${stats.isMuted ? '✅ Sí' : '❌ No'}\n**Baneado:** ${stats.isBanned ? '✅ Sí' : '❌ No'}\n**Última acción:** ${stats.lastAction || 'Ninguna'}\n**Última fecha:** ${stats.lastActionDate ? `<t:${Math.floor(stats.lastActionDate.getTime() / 1000)}:R>` : 'Nunca'}`,
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: 'Sistema de Moderación', 
                iconURL: this.client.user.displayAvatarURL() 
            });

        // Agregar historial reciente si existe
        if (recentActions && recentActions.length > 0) {
            const historyText = recentActions.map(action => 
                `**${action.action.toUpperCase()}** - ${action.reason}\n*${action.moderatorUsername} - <t:${Math.floor(action.timestamp.getTime() / 1000)}:R>*`
            ).join('\n\n');
            
            embed.addFields({
                name: '📜 Historial Reciente',
                value: historyText.length > 1024 ? historyText.substring(0, 1021) + '...' : historyText,
                inline: false
            });
        }

        return embed;
    }
}

module.exports = ModerationLogger;
