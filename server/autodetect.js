const { readBits } = require("./driver_gree");

/**
 * Lit des blocs pour   viter l'erreur "Data length error"
 */
async function readInChunks(start, length, ip, port, chunkSize = 32) {
    let result = [];
    let remaining = length;
    let offset = start;

    while (remaining > 0) {
        const size = Math.min(remaining, chunkSize);
        try {
            const data = await readBits(offset, size, ip, port);
            result = result.concat(data);
        } catch (err) {
            console.error(`Erreur lecture Modbus    ${offset}, taille ${size}: ${err.message}`);
        }
        offset += size;
        remaining -= size;
    }

    return result;
}

/**
 * Scanne toutes les unit  s d  tectables
 */
async function scanUnits(ip, port) {
    const extBits = await readInChunks(88, 16, ip, port);       // unit  s ext  rieures
    const intBits = await readInChunks(120, 128, ip, port);     // unit  s int  rieures

    const extUnits = extBits.map((b,i)=>b?`ExtUnit_${i+1}`:null).filter(Boolean);
    const intUnits = intBits.map((b,i)=>b?`IntUnit_${i+1}`:null).filter(Boolean);

    return { extUnits, intUnits };
}

module.exports = { scanUnits };

