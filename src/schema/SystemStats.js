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
        
        // Calcular el total depositado y estadísticas específicas de apuestas
        let totalDeposited = 0;
        let totalSportsBets = 0;
        let totalSportsBetAmount = 0;
        let totalBlackjackGames = 0;
        let totalBlackjackBetAmount = 0;
        let totalWinnings = 0;
        
        const allWallets = await Wallet.find({});
        
        for (const wallet of allWallets) {
            if (wallet.transactions && wallet.transactions.length > 0) {
                for (const transaction of wallet.transactions) {
                    if (transaction.type === 'deposit') {
                        totalDeposited += transaction.amount;
                    } else if (transaction.type === 'bet') {
                        // Distinguir entre apuestas deportivas y blackjack
                        if (transaction.gameType === 'sports') {
                            totalSportsBets++;
                            totalSportsBetAmount += transaction.amount;
                        } else if (transaction.gameType === 'blackjack') {
                            totalBlackjackGames++;
                            totalBlackjackBetAmount += transaction.amount;
                        } else {
                            // Para transacciones antiguas sin gameType, asumir que son deportivas
                            totalSportsBets++;
                            totalSportsBetAmount += transaction.amount;
                        }
                    } else if (transaction.type === 'win') {
                        totalWinnings += transaction.amount;
                    }
                }
            }
        }
        
        // Actualizar estadísticas básicas
        if (walletStats.length > 0) {
            this.totalWallets = walletStats[0].totalWallets;
            this.totalBetAmount = walletStats[0].totalBetAmount;
        }
        
        // Actualizar estadísticas específicas
        this.totalDeposited = totalDeposited;
        this.totalSportsBets = totalSportsBets;
        this.totalSportsBetAmount = totalSportsBetAmount;
        this.totalBlackjackGames = totalBlackjackGames;
        this.totalBlackjackBetAmount = totalBlackjackBetAmount;
        this.totalWinnings = totalWinnings;
        this.lastUpdated = new Date();
        
        await this.save();
        
        console.log(`📊 Estadísticas actualizadas: ${this.totalWallets} wallets, $${this.totalDeposited.toLocaleString()} depositado, $${this.totalBetAmount.toLocaleString()} apostado, ${this.totalSportsBets} apuestas deportivas`);
        
    } catch (error) {
        console.error('❌ Error al actualizar estadísticas de wallet:', error);
        throw error;
    }
};

module.exports = mongoose.model('SystemStats', systemStatsSchema);
