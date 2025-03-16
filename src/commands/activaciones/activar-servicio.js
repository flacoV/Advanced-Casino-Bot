const { SlashCommandBuilder } = require("@discordjs/builders");
const legalconfig = require("../../schema/legal/empresaservicioconfig");

const ceonotify = process.env.ceonotify.split(",");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("empresaservicio")
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

    const servicioserverId = interaction.guild.id;
    const serviciochannelId = interaction.options.getChannel("canal").id;

    try {
      await legalconfig.findOneAndUpdate(
        { servicioserverId },
        { serviciochannelId },
        { upsert: true }
      );

      console.log(`Canal configurado para recibir alertas sobre las actividades de empresas de servicio en el servidor ${servicioserverId}, en el canal ${serviciochannelId}`);

      await interaction.reply({ content: "Canal configurado para recibir avisos de empresas de servicio en el servidor.", ephemeral: true });
    } catch (error) {
      console.error("Error al configurar el canal:", error);
      await interaction.reply({ content: "Ocurrió un error al configurar el canal.", ephemeral: true });
    }
  },
};