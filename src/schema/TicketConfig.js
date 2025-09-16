/**
 * Esquema para la configuración del sistema de tickets
 */

const mongoose = require('mongoose');

const ticketConfigSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    ticketCategoryId: {
        type: String,
        required: true
    },
    staffRoleId: {
        type: String,
        required: true
    },
    logChannelId: {
        type: String,
        required: true
    },
    transcriptChannelId: {
        type: String,
        required: true
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
ticketConfigSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('TicketConfig', ticketConfigSchema);
