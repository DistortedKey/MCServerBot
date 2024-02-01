// takes all whitelisted/admin users and adds specified role to them

const { SlashCommandBuilder } = require('discord.js');
const { readJSON, errorEmbed, goodEmbed, processEmbed } = require('../functions');

module.exports = {
    data: new SlashCommandBuilder().setName('update-roles')
    .setDescription('Adds users in who are already whitelisted/admin to the role designated as such')
    .addStringOption(option =>
        option.setName('role')
            .setDescription('Chose the role to be updated')
            .setRequired(true)
            .addChoices(
                { name: 'Whitelisted', value: 'serverMemberRole' },
                { name: 'Admin', value: 'serverAdminRole' },
            )),
    async execute(interaction) {
        // process message
        await interaction.reply({embeds: [processEmbed('Adding roles...')], ephemeral: true })

        guild = interaction.guild;
        let config = await readJSON('./config.json');
        
        // get role info
        let roleType = interaction.options.getString('role');
        let updateRoleId = config[guild.id][roleType];

        
        let users = {};
        // grab the specified list of users
        if (roleType == 'serverMemberRole') {
            users = await readJSON('./whitelisted.json');
            users = users[guild.id];
        } else {
            users = config[guild.id].permissions;
        }

        // get the role and make sure it exists
        const role = guild.roles.cache.get(updateRoleId);
        if (!role) {
            return interaction.editReply({embeds: [errorEmbed(`The role id "${updateRoleId}" does not exist in this server.`)], ephemeral: true});
        }

        // for each user, add the role and add to the list to be printed
        let userList = "";
        for (var user in users) {
            if (users.hasOwnProperty(user)) {
                userList = userList + `\n<@${user}>`;
                const targetUser = await guild.members.fetch(user);
                targetUser.roles.add(updateRoleId);
            }
        }
        // output results
        interaction.editReply({embeds: [goodEmbed(`Gave the role <@&${updateRoleId}> to the following users:${userList}`)], ephemeral: true})
    }
}