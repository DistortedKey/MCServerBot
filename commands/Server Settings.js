// command to view/edit server settings

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
                            { name: 'Dedicated Ram(In Gigabytes)', value: 'dedicatedRamGB'}, // left off here
                        ))
                .addStringOption(option => 
                    option.setName('value')
                        .setDescription('New setting')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // get current settings
        const guild = interaction.guild;
        let config = readJSON('config.json');
        let settings = config[`${guild.id}`];
        const subcommand = interaction.options.getSubcommand();

        // if command is list, output a list of current settings
        if (subcommand == 'list') {
            interaction.reply({embeds: [processEmbed(`Rcon Password: ${settings.rconPassword}\nRcon Port: ${settings.rconPort}\nServer Member Role: <@&${settings.serverMemberRole}>
            Server Admin Role: <@&${settings.serverAdminRole}>`, 'Settings:', 0xb7ffff)], ephemeral: true})
            
        } else if (subcommand == 'set') { // if command is 'set', get the picked settings and validate new setting
            let setting = interaction.options.getString('settings');
            let value = interaction.options.getString('value');
            if (setting == 'serverMemberRole' || setting == 'serverAdminRole') { // if the setting is a role choice, validate id
                const role = guild.roles.cache.get(value);
                if (!role) {
                    return interaction.reply({embeds: [errorEmbed(`The role id "${value}" does not exist in this server.`)], ephemeral: true});
                }
            } else if (value == 'dedicatedRamGB') { // if the setting is the ram setting, check against a range
                let num = parseInt(value);

                if (num <= 0 || num >= 100) {
                    return;
                }
            }
            if (setting == 'dedicatedRamGB') { // if the changed setting is ram, make new setting an int
                settings[setting] = parseInt(value);

            } else { // otherwise, a string is fine
                settings[setting] = value;
            }
            // update config
            config[`${guild.id}`] = settings;
            // write to file
            writeJSON('config.json', config);
            // output results
            interaction.reply({embeds: [goodEmbed(`**New Settings:**\nRcon Password: ${settings.rconPassword}\nRcon Port: ${settings.rconPort}\nServer Member Role: <@&${settings.serverMemberRole}>
            Server Admin Role: <@&${settings.serverAdminRole}>\nDedicated Ram (In Gigabytes): ${settings.dedicatedRamGB}`)], ephemeral: true});
            
        }
    }
}