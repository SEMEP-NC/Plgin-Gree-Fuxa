const { readBits } = require("./driver_gree");

async function scanUnits() {
    const extBits = await readBits(88, 16);
    const intBits = await readBits(120, 128);

    const extUnits = extBits.map((b,i)=>b?`ExtUnit_${i+1}`:null).filter(Boolean);
    const intUnits = intBits.map((b,i)=>b?`IntUnit_${i+1}`:null).filter(Boolean);

    return { extUnits, intUnits };
}

module.exports = { scanUnits };

