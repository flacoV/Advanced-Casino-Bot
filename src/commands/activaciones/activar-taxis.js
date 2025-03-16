const { SlashCommandBuilder } = require("@discordjs/builders");
const legalconfig = require("../../schema/legal/empresataxisconfig");

const ceonotify = process.env.ceonotify.split(",");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("taxis")
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

    const empresataxisserverId = interaction.guild.id;
    const empresataxischannelId = interaction.options.getChannel("canal").id;

    try {
      await legalconfig.findOneAndUpdate(
        { empresataxisserverId },
        { empresataxischannelId },
        { upsert: true }
      );

      console.log(`Canal configurado para recibir alertas sobre las actividades de empresa de taxis en el servidor ${empresataxisserverId}, en el canal ${empresataxischannelId}`);

      await interaction.reply({ content: "Canal configurado para recibir avisos de empresa de taxis en el servidor.", ephemeral: true });
    } catch (error) {
      console.error("Error al configurar el canal:", error);
      await interaction.reply({ content: "Ocurrió un error al configurar el canal.", ephemeral: true });
    }
  },
};