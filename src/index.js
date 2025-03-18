require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, Embed } = require('discord.js');
const fs = require('fs');
const cron = require('node-cron');
const moment = require('moment');
const handleEvents = require('./functions/handelEvents');
const handleButtons = require('./functions/handleButtons');
const path = require("path");

const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Conexión a MongoDB establecida con éxito');
});

mongoose.connection.on('error', (err) => {
  console.error('Error en la conexión a MongoDB:', err);
});


//Ticket System
 const { createTranscript } = require('discord-html-transcripts')



const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

require('dotenv').config();

const functions = fs.readdirSync('./src/functions').filter((file) => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./src/events').filter((file) => file.endsWith('.js'));
const commandFolders = fs.readdirSync('./src/commands');

(async () => {
  for (file of functions) {
    require(`./functions/${file}`)(client);
  }
  client.handleEvents(eventFiles, './src/events');
  client.handleCommands(commandFolders, './src/commands');
  handleButtons(client);
  await client.login(process.env.token);

  client.on("guildMemberAdd", (member) => {
    require("./events/guildMemberAdd").execute(member);
});

  // EMPRESAS DE SERVICIO

  const empresaservicio = require('./mensajes/legal/empresaservicio.json');
  const empresaservicioconfig = require('./schema/legal/empresaservicioconfig');

  cron.schedule("* * * * *", async () => {
    try {
    
      const now = new Date();
      const horaCanarias = new Date(
        now.toLocaleString("en-US", { timeZone: "Atlantic/Canary" })
      );
  
      const horas = horaCanarias.getHours().toString().padStart(2, "0");
      const minutos = horaCanarias.getMinutes().toString().padStart(2, "0");
      const currentTime = `${horas}:${minutos}`;
  
      const mensajesParaEnviar = empresaservicio.filter(
        (mensaje) => mensaje.hour === currentTime
      );
  
      if (mensajesParaEnviar.length > 0) {
        const servers = await empresaservicioconfig.find();
  
        for (const server of servers) {
          const { servicioserverId, serviciochannelId } = server;
  
          const guild = await client.guilds.fetch(servicioserverId);
          if (!guild) {
            console.error(`Servidor no encontrado: ${servicioserverId}`);
            continue;
          }
  
          const channel = guild.channels.cache.get(serviciochannelId);
          if (!channel) {
            console.error(`Canal no encontrado: ${serviciochannelId}`);
            continue;
          }
  
          if (!channel.permissionsFor(client.user).has("SEND_MESSAGES")) {
            console.error(
              `El bot no tiene permisos para enviar mensajes en el canal: ${channel.name}`
            );
            continue;
          }
  
          for (const mensaje of mensajesParaEnviar) {
            const embed = new EmbedBuilder()
              .setColor("#063970")
              .setTitle(mensaje.mensaje)
              .setDescription(
                'Suena el teléfono.. es el jefe, necesita que hagas algunas tareas..'
              )
              .setImage(mensaje.imagen);
  
            try {
              await channel.send({ embeds: [embed] });
              console.log(
                `Mensaje enviado al canal ${serviciochannelId} en el servidor ${empresataxisserverId}`
              );
            } catch (error) {
              console.error(
                `Error al enviar mensaje al canal ${serviciochannelId}:`,
                error
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error en el cron de notificaciones:", error);
    }
  });

  // EMPRESAS DE TAXIS

  const empresataxis = require('./mensajes/legal/empresataxis.json');
  const empresataxisconfig = require('./schema/legal/empresataxisconfig');

  cron.schedule("* * * * *", async () => {
    try {
  
      const now = new Date();
      const horaCanarias = new Date(
        now.toLocaleString("en-US", { timeZone: "Atlantic/Canary" })
      );
  
      const horas = horaCanarias.getHours().toString().padStart(2, "0");
      const minutos = horaCanarias.getMinutes().toString().padStart(2, "0");
      const currentTime = `${horas}:${minutos}`;
  
      const mensajesParaEnviar = empresataxis.filter(
        (mensaje) => mensaje.hour === currentTime
      );
  
      if (mensajesParaEnviar.length > 0) {
        const servers = await empresataxisconfig.find();
  
        for (const server of servers) {
          const { empresataxisserverId, empresataxischannelId } = server;
  
          const guild = await client.guilds.fetch(empresataxisserverId);
          if (!guild) {
            console.error(`Servidor no encontrado: ${empresataxisserverId}`);
            continue;
          }
  
          const channel = guild.channels.cache.get(empresataxischannelId);
          if (!channel) {
            console.error(`Canal no encontrado: ${empresataxischannelId}`);
            continue;
          }
  
          if (!channel.permissionsFor(client.user).has("SEND_MESSAGES")) {
            console.error(
              `El bot no tiene permisos para enviar mensajes en el canal: ${channel.name}`
            );
            continue;
          }
  
          for (const mensaje of mensajesParaEnviar) {
            const embed = new EmbedBuilder()
              .setColor("#063970")
              .setTitle(mensaje.mensaje)
              .setDescription(
                'Suena el teléfono.. es el jefe, necesita que hagas algunas tareas..'
              )
              .setImage(mensaje.imagen);
  
            try {
              await channel.send({ embeds: [embed] });
              console.log(
                `Mensaje enviado al canal ${empresataxischannelId} en el servidor ${empresataxisserverId}`
              );
            } catch (error) {
              console.error(
                `Error al enviar mensaje al canal ${empresataxischannelId}:`,
                error
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error en el cron de notificaciones:", error);
    }
  });
    

  // EMPRESAS DE MECANICOS

  const empresamecanico = require('./mensajes/legal/empresamecanico.json');
  const empresamecanicoconfig = require('./schema/legal/empresamecanicoconfig');

  cron.schedule("* * * * *", async () => {
    try {
  
      const now = new Date();
      const horaCanarias = new Date(
        now.toLocaleString("en-US", { timeZone: "Atlantic/Canary" })
      );
  
      const horas = horaCanarias.getHours().toString().padStart(2, "0");
      const minutos = horaCanarias.getMinutes().toString().padStart(2, "0");
      const currentTime = `${horas}:${minutos}`;
  
      const mensajesParaEnviar = empresamecanico.filter(
        (mensaje) => mensaje.hour === currentTime
      );
  
      if (mensajesParaEnviar.length > 0) {
        const servers = await empresamecanicoconfig.find();
  
        for (const server of servers) {
          const { mecanicoserverId, mecanicochannelId, mecanicoroleId } = server;
  
          const guild = await client.guilds.fetch(mecanicoserverId);
          if (!guild) {
            console.error(`Servidor no encontrado: ${mecanicoserverId}`);
            continue;
          }
  
          const channel = guild.channels.cache.get(mecanicochannelId);
          if (!channel) {
            console.error(`Canal no encontrado: ${mecanicochannelId}`);
            continue;
          }

          const role = guild.roles.cache.get(mecanicoroleId);
          if (!role) {
            console.error(`Rol no encontrado: ${mecanicoroleId}`);
          }
  
          if (!channel.permissionsFor(client.user).has("SEND_MESSAGES")) {
            console.error(
              `El bot no tiene permisos para enviar mensajes en el canal: ${channel.name}`
            );
            continue;
          }
  
          for (const mensaje of mensajesParaEnviar) {
            const embed = new EmbedBuilder()
              .setColor("#DF2020")
              .setTitle(mensaje.mensaje)
              .setAuthor( { name: 'Notify', iconURL: 'https://i.imgur.com/syqaPft.png' })
              .setDescription(mensaje.descripcion)
              .setImage(mensaje.imagen)
              .setTimestamp()
              .setFooter({ text: 'Ciudad de Los Santos', iconURL: 'https://i.imgur.com/C6GXDqO.png'})
  
            try {
              await channel.send({ content: `<@&${mecanicoroleId}>`, embeds: [embed] });
              console.log(
                `Mensaje enviado al canal ${mecanicochannelId} en el servidor ${mecanicoserverId}`
              );
            } catch (error) {
              console.error(
                `Error al enviar mensaje al canal ${mecanicochannelId}:`,
                error
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error en el cron de notificaciones:", error);
    }
  });
  


  // EMPRESAS DE SEGURIDAD

  const empresaseguridad = require('./mensajes/legal/empresaseguridad.json');
  const empresaseguridadconfig = require('./schema/legal/empresaseguridadconfig');

  cron.schedule("* * * * *", async () => {
    try {
    
      const now = new Date();
      const horaCanarias = new Date(
        now.toLocaleString("en-US", { timeZone: "Atlantic/Canary" })
      );
  
      const horas = horaCanarias.getHours().toString().padStart(2, "0");
      const minutos = horaCanarias.getMinutes().toString().padStart(2, "0");
      const currentTime = `${horas}:${minutos}`;
  
      const mensajesParaEnviar = empresaseguridad.filter(
        (mensaje) => mensaje.hour === currentTime
      );
  
      if (mensajesParaEnviar.length > 0) {
        const servers = await empresaseguridadconfig.find();
  
        for (const server of servers) {
          const { empresaseguridadserverId, empresaseguridadchannelId, seguridadroleId } = server;
  
          const guild = await client.guilds.fetch(empresaseguridadserverId);
          if (!guild) {
            console.error(`Servidor no encontrado: ${empresaseguridadserverId}`);
            continue;
          }
  
          const channel = guild.channels.cache.get(empresaseguridadchannelId);
          if (!channel) {
            console.error(`Canal no encontrado: ${empresaseguridadchannelId}`);
            continue;
          }

          const role = guild.roles.cache.get(seguridadroleId);
          if(!role){
            console.error(`Rol no encontrado: ${seguridadroleId}`);
            continue;
          }
  
          if (!channel.permissionsFor(client.user).has("SEND_MESSAGES")) {
            console.error(
              `El bot no tiene permisos para enviar mensajes en el canal: ${channel.name}`
            );
            continue;
          }
  
          for (const mensaje of mensajesParaEnviar) {
            const embed = new EmbedBuilder()
              .setColor("#063970")
              .setTitle(mensaje.mensaje)
              .setDescription(mensaje.descripcion)
              .setImage(mensaje.imagen)
              .setTimestamp()
              .setFooter({text: 'Ciudad de Los Santos', iconURL: 'https://i.imgur.com/C6GXDqO.png'})
  
            try {
              await channel.send({ content: `<@&${seguridadroleId}>`, embeds: [embed] });
              console.log(
                `Mensaje enviado al canal ${empresaseguridadchannelId} en el servidor ${empresaseguridadserverId}`
              );
            } catch (error) {
              console.error(
                `Error al enviar mensaje al canal ${empresaseguridadchannelId}:`,
                error
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error en el cron de notificaciones:", error);
    }
  });  

  // FINALIZA LA FUNCION DE AVISOS.

})();