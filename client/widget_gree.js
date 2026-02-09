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

const createTable = (units, type) => {
    if (!Array.isArray(units)) {
        throw new Error(`Liste d'unit  s invalide (${type})`);
    }

    const table = document.createElement("table");
    const header = table.insertRow();
    header.innerHTML = `<th>Type</th><th>ID</th><th>Nom    saisir</th>`;

    units.forEach((id) => {
        if (!id) return;

        const row = table.insertRow();
        row.innerHTML = `
            <td>${type}</td>
            <td>${id}</td>
            <td>
                <input type="text"
                       placeholder="Nom de l'unit  "
                       data-type="${type}"
                       data-id="${id}">
            </td>
        `;
    });

    return table;
};

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
   Export JSON
   ========================== */

async function importUnits() {
    try {
        clearError();

        const inputs = document.querySelectorAll("#unitsContainer input");
        let unitsToExport = [];

        if (!inputs.length) {
            throw new Error("Aucune unit      exporter");
        }

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

            unitsToExport.push({
                type: input.dataset.type,
                id: input.dataset.id,
                name
            });
       }

        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(unitsToExport, null, 2));

        const dlAnchor = document.createElement("a");
        dlAnchor.href = dataStr;
        dlAnchor.download = "gree_units.json";
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();

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

