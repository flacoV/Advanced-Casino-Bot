const { SlashCommandBuilder } = require('discord.js');
const Wallet = require('../../schema/Wallet');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear')
        .setDescription('Crea una cartera para el usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario al que se le creará la wallet')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('codigo')
                .setDescription('Código promocional (opcional)')
                .setRequired(false)),

    async execute(interaction) {
        const managerRole = process.env.rolceo;
        const ceoNotifyRole = process.env.ceonotify;
        if (!interaction.member.roles.cache.has(managerRole) && !interaction.member.roles.cache.has(ceoNotifyRole)) {
            return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
        }

        const user = interaction.options.getUser('usuario');
        const username = interaction.guild.members.cache.get(user.id)?.displayName || user.username;
        const discordId = user.id;
        const promoCode = interaction.options.getString('codigo');

        // Verificar si la cartera ya existe
        const existingWallet = await Wallet.findOne({ discordId });
if (existingWallet) {
    return interaction.reply({ content: `❌ El usuario **${username}** ya tiene una cartera registrada.`, ephemeral: true });
}

let balance = 0;
let bonusGiven = false;
let promoOwner = null;

// Verificar si se ingresó un código promocional
if (promoCode && promoCode.trim() !== "") {
    // Buscar si el código promocional pertenece a alguien
    promoOwner = await Wallet.findOne({ promoCode });

    if (!promoOwner) {
        return interaction.reply({ content: '❌ Código promocional inválido. Verifica e intenta de nuevo.', ephemeral: true });
    }

    // Aplicar bono al usuario que usa el código
    balance = 20000; // 20K al usuario nuevo

    // Aplicar bono al dueño del código promocional
    await Wallet.findByIdAndUpdate(promoOwner._id, { $inc: { balance: 15000 } }); // 15K al dueño del código
    bonusGiven = true;
}

// Crear la nueva cartera SIN código promocional asignado
const newWallet = new Wallet({
    discordId,
    username,
    balance,
    promoCode: null // Asegurar que no se guarde el código promocional usado
});

await newWallet.save();

let response = `✅ Cartera creada para **${username}**. Balance inicial: **$${balance.toLocaleString()}**.`;
if (bonusGiven) {
    response += ` Código promocional aplicado con éxito. 🏆`;
}

return interaction.reply({ content: response, ephemeral: false });
    }
};