module.exports = (client) => {
    client.handleEvents = async (eventFiles, path) => {
        for (const file of eventFiles) {
            const event = require(`../events/${file}`);
            if (event.once) {
                client.once(event.name, (...args) => {
                    // console.log(`Received ${event.name} event:`, args);
                    event.execute(...args, client);
                })
            } else {
                client.on(event.name, (...args) => {
                    // console.log(`Received ${event.name} event:`, args);
                    event.execute(...args, client)
                });
            }
        }
    };
}