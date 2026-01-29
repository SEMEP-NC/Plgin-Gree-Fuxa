const express = require("express");
const router = express.Router();
const { connectGateway } = require("./driver_gree");
const { scanUnits } = require("./autodetect");

let gatewayIP = null;

router.post("/setIP", (req, res) => {
    gatewayIP = req.body.ip;
    res.json({ status: "IP set", ip: gatewayIP });
});

router.get("/scan", async (req, res) => {
    try {
        if (!gatewayIP) return res.status(400).json({ error: "IP not set" });
        await connectGateway(gatewayIP);
        const units = await scanUnits();
        res.json(units);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
