const { SlashCommandBuilder } = require("@discordjs/builders");
const dealerconfig = require("../../schema/ilegal/dealerconfig");

const ceonotify = process.env.ceonotify.split(",");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dealer")
    .setDescription("Establece el canal donde serán enviados los avisos del dealer.")
    .addChannelOption(option =>
      option.setName("canal")
        .setDescription("Selecciona el canal donde se enviarán los avisos del dealer.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    
    if (!ceonotify.includes(userId)) {
      await interaction.reply({ content: "No tienes permiso para ejecutar este comando. Contacta con el proveedor!", ephemeral: true });
      return;
    }

    const dealerserverId = interaction.guild.id;
    const dealerchannelId = interaction.options.getChannel("canal").id;

    try {
      await dealerconfig.findOneAndUpdate(
        { dealerserverId },
        { dealerchannelId },
        { upsert: true }
      );

      console.log(`Canal configurado para recibir avisos del dealer en el servidor ${dealerserverId}, en el canal ${dealerchannelId}`);

      await interaction.reply({ content: "Canal configurado para recibir avisos del dealer en este servidor.", ephemeral: true });
    } catch (error) {
      console.error("Error al configurar el canal:", error);
      await interaction.reply({ content: "Ocurrió un error al configurar el canal.", ephemeral: true });
    }
  },
};