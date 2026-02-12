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
    header.innerHTML = type === "Interieure" ?
        `<th>Type</th><th>Adresse</th><th>Puissance (kW)</th><th>Nom à saisir</th>` :
        `<th>Type</th><th>Adresse</th><th>Nom à saisir</th>`;

    units.forEach(unit => {
        const row = table.insertRow();
        const power = unit.power ?? "-";
        if (type === "Interieure") {
            row.innerHTML = `
                <td>${type}</td>
                <td>${unit.address}</td>
                <td>${power !== "-" ? (power/10).toFixed(1)+" kW" : "-"}</td>
                <td><input type="text" placeholder="Nom de l'unité" data-type="${type}" data-id="${unit.id}" data-address="${unit.address}"></td>`;
        } else {
            row.innerHTML = `
                <td>${type}</td>
                <td>${unit.address}</td>
                <td><input type="text" placeholder="Nom de l'unité" data-type="${type}" data-id="${unit.id}" data-address="${unit.address}"></td>`;
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
        if (!setIpResp.ok) throw new Error((await setIpResp.json()).error || "Erreur configuration IP");

        const scanResp = await fetch(`${API_BASE}/scan`);
        if (!scanResp.ok) throw new Error((await scanResp.json()).error || "Erreur scan Modbus");

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

        inputs.forEach(input => {
            const name = input.value.trim();
            if (!name) {
                input.style.border = "2px solid #b00020";
                throw new Error(`Nom manquant pour l'unité ${input.dataset.id} (${input.dataset.type})`);
            } else input.style.border = "";

            const unit = { id: input.dataset.id, name };
            if (input.dataset.type === "Interieure") intUnits.push(unit);
            else if (input.dataset.type === "Exterieure") extUnits.push(unit);
        });

        // Export JSON Gree
        const greeResp = await fetch("/plugins/gree/export", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intUnits, extUnits })
        });
        if (!greeResp.ok) throw new Error((await greeResp.json()).error || "Erreur lors de l'export Gree");

        const greeBlob = await greeResp.blob();
        const greeUrl = window.URL.createObjectURL(greeBlob);
        const a1 = document.createElement("a");
        a1.href = greeUrl;
        a1.download = "gree_fuxa.json";
        document.body.appendChild(a1);
        a1.click();
        a1.remove();
        window.URL.revokeObjectURL(greeUrl);

        // Export Vue FUXA
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
            { id: `c_${crypto.randomUUID()_
