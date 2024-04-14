const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, Colors } = require('discord.js');
const { readJSON, writeJSON } = require('../../misc/readwrite');

module.exports = {
    data: new SlashCommandBuilder().setName('config')
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
                    option.setName('option')
                        .setDescription('What to choose...')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Rcon Password', value: 'rconPassword' },
                            { name: 'Rcon Port', value: 'rconPort' },
                            { name: 'Server Member Role', value: 'serverMemberRole' },
                            { name: 'Dedicated Ram(In Gigabytes)', value: 'dedicatedRamGB' },
                            { name: 'MC Server Status Channel', value: 'statusChannel' },
                            { name: 'Server IP', value: 'serverIp' },
                            { name: 'Timeout(Time in multiples of 5 minutes)', value: 'timeoutMinutes' }
                        ))
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('New value')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {

        function reply(message, ButtonRow, title = " ", ephemeral = true, color = '#304d06') {

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(message)
                .setTimestamp()
                .setFooter({ text: 'heh', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

            interaction.editReply({ content: "", embeds: [embed], buttons: [ButtonRow], ephemeral: ephemeral })
        }

        let config = await readJSON('config.json');

        if (config == null) {
            config = {
                'rconPassword': 'SuperSecurePassword',
                'rconPort': '25575',
                'serverMemberRole': "000000000000000000",
                'dedicatedRamGB': 1,
                'statusChannel': '000000000000000000',
                'serverIp': '8.8.8.8',
                '#guildId': '000000000000000000',
                'timeoutMinutes': 30
            }

            writeJSON(config, "config.json");
        }


        const subcommand = interaction.options.getSubcommand();
        if (subcommand == 'list') {

            let settingsList = "";
            for (var set in config) {
                if (config.hasOwnProperty(set)) {
                    let value = config[set];
                    if (set.charAt(0) == '#') continue;
                    if (set.includes("Role")) {
                        value = `<@&${config[set]}>`;
                    } else if (set.includes("Channel")) {
                        value = `<#${config[set]}>`;
                    }
                    settingsList = settingsList + set.toString().padEnd(20, " ") + `: ${value}\n`;
                }
            }

            reply(settingsList, null, "Settings:");
        } else {
            let guild = interaction.guild;
            let setting = interaction.options.getString('option');
            let value = interaction.options.getString('value');

            if (setting == 'serverMemberRole') { // if the setting is a role choice, validate id
                const role = guild.roles.cache.get(value);
                if (!role) {
                    return reply(`The role id "${value}" does not exist in this server.`, null, "⚠ ERROR", true, '#ff0000');
                }


            } else if (setting == 'dedicatedRamGB') { // if the setting is the ram setting, check against a range
                let num = parseInt(value);

                if (num <= 0 || num >= 100) {
                    return reply(`Please specify a value between 1 and 100`, null, "⚠ ERROR", true, '#ff0000');;
                }
            } else if (setting == 'statusChannel') {
                const channel = guild.channels.cache.get(value);
                if (!channel) {
                    return reply('The channel id "' + value + '" does not exist in this server.', null, "⚠ ERROR", true, '#ff0000');
                }
                config['#guildId'] = interaction.guild.id;
            }
            if (setting == 'dedicatedRamGB' || setting == 'timeoutMinutes') { // if the changed setting is ram, make new setting an int
                config[setting] = parseInt(value);

            } else { // otherwise, a string is fine
                config[setting] = value;
            }
            
            let settingsList = "";
            for (var set in config) {
                if (config.hasOwnProperty(set)) {
                    let value = config[set];
                    if (set.charAt(0) == '#') continue;
                    if (set.includes("Role")) {
                        value = `<@&${config[set]}>`;
                    } else if (set.includes("Channel")) {
                        value = `<#${config[set]}>`;
                    }
                    settingsList = settingsList + set.toString().padEnd(20, " ") + `: ${value}\n`;
                }
            }
            writeJSON(config, "config.json");
            reply(settingsList, null, "New Settings:");
        }
    }
}