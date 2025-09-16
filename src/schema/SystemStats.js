/**
 * Esquema para las estadísticas del sistema de casino
 */

const mongoose = require('mongoose');

const systemStatsSchema = new mongoose.Schema({
    // Estadísticas de wallets
    totalWallets: {
        type: Number,
        default: 0
    },
    totalDeposited: {
        type: Number,
        default: 0
    },
    totalBetAmount: {
        type: Number,
        default: 0
    },
    totalWinnings: {
        type: Number,
        default: 0
    },
    
    // Estadísticas de apuestas deportivas
    totalSportsBets: {
        type: Number,
        default: 0
    },
    totalSportsBetAmount: {
        type: Number,
        default: 0
    },
    
    // Estadísticas de blackjack
    totalBlackjackGames: {
        type: Number,
        default: 0
    },
    totalBlackjackBetAmount: {
        type: Number,
        default: 0
    },
    
    // Fecha de última actualización
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Crear un documento único para las estadísticas
systemStatsSchema.statics.getStats = async function() {
    let stats = await this.findOne();
    if (!stats) {
        stats = new this();
        await stats.save();
    }
    return stats;
};

// Método para actualizar estadísticas de wallet
systemStatsSchema.methods.updateWalletStats = async function() {
    const Wallet = mongoose.model('Wallet');
    
    try {
        // Calcular estadísticas básicas de wallets
        const walletStats = await Wallet.aggregate([
            {
                $group: {
                    _id: null,
                    totalWallets: { $sum: 1 },
                    totalBetAmount: { $sum: '$dineroApostado' }
                }
            }
        ]);
        
        console.log('📊 Wallet stats result:', walletStats);
        
        // Calcular el total depositado de manera más simple
        let totalDeposited = 0;
        const allWallets = await Wallet.find({});
        
        for (const wallet of allWallets) {
            if (wallet.transactions && wallet.transactions.length > 0) {
                for (const transaction of wallet.transactions) {
                    if (transaction.type === 'deposit') {
                        totalDeposited += transaction.amount;
                        console.log(`💰 Depósito encontrado: ${wallet.username} - $${transaction.amount.toLocaleString()}`);
                    }
                }
            }
        }
        
        if (walletStats.length > 0) {
            this.totalWallets = walletStats[0].totalWallets;
            this.totalBetAmount = walletStats[0].totalBetAmount;
        }
        
        this.totalDeposited = totalDeposited;
        this.lastUpdated = new Date();
        await this.save();
        
        console.log(`📊 Estadísticas actualizadas: ${this.totalWallets} wallets, $${this.totalDeposited.toLocaleString()} depositado, $${this.totalBetAmount.toLocaleString()} apostado`);
        
    } catch (error) {
        console.error('❌ Error al actualizar estadísticas de wallet:', error);
        throw error;
    }
};

module.exports = mongoose.model('SystemStats', systemStatsSchema);
