/**
 * Comando de Blackjack para el sistema de casino
 * Implementa un juego de blackjack completo con apuestas
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Wallet = require('../../schema/Wallet');
const { validateAmount, validateBalance, validateWallet } = require('../../utils/validators');
const CasinoLogger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Juega una partida de blackjack')
        .addIntegerOption(option =>
            option.setName('apuesta')
                .setDescription('Monto a apostar (mínimo: 5,000, máximo: 500,000)')
                .setRequired(true)
                .setMinValue(5000)
                .setMaxValue(500000)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const betAmount = interaction.options.getInteger('apuesta');
        
        try {
            // Validar monto de apuesta
            const amountValidation = validateAmount(betAmount, 5000, 500000);
            if (!amountValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Apuesta Inválida')
                    .setDescription(amountValidation.error)
                    .setFooter({ text: 'bet365 - Blackjack', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Buscar cartera del usuario
            const userWallet = await Wallet.findOne({ discordId: userId });
            const walletValidation = validateWallet(userWallet, interaction.user.username);
            if (!walletValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Cartera No Encontrada')
                    .setDescription(walletValidation.error)
                    .setFooter({ text: 'bet365 - Blackjack', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Validar saldo suficiente
            const balanceValidation = validateBalance(userWallet.balance, betAmount);
            if (!balanceValidation.valid) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Saldo Insuficiente')
                    .setDescription(balanceValidation.error)
                    .setFooter({ text: 'bet365 - Blackjack', iconURL: 'https://i.imgur.com/SuTgawd.png' });
                
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Descontar apuesta del balance
            userWallet.balance -= betAmount;
            userWallet.dineroApostado += betAmount;
            userWallet.transactions.push({ 
                type: 'bet', 
                amount: betAmount,
                date: new Date(),
                gameType: 'blackjack'
            });
            await userWallet.save();

            // Crear nueva partida de blackjack
            const game = new BlackjackGame(userId, betAmount, userWallet.username);
            
            // Guardar partida en el cliente (en un entorno real, usarías una base de datos)
            if (!interaction.client.activeGames) {
                interaction.client.activeGames = new Map();
            }
            interaction.client.activeGames.set(userId, game);

            // Mostrar estado inicial del juego
            const gameEmbed = game.getGameEmbed();
            const gameButtons = game.getGameButtons();

            // Log de la apuesta
            const logger = new CasinoLogger(interaction.client);
            await logger.logBet({
                userId,
                username: userWallet.username,
                amount: betAmount,
                type: 'Blackjack',
                details: `Nueva partida iniciada`
            });

            // Actualizar estadísticas del sistema
            await logger.updateSystemStats();

            await interaction.reply({ 
                embeds: [gameEmbed], 
                components: [gameButtons] 
            });

        } catch (error) {
            console.error('❌ Error en comando blackjack:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('❌ Error del Sistema')
                .setDescription('Ocurrió un error inesperado. Por favor, intenta de nuevo.')
                .setFooter({ text: 'bet365 - Blackjack', iconURL: 'https://i.imgur.com/SuTgawd.png' });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};

/**
 * Clase para manejar el juego de Blackjack
 */
class BlackjackGame {
    constructor(userId, betAmount, username) {
        this.userId = userId;
        this.betAmount = betAmount;
        this.username = username;
        this.userCards = [];
        this.dealerCards = [];
        this.gameStatus = 'playing'; // playing, userWon, dealerWon, tie, userBusted, dealerBusted
        this.userScore = 0;
        this.dealerScore = 0;
        
        this.dealInitialCards();
    }

    /**
     * Reparte las cartas iniciales
     */
    dealInitialCards() {
        this.userCards = [this.drawCard(), this.drawCard()];
        this.dealerCards = [this.drawCard(), this.drawCard()];
        this.calculateScores();
    }

    /**
     * Obtiene una carta aleatoria
     */
    drawCard() {
        const suits = ['♠️', '♥️', '♦️', '♣️'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const value = values[Math.floor(Math.random() * values.length)];
        
        return { suit, value };
    }

    /**
     * Calcula el puntaje de las cartas
     */
    calculateScores() {
        this.userScore = this.calculateHandValue(this.userCards);
        this.dealerScore = this.calculateHandValue(this.dealerCards);
    }

    /**
     * Calcula el valor de una mano
     */
    calculateHandValue(cards) {
        let score = 0;
        let aces = 0;

        for (const card of cards) {
            if (card.value === 'A') {
                aces++;
                score += 11;
            } else if (['J', 'Q', 'K'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }

        // Ajustar ases si es necesario
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }

        return score;
    }

    /**
     * El usuario pide una carta
     */
    hit() {
        if (this.gameStatus !== 'playing') return false;
        
        this.userCards.push(this.drawCard());
        this.calculateScores();
        
        if (this.userScore > 21) {
            this.gameStatus = 'userBusted';
        } else if (this.userScore === 21) {
            this.gameStatus = 'userWon';
        }
        
        return true;
    }

    /**
     * El usuario se planta
     */
    stand() {
        if (this.gameStatus !== 'playing') return false;
        
        // El dealer juega automáticamente
        while (this.dealerScore < 17) {
            this.dealerCards.push(this.drawCard());
            this.calculateScores();
        }
        
        // Determinar ganador
        if (this.dealerScore > 21) {
            this.gameStatus = 'dealerBusted';
        } else if (this.dealerScore > this.userScore) {
            this.gameStatus = 'dealerWon';
        } else if (this.dealerScore < this.userScore) {
            this.gameStatus = 'userWon';
        } else {
            this.gameStatus = 'tie';
        }
        
        return true;
    }

    /**
     * Obtiene el embed del estado del juego
     */
    getGameEmbed() {
        const embed = new EmbedBuilder()
            .setColor(this.getGameColor())
            .setTitle('🃏 Blackjack - bet365')
            .setThumbnail('https://i.imgur.com/vclIRjE.png')
            .addFields(
                { 
                    name: '👤 Tu Mano', 
                    value: this.formatCards(this.userCards) + `\n**Puntaje: ${this.userScore}**`, 
                    inline: true 
                },
                { 
                    name: '🤖 Dealer', 
                    value: this.formatDealerCards() + `\n**Puntaje: ${this.getDealerDisplayScore()}**`, 
                    inline: true 
                },
                { 
                    name: '💰 Apuesta', 
                    value: `$${this.betAmount.toLocaleString()}`, 
                    inline: true 
                }
            )
            .setFooter({ text: 'bet365 - Blackjack', iconURL: 'https://i.imgur.com/SuTgawd.png' })
            .setTimestamp();

        // Agregar estado del juego
        if (this.gameStatus !== 'playing') {
            embed.addFields({ 
                name: '🎯 Resultado', 
                value: this.getGameResult(), 
                inline: false 
            });
        }

        return embed;
    }

    /**
     * Obtiene los botones del juego
     */
    getGameButtons() {
        const row = new ActionRowBuilder();

        if (this.gameStatus === 'playing') {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('blackjack_hit')
                    .setLabel('Pedir Carta')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🃏'),
                new ButtonBuilder()
                    .setCustomId('blackjack_stand')
                    .setLabel('Plantarse')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✋')
            );
        } else {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('blackjack_new')
                    .setLabel('Nueva Partida')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄')
            );
        }

        return row;
    }

    /**
     * Formatea las cartas para mostrar
     */
    formatCards(cards) {
        return cards.map(card => `${card.value}${card.suit}`).join(' ');
    }

    /**
     * Formatea las cartas del dealer (oculta la primera si el juego está en curso)
     */
    formatDealerCards() {
        if (this.gameStatus === 'playing') {
            return `🂠 ${this.dealerCards[1].value}${this.dealerCards[1].suit}`;
        }
        return this.formatCards(this.dealerCards);
    }

    /**
     * Obtiene el puntaje del dealer para mostrar
     */
    getDealerDisplayScore() {
        if (this.gameStatus === 'playing') {
            return this.calculateHandValue([this.dealerCards[1]]);
        }
        return this.dealerScore;
    }

    /**
     * Obtiene el color del embed según el estado del juego
     */
    getGameColor() {
        switch (this.gameStatus) {
            case 'userWon':
            case 'dealerBusted':
                return '#097b5a';
            case 'dealerWon':
            case 'userBusted':
                return '#ff4444';
            case 'tie':
                return '#ffe417';
            default:
                return '#007c5a';
        }
    }

    /**
     * Obtiene el resultado del juego
     */
    getGameResult() {
        switch (this.gameStatus) {
            case 'userWon':
                return '🎉 ¡Ganaste!';
            case 'dealerWon':
                return '😞 Perdiste';
            case 'userBusted':
                return '💥 Te pasaste de 21';
            case 'dealerBusted':
                return '🎉 ¡El dealer se pasó! ¡Ganaste!';
            case 'tie':
                return '🤝 Empate';
            default:
                return '🎮 Juego en curso';
        }
    }

    /**
     * Calcula las ganancias del usuario
     */
    getWinnings() {
        switch (this.gameStatus) {
            case 'userWon':
            case 'dealerBusted':
                // Blackjack natural (21 con 2 cartas) paga 3:2, otros ganan 1:1
                if (this.userScore === 21 && this.userCards.length === 2) {
                    return Math.floor(this.betAmount * 2.5);
                }
                return this.betAmount * 2;
            case 'tie':
                return this.betAmount; // Devolver apuesta
            default:
                return 0; // Perdió
        }
    }
}
