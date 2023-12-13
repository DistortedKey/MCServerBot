const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { goodEmbed, errorEmbed, readJSON, writeJSON, isCommandRegistered } = require('./functions.js');
const serverStatus = require('./server/ServerStatus.js')
const serverStart = require('./server/ServerStart.js')
const { token } = require('./config.json');
const { registerGlobal } = require('./deploy-commands.js');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
	]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

const options = {
    "token": token,
    "clientId": "",
    "guildTest": false,
    "commandName": "setup"
};

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);
	options.clientId = client.user.id;
	const registered = await isCommandRegistered(options);
	
	if (!registered) {
		let config = await readJSON('config.json');
		config.clientId = `${client.user.id}`;
		await writeJSON('config.json', config);

		registerGlobal();
	}
});


client.on('interactionCreate', async interaction => {
	if (interaction.isButton()) {
		if (interaction.customId == "server-start") {
			const runningStatus = await serverStatus();
			if (runningStatus == true) {
				interaction.reply({ embeds: [errorEmbed("Server is already running.")], ephemeral: true });
			} else {
				try {
					const response = await serverStart.execute("");
					if (response == true) {
						interaction.reply({ embeds: [goodEmbed("Starting server...")], ephemeral: true });
					} else {
						interaction.reply({ embeds: [errorEmbed("Unable to start the server ):")], ephemeral: true });
					}
				} catch (error) {
					console.log(error);
				}
			}
		}
	} else if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);