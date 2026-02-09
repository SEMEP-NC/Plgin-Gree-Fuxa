container.innerHTML = "";

// Fonction pour cr  er un tableau   ditable
const createTable = (units, type) => {
    const table = document.createElement("table");
    const header = table.insertRow();
    header.innerHTML = `<th>Type</th><th>ID</th><th>Nom    saisir</th>`;
    units.forEach((id) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${type}</td>
            <td>${id}</td>
            <td><input type="text" placeholder="Nom de l'unit  " data-type="${type}" data-id="${id}"></td>
        `;
    });
    return table;
}

container.appendChild(createTable(detectedUnits.extUnits, "Exterieure"));
container.appendChild(createTable(detectedUnits.intUnits, "Interieure"));

// Activer le bouton Export JSON
document.getElementById("importBtn").disabled = false;
document.getElementById("importBtn").innerText = "Exporter JSON pour FUXA";

// Nouvelle fonction : export JSON t  l  chargeable
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

    // G  n  rer le fichier JSON et le d  clencher en t  l  chargement
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(unitsToExport, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "gree_units.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    alert("Fichier JSON g  n  r  , vous pouvez maintenant l'importer dans FUXA");
}
