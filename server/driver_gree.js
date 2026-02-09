const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

let connected = false;

/**
 * Connecte    la passerelle Gree via Modbus TCP
 * @param {string} ip
 * @param {number} port
 */
async function connectGateway(ip, port = 1502) {
    if (!connected) {
        await client.connectTCP(ip, { port });
        connected = true;
        console.log(` ^|^e Connect      la passerelle Gree ${ip}:${port}`);
    }
    return client;
}

/**
 * Lit des bits depuis la passerelle
 * @param {number} start
 * @param {number} length
 * @param {string} ip
 * @param {number} port
 * @returns {Promise<Array<number>>}
 */
async function readBits(start, length, ip, port) {
    const client = await connectGateway(ip, port);
    return await client.readCoils(start, length).then(res => res.data);
}

module.exports = { connectGateway, readBits };

