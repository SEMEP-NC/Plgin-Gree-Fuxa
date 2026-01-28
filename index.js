// index.js du plugin Gree
const { connectGateway, readBits } = require("./server/driver_gree");
const { scanUnits } = require("./server/autdetect");

module.exports = {
    name: "gree",
    description: "Plugin Gree pour auto-détection unités Modbus TCP",
    connectGateway,
    readBits,
    scanUnits
};

