// starts the minecraft server

const path = require('node:path');
const { exec } = require('child_process');

module.exports = {
    data: "serverStart",
    async execute(sizeInGigabytes) {

        // convert GB to MB for command
        const heapSize = sizeInGigabytes * 1024;

        // create command to start server, with heap size from config
        const command = `java -Xmx${heapSize}M -Xms${heapSize}M -jar ${path.join(__dirname, "server.jar")}`;

        const options = { cwd: `${__dirname}`};
        //start server
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                return false;
            }
        })
        return true;

    }
}