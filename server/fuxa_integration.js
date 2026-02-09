const fs = require("fs");
const path = require("path");

async function importToFuxa(units) {
    const fuxaDataFile = path.join(__dirname, "_db", "gree_units.json");

    let existing = [];
    if (fs.existsSync(fuxaDataFile)) {
        existing = JSON.parse(fs.readFileSync(fuxaDataFile));
    }

    units.forEach(u => existing.push(u));
    fs.writeFileSync(fuxaDataFile, JSON.stringify(existing, null, 2));
}

module.exports = { importToFuxa };

