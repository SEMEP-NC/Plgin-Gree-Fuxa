<<<<<<< HEAD
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

=======
const apiGree = require('./server/api_gree');
module.exports = {
    name: "gree",
    description: "Plugin Gree Web",
    api: apiGree
};
>>>>>>> e494626 (Update plugin)
