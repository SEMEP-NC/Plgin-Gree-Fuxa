const { readBits } = require("./driver_gree");
const greeConfig = require("../config/gree_config.json");

/**
 * Lit des blocs pour eviter l'erreur "Data length error"
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
            console.error(`Erreur lecture Modbus a ${offset}, taille ${size}: ${err.message}`);
        }
        offset += size;
        remaining -= size;
    }

    return result;
}

/**
 * Scanne toutes les unites detectables
 */
async function scanUnits(ip, port) {
    const extBits = await readInChunks(
        greeConfig.scanExtStart,
        greeConfig.scanExtLength,
        ip,
        port
    );
    const intBits = await readInChunks(
        greeConfig.scanIntStart,
        greeConfig.scanIntLength,
        ip,
        port
    );

    const extUnits = extBits.map((b, i) => (b ? `ExtUnit_${i + 1}` : null)).filter(Boolean);
    const intUnits = intBits.map((b, i) => (b ? `IntUnit_${i + 1}` : null)).filter(Boolean);

    return { extUnits, intUnits };
}

module.exports = { scanUnits };
