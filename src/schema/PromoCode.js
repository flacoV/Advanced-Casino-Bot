/**
 * Esquema para códigos promocionales del sistema de casino
 */

const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
    // Información del código
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    
    // Usuario propietario del código (quien lo creó/recibe bonos)
    ownerId: {
        type: String,
        required: true
    },
    
    ownerUsername: {
        type: String,
        required: true
    },
    
    // Usuarios que han usado este código
    usedBy: [{
        userId: String,
        username: String,
        usedAt: {
            type: Date,
            default: Date.now
        },
        bonusReceived: {
            type: Number,
            default: 15000 // Bono para el referidor
        }
    }],
    
    // Estadísticas del código
    totalUses: {
        type: Number,
        default: 0
    },
    
    totalBonusPaid: {
        type: Number,
        default: 0
    },
    
    // Estado del código
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Fechas
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    expiresAt: {
        type: Date,
        default: null // null = no expira
    }
});

// Índices para búsquedas rápidas
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ ownerId: 1 });
promoCodeSchema.index({ isActive: 1 });

// Método estático para buscar un código activo
promoCodeSchema.statics.findActiveCode = async function(code) {
    const promoCode = await this.findOne({ 
        code: code.toUpperCase(), 
        isActive: true 
    });
    
    // Verificar si el código ha expirado
    if (promoCode && promoCode.expiresAt && promoCode.expiresAt < new Date()) {
        promoCode.isActive = false;
        await promoCode.save();
        return null;
    }
    
    return promoCode;
};

// Método para verificar si un usuario ya usó este código
promoCodeSchema.methods.hasUserUsed = function(userId) {
    return this.usedBy.some(usage => usage.userId === userId);
};

// Método para registrar el uso del código
promoCodeSchema.methods.recordUsage = async function(userId, username) {
    // Verificar si el usuario ya usó este código
    if (this.hasUserUsed(userId)) {
        throw new Error('Este usuario ya ha usado este código promocional');
    }
    
    // Agregar el uso
    this.usedBy.push({
        userId: userId,
        username: username,
        usedAt: new Date(),
        bonusReceived: 15000
    });
    
    // Actualizar estadísticas
    this.totalUses += 1;
    this.totalBonusPaid += 15000;
    
    await this.save();
    return this;
};

// Método para obtener estadísticas del código
promoCodeSchema.methods.getStats = function() {
    return {
        code: this.code,
        owner: this.ownerUsername,
        totalUses: this.totalUses,
        totalBonusPaid: this.totalBonusPaid,
        isActive: this.isActive,
        createdAt: this.createdAt,
        expiresAt: this.expiresAt
    };
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
