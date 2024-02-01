// returns wether or not the minecraft server is up.

const util = require('minecraft-server-util');

// function to get server response
async function checkServerStatus(serverIp, serverPort) {
    try {
        const response = await util.status(serverIp, serverPort);
        return response !== null;
    } catch (error) {
        return false;
    }
}

async function serverStatus(IP = 'localhost', port = 25565) {
    try {
        const status = await checkServerStatus(IP, port);
        if (status) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error(error);
        throw error; // Re-throw the error to be caught in the calling code
    }
}

module.exports = serverStatus;
