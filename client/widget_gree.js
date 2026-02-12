const container = document.getElementById("unitsContainer");
const importBtn = document.getElementById("importBtn");
const ipInput = document.getElementById("ip");
const errorBox = document.getElementById("errorBox");

const API_BASE = "/plugins/gree";

/* ==========================
   Gestion des erreurs UI
========================== */
function showError(message) {
    errorBox.innerText = message;
    errorBox.style.display = "block";
    setTimeout(() => clearError(), 5000);
}

function clearError() {
    errorBox.innerText = "";
    errorBox.style.display = "none";
}

/* ==========================
   Création du tableau UI
========================== */
function createTable(units, type) {
    if (!Array.isArray(units) || units.length === 0) return null;

    const table = document.createElement("table");
    table.classList.add("unit-table");

    const header = table.insertRow();
    if (type === "Interieure") {
        header.innerHTML = `<th>Type</th><th>Adresse</th><th>Puissance (kW)</th><th>Nom à saisir</th>`;
    } else {
        header.innerHTML = `<th>Type</th><th>Adresse</th><th>Nom à saisir</th>`;
    }

    units.forEach((unit) => {
        const row = table.insertRow();
        const address = unit.address;
        const power = unit.power ?? "-";

        if (type === "Interieure") {
            row.innerHTML = `
                <td>${type}</td>
                <td>${address}</td>
                <td>${power !== "-" ? (power / 10).toFixed(1) + " kW" : "-"}</td>
                <td>
                    <input type="text"
                           placeholder="Nom de l'unité"
                           data-type="${type}"
                           data-id="${unit.id}"
                           data-address="${address}">
                </td>`;
        } else {
            row.innerHTML = `
                <td>${type}</td>
                <td>${address}</td>
                <td>
                    <input type="text"
                           placeholder="Nom de l'unité"
                           data-type="${type}"
                           data-id="${unit.id}"
                           data-address="${address}">
                </td>`;
        }
    });

    return table;
}

/* ==========================
   Affichage des unités
========================== */
function displayUnits(detectedUnits) {
    try {
        clearError();
        container.innerHTML = "";

        if (!detectedUnits) throw new Error("Aucune donnée reçue");

        container.appendChild(createTable(detectedUnits.extUnits, "Exterieure"));
        container.appendChild(createTable(detectedUnits.intUnits, "Interieure"));

        importBtn.disabled = false;
        importBtn.innerText = "Exporter JSON & Vue FUXA";

    } catch (err) {
        showError("Erreur d'affichage : " + err.message);
        console.error(err);
    }
}

/* ==========================
   Scan Modbus
========================== */
async function scan() {
    try {
        clearError();
        importBtn.disabled = true;
        container.innerHTML = "";

        const ip = ipInput.value.trim();
        if (!ip) throw new Error("Veuillez saisir l'adresse IP de la passerelle Gree");

        const setIpResp = await fetch(`${API_BASE}/set-ip`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip })
        });

        if (!setIpResp.ok) {
            const err = await setIpResp.json();
            throw new Error(err.error || "Erreur configuration IP");
        }

        const scanResp = await fetch(`${API_BASE}/scan`);
        if (!scanResp.ok) {
            const err = await scanResp.json();
            throw new Error(err.error || "Erreur scan Modbus");
        }

        const detectedUnits = await scanResp.json();
        displayUnits(detectedUnits);

    } catch (err) {
        showError(err.message);
        console.error("Scan error:", err);
    }
}

/* ==========================
   Export JSON Gree + Vue FUXA
========================== */
async function importAndExport() {
    try {
        clearError();

        const inputs = document.querySelectorAll("#unitsContainer input");
        if (!inputs.length) throw new Error("Aucune unité à exporter");

        const intUnits = [];
        const extUnits = [];

        for (let input of inputs) {
            const name = input.value.trim();
            if (!name) {
                input.style.border = "2px solid #b00020";
                throw new Error(`Nom manquant pour l'unité ${input.dataset.id} (${input.dataset.type})`);
            } else {
                input.style.border = "";
            }

            const unit = { id: input.dataset.id, name };
            if (input.dataset.type === "Interieure") intUnits.push(unit);
            else if (input.dataset.type === "Exterieure") extUnits.push(unit);
        }

        // ---- Export JSON Gree ----
        const greeResp = await fetch("/plugins/gree/export", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intUnits, extUnits })
        });

        if (!greeResp.ok) {
            const err = await greeResp.json();
            throw new Error(err.error || "Erreur lors de l'export Gree");
        }

        const greeBlob = await greeResp.blob();
        const greeUrl = window.URL.createObjectURL(greeBlob);
        const a1 = document.createElement("a");
        a1.href = greeUrl;
        a1.download = "gree_fuxa.json";
        document.body.appendChild(a1);
        a1.click();
        a1.remove();
        window.URL.revokeObjectURL(greeUrl);

        // ---- Export Vue FUXA ----
        exportFuxaView(intUnits, extUnits);

    } catch (err) {
        showError(err.message);
        console.error(err);
    }
}

/* ==========================
   Création automatique Vue FUXA
========================== */
function exportFuxaView(intUnits, extUnits) {
    const viewId = `v_${crypto.randomUUID()}`;
    const tableId = `OXC_${crypto.randomUUID()}`;

    const allUnits = [...intUnits, ...extUnits];
    const rows = allUnits.map(unit => ({
        cells: [
            { id: `c_${crypto.randomUUID()}`, type: "variable", variableId: `t_${crypto.randomUUID()}`, label: unit.name },
            { id: `c_${crypto.randomUUID()}`, type: "variable", variableId: `t_${crypto.randomUUID()}`, label: "Off" },
            { id: `c_${crypto.randomUUID()}`, type: "variable", variableId: `t_${crypto.randomUUID()}`, label: "N/A" },
            { id: `c_${crypto.randomUUID()}`, type: "variable", variableId: `t_${crypto.randomUUID()}`, label: "N/A" },
            { id: `c_${crypto.randomUUID()}`, type: "variable", variableId: `t_${crypto.randomUUID()}`, label: "N/A" },
            { id: `c_${crypto.randomUUID()}`, type: "variable", variableId: `t_${crypto.randomUUID()}`, label: "OK" }
        ]
    }));

    const viewJson = {
        id: viewId,
        name: "Tableau Equipements",
        profile: { width: 1920, height: 1080, bkcolor: "#ffffffff", margin: 10, align: "middleCenter", gridType: "fixed", viewRenderDelay: 0 },
        items: {
            [tableId]: {
                id: tableId,
                type: "svg-ext-own_ctrl-table",
                name: "Equipements",
                property: {
                    id: null,
                    type: "data",
                    options: {
                        paginator: { show: false },
                        filter: { show: false },
                        daterange: { show: false },
                        realtime: false,
                        lastRange: "last1h",
                        gridColor: "#E0E0E0",
                        header: { show: true, height: 30, fontSize: 12, background: "#F0F0F0", color: "#757575" },
                        row: { height: 30, fontSize: 10, background: "#F9F9F9", color: "#000000" },
                        selection: { background: "#3059AF", color: "#FFFFFF", fontBold: true },
                        columns: [
                            { id: `c_${crypto.randomUUID()}`, label: "Equipements", type: "label", align: "center", width: 100 },
                            { id: `c_${crypto.randomUUID()}`, label: "Etat", type: "label", align: "center", width: 80 },
                            { id: `c_${crypto.randomUUID()}`, label: "Consigne", type: "label", align: "center", width: 100 },
                            { id: `c_${crypto.randomUUID()}`, label: "Temp. Ambiante", type: "label", align: "center", width: 100 },
                            { id: `c_${crypto.randomUUID()}`, label: "Ventilation", type: "label", align: "center", width: 100 },
                            { id: `c_${crypto.randomUUID()}`, label: "Défaut", type: "label", align: "center", width: 20 }
                        ],
                        rows: rows
                    }
                },
                events: []
            }
        },
        variables: {},
        svgcontent: ""
    };

    const blob = new Blob([JSON.stringify(viewJson, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fuxa_view.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    console.log("Vue FUXA exportée avec succès !");
}

/* ==========================
   Événements boutons
========================== */
document.getElementById("scanBtn").addEventListener("click", scan);
importBtn.addEventListener("click", importAndExport);
