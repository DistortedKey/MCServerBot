const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { writeJSON, readJSON, goodEmbed, errorEmbed, isCommandRegistered, processEmbed } = require('../functions.js');
const { registerGuild } = require('../deploy-commands.js');

module.exports = {

    data: new SlashCommandBuilder().setName('setup')
        .setDescription('Sets up roles for server integration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.reply({embeds: [processEmbed("If this message stays, contact support")], ephemeral: true });
        let configData = await readJSON('./config.json'); // read file data
        let whitelist = await readJSON('./whitelisted.json');
        const guild = interaction.guild; // shorten guild
        guildId = guild.id;

        if (!configData[guildId]) {
            configData[guildId] = {
            'permissions': {},
            'serverMemberRole': "000000000000000000",
            'serverAdminRole': "000000000000000000",
            'rconPassword': 'password',
            'rconPort': '25575'
            };
            configData[guildId].permissions[interaction.member.user.id] = 'server_owner';
        }
        writeJSON('./config.json', configData); // write config to file
        if (!whitelist[guildId]) {
            whitelist[guildId] = {};
        }
        writeJSON('./whitelisted.json', whitelist);

        const options = {
            "token": configData.token,
            "clientId": configData.clientId,
            "guildId": guildId,
            "guildTest": true,
            "commandName": "server"
        };

        let setup = await isCommandRegistered(options);

        if (setup) return interaction.editReply({ embeds: [errorEmbed("Server commands are already set up.")], ephemeral: true }); // check if commands are set up

            registerGuild(guildId);
            interaction.editReply({ embeds: [goodEmbed(`Added <@${interaction.member.user.id}> to MC server admins\nRegistered Commands\nFor more setup, use /server settings`)], ephemeral: true }); // return success

    },
};