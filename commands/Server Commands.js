const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('node:path');
const execAsync = promisify(exec);

const { goodEmbed, processEmbed, errorEmbed, readJSON, writeJSON } = require('../functions.js');
const serverStatus = require("../server/ServerStatus.js");
const serverStart = require("../server/ServerStart.js");



async function sendRconCommand(command, rconPassword, rconPort) {
    const mcrconPath = path.join(__dirname, '../', 'mcrcon');
    const mcrconCommand = `${mcrconPath} -p ${rconPassword} -P ${rconPort} "${command}"`;
    try {
        const { stdout } = await execAsync(mcrconCommand);
        return stdout;
    } catch (error) {
        console.error(`Error executing MCRcon: ${error.message}`);

        return undefined;
    }
}


module.exports = {
    data: new SlashCommandBuilder().setName('server')
        .setDescription('Starts the minecraft server if it is down')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Starts the server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stops the server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Adds a username to the whitelist')
                .addStringOption(option =>
                    option
                        .setName('username')
                        .setDescription('The username to add to the whitelist')
                        .setRequired(true)
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('command')
                .setDescription('Sends a command to the MC server(Requires server admin role)')
                .addStringOption(option =>
                    option
                        .setName('command')
                        .setDescription('The command to send to the server')
                        .setRequired(true)
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('admin')
                .setDescription('Command for oping')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('What to do')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add OP', value: '+op' },
                            { name: 'Remove OP', value: '-op' },
                            { name: 'OP List', value: '_op' },
                        ))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to affect')
                        .setRequired(false))),
    async execute(interaction) {
        await interaction.reply({ embeds: [processEmbed("Processing request")], ephemeral: true });
        const subcommand = interaction.options.getSubcommand();

        const runningStatus = await serverStatus();

        const guild = interaction.guild;
        let configData = readJSON("config.json");
        let settings = configData[guild.id];

        const row = new ActionRowBuilder();
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("server-start")
                .setLabel("Start Server")
                .setStyle(ButtonStyle.Success)
        )

        if (subcommand == "start") {
            if (runningStatus == true) {
                return interaction.editReply({ embeds: [errorEmbed("Server is already running.")], ephemeral: true });
            }
            try {
                const response = await serverStart.execute("");
                if (response == true) {
                    return interaction.editReply({ embeds: [goodEmbed("Starting server...")], ephemeral: true });
                }
                interaction.editReply({ embeds: [errorEmbed("Unable to start the server ):")], ephemeral: true });
            } catch (error) {
                console.log(error);
            }
        } else if (subcommand == "stop") {
            if (settings.permissions[interaction.member.user.id] != 'server_admin' && settings.permissions[interaction.member.user.id] != 'server_owner') {
                return interaction.editReply({ embeds: [errorEmbed(`You must have MC server admin`)], ephemeral: true });
            }

            const running = await serverStatus();
            if (running == false) {
                return interaction.editReply({ embeds: [errorEmbed("The server is down. \nClick the button to start it, then wait a minute before trying again")], components: [row], ephemeral: true });
            }

            const response = await sendRconCommand(`stop`, settings.rconPassword, settings.rconPort);

            if (response) {
                return interaction.editReply({ embeds: [goodEmbed(response)], ephemeral: true });
            }
            interaction.editReply({ embeds: [errorEmbed('Command Failed to send to server.')], ephemeral: true });


        } else if (subcommand == "whitelist") {
            let whitelistUsername = interaction.options.getString('username');

            const running = await serverStatus();
            if (running == false) {
                return interaction.editReply({ embeds: [errorEmbed("The server is down. \nClick the button to start it, then wait a minute before trying again")], components: [row], ephemeral: true });
            }


            if (whitelistUsername == "list") {
                const list = await sendRconCommand(`whitelist list`);
                return interaction.editReply({ embeds: [goodEmbed(list)], ephemeral: true });

            } else if (whitelistUsername == "remove") {
                let whitelistList = readJSON("whitelisted.json");
                const username = whitelistList[guild.id][`${interaction.member.user.id}`];

                if (!username) {
                    return interaction.editReply({ embeds: [errorEmbed("You haven't whitelisted yet")], ephemeral: true });
                }

                interaction.editReply({ embeds: [processEmbed(`Removing "${username}"`)], ephemeral: true });

                const success = await sendRconCommand(`whitelist remove ${username}`, settings.rconPassword, settings.rconPort);
                if (!success) {
                    return interaction.editReply({ embeds: [errorEmbed("Unable to connect to the server.")], ephemeral: true });
                }

                delete whitelistList[guild.id][`${interaction.member.user.id}`];
                if (guild.roles.cache.get(settings.serverMemberRole)) interaction.member.roles.remove(settings.serverMemberRole);
                writeJSON("whitelisted.json", whitelistList);
                return interaction.editReply({ embeds: [goodEmbed(success)], ephemeral: true });

            } else {
                let whitelistList = readJSON('./whitelisted.json');

                if (whitelistList[guild.id][interaction.member.user.id]) {
                    return interaction.editReply({ embeds: [errorEmbed("You have already whitelisted")], ephemeral: true });
                }

                await interaction.editReply({ embeds: [processEmbed(`attempting to whitelist "${whitelistUsername}"`)], ephemeral: true });
                const success = await sendRconCommand(`whitelist add ${whitelistUsername}`, settings.rconPassword, settings.rconPort);

                if (!success) {
                    return interaction.editReply({ embeds: [errorEmbed(`Unable to whitelist at this time.`)], ephemeral: true });
                }

                if(settings.permissions[interaction.member.user.id] == 'server_owner' ) {
                    await sendRconCommand(`op ${whitelistUsername}`, settings.rconPassword, settings.rconPort);
                    if (guild.roles.cache.get(settings.serverAdminRole)) interaction.member.roles.add(settings.serverAdminRole);
                }
                
                interaction.editReply({ embeds: [goodEmbed(`Whitelisted ${whitelistUsername}!`)], ephemeral: true });
                whitelistList[guild.id][`${interaction.member.user.id}`] = whitelistUsername;
                writeJSON('whitelisted.json', whitelistList);
                if (guild.roles.cache.get(settings.serverMemberRole)) interaction.member.roles.add(settings.serverMemberRole);

            }

        } else if (subcommand == "command") {
            if (settings.permissions[interaction.member.user.id] != 'server_admin' && settings.permissions[interaction.member.user.id] != 'server_owner') {
                return interaction.editReply({ embeds: [errorEmbed(`You must have MC server admin to use this command`)], ephemeral: true });
            }

            const running = await serverStatus();
            if (running == false) {
                return interaction.editReply({ embeds: [errorEmbed("The server is down. \nClick the button to start it, then wait a minute before trying again")], components: [row], ephemeral: true });
            }

            let command = interaction.options.getString('command');
            const response = await sendRconCommand(command, settings.rconPassword, settings.rconPort);
            console.log(response);
            if (response == undefined) {
                return interaction.editReply({ embeds: [errorEmbed(`Unable to execute a command at this time`)], ephemeral: true });
            }
            return interaction.editReply({ embeds: [goodEmbed(response)], ephemeral: true });
        } else if (subcommand == 'admin') {
            let option = interaction.options.getString('action');
            const whitelistList = readJSON('./whitelisted.json');
            const whitelist = whitelistList[guild.id];

            if (settings.permissions[interaction.member.user.id] != 'server_admin' && settings.permissions[interaction.member.user.id] != 'server_owner') {
                return interaction.editReply({ embeds: [errorEmbed(`You must have MC server admin to use this command`)], ephemeral: true });
            }

            if (option == '_op') {
                const permissions = settings.permissions;
                let ops = "Discord Username: Whitelisted Username\n";
                for (const key in permissions) {
                    if (permissions.hasOwnProperty(key)) {
                        const value = permissions[key];
                        if (value == 'server_admin' || settings.permissions[interaction.member.user.id] == 'server_owner') {
                            ops += `<@${key}>: ${whitelist[key]}\n`;
                        }
                    }
                }
                return interaction.editReply({ embeds: [goodEmbed(ops)], ephemeral: true });
            }

            let user = interaction.options.getUser('user');

            if (!user) return interaction.editReply({ embeds: [errorEmbed("You must specify a user")], ephemeral: true });

            const targetUser = await guild.members.fetch(user.id);

            const running = await serverStatus();
            if (running == false) {
                return interaction.editReply({ embeds: [errorEmbed("The server is down. \nClick the button to start it, then wait a minute before trying again")], components: [row], ephemeral: true });
            }            

            if (option == '+op') {
                if (settings.permissions[user.id] == 'server_admin' || settings.permissions[user.id] == 'server_owner') {
                    return interaction.editReply({ embeds: [errorEmbed(`User is already an admin`)], ephemeral: true });
                }

                if (!whitelist[user.id]) {
                    return interaction.editReply({ embeds: [errorEmbed(`User is not whitelisted`)], ephemeral: true });
                }

                const response = await sendRconCommand(`op ${whitelist[user.id]}`, settings.rconPassword, settings.rconPort);
                console.log(response);

                if (response == undefined) {
                    return interaction.editReply({ embeds: [errorEmbed(`Unable to execute a command at this time`)], ephemeral: true });
                }
                if (guild.roles.cache.get(settings.serverAdminRole)) targetUser.roles.add(settings.serverAdminRole);
                settings.permissions[user.id] = 'server_admin';
                configData[guild.id] = settings;
                writeJSON('./config.json', configData);
                return interaction.editReply({ embeds: [goodEmbed(response)], ephemeral: true });

            } else if (option == '-op') {
                if (settings.permissions[user.id] != 'server_admin') {
                    return interaction.editReply({ embeds: [errorEmbed(`User is not an admin`)], ephemeral: true });
                }

                if (!whitelist[user.id]) {
                    return interaction.editReply({ embeds: [errorEmbed(`User is not whitelisted`)], ephemeral: true });
                }

                const response = await sendRconCommand(`deop ${whitelist[user.id]}`, settings.rconPassword, settings.rconPort);
                console.log(response);

                if (response == undefined) {
                    return interaction.editReply({ embeds: [errorEmbed(`Unable to execute a command at this time`)], ephemeral: true });
                }
                if (guild.roles.cache.get(settings.serverAdminRole)) targetUser.roles.remove(settings.serverAdminRole);
                delete settings.permissions[user.id];
                configData[guild.id] = settings;
                writeJSON('./config.json', configData);
                return interaction.editReply({ embeds: [goodEmbed(response)], ephemeral: true });

            }
        }
    },
};