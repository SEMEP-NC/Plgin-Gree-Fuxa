const { readBits, readHoldingRegisters } = require("./driver_gree");

/**
 * Lecture en blocs pour   viter "Data length error"
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
            console.error(`Erreur lecture Modbus @${offset}, taille ${size}: ${err.message}`);
        }
        offset += size;
        remaining -= size;
    }

    return result;
}

/**
 * Lecture puissance unit   int  rieure
 * Registre = 123 + 25*(n-1)
 */
async function readUnitPower(unitNumber, ip, port) {
    const register = 123 + 25 * (unitNumber - 1);

    try {
        const res = await readHoldingRegisters(register, 1, ip, port);
        return Array.isArray(res) ? res[0] : res.data?.[0] ?? null;
    } catch (err) {
        console.error(`Erreur lecture puissance unit   ${unitNumber}: ${err.message}`);
        return null;
    }
}

/**
 * Scan complet
 */
async function scanUnits(ip, port) {

    // Bits de pr  sence
    const extBits = await readInChunks(88, 16, ip, port);
    const intBits = await readInChunks(120, 128, ip, port);

    const extUnits = [];
    const intUnits = [];

    // --- Unit  s ext  rieures ---
    extBits.forEach((bit, i) => {
        if (bit) {
            const unitNumber = i + 1;
            extUnits.push({
                id: `ExtUnit_${unitNumber}`,
                type: "Exterieure",
                name: `UE ${unitNumber}`,
                address: unitNumber
            });
        }
    });

    // --- Unit  s int  rieures ---
    for (let i = 0; i < intBits.length; i++) {
        if (intBits[i]) {
            const unitNumber = i + 1;

            const power = await readUnitPower(unitNumber, ip, port);

            intUnits.push({
                id: `IntUnit_${unitNumber}`,
                type: "Interieure",
                name: `UI ${unitNumber}`,
                address: unitNumber,  // <-- Important pour l'affichage
                power: power           // valeur brute
            });
        }
    }

    return { extUnits, intUnits };
}

module.exports = { scanUnits };
