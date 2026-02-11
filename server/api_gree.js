const express = require("express");
const router = express.Router();

const { connectGateway } = require("./driver_gree");
const { scanUnits } = require("./autodetect");
const { importToFuxa } = require("./fuxa_integration");
const { buildFuxaJson } = require("./fuxa_integration");

let gatewayIP = null;
let gatewayPort = 1502;

/**
 * D  finition IP passerelle
 */
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

/**
 * Scan Modbus
 */
router.get("/scan", async (req, res) => {
    try {
        if (!gatewayIP) {
            return res.status(400).json({ error: "Gateway IP not set" });
        }

        const result = await scanUnits(gatewayIP, gatewayPort);
        res.json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * G  n  ration JSON FUXA
 */
router.post("/import", async (req, res) => {
    try {
        const { units } = req.body;
        if (!units || !units.length) {
            return res.status(400).json({ error: "No units provided" });
        }

        await importToFuxa(units, gatewayIP, gatewayPort);
        res.json({ status: "ok", message: "Fichier FUXA g  n  r  " });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/export", (req, res) => {
    try {
        if (!gatewayIP) {
            return res.status(400).json({ error: "Gateway IP not set" });
        }

        const { intUnits = [], extUnits = [] } = req.body;

        // V  rifie qu'il y a au moins une unit
        if (intUnits.length === 0 && extUnits.length === 0) {
            return res.status(400).json({ error: "No units provided" });
        }

        const json = buildFuxaJson(intUnits, extUnits, gatewayIP, gatewayPort);

        res.setHeader("Content-Type", "application/json");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=gree_fuxa.json"
        );

        res.send(JSON.stringify(json, null, 2));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
