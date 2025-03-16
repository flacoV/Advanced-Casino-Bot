const { SlashCommandBuilder } = require("@discordjs/builders");
const darknetconfig = require("../../schema/ilegal/darknetconfig");

const ceonotify = process.env.ceonotify.split(",");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("darknet")
    .setDescription("Establece el canal donde serán enviados los avisos de la darknet.")
    .addChannelOption(option =>
      option.setName("canal")
        .setDescription("Selecciona el canal donde se enviarán los avisos de la darknet.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    
    if (!ceonotify.includes(userId)) {
      await interaction.reply({ content: "No tienes permiso para ejecutar este comando. Contacta con el proveedor!", ephemeral: true });
      return;
    }

    const darknetserverid = interaction.guild.id;
    const darknetchid = interaction.options.getChannel("canal").id;

    try {
      await darknetconfig.findOneAndUpdate(
        { darknetserverid },
        { darknetchid },
        { upsert: true }
      );

      console.log(`Canal configurado para recibir avisos de la darknet en el servidor ${darknetserverid}, en el canal ${darknetchid}`);

      await interaction.reply({ content: "Canal configurado para recibir avisos de la darknet.", ephemeral: true });
    } catch (error) {
      console.error("Error al configurar el canal:", error);
      await interaction.reply({ content: "Ocurrió un error al configurar el canal.", ephemeral: true });
    }
  },
};