const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("horahub")
    .setDescription("Muestra la hora actual del servidor."),
  async execute(interaction) {
    const horaActual = new Date();
    const horas = horaActual.getHours();
    const minutos = horaActual.getMinutes();

    const embed = new EmbedBuilder()
      .setColor("#001eff")
      .setTitle("Hora actual en la ciudad")
      .setDescription(`Hora (HUB): ${horas}:${minutos} hs`);

    await interaction.reply({
      embeds: [embed],
    });
  },
};