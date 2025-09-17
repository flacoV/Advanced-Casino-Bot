/**
 * Modelo para configuración del sistema de moderación
 */
const mongoose = require('mongoose');

const moderationConfigSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    // Canales de logs para diferentes acciones
    logChannels: {
        strikes: {
            type: String,
            default: null
        },
        kicks: {
            type: String,
            default: null
        },
        mutes: {
            type: String,
            default: null
        },
        bans: {
            type: String,
            default: null
        },
        warnings: {
            type: String,
            default: null
        },
        timeouts: {
            type: String,
            default: null
        },
        general: {
            type: String,
            default: null // Canal general para todas las acciones
        }
    },
    // Configuración de roles
    roles: {
        moderator: {
            type: String,
            default: null
        },
        admin: {
            type: String,
            default: null
        },
        muted: {
            type: String,
            default: null // Rol de mute
        }
    },
    // Configuración de automod
    autoMod: {
        enabled: {
            type: Boolean,
            default: false
        },
        maxWarnings: {
            type: Number,
            default: 3
        },
        autoMuteAfterWarnings: {
            type: Number,
            default: 3
        },
        autoKickAfterWarnings: {
            type: Number,
            default: 5
        },
        autoBanAfterWarnings: {
            type: Number,
            default: 7
        }
    },
    // Configuración de duraciones por defecto
    defaultDurations: {
        mute: {
            type: Number,
            default: 60 // 1 hora en minutos
        },
        timeout: {
            type: Number,
            default: 10 // 10 minutos
        }
    },
    // Configuración de embeds
    embedSettings: {
        color: {
            type: String,
            default: '#ff4444'
        },
        footer: {
            type: String,
            default: 'Sistema de Moderación'
        },
        thumbnail: {
            type: String,
            default: null
        }
    },
    // Configuración de notificaciones
    notifications: {
        dmUser: {
            type: Boolean,
            default: true
        },
        logToChannel: {
            type: Boolean,
            default: true
        }
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

// Actualizar updatedAt antes de guardar
moderationConfigSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('ModerationConfig', moderationConfigSchema);
