const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    promoCode: {
        type: String,
        unique: true
    },
    transactions: [
        {
            type: {
                type: String,
                enum: ['deposit', 'withdraw', 'bet', 'win'],
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

module.exports = mongoose.model('Wallet', walletSchema);
