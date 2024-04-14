const { serverStart } = require('../../../server/ServerStart.js');
const { serverStatus } = require('../../../server/ServerStatus.js');
const { EmbedBuilder } = require('discord.js');
const { readJSON } = require('../../misc/readwrite.js')

module.exports = {
    data: {
        name: "server-start",
        description: "Starts the minecraft server",
        "integration_types": [1],
        "contexts": [0, 1, 2]
    },
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

        const running = await serverStatus();

        if (running) {
            return reply("Server is already up", null, "⚠ ERROR", true, '#ff0000');
        }

        const config = await readJSON('config.json');
        await serverStart(config.dedicatedRamGB, interaction);
    }
}