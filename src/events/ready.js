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
        let periodic = 0;
        let periodicstopping = false;

        const checkServer = async () => {
            if (periodicstopping == true) {
                periodicstopping = false;

                const config = await readJSON('config.json');

                let time = 0;
                let minutewarn = setInterval(async () => {
                    if (time == 0) {
                        await sendRconCommand(`tellraw @a \\"[server] Stopping server in 1 minute\\"`, config.rconpassword, config.rconport)
                            .then((response) => console.log(response))
                            .catch((error) => console.log(error));
                    } else if (time == 5) {
                        async function message(message) {
                            await sendRconCommand(`tellraw @a \\"${message}\\"`, config.rconpassword, config.rconport)
                                .then((response) => console.log(response))
                                .catch((error) => console.log(error));
                        }
                        time = -1;
                        let secondWarn = setInterval(async () => {
                            if (time == 10 || time == 9 || time == 8 || time == 7 || time == 6 || time == 5 || time == 0) {
                                if (time - 10 == 0) {
                                    message('[server] Stopping server...');
                                    await sendRconCommand(`stop`, config.rconpassword, config.rconport)
                                        .then((response) => console.log(response))
                                        .catch((error) => console.log(error));
                                    clearInterval(secondWarn);
                                } else message(`[server] Stopping server in ${10 - time} seconds`)
                            }
                            time++;
                        }, 1000)
                        clearInterval(minutewarn);
                    }
                    time++;
                }, 10000)


            } else {
                const serverUtilOptions = {
                    timeout: 1000 * 5, // timeout in milliseconds
                    enableSRV: true // SRV record lookup
                };

                const config = await readJSON('config.json');
                if (config) {
                    util.status(config.serverip, 25565, serverUtilOptions)
                        .then(async (result) => {
                            if (config.periodicrestart > 0) {
                                periodic += 5;
                                if (periodic >= config.periodicrestart) {
                                    periodicstopping = true
                                }
                            }


                            if (config.timeoutminutes > 0) {
                                timeout += 5;
                                if (result.players.online > 0) {
                                    timeout = 0;
                                }

                                if (timeout >= config.timeoutminutes) {
                                    await sendRconCommand(`stop`, config.rconpassword, config.rconport)
                                        .then((response) => console.log(response))
                                        .catch((error) => console.log(error));
                                }
                            }
                            console.log("Periotic count: " + periodic + ", timeout count: " + timeout);
                        })
                        .catch((error) => { // error means server is unreachable, treat as offline
                            timeout = 0;
                            periodic = 0;
                            console.log('server offline');
                        });
                }
            }
        }
        setInterval(checkServer, 300100); // check the server status every 5 mins
    }
};