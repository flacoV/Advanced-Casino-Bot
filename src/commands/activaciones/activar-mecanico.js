const { SlashCommandBuilder } = require("@discordjs/builders");
const empresamecanicoconfig = require("../../schema/legal/empresamecanicoconfig");

const ceonotify = process.env.ceonotify.split(",");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("empresamecanico")
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

    const mecanicoserverId = interaction.guild.id;
    const mecanicochannelId = interaction.options.getChannel("canal").id;

    try {
      await empresamecanicoconfig.findOneAndUpdate(
        { mecanicoserverId },
        { mecanicochannelId },
        { upsert: true }
      );

      console.log(`Canal configurado para recibir alertas sobre las actividades de empresas de mecanico en el servidor ${mecanicoserverId}, en el canal ${mecanicochannelId}`);

      await interaction.reply({ content: "Canal configurado para recibir avisos de empresas de mecanico en el servidor.", ephemeral: true });
    } catch (error) {
      console.error("Error al configurar el canal:", error);
      await interaction.reply({ content: "Ocurrió un error al configurar el canal.", ephemeral: true });
    }
  },
};