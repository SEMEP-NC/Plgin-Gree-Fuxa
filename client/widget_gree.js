const API_BASE = "/plugins/gree";

const container = document.getElementById("unitsContainer");
const importBtn = document.getElementById("importBtn");
const ipInput = document.getElementById("ip");

const resetUnits = () => {
    container.innerHTML = "";
    importBtn.disabled = true;
    importBtn.innerText = "Exporter JSON pour FUXA";
};

resetUnits();

const createTable = (units, type) => {
    const table = document.createElement("table");
    const header = table.insertRow();
    header.innerHTML = `<th>Type</th><th>ID</th><th>Nom a saisir</th>`;
    units.forEach((id) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${type}</td>
            <td>${id}</td>
            <td><input type="text" placeholder="Nom de l'unite" data-type="${type}" data-id="${id}"></td>
        `;
    });
    return table;
};

const renderUnits = (detectedUnits) => {
    container.innerHTML = "";
    container.appendChild(createTable(detectedUnits.extUnits, "Exterieure"));
    container.appendChild(createTable(detectedUnits.intUnits, "Interieure"));

    importBtn.disabled = false;
    importBtn.innerText = "Exporter JSON pour FUXA";
};

async function scan() {
    const ip = ipInput.value.trim();
    if (!ip) {
        alert("Merci de renseigner l'adresse IP de la passerelle");
        return;
    }
 resetUnits();
 try {
        const setIpResponse = await fetch(`${API_BASE}/set-ip`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip })
        });

        if (!setIpResponse.ok) {
            const error = await setIpResponse.json();
            throw new Error(error.error || "Impossible de configurer la passerelle");
        }

        const scanResponse = await fetch(`${API_BASE}/scan`);
        if (!scanResponse.ok) {
            const error = await scanResponse.json();
            throw new Error(error.error || "Scan impossible");
        }

        const detectedUnits = await scanResponse.json();
        if (!detectedUnits.extUnits.length && !detectedUnits.intUnits.length) {
            alert("Aucune unite detectee.");
            return;
        }

        renderUnits(detectedUnits);
    } catch (error) {
        alert(`Erreur pendant le scan: ${error.message}`);
    }
}




async function importUnits() {
    const inputs = document.querySelectorAll("#unitsContainer input");
    let unitsToExport = [];

    for (let input of inputs) {
        const name = input.value.trim();
        if (!name) return alert("Merci de remplir tous les noms avant l'export");
        unitsToExport.push({
            type: input.dataset.type,
            id: input.dataset.id,
            name
        });
    }


    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(unitsToExport, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "gree_units.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    alert("Fichier JSON genere, vous pouvez maintenant l'importer dans FUXA");
}
