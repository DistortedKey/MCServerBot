// starts the minecraft server
const path = require('node:path');
const { exec } = require('child_process');
const { EmbedBuilder } = require('discord.js');

let canCallFunction = true;

async function serverStart(sizeInGigabytes, interaction) {

    function reply(message, ButtonRow, title = " ", ephemeral = true, color = '#304d06') {

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(message)
            .setTimestamp()
            .setFooter({ text: 'heh', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

        interaction.editReply({ content: "", embeds: [embed], buttons: [ButtonRow], ephemeral: ephemeral })
    }


    if (!canCallFunction) {
        return reply("Server has been started in the last 2 mins",null, "⚠ ERROR", true, '#ff0000');
    } else {

        // convert GB to MB for command
        const heapSize = sizeInGigabytes * 1024;

        // create command to start server, with heap size from config
        const command = `java -Xmx${heapSize}M -Xms${heapSize}M -jar ${path.join(__dirname, "server.jar")}`;
        const options = { cwd: `${__dirname}` };
        //start server
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reply("Unable to start server, contact owner",null, "⚠ ERROR", true, '#ff0000');
                console.error(error);
            }

        });
        reply("Wait a couple minutes for the server to start",null, "Starting server...", true);

        // Set the flag to prevent further calls
        canCallFunction = false;
        // Reset the flag after 2 minutes
        setTimeout(() => {
            canCallFunction = true;
        }, 2 * 60 * 1000); // 2 minutes in milliseconds
    }
}
module.exports = {
    serverStart
}