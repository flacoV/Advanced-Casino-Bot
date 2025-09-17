/**
 * Modelo para estadísticas de moderación por usuario
 */
const mongoose = require('mongoose');

const userModerationStatsSchema = new mongoose.Schema({
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
    // Contadores de acciones recibidas
    strikes: {
        type: Number,
        default: 0
    },
    warnings: {
        type: Number,
        default: 0
    },
    kicks: {
        type: Number,
        default: 0
    },
    mutes: {
        type: Number,
        default: 0
    },
    timeouts: {
        type: Number,
        default: 0
    },
    bans: {
        type: Number,
        default: 0
    },
    // Estado actual
    isMuted: {
        type: Boolean,
        default: false
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    muteExpiresAt: {
        type: Date,
        default: null
    },
    // Historial de acciones
    lastAction: {
        type: String,
        default: null
    },
    lastActionDate: {
        type: Date,
        default: null
    },
    lastModerator: {
        type: String,
        default: null
    },
    // Fechas importantes
    firstJoin: {
        type: Date,
        default: Date.now
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Índice compuesto para búsquedas eficientes
userModerationStatsSchema.index({ guildId: 1, userId: 1 }, { unique: true });

// Actualizar updatedAt antes de guardar
userModerationStatsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('UserModerationStats', userModerationStatsSchema);
