/**
 * Comando para configurar el sistema de moderación
 */
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ModerationConfig = require('../../schema/ModerationConfig');
const { validateAdminPermissions } = require('../../utils/validators');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar-moderacion')
        .setDescription('Configura el sistema de moderación del servidor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('canales')
                .setDescription('Configura los canales de logs para moderación')
                .addStringOption(option =>
                    option.setName('tipo')
                        .setDescription('Tipo de acción a configurar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Strikes', value: 'strikes' },
                            { name: 'Kicks', value: 'kicks' },
                            { name: 'Mutes', value: 'mutes' },
                            { name: 'Bans', value: 'bans' },
                            { name: 'Advertencias', value: 'warnings' },
                            { name: 'Timeouts', value: 'timeouts' },
                            { name: 'General (todas las acciones)', value: 'general' }
                        ))
                .addChannelOption(option =>
                    option.setName('canal')
                        .setDescription('Canal donde se enviarán los logs')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('roles')
                .setDescription('Configura los roles de moderación')
                .addStringOption(option =>
                    option.setName('tipo')
                        .setDescription('Tipo de rol a configurar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Moderador', value: 'moderator' },
                            { name: 'Administrador', value: 'admin' },
                            { name: 'Muteado', value: 'muted' }
                        ))
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Rol a asignar')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('automod')
                .setDescription('Configura el sistema de automod')
                .addBooleanOption(option =>
                    option.setName('habilitado')
                        .setDescription('Habilitar/deshabilitar automod')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('max-advertencias')
                        .setDescription('Máximo de advertencias antes de acción automática')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ver')
                .setDescription('Ver la configuración actual del sistema'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Verificar permisos de administrador
            const managerRole = process.env.rolceo;
            if (!validateAdminPermissions(interaction.member, [managerRole])) {
                return interaction.reply({
                    content: '🚫 No tienes permisos para usar este comando.',
                    ephemeral: true
                });
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'canales':
                    await this.handleChannelsConfig(interaction);
                    break;
                case 'roles':
                    await this.handleRolesConfig(interaction);
                    break;
                case 'automod':
                    await this.handleAutoModConfig(interaction);
                    break;
                case 'ver':
                    await this.handleViewConfig(interaction);
                    break;
            }

        } catch (error) {
            console.error('❌ Error en comando configurar-moderacion:', error);
            await interaction.reply({
                content: '❌ Error al configurar el sistema de moderación.',
                ephemeral: true
            });
        }
    },

    async handleChannelsConfig(interaction) {
        const actionType = interaction.options.getString('tipo');
        const channel = interaction.options.getChannel('canal');

        // Verificar que el canal sea de texto
        if (channel.type !== 0) {
            return interaction.reply({
                content: '❌ El canal debe ser un canal de texto.',
                ephemeral: true
            });
        }

        // Obtener o crear configuración
        let config = await ModerationConfig.findOne({ guildId: interaction.guild.id });
        if (!config) {
            config = new ModerationConfig({ guildId: interaction.guild.id });
        }

        // Actualizar canal según el tipo
        config.logChannels[actionType] = channel.id;
        await config.save();

        const embed = new EmbedBuilder()
            .setTitle('✅ Canal Configurado')
            .setDescription(`El canal ${channel} ha sido configurado para logs de **${actionType}**.`)
            .setColor('#097b5a')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleRolesConfig(interaction) {
        const roleType = interaction.options.getString('tipo');
        const role = interaction.options.getRole('rol');

        // Obtener o crear configuración
        let config = await ModerationConfig.findOne({ guildId: interaction.guild.id });
        if (!config) {
            config = new ModerationConfig({ guildId: interaction.guild.id });
        }

        // Actualizar rol según el tipo
        config.roles[roleType] = role.id;
        await config.save();

        const roleNames = {
            moderator: 'Moderador',
            admin: 'Administrador',
            muted: 'Muteado'
        };

        const embed = new EmbedBuilder()
            .setTitle('✅ Rol Configurado')
            .setDescription(`El rol ${role} ha sido configurado como **${roleNames[roleType]}**.`)
            .setColor('#097b5a')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleAutoModConfig(interaction) {
        const enabled = interaction.options.getBoolean('habilitado');
        const maxWarnings = interaction.options.getInteger('max-advertencias');

        // Obtener o crear configuración
        let config = await ModerationConfig.findOne({ guildId: interaction.guild.id });
        if (!config) {
            config = new ModerationConfig({ guildId: interaction.guild.id });
        }

        // Actualizar configuración de automod
        config.autoMod.enabled = enabled;
        if (maxWarnings !== null) {
            config.autoMod.maxWarnings = maxWarnings;
        }
        await config.save();

        const embed = new EmbedBuilder()
            .setTitle('✅ AutoMod Configurado')
            .setDescription(`AutoMod ha sido **${enabled ? 'habilitado' : 'deshabilitado'}**.\n${maxWarnings ? `Máximo de advertencias: **${maxWarnings}**` : ''}`)
            .setColor('#097b5a')
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleViewConfig(interaction) {
        const config = await ModerationConfig.findOne({ guildId: interaction.guild.id });

        if (!config) {
            return interaction.reply({
                content: '❌ El sistema de moderación no está configurado.',
                ephemeral: true
            });
        }

        // Crear embed con la configuración actual
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Configuración del Sistema de Moderación')
            .setColor('#097b5a')
            .addFields(
                {
                    name: '📺 Canales de Logs',
                    value: `**Strikes:** ${config.logChannels.strikes ? `<#${config.logChannels.strikes}>` : 'No configurado'}\n**Kicks:** ${config.logChannels.kicks ? `<#${config.logChannels.kicks}>` : 'No configurado'}\n**Mutes:** ${config.logChannels.mutes ? `<#${config.logChannels.mutes}>` : 'No configurado'}\n**Bans:** ${config.logChannels.bans ? `<#${config.logChannels.bans}>` : 'No configurado'}\n**Advertencias:** ${config.logChannels.warnings ? `<#${config.logChannels.warnings}>` : 'No configurado'}\n**Timeouts:** ${config.logChannels.timeouts ? `<#${config.logChannels.timeouts}>` : 'No configurado'}\n**General:** ${config.logChannels.general ? `<#${config.logChannels.general}>` : 'No configurado'}`,
                    inline: false
                },
                {
                    name: '👥 Roles',
                    value: `**Moderador:** ${config.roles.moderator ? `<@&${config.roles.moderator}>` : 'No configurado'}\n**Administrador:** ${config.roles.admin ? `<@&${config.roles.admin}>` : 'No configurado'}\n**Muteado:** ${config.roles.muted ? `<@&${config.roles.muted}>` : 'No configurado'}`,
                    inline: false
                },
                {
                    name: '🤖 AutoMod',
                    value: `**Estado:** ${config.autoMod.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}\n**Máx. Advertencias:** ${config.autoMod.maxWarnings}\n**Auto Mute:** ${config.autoMod.autoMuteAfterWarnings} advertencias\n**Auto Kick:** ${config.autoMod.autoKickAfterWarnings} advertencias\n**Auto Ban:** ${config.autoMod.autoBanAfterWarnings} advertencias`,
                    inline: false
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
