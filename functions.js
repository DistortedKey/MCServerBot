const { EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('node:fs');
function errorEmbed(errorMessage) {
    return new EmbedBuilder()
        .setColor(0xa10202)
        .setTitle('ERROR')
        .setDescription(errorMessage)
        .setTimestamp()
        .setFooter({ text: 'MC Server Bot', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });
}

function goodEmbed(message) {
    return new EmbedBuilder()
        .setColor(0x14a102)
        .setTitle('Success!')
        .setDescription(message)
        .setTimestamp()
        .setFooter({ text: 'MC Server Bot', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });
}

function processEmbed(message, title = 'Processing...', color = 0xc7ac01) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(message)
        .setTimestamp()
        .setFooter({ text: 'MC Server Bot', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });
}

function readJSON(fileName) {
    try {
        const data = fs.readFileSync(`${fileName}`, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

function writeJSON(fileName, data) {
    
    // Convert the updated configuration back to JSON
    const updatedConfig = JSON.stringify(data, null, 2); // The third parameter (2) specifies the number of spaces for indentation
    // Write the updated JSON back to the file
    fs.writeFileSync(`${fileName}`, updatedConfig, 'utf8', (writeErr) => {
        if (writeErr) {
            console.error('Error writing to the file:', writeErr);
        }
    });
    return;
}



// Function to check if a global command with a certain name is already registered
async function isCommandRegistered(options) {
    const rest = new REST({ version: '10' }).setToken(options.token);
    if(options.guildTest) {
        const commands = await rest.get(
            Routes.applicationGuildCommands(options.clientId, options.guildId),
        );
        return commands.some(command => command.name === options.commandName);
    } else {
        const commands = await rest.get(
            Routes.applicationCommands(options.clientId),
        );
        return commands.some(command => command.name === options.commandName);
    }
}

module.exports = {
    errorEmbed,
    goodEmbed,
    processEmbed,
    readJSON,
    writeJSON,
    isCommandRegistered
}