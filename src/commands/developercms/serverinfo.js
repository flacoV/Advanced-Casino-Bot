const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");
module.exports = {
    data: new SlashCommandBuilder()
    .setName("guild-info")
    .setDescription("Obtengo información sobre un servidor")
    .addStringOption(option => option.setName("guild-id").setDescription("La ID del servidor.").setRequired(true)),
 
    async execute (interaction, client) {
        const {options} = interaction;
        const guildID = options.getString("guild-id");
        const guild = await client.guilds.cache.get(guildID)
 
        if (!guild) {
            await interaction.reply({
                content: `No puedo encontrar un servidor con la ID ${guildID}!`,
                ephemeral: true
            });
            return;
        }
 
        const name = guild.name;
        const id = guild.id;
        const ownerId = guild.ownerId;
        const textChannelCount = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText).size;
        const voiceChannelCount = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildVoice).size;
        const defaultMessage = guild.defaultMessageNotifications;
        const afkTimeout = guild.afkTimeout;
        const created = guild.createdAt;
        const roleCount = guild.roles.cache.size;
        const channels = guild.channels.cache.size;
 
        const text =  `Texto: ${textChannelCount}`;
        const voice = `Voz: ${voiceChannelCount}`;
 
 
        const embed = new EmbedBuilder()
        .setTitle(`Información del servidor ${name}`)
        .addFields(
            {name: "Nombre:", value: `${name}`},
            {name: "ID:", value: `${id}`},
            {name: "ID del dueño:", value: `${ownerId}`},
            {name: "Tag del dueño:", value: `<@${ownerId}>`},
            {name: "Cantidad de canales:", value: `\n${text} \n${voice} \n TOTAL: ${channels}`},
            {name: "Roles:", value: `${roleCount}`},
            {name: "Permisos de mensajes:", value: `${defaultMessage}`},
            {name: "Tiempo de AFK:", value: `${afkTimeout}`},
            {name: "Creado:", value: `${created}`},
        )
 
        const owner = client.users.cache.get(`${guild.ownerId}`);
 
        if (owner) {
            const ownerEmbed = new EmbedBuilder()
            .setTitle(`Información del propietario de ${guild.name}`)
            .setThumbnail(`${owner.displayAvatarURL()}`)
            .addFields(
                {name: "Nombre:", value: `${owner.username}`},
                {name: "ID:", value: `${owner.id}`},
                {name: "Tag:", value: `${owner}`},
                {name: "Cuenta creada:", value: `${owner.createdAt}`},
            )
 
            await interaction.reply({
                embeds: [embed, ownerEmbed]
            })
 
        } else {
            await interaction.reply({
                embeds: [embed]
            })
        }
    },
    permisorol: [process.env.rolceo],
}