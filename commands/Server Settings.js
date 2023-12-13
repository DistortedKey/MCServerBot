const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { readJSON, writeJSON, processEmbed, goodEmbed, errorEmbed } = require('../functions');


module.exports = {
    data: new SlashCommandBuilder().setName('settings')
        .setDescription('Change Server Settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Shows a list of settings and their current values'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Changes a setting')
                .addStringOption(option =>
                    option.setName('settings')
                        .setDescription('Changes a selected setting')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Rcon Password', value: 'rconPassword' },
                            { name: 'Rcon Port', value: 'rconPort' },
                            { name: 'Server Member Role', value: 'serverMemberRole' },
                            { name: 'Server Admin Role', value: 'serverAdminRole' },
                        ))
                .addStringOption(option => 
                    option.setName('value')
                        .setDescription('New setting')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guild = interaction.guild;
        let config = readJSON('config.json');
        let settings = config[`${guild.id}`];
        const subcommand = interaction.options.getSubcommand();

        if (subcommand == 'list') {
            interaction.reply({embeds: [processEmbed(`Rcon Password: ${settings.rconPassword}\nRcon Port: ${settings.rconPort}\nServer Member Role: <@&${settings.serverMemberRole}>
            Server Admin Role: <@&${settings.serverAdminRole}>`, 'Settings:', 0xb7ffff)], ephemeral: true})
        } else if (subcommand == 'set') {
            let setting = interaction.options.getString('settings');
            let value = interaction.options.getString('value');
            if (value == 'serverMemberRole' || value == 'serverAdminRole') {
                const role = guild.roles.cache.get(value);
                if (!role) {
                    return interaction.reply({embeds: [errorEmbed(`The role id "${value}" does not exist in this server.`)], ephemeral: true});
                }
            }
            settings[setting] = value;
            config[`${guild.id}`] = settings;
            writeJSON('config.json', config);
            interaction.reply({embeds: [goodEmbed(`**New Settings:**\nRcon Password: ${settings.rconPassword}\nRcon Port: ${settings.rconPort}\nServer Member Role: <@&${settings.serverMemberRole}>
            Server Admin Role: <@&${settings.serverAdminRole}>`)], ephemeral: true});
            
        }
    }
}