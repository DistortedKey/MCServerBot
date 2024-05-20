const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const { serverStatus } = require("../../../server/ServerStatus.js");
const { readJSON, writeJSON } = require('../../misc/readwrite.js')


const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('node:path');
const execAsync = promisify(exec);
// function to send command to the server
async function sendRconCommand(command, rconPassword, rconPort = '25575') {
    const mcrconPath = path.join(__dirname, '../../../', 'mcrcon');
    const mcrconCommand = `${mcrconPath} -p ${rconPassword} -P ${rconPort} "${command}"`; // command to send to mcrcon
    try {
        const { stdout } = await execAsync(mcrconCommand);
        return stdout;
    } catch (error) {
        console.error(`Error executing MCRcon: ${error.message}`);

        return undefined;
    }
}

const row = new ActionRowBuilder();
row.addComponents(
    new ButtonBuilder()
        .setCustomId("server-start")
        .setLabel("Start Server")
        .setStyle(ButtonStyle.Success)
)



module.exports = {
    data: {
        options: [
            {
                choices: undefined,
                autocomplete: true,
                type: 3,
                name: 'username',
                name_localizations: undefined,
                description: 'The username to add to the whitelist',
                description_localizations: undefined,
                required: true,
                max_length: undefined,
                min_length: undefined
            }
        ],
        name: 'whitelist',
        name_localizations: undefined,
        description: 'Adds a username to the whitelist',
        description_localizations: undefined,
        default_permission: undefined,
        default_member_permissions: undefined,
        dm_permission: undefined,
        nsfw: undefined,
        "integration_types": [1],
        "contexts": [0, 1, 2]
    },
    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();
        const choices = ['list', 'remove'];
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        );
    },
    async execute(interaction, client) {

        let list = await readJSON('whitelist.json');

        if (list == null) {
            list = {
                "discordUser": "MinecraftUsername"
            }

            writeJSON(list, "whitelist.json");
        }

        async function reply(message, ButtonRow, title = " ", ephemeral = true, color = '#304d06') {

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(message)
                .setTimestamp()
                .setFooter({ text: 'heh', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

            if (ButtonRow != null) {
                interaction.editReply({ content: "", embeds: [embed], components: [ButtonRow], ephemeral: ephemeral })   
            } else
            interaction.editReply({ content: "", embeds: [embed], ephemeral: ephemeral })
        }

        const choice = interaction.options.getString('username');

        if (choice == 'list') {
            let userList = "";
            for (var user in list) {
                if (list.hasOwnProperty(user)) {
                    let value = list[user];
                    if (user == 'discordUser') {
                        userList = userList + "Discord User : Minecraft Username\n";
                    } else {
                        userList = userList + `<@${user}> : **${value}**\n`;
                    }
                }
            }
            reply(userList, null, "WhiteList:")
        } else {
            const config = await readJSON('config.json');
            const running = await serverStatus();
            if (!running) return reply("Server is down, click button to start.", row, "⚠ ERROR", true, '#ff0000');
            if (choice == 'remove') {
                if (!list[interaction.user.id]) return reply("You have not whitelisted a username", null, "⚠ ERROR", true, '#ff0000');
                
                let username = list[interaction.user.id];

                let response = await sendRconCommand('whitelist remove ' + username, config.rconpassword, config.rconport);

                if (response.includes('Player is not whitelisted')) {
                    reply("User " + username + " is not currently whitelisted, for help, contact owner", null, "⚠ ERROR", true, '#ff0000');
                } else if (response.includes(' from the whitelist')) {
                    reply(response);
                    delete list[interaction.user.id];
                    writeJSON(list, 'whitelist.json')
                } else {
                    console.log(response)
                }

            } else {
                if (list[interaction.user.id]) {
                    return reply('You have already whitelisted', null, "⚠ ERROR", true, '#ff0000');
                } 
                let response = await sendRconCommand('whitelist add ' + choice, config.rconpassword, config.rconport);
                if (response.includes("Added ")) {
                    list[interaction.user.id] = choice;
                    writeJSON(list, 'whitelist.json')
                    reply(response);
                } else if (response.includes("Player is already whitelisted")) {
                    reply(response, null, "⚠ ERROR", true, '#ff0000');
                } else {
                    reply("Failed to whitelist user", null, "⚠ ERROR", true, '#ff0000');
                }
            }
        }
    }
}