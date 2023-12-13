const { REST, SlashCommandBuilder, Routes, PermissionFlagsBits } = require('discord.js');
const { readJSON } = require('./functions.js');
let config = readJSON('config.json');

const guildCommands = [
    new SlashCommandBuilder().setName('server')
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
    new SlashCommandBuilder().setName('settings')
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
]
    .map(command => command.toJSON());

const globalCommands = [
    new SlashCommandBuilder().setName('setup')
        .setDescription('Sets up roles for server integration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);



//to delete all global commands



function registerGuild(guildId) {
    rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body: guildCommands })
        .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
        .catch(console.error);
}
function deleteAllGuild(guildId) {
    rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body: [] })
        .then(() => console.log('Successfully deleted all guild commands.'))
        .catch(console.error);
}
async function registerGlobal() {
    config = await readJSON('config.json');
    rest.put(Routes.applicationCommands(config.clientId), { body: globalCommands })
        .then((data) => console.log(`Successfully registered setup command`))
        .catch(console.error);
}
async function deleteAllGlobal() {
    config = await readJSON('config.json');
    rest.put(Routes.applicationCommands(config.clientId), { body: [] })
        .then((data) => console.log(`Successfully deleted all global commands`))
        .catch(console.error);
}

module.exports = {
    registerGuild,
    deleteAllGuild,
    registerGlobal,
    deleteAllGlobal
}

