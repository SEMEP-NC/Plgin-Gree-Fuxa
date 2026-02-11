const crypto = require("crypto");

function makeId(prefix) {
    return prefix + "_" + crypto.randomBytes(4).toString("hex");
}
function extractUnitNumber(unitId) {
    // IntUnit_4  ^f^r 4
    // ExtUnit_2  ^f^r 2
    const match = unitId.match(/_(\d+)$/);
    return match ? parseInt(match[1], 10) : 1;
}

/**
 * G  n  re le JSON FUXA ModbusTCP avec tags configurables
 */
function buildFuxaJson(intUnits, extUnits, ip, port) {
    const deviceId = makeId("gree");

    const device = {
        id: deviceId,
        name: "Gree Gateway",
        enabled: true,
        type: "ModbusTCP",
        polling: 200,
        property: {
            address: `${ip}:${port}`,
            port: null,
            slot: null,
            rack: null,
            slaveid: "1",
            baudrate: 9600,
            databits: 8,
            stopbits: 8,
            parity: "None",
            connectionOption: "TcpPort",
            delay: 10,
            forceFC16: false,
            socketReuse: "Reuse"
        },
        tags: {}
    };

    // =========================
    // Mod  les de tags int  rieurs
    // =========================
    const INT_TAGS_TEMPLATE = [
        { suffix: "On/Off", type: "UInt16", memaddress: "400000", offset: 102 },
        { suffix: "Mode",  type: "UInt16", memaddress: "400000", offset: 103 },
        { suffix: "Consigne",  type: "UInt16", memaddress: "400000", offset: 104 },
        { suffix: "Fan",   type: "UInt16", memaddress: "400000", offset: 105 },
        { suffix: "Limite basse froid",   type: "UInt16", memaddress: "400000", offset: 106 },
        { suffix: "Limite haute chaud",   type: "UInt16", memaddress: "400000", offset: 107 },
        { suffix: "Limite basse deshu", type: "UInt16", memaddress: "400000", offset: 108 },
        { suffix: "Temp reprise", type: "UInt16", memaddress: "400000", offset: 116 },
        { suffix: "Contact de porte", type: "UInt16", memaddress: "400000", offset: 117 },
        { suffix: "Unite exterieure raccorde", type: "UInt16", memaddress: "400000", offset: 118 },
        { suffix: "Puissance nominale", type: "UInt16", memaddress: "400000", offset: 123 },
        { suffix: "Shield energy saving", type: "Bool", memaddress: "000000", offset: 288 },
        { suffix: "Shield temperature", type: "Bool", memaddress: "000000", offset: 289 },
        { suffix: "Shield mode", type: "Bool", memaddress: "000000", offset: 290 },
        { suffix: "Shield on/off", type: "Bool", memaddress: "000000", offset: 291 },
        { suffix: "Lock", type: "Bool", memaddress: "000000", offset: 292 },
        { suffix: "Swing U&D", type: "Bool", memaddress: "000000", offset: 294 },
        { suffix: "Swing L&R", type: "Bool", memaddress: "000000", offset: 295 },
        { suffix: "Energy saving", type: "Bool", memaddress: "000000", offset: 296 },
        { suffix: "Unite master", type: "Bool", memaddress: "000000", offset: 315 },
        { suffix: "Defaut", type: "Bool", memaddress: "000000", offset: 319 }

   ];

        intUnits.forEach(unit => {
                const unitNumber = extractUnitNumber(unit.id);

        INT_TAGS_TEMPLATE.forEach(template => {
            const tagId = makeId("t");

            const unitOffset =
                template.type === "Bool"
                   ? 64 * (unitNumber - 1)
                   : 25 * (unitNumber - 1);

            device.tags[tagId] = {
                id: tagId,
                name: `${unit.name} - ${template.suffix}`,
                type: template.type,
                value: null,
                memaddress: template.memaddress,
                address: template.offset + unitOffset,
                divisor: null,
                daq: {
                    enabled: true,
                    interval: 60,
                    changed: true,
                    restored: false
                },
                description: `${unit.name} - ${template.suffix}`,
                timestamp: Date.now(),
                format: null,
                scale: null,
                scaleReadFunction: null,
                scaleWriteFunction: null
            };
        });
    });

    // =========================
    // Mod  les de tags ext  rieurs
    // =========================
    const EXT_TAGS_TEMPLATE = [
        { suffix: "Puissance maxi unite", type: "UInt16", memaddress: "400000", offset: 3302 },
        { suffix: "Mode",  type: "UInt16", memaddress: "400000", offset: 3306 },
        { suffix: "Temp exterieure",  type: "UInt16", memaddress: "400000", offset: 3307 },
        { suffix: "Mode emergency", type: "UInt16", memaddress: "400000", offset: 3308 },
        { suffix: "Defaut com unite int", type: "Bool", memaddress: "000000", offset: 8488 },
        { suffix: "Protection defaut gaz", type: "Bool", memaddress: "000000", offset: 8489 },
        { suffix: "Defaut com interne", type: "Bool", memaddress: "000000", offset: 8490 },
        { suffix: "Defaut rotation phase", type: "Bool", memaddress: "000000", offset: 8491 },
        { suffix: "Debugging", type: "Bool", memaddress: "000000", offset: 8492 },
        { suffix: "Marche compresseur", type: "Bool", memaddress: "000000", offset: 8494 },
        { suffix: "Defaut general", type: "Bool", memaddress: "000000", offset: 8495 }

    ];

        extUnits.forEach(unit => {
            const unitNumber = extractUnitNumber(unit.id);

        EXT_TAGS_TEMPLATE.forEach(template => {
            const tagId = makeId("t");

            const unitOffset =
                template.type === "Bool"
                   ? 48 * (unitNumber - 1)
                   : 10 * (unitNumber - 1);

            device.tags[tagId] = {
                id: tagId,
                name: `${unit.name} - ${template.suffix}`,
                type: template.type,
                value: null,
                memaddress: template.memaddress,
                address: template.offset + unitOffset,
                divisor: null,
                daq: {
                    enabled: true,
                    interval: 60,
                    changed: true,
                    restored: false
                },
                description: `${unit.name} ${template.key}`,
                timestamp: Date.now(),
                format: null,
                scale: null,
                scaleReadFunction: null,
                scaleWriteFunction: null
            };
        });
    });

    //  ^z   ^o Important : retourner un tableau pour FUXA
    return [device];
}

module.exports = { buildFuxaJson };
