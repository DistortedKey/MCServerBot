const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readJSON, writeJSON } = require('../../misc/readwrite.js');
module.exports = {
    data: new SlashCommandBuilder().setName('bot')
        .setDescription('Commands to alter the bot')
        .addSubcommandGroup(options =>
            options.setName('profile')
                .setDescription('changes the bot\'s user profile')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('pfp')
                        .setDescription('changes the bot\'s pfp')
                        .addAttachmentOption(option =>
                            option
                                .setName('image-gif')
                                .setDescription('File for the new pfp (Recommended size: 128 x 128)')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('description')
                        .setDescription('changes the bot\'s status description')
                        .addStringOption(option =>
                            option
                                .setName('text')
                                .setDescription('Text for description')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('username')
                        .setDescription('changes the bot\'s username')
                        .addStringOption(option =>
                            option
                                .setName('text')
                                .setDescription('New username')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('status')
                        .setDescription('Changes the bot\'s status message')
                        .addStringOption(option =>
                            option
                                .setName('name')
                                .setDescription('Text for status message')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option
                                .setName('type')
                                .setDescription('The type of status')
                                .addChoices(
                                    { name: 'Listening', value: '2' },
                                    { name: 'Competing', value: '5' },
                                )
                                .setRequired(true)
                        )
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        function reply(message, title = " ", ephemeral = true, color = '#304d06') {

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(message)
                .setTimestamp()
                .setFooter({ text: 'heh', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

            interaction.editReply({ content: "", embeds: [embed], ephemeral: ephemeral })
        }
        function replyImage(message, attachment, ephemeral = true) {

            const embed = new EmbedBuilder()
                .setColor('#304d06')
                .setImage(attachment)
                .setDescription(message)
                .setTimestamp()
                .setFooter({ text: 'heh', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

            interaction.editReply({ content: "", embeds: [embed], ephemeral: ephemeral })
        }

        const command = interaction.options.getSubcommand();

        if (command == 'pfp') {
            const file = interaction.options.getAttachment('image-gif', true);
            const imageContentTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (imageContentTypes.includes(file.contentType)) {
                try {
                    await client.user.setAvatar(file.url);
                    replyImage("New PFP:", file.url);
                } catch (error) {
                    return reply(error, "⚠ ERROR", true, '#ff0000');
                }
            } else return reply("The file was not an image or a gif", "⚠ ERROR", true, '#ff0000');
        } else if (command == 'username') {
            const username = interaction.options.getString('text');
            try {
                await client.user.setUsername(username);
                reply('New username: ' + client.user.tag);
            } catch (error) {
                return reply(error.toString(), "⚠ ERROR", true, '#ff0000');
            }
        } else {
            const userConfig = readJSON('userConfig.json')
            if (command == 'description') {
                const newDescription = interaction.options.getString('text');
                userConfig.description = newDescription
                try {
                    client.user.setActivity({
                        "name": userConfig.status,
                        "type": userConfig.statusType,
                        "state": userConfig.description
                    })
                    reply('Updated about me!');
                } catch (error) {
                    return reply(error, "⚠ ERROR", true, '#ff0000');
                }
            } else if (command == 'status') {
                const newStatus = interaction.options.getString('name');
                const newStatusType = interaction.options.getString('type');
                userConfig.status = newStatus;
                userConfig.statusType = parseInt(newStatusType);
                try {
                    client.user.setActivity({
                        "name": userConfig.status,
                        "type": userConfig.statusType,
                        "state": userConfig.description
                    })
                    reply('Updated status!');
                } catch (error) {
                    return reply(error, "⚠ ERROR", true, '#ff0000');
                }
            }
            writeJSON(userConfig, 'userConfig.json')
        }
    }
}