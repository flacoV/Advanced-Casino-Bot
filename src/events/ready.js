require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
});

client.on("ready", () => {
  console.log('Estoy listo 🚀!');
  const activities = [
    { type: 'PLAYING', name: '[GTAHUB] ORION' },
    { type: 'WATCHING', name: 'bet365' },
  ];

  setInterval(() => {
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    client.user.setPresence({
      activities: [{ name: randomActivity.name }],
      status: 'online',
      type: randomActivity.type,
    });
  }, 10000);
});

client.login(process.env.token);