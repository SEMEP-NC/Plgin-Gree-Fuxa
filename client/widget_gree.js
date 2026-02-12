const container = document.getElementById("unitsContainer");
const errorBox = document.getElementById("errorBox");
const API_BASE = "/plugins/gree";

/* ===== Gestion erreurs ===== */
function showError(message) {
    errorBox.innerText = message;
    errorBox.style.display = "block";
    setTimeout(() => clearError(), 5000);
}
function clearError() {
    errorBox.innerText = "";
    errorBox.style.display = "none";
}

/* ===== Création tableau ===== */
function createTable(units, type) {
    if (!Array.isArray(units) || units.length === 0) return null;
    const table = document.createElement("table");
    const header = table.insertRow();
    header.innerHTML = type === "Interieure" ?
        `<th>Type</th><th>Adresse</th><th>Puissance (kW)</th><th>Nom à saisir</th>` :
        `<th>Type</th><th>Adresse</th><th>Nom à saisir</th>`;
    units.forEach(u => {
        const row = table.insertRow();
        const power = u.power ?? "-";
        if (type === "Interieure") {
            row.innerHTML = `<td>${type}</td><td>${u.address}</td><td>${power!="-"? (power/10).toFixed(1)+" kW":"-"}</td><td><input type="text" data-type="${type}" data-id="${u.id}" data-address="${u.address}" placeholder="Nom de l'unité"></td>`;
        } else {
            row.innerHTML = `<td>${type}</td><td>${u.address}</td><td><input type="text" data-type="${type}" data-id="${u.id}" data-address="${u.address}" placeholder="Nom de l'unité"></td>`;
        }
    });
    return table;
}

/* ===== Affichage unités ===== */
function displayUnits(detectedUnits) {
    clearError();
    container.innerHTML = "";
    if (!detectedUnits) { showError("Aucune donnée reçue"); return; }

    container.appendChild(createTable(detectedUnits.extUnits, "Exterieure"));
    container.appendChild(createTable(detectedUnits.intUnits, "Interieure"));

    document.getElementById("exportGreeBtn").disabled = false;
    document.getElementById("exportFuxaBtn").disabled = false;
}

/* ===== Scan Modbus ===== */
async function scan() {
    try {
        clearError();
        container.innerHTML = "";
        const ip = document.getElementById("ip").value.trim();
        if (!ip) throw new Error("Veuillez saisir l'adresse IP de la passerelle Gree");

        const setIpResp = await fetch(`${API_BASE}/set-ip`, {
            method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ip})
        });
        if (!setIpResp.ok) throw new Error((await setIpResp.json()).error || "Erreur configuration IP");

        const scanResp = await fetch(`${API_BASE}/scan`);
        if (!scanResp.ok) throw new Error((await scanResp.json()).error || "Erreur scan Modbus");

        displayUnits(await scanResp.json());
    } catch(err){ showError(err.message); console.error(err); }
}

/* ===== Récupération unités depuis tableau ===== */
function getUnitsFromTable() {
    const inputs = document.querySelectorAll("#unitsContainer input");
    if (!inputs.length) throw new Error("Aucune unité à exporter");

    const intUnits = [], extUnits = [];
    inputs.forEach(i => {
        const name = i.value.trim();
        if (!name) throw new Error(`Nom manquant pour l'unité ${i.dataset.id} (${i.dataset.type})`);
        const unit = { id:i.dataset.id, name };
        if (i.dataset.type==="Interieure") intUnits.push(unit);
        else extUnits.push(unit);
    });
    return { intUnits, extUnits };
}

/* ===== Export JSON Gree ===== */
async function exportGreeJSON(intUnits, extUnits) {
    const resp = await fetch("/plugins/gree/export", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({intUnits, extUnits})
    });
    if (!resp.ok) throw new Error((await resp.json()).error || "Erreur export Gree");

    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download="gree_fuxa.json";
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
}

/* ===== Export Vue FUXA ===== */
function exportFuxaJSON(intUnits, extUnits) {
    const viewId = `v_${crypto.randomUUID()}`;
    const tableId = `OXC_${crypto.randomUUID()}`;
    const allUnits = [...intUnits, ...extUnits];
    const rows = allUnits.map(u => ({
        cells:[
            {id:`c_${crypto.randomUUID()}`, type:"variable", variableId:`t_${crypto.randomUUID()}`, label:u.name},
            {id:`c_${crypto.randomUUID()}`, type:"variable", variableId:`t_${crypto.randomUUID()}`, label:"Off"},
            {id:`c_${crypto.randomUUID()}`, type:"variable", variableId:`t_${crypto.randomUUID()}`, label:"N/A"},
            {id:`c_${crypto.randomUUID()}`, type:"variable", variableId:`t_${crypto.randomUUID()}`, label:"N/A"},
            {id:`c_${crypto.randomUUID()}`, type:"variable", variableId:`t_${crypto.randomUUID()}`, label:"N/A"},
            {id:`c_${crypto.randomUUID()}`, type:"variable", variableId:`t_${crypto.randomUUID()}`, label:"OK"}
        ]
    }));

    const viewJson = {
        id:viewId,
        name:"Tableau Equipements",
        profile:{width:1920,height:1080,bkcolor:"#ffffffff",margin:10,align:"middleCenter",gridType:"fixed",viewRenderDelay:0},
        items:{
            [tableId]:{
                id:tableId,
                type:"svg-ext-own_ctrl-table",
                name:"Equipements",
                property:{
                    id:null,
                    type:"data",
                    options:{
                        paginator:{show:false},
                        filter:{show:false},
                        daterange:{show:false},
                        realtime:false,
                        lastRange:"last1h",
                        gridColor:"#E0E0E0",
                        header:{show:true,height:30,fontSize:12,background:"#F0F0F0",color:"#757575"},
                        row:{height:30,fontSize:10,background:"#F9F9F9",color:"#000000"},
                        selection:{background:"#3059AF",color:"#FFFFFF",fontBold:true},
                        columns:[
                            {id:`c_${crypto.randomUUID()}`, label:"Equipements", type:"label", align:"center", width:100},
                            {id:`c_${crypto.randomUUID()}`, label:"Etat", type:"label", align:"center", width:80},
                            {id:`c_${crypto.randomUUID()}`, label:"Consigne", type:"label", align:"center", width:100},
                            {id:`c_${crypto.randomUUID()}`, label:"Temp. Ambiante", type:"label", align:"center", width:100},
                            {id:`c_${crypto.randomUUID()}`, label:"Ventilation", type:"label", align:"center", width:100},
                            {id:`c_${crypto.randomUUID()}`, label:"Défaut", type:"label", align:"center", width:20}
                        ],
                        rows: rows
                    }
                },
                events:[]
            }
        },
        variables:{},
        svgcontent:""
    };

    const blob = new Blob([JSON.stringify(viewJson, null, 2)], {type:"application/json"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="fuxa_view.json"; document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
}
