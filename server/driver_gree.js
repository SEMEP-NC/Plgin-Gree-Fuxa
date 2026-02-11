const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

let connected = false;

/**
 * Connexion Modbus TCP    la passerelle Gree
 */
async function connectGateway(ip, port = 1502) {
    if (!connected) {
        await client.connectTCP(ip, { port });
        client.setID(1); // Slave ID Modbus (adapter si n  cessaire)
        connected = true;
        console.log(`Connect      la passerelle Gree ${ip}:${port}`);
    }
    return client;
}

/**
 * Lecture des coils (FC01)
 */
async function readBits(start, length, ip, port) {
    const client = await connectGateway(ip, port);
    const res = await client.readCoils(start, length);
    return res.data;
}

/**
 * Lecture des Holding Registers (FC03)
 */
async function readHoldingRegisters(start, length, ip, port) {
    const client = await connectGateway(ip, port);
    const res = await client.readHoldingRegisters(start, length);
    return res.data;
}

/**
 * D  connexion propre
 */
async function disconnect() {
    if (connected) {
        await client.close();
        connected = false;
        console.log("D  connect   de la passerelle");
    }
}

module.exports = {
    connectGateway,
    readBits,
    readHoldingRegisters,
    disconnect
};
