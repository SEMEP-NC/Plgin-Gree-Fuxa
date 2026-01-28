const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

async function connectGateway(ip, port = 502) {
    await client.connectTCP(ip, { port });
    client.setID(1); // ID passerelle
    console.log("Connecté à la passerelle Gree:", ip);
}

async function readBits(addressStart, length) {
    try {
        const res = await client.readCoils(addressStart, length);
        return res.data; // tableau de booléens
    } catch (err) {
        console.error("Erreur lecture bits :", err);
        return [];
    }
}

// Exposition API interne
module.exports = { connectGateway, readBits };
