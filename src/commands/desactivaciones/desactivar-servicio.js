const { SlashCommandBuilder } = require("@discordjs/builders");
const empresaservicioconfig = require("../../schema/legal/empresaservicioconfig");

const ceonotify = process.env.ceonotify.split(",");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("desactivar-servicio")
    .setDescription("Elimina la configuración del canal donde se enviarán los avisos de las empresas de servicios."),
  async execute(interaction) {
    const userId = interaction.user.id;
    
    if (!ceonotify.includes(userId)) {
      await interaction.reply({ content: "No tienes permiso para ejecutar este comando. Contacta con el proveedor!", ephemeral: true });
      return;
    }

    const servicioserverId = interaction.guild.id;

    try {
      const deletedConfig = await empresaservicioconfig.findOneAndDelete({ servicioserverId });
      
      if (deletedConfig) {
        await interaction.reply({ content: "Configuración del canal eliminada correctamente para este servidor.", ephemeral: true });
      } else {
        await interaction.reply({ content: "No se encontró ninguna configuración para este servidor.", ephemeral: true });
      }
    } catch (error) {
      console.error("Error al eliminar la configuración del servidor:", error);
      await interaction.reply({ content: "Ocurrió un error al eliminar la configuración del servidor.", ephemeral: true });
    }
  },
};