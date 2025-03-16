require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const cron = require('node-cron');
const moment = require('moment');

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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
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
  await client.login(process.env.token);

  // DEALER.

  const dealer = require('./mensajes/ilegal/dealer.json');
  const dealerconfig = require('./schema/ilegal/dealerconfig.js');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
      for (const messageInfo of dealer) {
        if (messageInfo.hour === currentTime) {
          client.guilds.cache.forEach(async (guild) => {
            try {
              const config = await dealerconfig.findOne({ dealerserverId: guild.id });
  
              if (config) {
                const channel = guild.channels.cache.get(config.dealerchannelId);
                if (channel) {
                  const dealer = await channel.messages.fetch({ limit: 1 });
                  const lastdealer = dealer.first();
                  if (lastdealer) {
                    await lastdealer.delete();
                  }
                  const embed = new EmbedBuilder()
                    .setColor(0xDF2020)
                    .setTitle(messageInfo.mensaje)
                    .setDescription('En este lugar encontrarás un pequeño emprendedor el cual te venderá algunas cosas..')
                    .setImage(messageInfo.imagen);
  
                  await channel.send({ embeds: [embed] });
                } else {
                  console.error('El canal no se encontró o el bot no tiene permisos para enviar mensajes en él en el servidor:', guild.name);
                }
              } else {
                console.error('Configuración de canal no encontrada para las ubicaciones del dealer en:', guild.name);
              }
            } catch (innerError) {
              console.error('Error interno al procesar un servidor:', innerError);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error al programar y enviar mensajes:', error);
    }
  });
  
  // DARKNET.

  const darknet = require('./mensajes/ilegal/darknet.json');
  const darknetconfig = require('./schema/ilegal/darknetconfig.js');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
      for (const mensajedarknet of darknet) {
        if (mensajedarknet.hour === currentTime) {
          client.guilds.cache.forEach(async (guild) => {
            try {
              const config = await darknetconfig.findOne({ darknetserverid: guild.id });
  
              if (config) {
                const channel = guild.channels.cache.get(config.darknetchid);
                if (channel) {
                  const darknet = await channel.messages.fetch({ limit: 1 });
                  const lastdarknet = darknet.first();
                  if (lastdarknet) {
                    await lastdarknet.delete();
                  }
                  const embeddarknet = new EmbedBuilder()
                    .setColor(0xDF2020)
                    .setTitle(mensajedarknet.mensaje)
                    .setDescription('Varias personas avisaron de un teléfono descompuesto.. ve a revisarlo, capaz te llevas una sorpresa...')
                    .setImage(mensajedarknet.imagen);
  
                  await channel.send({ embeds: [embeddarknet] });
                } else {
                  console.error('El canal no se encontró o el bot no tiene permisos para enviar mensajes en él en el servidor:', guild.name);
                }
              } else {
                console.error('Configuración de canal no encontrada para darknet en:', guild.name);
              }
            } catch (innerError) {
              console.error('Error interno al procesar un servidor:', innerError);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error al programar y enviar mensajes:', error);
    }
  });

  // EMPRESAS DE SERVICIO

  const empresaservicio = require('./mensajes/legal/empresaservicio.json');
  const empresaservicioconfig = require('./schema/legal/empresaservicioconfig');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
      for (const mensajeempresaservicio of empresaservicio) {
        if (mensajeempresaservicio.hour === currentTime) {
          client.guilds.cache.forEach(async (guild) => {
            try {
              const config = await empresaservicioconfig.findOne({ servicioserverId: guild.id });
  
              if (config) {
                const channel = guild.channels.cache.get(config.serviciochannelId);
                if (channel) {
                  const empresaservicio = await channel.messages.fetch({ limit: 1 });
                  const lastempresaservicio = empresaservicio.first();
                  if (lastempresaservicio) {
                    await lastempresaservicio.delete();
                  }
                  const embedempresaservicio = new EmbedBuilder()
                    .setColor(0xDF2020)
                    .setTitle(mensajeempresaservicio.mensaje)
                    .setDescription('Suena el teléfono... es el jefe, necesita que hagas algunas tareas..')
                    .setImage(mensajeempresaservicio.imagen);
  
                  await channel.send({ embeds: [embedempresaservicio] });
                } else {
                  console.error('El canal no se encontró o el bot no tiene permisos para enviar mensajes en él en el servidor:', guild.name);
                }
              } else {
                console.error('Configuración de canal no encontrada para actividades empresa de servicio en:', guild.name);
              }
            } catch (innerError) {
              console.error('Error interno al procesar un servidor:', innerError);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error al programar y enviar mensajes:', error);
    }
  });

  // EMPRESAS DE TAXIS

  const empresataxis = require('./mensajes/legal/empresataxis.json');
  const empresataxisconfig = require('./schema/legal/empresataxisconfig');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
      for (const mensajeempresataxis of empresataxis) {
        if (mensajeempresataxis.hour === currentTime) {
          client.guilds.cache.forEach(async (guild) => {
            try {
              const config = await empresataxisconfig.findOne({ empresataxisserverId: guild.id });
  
              if (config) {
                const channel = guild.channels.cache.get(config.empresataxischannelId);
                if (channel) {
                  const empresataxis = await channel.messages.fetch({ limit: 1 });
                  const lastempresataxis = empresataxis.first();
                  if (lastempresataxis) {
                    await lastempresataxis.delete();
                  }
                  const embedempresataxis = new EmbedBuilder()
                    .setColor(0xDF2020)
                    .setTitle(mensajeempresataxis.mensaje)
                    .setDescription('Suena el teléfono.. es el jefe, necesita que hagas algunas tareas..')
                    .setImage(mensajeempresataxis.imagen);
  
                  await channel.send({ embeds: [embedempresataxis] });
                } else {
                  console.error('El canal no se encontró o el bot no tiene permisos para enviar mensajes en él en el servidor:', guild.name);
                }
              } else {
                console.error('Configuración de canal no encontrada para actividades empresa de taxi en:', guild.name);
              }
            } catch (innerError) {
              console.error('Error interno al procesar un servidor:', innerError);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error al programar y enviar mensajes:', error);
    }
  });  

  // EMPRESAS DE MECANICOS

  const empresamecanico = require('./mensajes/legal/empresamecanico.json');
  const empresamecanicoconfig = require('./schema/legal/empresamecanicoconfig');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
      for (const mensajeempresamecanico of empresamecanico) {
        if (mensajeempresamecanico.hour === currentTime) {
          client.guilds.cache.forEach(async (guild) => {
            try {
              const config = await empresamecanicoconfig.findOne({ mecanicoserverId: guild.id });
  
              if (config) {
                const channel = guild.channels.cache.get(config.mecanicochannelId);
                if (channel) {
                  const empresamecanico = await channel.messages.fetch({ limit: 1 });
                  const lastempresamecanico = empresamecanico.first();
                  if (lastempresamecanico) {
                    await lastempresamecanico.delete();
                  }
                  const embedempresamecanico = new EmbedBuilder()
                    .setColor(0xDF2020)
                    .setTitle(mensajeempresamecanico.mensaje)
                    .setDescription('Suena el teléfono.. es el jefe, necesita que hagas algunas tareas..')
                    .setImage(mensajeempresamecanico.imagen);
  
                  await channel.send({ embeds: [embedempresamecanico] });
                } else {
                  console.error('El canal no se encontró o el bot no tiene permisos para enviar mensajes en él en el servidor:', guild.name);
                }
              } else {
                console.error('Configuración de canal no encontrada para actividades empresa de mecánicos en:', guild.name);
              }
            } catch (innerError) {
              console.error('Error interno al procesar un servidor:', innerError);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error al programar y enviar mensajes:', error);
    }
  });  

  // EMPRESAS DE SEGURIDAD

  const empresaseguridad = require('./mensajes/legal/empresaseguridad.json');
  const empresaseguridadconfig = require('./schema/legal/empresaseguridadconfig');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
      for (const mensajeempresaseguridad of empresaseguridad) {
        if (mensajeempresaseguridad.hour === currentTime) {
          client.guilds.cache.forEach(async (guild) => {
            try {
              const config = await empresaseguridadconfig.findOne({ empresaseguridadserverId: guild.id });
  
              if (config) {
                const channel = guild.channels.cache.get(config.empresaseguridadchannelId);
                if (channel) {
                  const empresaseguridad = await channel.messages.fetch({ limit: 1 });
                  const lastempresaseguridad = empresaseguridad.first();
                  if (lastempresaseguridad) {
                    await lastempresaseguridad.delete();
                  }
                  const embedempresaseguridad = new EmbedBuilder()
                    .setColor(0xDF2020)
                    .setTitle(mensajeempresaseguridad.mensaje)
                    .setDescription('Suena el teléfono.. es el jefe, necesita que hagas algunas tareas..')
                    .setImage(mensajeempresaseguridad.imagen);
  
                  await channel.send({ embeds: [embedempresaseguridad] });
                } else {
                  console.error('El canal no se encontró o el bot no tiene permisos para enviar mensajes en él en el servidor:', guild.name);
                }
              } else {
                console.error('Configuración de canal no encontrada para actividades empresa de seguridad en:', guild.name);
              }
            } catch (innerError) {
              console.error('Error interno al procesar un servidor:', innerError);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error al programar y enviar mensajes:', error);
    }
  });  

  // FINALIZA LA FUNCION DE AVISOS.

})();