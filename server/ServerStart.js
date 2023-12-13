const path = require('node:path');
const { exec } = require('child_process');

module.exports = {
    data: "serverStart",
    async execute(statusMessage) {
        const command = `java -Xmx1024M -Xms1024M -jar ${path.join(__dirname, "server.jar")}`;

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