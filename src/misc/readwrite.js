const fs = require('node:fs');

// takes a .json file and reads it into an object
function readJSON(fileName) {
    try {
        const data = fs.readFileSync("./data/" + fileName, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading config:', error);
        return null;
    }
}

function writeJSON(data, fileName = "db.json") {
    // Write the updated JSON back to the file
    try {
        fs.writeFileSync("./data/" + fileName, JSON.stringify(data));
    } catch {
        console.log("ERROR SAVING")
    }
    
    return;
}

module.exports = { readJSON, writeJSON }