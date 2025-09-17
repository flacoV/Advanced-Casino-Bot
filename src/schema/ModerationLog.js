/**
 * Modelo para registrar logs de moderación
 */
const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    moderatorId: {
        type: String,
        required: true
    },
    moderatorUsername: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['strike', 'kick', 'mute', 'ban', 'warn', 'timeout', 'unmute', 'unban', 'untimeout'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // Duración en minutos (para mute/timeout)
        default: null
    },
    channelId: {
        type: String,
        default: null
    },
    messageId: {
        type: String,
        default: null
    },
    evidence: {
        type: String, // URL de imagen o texto de evidencia
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    caseId: {
        type: String,
        required: true,
        unique: true
    },
    active: {
        type: Boolean,
        default: true // Para bans/mutes que pueden ser removidos
    }
});

// Índices para optimizar consultas
moderationLogSchema.index({ guildId: 1, userId: 1 });
moderationLogSchema.index({ guildId: 1, moderatorId: 1 });
moderationLogSchema.index({ caseId: 1 });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
