const { SlashCommandBuilder } = require("@discordjs/builders");
const empresaseguridadconfig = require("../../schema/legal/empresaseguridadconfig");

const ceonotify = process.env.ceonotify.split(",");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("empresaseguridad")
    .setDescription("Establece el canal donde serán enviados los avisos.")
    .addChannelOption(option =>
      option.setName("canal")
        .setDescription("Selecciona el canal donde se enviarán los avisos.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    
    if (!ceonotify.includes(userId)) {
      await interaction.reply({ content: "No tienes permiso para ejecutar este comando. Contacta con el proveedor!", ephemeral: true });
      return;
    }

    const empresaseguridadserverId = interaction.guild.id;
    const empresaseguridadchannelId = interaction.options.getChannel("canal").id;

    try {
      await empresaseguridadconfig.findOneAndUpdate(
        { empresaseguridadserverId },
        { empresaseguridadchannelId },
        { upsert: true }
      );

      console.log(`Canal configurado para recibir alertas sobre las actividades de empresas de seguridad en el servidor ${empresaseguridadserverId}, en el canal ${empresaseguridadchannelId}`);

      await interaction.reply({ content: "Canal configurado para recibir avisos de empresas de seguridad en el servidor.", ephemeral: true });
    } catch (error) {
      console.error("Error al configurar el canal:", error);
      await interaction.reply({ content: "Ocurrió un error al configurar el canal.", ephemeral: true });
    }
  },
};