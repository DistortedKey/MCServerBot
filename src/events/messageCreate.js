const { ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { serverStatus } = require('../../server/ServerStatus.js');
const { readJSON, writeJSON } = require('../misc/readwrite.js');

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('node:path');
const execAsync = promisify(exec);
// function to send command to the server
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

const row = new ActionRowBuilder();
row.addComponents(
    new ButtonBuilder()
        .setCustomId("server-start")
        .setLabel("Start Server")
        .setStyle(ButtonStyle.Success)
)
module.exports = {
    name: 'messageCreate',
    async execute(message, client) {

        function reply(content, title = " ", ephemeral = true, color = '#304d06', row = null, deleteMessage = true, pin = false) {

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(content)
                .setTimestamp()
                .setFooter({ text: '\n*this message will be deleted in 30 seconds*', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

            if (row) return message.reply({ content: "", embeds: [embed], components: [row], ephemeral: ephemeral }).then((reply) => {
                if (deleteMessage) {
                    setTimeout(() => {
                        try {
                            reply.delete();
                        } catch { }
                    }, 30000)
                }
                if (pin) reply.pin()
            });
            message.reply({ content: "", embeds: [embed], ephemeral: ephemeral }).then((reply) => {
                if (deleteMessage) {
                    setTimeout(() => {
                        try {
                            reply.delete();
                        } catch { }
                    }, 30000)
                }
                if (pin) reply.pin()
            });
        }
        function replyImage(content, attachment, ephemeral = true) {

            const embed = new EmbedBuilder()
                .setColor('#304d06')
                .setImage(attachment)
                .setDescription(content)
                .setTimestamp()
                .setFooter({ text: '\n*this message will be deleted in 30 seconds*', iconURL: 'https://cdn.discordapp.com/avatars/558440155397095455/d85c9d818e61126c089152e688adce7c.webp' });

            message.reply({ content: "", embeds: [embed], ephemeral: ephemeral }).then((reply) => {
                setTimeout(() => {
                    try {
                        reply.delete();
                    } catch { }
                }, 30000)
            });
        }

        let userList = await readJSON("adminUsers.json")

        if (message.guildId === null && userList[message.author.id]) {

            let args = message.content.split(" ")
            if (args[0] == 'register') {
                if (!args[1]) {
                    if (userList[message.author.id] == "unregistered") {
                        userList[message.author.id] = "registered";
                        reply(`To use a command on the server, just type the command as you would in mc(ex: "/say test")\nThe command to stop the server is "/stop"\nTo add a user to the admin list, use "admin add [discord id]"`, "**Registered**", false, '#304d06', null, false, true);

                        writeJSON(userList, 'adminUsers.json')
                    }
                }
            } else if (userList[message.author.id] == 'registered') {
                if (args[0] == "admin") {
                    if (!args[1]) return message.reply('Incorrect format, use:\n**admin [add/remove/list]**' + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                        setTimeout(() => {
                            try {
                                reply.delete();
                            } catch { }
                        }, 30000)
                    });
                    else {
                        if (args[1] == 'list') {
                            let usersList = "";
                            let i = 0;
                            for (var user in userList) {
                                if (userList.hasOwnProperty(user)) {
                                    let value = userList[user];
                                    usersList = usersList + `${i++}. <@${user}> : **${value}**\n`;
                                }
                            }
                            message.reply("User : Username\n" + usersList + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                                setTimeout(() => {
                                    try {
                                        reply.delete();
                                    } catch { }
                                }, 30000)
                            });
                        } else {
                            if (!args[2]) return message.reply('Incorrect format, use:\n**admin [add/remove/list] [user id]**' + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                                setTimeout(() => {
                                    try {
                                        reply.delete();
                                    } catch { }
                                }, 30000)
                            });
                            if (args[1] == 'add') {
                                userList[args[2]] = 'unregistered'
                                message.reply(`Added <@${args[2]}> to the admin list` + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                                    setTimeout(() => {
                                        try {
                                            reply.delete();
                                        } catch { }
                                    }, 30000)
                                });
                            } else if (args[1] == 'remove') {
                                delete userList[args[2]];
                                message.reply(`Removed <@${args[2]}> from the admin list` + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                                    setTimeout(() => {
                                        try {
                                            reply.delete();
                                        } catch { }
                                    }, 30000)
                                });
                            }
                            return writeJSON(userList, 'adminUsers.json');
                        }

                    }
                } else if (args[0] == 'settings') {
                    let config = await readJSON('config.json');

                    if (config == null) {
                        config = {
                            'rconpassword': 'SuperSecurePassword',
                            'rconport': '25575',
                            'dedicatedramgb': 1,
                            'serverip': '8.8.8.8',
                            'timeoutminutes': 30,
                            'periodicrestart': 180
                        }

                        writeJSON(config, "config.json");
                    }

                    if (!args[1]) return message.reply(`⚠ ERROR\nIncorrect arguments, please use the following format:\n**settings [set/list]**\nFor a list of settings, use setting list` + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                        setTimeout(() => {
                            try {
                                reply.delete();
                            } catch { }
                        }, 30000)
                    });
                    const subcommand = args[1].toLowerCase();

                    if (subcommand == 'list') {

                        let settingsList = "";
                        for (var set in config) {
                            if (config.hasOwnProperty(set)) {
                                let value = config[set];
                                settingsList = settingsList + set.toString().padEnd(20) + `: ${value}\n`;
                            }
                        }

                        message.reply("**Settings:**\n" + settingsList + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                            setTimeout(() => {
                                try {
                                    reply.delete();
                                } catch { }
                            }, 30000)
                        });
                    } else if (subcommand == 'set') {
                        if (!args[2] || !args[3]) return message.reply(`⚠ ERROR\nIncorrect arguments, please use the following format:\n**settings set [setting] [value]**\nFor a list of settings, use setting list` + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                            setTimeout(() => {
                                try {
                                    reply.delete();
                                } catch { }
                            }, 30000)
                        });

                        let setting = args[2].toLowerCase();
                        let value = args[3].toLowerCase();

                        if (setting == 'dedicatedramgb') { // if the setting is the ram setting, check against a range
                            let num = parseInt(value);

                            if (num <= 0 || num >= 100) {
                                return message.reply(`⚠ ERROR\nPlease specify a value between 1 and 100` + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                                    setTimeout(() => {
                                        try {
                                            reply.delete();
                                        } catch { }
                                    }, 30000)
                                });
                            }
                            config[setting] = parseInt(value);
                        } else if (setting == 'timeoutminutes') config[setting] = parseInt(value);
                        else { // otherwise, a string is fine
                            if (config[setting]) config[setting] = value;
                            else return message.reply(`⚠ ERROR\nInvalid setting` + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                                setTimeout(() => {
                                    try {
                                        reply.delete();
                                    } catch { }
                                }, 30000)
                            });
                        }

                        let settingsList = "";
                        for (var set in config) {
                            if (config.hasOwnProperty(set)) {
                                let value = config[set];
                                settingsList = settingsList + set.toString().padEnd(20, " ") + `: ${value}\n`;
                            }
                        }
                        writeJSON(config, "config.json");
                        message.reply("**New Settings:**\n" + settingsList + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                            setTimeout(() => {
                                try {
                                    reply.delete();
                                } catch { }
                            }, 30000)
                        });
                    }
                } else if (message.content.charAt(0) == '/') {
                    const running = await serverStatus();
                    if (!running) return message.reply({ content: "⚠ ERROR\nServer is down, click button to start.\n*this message will be deleted in 30 seconds*", components: [row] }).then((reply) => {
                        setTimeout(() => {
                            try {
                                reply.delete();
                            } catch { }
                        }, 30000)
                    });

                    const config = await readJSON('config.json');
                    const serverCommand = message.content.slice(1);

                    const result = await sendRconCommand(serverCommand, config.rconpassword, config.rconport);
                    if (result == "") {
                        message.reply('Command successfully executed.' + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                            setTimeout(() => {
                                try {
                                    reply.delete();
                                } catch { }
                            }, 30000)
                        });
                    } else if (result.includes('Unknown or incomplete')) {
                        message.reply("⚠ ERROR\n" + result.slice(0, 50) + "\n" + result.slice(50) + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                            setTimeout(() => {
                                try {
                                    reply.delete();
                                } catch { }
                            }, 30000)
                        });
                    } else {
                        message.reply(result + '\n*this message will be deleted in 30 seconds*').then((reply) => {
                            setTimeout(() => {
                                try {
                                    reply.delete();
                                } catch { }
                            }, 30000)
                        });
                    }
                } else if (args[0] == 'bot') {



                    if (!args[1]) return reply("Incorrect command format, use the following format:\n**bot [pfp/username/description/status]**", "⚠ ERROR", true, '#ff0000');
                    const command = args[1];

                    if (command == 'pfp') {
                        const files = message.attachments;
                        let file;
                        try {
                            file = files.values().next().value;
                        } catch { }
                        if (!file) return reply("You must attach a file", "⚠ ERROR", true, '#ff0000');

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
                        if (!args[2]) return reply("Incorrect command format, use the following format:\n**bot username [username]**", "⚠ ERROR", true, '#ff0000');
                        const username = args[2];
                        try {
                            await client.user.setUsername(username);
                            reply('New username: ' + client.user.tag);
                        } catch (error) {
                            return reply(error.toString(), "⚠ ERROR", true, '#ff0000');
                        }
                    } else {
                        const userConfig = readJSON('userConfig.json')
                        if (command == 'description') {
                            if (!args[2]) return reply("Incorrect command format, use the following format:\n**bot description [description]**", "⚠ ERROR", true, '#ff0000');
                            const newDescription = args[2];
                            userConfig.description = newDescription;
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
                            if (!args[2] || !args[3]) return reply("Incorrect command format, use the following format:\n**bot status [type(2/5)] [status]**", "⚠ ERROR", true, '#ff0000');
                            const newStatus = args.slice(3).join(" ");
                            const newStatusType = args[2];
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
                        writeJSON(userConfig, 'userConfig.json');
                    }
                }
            }
        }
    },
};



