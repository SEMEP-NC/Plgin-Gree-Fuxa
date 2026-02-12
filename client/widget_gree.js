
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
}

function clearError() {
    errorBox.innerText = "";
    errorBox.style.display = "none";
}

/* ==========================
   Cr  ation du tableau
   ========================== */

function createTable(units, type) {
    if (!Array.isArray(units) || units.length === 0) {
        return null;
    }

    const table = document.createElement("table");
    table.classList.add("unit-table");

    const header = table.insertRow();

    if (type === "Interieure") {
        header.innerHTML = `
            <th>Type</th>
            <th>Adresse</th>
            <th>Puissance (kW)</th>
            <th>Nom    saisir</th>
        `;
    } else {
        header.innerHTML = `
            <th>Type</th>
            <th>Adresse</th>
            <th>Nom    saisir</th>
        `;
    }

    units.forEach((unit) => {
        const row = table.insertRow();

        // adresse
        const address = unit.address;

        // puissance (pour int  rieures)
        const power = unit.power ?? "-";

        if (type === "Interieure") {
            row.innerHTML = `
                <td>${type}</td>
                <td>${address}</td>
                <td>${power !== null && power !== undefined ? (power / 10).toFixed(1) + " kW" : "-"}</td>
                <td>
                    <input type="text"
                           placeholder="Nom de l'unit  "
                           data-type="${type}"
                           data-id="${unit.id}"
                           data-address="${address}">
                </td>
            `;
        } else {
            row.innerHTML = `
                <td>${type}</td>
                <td>${address}</td>
                <td>
                    <input type="text"
                           placeholder="Nom de l'unit  "
                           data-type="${type}"
                           data-id="${unit.id}"
                           data-address="${address}">
                </td>
            `;
        }
    });

    return table;
}

/* ==========================
   Exemple : affichage unit  s
   ========================== */
/*  ^` appeler apr  s scan() */
function displayUnits(detectedUnits) {
    try {
        clearError();
        container.innerHTML = "";

        if (!detectedUnits) {
            throw new Error("Aucune donn  e re  ue");
        }

        container.appendChild(
            createTable(detectedUnits.extUnits, "Exterieure")
        );
        container.appendChild(
            createTable(detectedUnits.intUnits, "Interieure")
        );

        importBtn.disabled = false;
        importBtn.innerText = "Exporter JSON pour FUXA";

    } catch (err) {
        showError("Erreur d'affichage : " + err.message);
        console.error(err);
    }
}

/* ==========================
   Export vers FUXA (serveur)
   ========================== */

async function importUnits() {
    try {
        clearError();

        const inputs = document.querySelectorAll("#unitsContainer input");
        if (!inputs.length) {
            throw new Error("Aucune unit      exporter");
        }

        const intUnits = [];
        const extUnits = [];

        for (let input of inputs) {
            const name = input.value.trim();

            if (!name) {
                input.style.border = "2px solid #b00020";
                throw new Error(
                    `Nom manquant pour l'unit   ${input.dataset.id} (${input.dataset.type})`
                );
            } else {
                input.style.border = "";
            }

            const unit = {
               id: input.dataset.id,
                name
            };

            if (input.dataset.type === "Interieure") {
                intUnits.push(unit);
            } else if (input.dataset.type === "Exterieure") {
                extUnits.push(unit);
            }
        }
 // Appel API serveur
        const response = await fetch("/plugins/gree/export", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                intUnits, extUnits
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Erreur lors de l'export");
        }
        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "gree_fuxa.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (err) {
        showError(err.message);
        console.error(err);
    }
}
/* ==========================
   Scan des unit  s via API
  ========================== */

async function scan() {
    try {
        clearError();
        importBtn.disabled = true;
        container.innerHTML = "";

        const ip = ipInput.value.trim();

        if (!ip) {
            throw new Error("Veuillez saisir l'adresse IP de la passerelle Gree");
        }

        /* 1. Envoi IP au backend */
        const setIpResp = await fetch(`${API_BASE}/set-ip`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip })
        });

        if (!setIpResp.ok) {
            const err = await setIpResp.json();
            throw new Error(err.error || "Erreur configuration IP");
        }

        /* 2. Lancement du scan */
        const scanResp = await fetch(`${API_BASE}/scan`);

        if (!scanResp.ok) {
            const err = await scanResp.json();
            throw new Error(err.error || "Erreur scan Modbus");
        }

        const detectedUnits = await scanResp.json();

        /* 3. Affichage */
        displayUnits(detectedUnits);

    } catch (err) {
        showError(err.message);
        console.error("Scan error:", err);
    }
}
