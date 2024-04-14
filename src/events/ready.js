const { readJSON, writeJSON } = require('../misc/readwrite.js');
const util = require('minecraft-server-util');


const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('node:path');
const execAsync = promisify(exec);
async function sendRconCommand(command, rconPassword, rconPort = '25575') {
    const mcrconPath = path.join(__dirname, '../../', 'mcrcon');
    const mcrconCommand = `${mcrconPath} -p ${rconPassword} -P ${rconPort} "${command}"`; // command to send to mcrcon
    try {
        const { stdout } = await execAsync(mcrconCommand);
        return stdout;
    } catch (error) {
        console.error(`Error executing MCRcon: ${error.message}`);

        return undefined;
    }
}

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('logged in as ' + client.user.tag + '!');

        let userConfig = await readJSON('userConfig.json');

        if (userConfig == null) {
            userConfig = {
                'statusType': 2,
                'status': 'your slash commands',
                'description': 'Insert generic description here'
            }

            writeJSON(userConfig, "userConfig.json");
        }

        client.user.setActivity({
            "name": userConfig.status,
            "type": userConfig.statusType,
            "state": userConfig.description
        })


        let timeout = 0;

        const checkServer = async () => {
            const serverUtilOptions = {
                timeout: 1000 * 5, // timeout in milliseconds
                enableSRV: true // SRV record lookup
            };
            
            const config = await readJSON('config.json');
            let guild
            if (config) guild = client.guilds.cache.get(config['#guildId']);
            let channel;
            if (guild) channel = guild.channels.cache.get(config.statusChannel);
            // get the server's status
            if (config) {
                util.status(config.serverIp, 25565, serverUtilOptions)
                    .then(async (result) => {
                        // if a valid channel is set, change channel name to reflect online players
                        if (channel) {
                            let channelName = `Players on server: ${result.players.online}`;
                            channel.setName(channelName);
                        }
                        if (config.timeoutMinutes != 0) {

                            // if there are players online, reset the count
                            if (result.players.online > 0) {
                                timeout = 0;
                            } else {
                                // if server is up but no players are online, increment timeout and check if 3rd timeout (15 mins)
                                if (++timeout >= config.timeoutMinutes) {
                                    // stop server
                                    await sendRconCommand(`stop`, config.rconPassword, config.rconPort)
                                        .then((response) => console.log(response))
                                        .catch((error) => console.log(error));
                                }
                                console.log('Time without online players: ', 5 * timeout);
                            }
                        }
                    })
                    .catch((error) => { // error means server is unreachable, treat as offline
                        timeout = 0;
                        if (channel) {
                            let channelName = `Server is offline`;
                            channel.setName(channelName);
                        }
                    });
            }
        }
        await checkServer(); //initial server check
        setInterval(checkServer, 300100); // check the server status every 5 mins
    }
};