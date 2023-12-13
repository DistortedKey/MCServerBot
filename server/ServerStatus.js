const util = require('minecraft-server-util');

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
