const { InteractionType, EmbedBuilder } = require("discord.js");
const { serverStart } = require('../../server/ServerStart.js');
const { serverStatus } = require('../../server/ServerStatus.js');
const { readJSON } = require('../misc/readwrite.js')

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {

        if (interaction.isButton()) {

            // check if the button interaction is the server start
            if (interaction.customId == "server-start") {
                async function reply(message, ButtonRow, title = " ", ephemeral = true, color = '#304d06') {

                    const embed = new EmbedBuilder()
                        .setColor(color)
                        .setTitle(title)
                        .setDescription(message)
                        .setTimestamp()
                        .setFooter({ text: 'heh', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

                    return await interaction.reply({ content: "", embeds: [embed], buttons: [ButtonRow], ephemeral: ephemeral })
                }

                const running = await serverStatus();

                if (running) {
                    return reply("Server is already up", null, "ERROR", true, '#ff0000');
                }

                try {
                    await reply("Processing...", null, " ", true, '#d4a508');
                    const config = await readJSON('config.json');
                    await serverStart(config.dedicatedramgb, interaction);
                } catch { }
            } 
        } else if (interaction.type == InteractionType.ApplicationCommandAutocomplete) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.autocomplete(interaction, client);
            } catch (error) {
                console.error(error);
            }
        } else {

            async function reply(message, ButtonRow, title = " ", ephemeral = true, color = '#304d06') {

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(title)
                    .setDescription(message)
                    .setTimestamp()
                    .setFooter({ text: 'heh', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

                await interaction.reply({ content: "", embeds: [embed], buttons: [ButtonRow], ephemeral: ephemeral });
            }
            async function editReply(message, ButtonRow, title = " ", ephemeral = true, color = '#304d06') {

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(title)
                    .setDescription(message)
                    .setTimestamp()
                    .setFooter({ text: 'heh', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

                await interaction.editReply({ content: "", embeds: [embed], buttons: [ButtonRow], ephemeral: ephemeral });
            }

            if (!interaction.isCommand()) return;

            const command = client.commands.get(interaction.commandName);

            if (!command) return

            try {
                await reply("Processing...", null, " ", true, '#d4a508');

                await command.execute(interaction, client);
            } catch (error) {
                console.log(error);
                try {
                    await editReply("There was an error executing that command", null, "⚠ ERROR", true, '#ff0000')
                } catch { }
            }
        }
    }
};