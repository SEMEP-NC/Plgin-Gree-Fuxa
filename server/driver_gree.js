const ModbusRTU = require("modbus-serial");
let client = null;

async function connectGateway(ip, port=5020) {
    client = new ModbusRTU();
    await client.connectTCP(ip, { port });
    client.setID(1);
    console.log(`Connected to Gree gateway at ${ip}:${port}`);
}

async function readBits(start, length) {
    if (!client) throw new Error("Gateway not connected");
    const data = await client.readCoils(start, length);
    return data.data;
}

module.exports = { connectGateway, readBits };
