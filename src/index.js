/**
 * Bot de Casino bet365 para Discord
 * Sistema completo de casino con economía, apuestas deportivas y blackjack
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const handleEvents = require('./functions/handelEvents');
// const handleButtons = require('./functions/handleButtons'); // Ya no es necesario
const { connectDatabase, setupDatabaseEvents } = require('./utils/database');

//Ticket System
const { createTranscript } = require('discord-html-transcripts');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();
client.activeGames = new Map(); // Para almacenar partidas de blackjack activas

/**
 * Función principal para inicializar el bot
 */
const initializeBot = async () => {
  try {
    console.log('🚀 Iniciando bot de casino bet365...');
    
    // Conectar a la base de datos
    await connectDatabase(process.env.MONGODB);
    setupDatabaseEvents();
    
    // Cargar funciones, eventos y comandos
    const functions = fs.readdirSync('./src/functions').filter((file) => file.endsWith('.js'));
    const eventFiles = fs.readdirSync('./src/events').filter((file) => file.endsWith('.js'));
    const commandFolders = fs.readdirSync('./src/commands');

    for (const file of functions) {
      require(`./functions/${file}`)(client);
    }
    
    client.handleEvents(eventFiles, './src/events');
    client.handleCommands(commandFolders, './src/commands');
    // handleButtons(client); // Ya no es necesario, se maneja en interactionCreate.js
    
    // Iniciar sesión del bot
    await client.login(process.env.token);
    
    console.log('✅ Bot inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar el bot:', error);
    process.exit(1);
  }
};

// Evento para nuevos miembros (si existe el archivo)
client.on("guildMemberAdd", (member) => {
  try {
    require("./events/guildMemberAdd").execute(member);
  } catch (error) {
    console.error('❌ Error al ejecutar evento guildMemberAdd:', error);
  }
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Inicializar el bot
initializeBot();