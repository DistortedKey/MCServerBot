const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const { serverStatus } = require('../../../server/ServerStatus.js');
const { readJSON } = require('../../misc/readwrite.js');

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
    data: new SlashCommandBuilder().setName('server-admin')
        .setDescription('Interaction with Minecraft server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stops the server'))
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
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        function reply(message, ButtonRow, title = " ", ephemeral = true, color = '#304d06') {

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

        const running = await serverStatus();
        if (!running) return reply("Server is down, click button to start.", row, "⚠ ERROR", true, '#ff0000');

        const config = await readJSON('config.json');
        const command = interaction.options.getSubcommand();
        if (command == 'stop') {
            const result = await sendRconCommand('stop', config.rconPassword, config.rconPort);
            if (result.includes('Stopping the server')) {
                reply(result);
            } else {
                return reply("Failed to stop server", null, "⚠ ERROR", true, '#ff0000');
            }
        } else if (command == 'command') {
            const serverCommand = interaction.options.getString('command');
            const result = await sendRconCommand(serverCommand, config.rconPassword, config.rconPort);
            if (result == "") {
                reply('Command successfully executed.');
            } else if (result.includes('Unknown or incomplete')) {
                reply(result.slice(0,50) + "\n" + result.slice(50), null, "⚠ ERROR", true, '#ff0000');
            } else {
                reply(result);
            }
        }
    }
}