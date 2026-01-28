const { readBits } = require("./driver_gree");

async function scanUnits() {
    // Unités extérieures
    const extBits = await readBits(88, 16); // bits 88 à 103
    const extUnits = extBits.map((present, i) => present ? `ExtUnit_${i+1}` : null).filter(Boolean);

    // Unités intérieures
    const intBits = await readBits(120, 128); // bits 120 à 247
    const intUnits = intBits.map((present, i) => present ? `IntUnit_${i+1}` : null).filter(Boolean);

    console.log("Unités extérieures détectées :", extUnits);
    console.log("Unités intérieures détectées :", intUnits);

    return { extUnits, intUnits };
}

module.exports = { scanUnits };
