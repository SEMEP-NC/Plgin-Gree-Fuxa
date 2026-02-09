const express = require("express");
const router = express.Router();

const { connectGateway } = require("./driver_gree");
const { scanUnits } = require("./autodetect");

let gatewayIP = null;
let gatewayPort = 1502;

router.post("/set-ip", async (req, res) => {
    try {
        const { ip, port } = req.body;
        if (!ip) return res.status(400).json({ error: "IP required" });

        gatewayIP = ip;
        gatewayPort = port || 1502;

        await connectGateway(gatewayIP, gatewayPort);
        res.json({ status: "ok", ip: gatewayIP, port: gatewayPort });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/scan", async (req, res) => {
    try {
        if (!gatewayIP) return res.status(400).json({ error: "IP not set" });
        const result = await scanUnits(gatewayIP, gatewayPort);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/import", async (req, res) => {
    try {
        const { units } = req.body;
        if (!units || !units.length) return res.status(400).json({ error: "No units to import" });

        const { importToFuxa } = require("./fuxa_integration");
        await importToFuxa(units);

        res.json({ message: "Unit  s import  es avec succ  s !" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
