diff --git a/client/widget_gree.js b/client/widget_gree.js
index d5f5dc085e8ac879531bc5a1c7f7654561ced9e1..4e12816bd2468ede8bf2aa9c4841f54d3ddb165a 100644
--- a/client/widget_gree.js
+++ b/client/widget_gree.js
@@ -1,89 +1,117 @@
 const container = document.getElementById("unitsContainer");
 const errorBox = document.getElementById("errorBox");
 const API_BASE = "/plugins/gree";
+let latestDetectedUnits = null;
 
 function showError(msg){ errorBox.innerText=msg; errorBox.style.display="block"; setTimeout(clearError,5000);}
 function clearError(){ errorBox.innerText=""; errorBox.style.display="none";}
 
 // Crée un tableau des unités
 function createTable(units,type){
     if(!Array.isArray(units)||units.length===0) return null;
     const table=document.createElement("table");
     const header=table.insertRow();
-    header.innerHTML = type==="Interieure"? 
+    header.innerHTML = type==="Interieure"?
         `<th>Type</th><th>Adresse</th><th>Puissance (kW)</th><th>Nom à saisir</th>` :
         `<th>Type</th><th>Adresse</th><th>Nom à saisir</th>`;
     units.forEach(u=>{
         const row=table.insertRow();
         const power = u.power ?? "-";
         if(type==="Interieure"){
             row.innerHTML=`<td>${type}</td><td>${u.address}</td><td>${power!="-"? (power/10).toFixed(1)+" kW":"-"}</td>
             <td><input type="text" data-type="${type}" data-id="${u.id}" data-address="${u.address}" placeholder="Nom de l'unité"></td>`;
         }else{
             row.innerHTML=`<td>${type}</td><td>${u.address}</td>
             <td><input type="text" data-type="${type}" data-id="${u.id}" data-address="${u.address}" placeholder="Nom de l'unité"></td>`;
         }
     });
     return table;
 }
 
 // Affiche les unités et active les boutons
 function displayUnits(detectedUnits){
     clearError();
     container.innerHTML="";
-    if(!detectedUnits){ showError("Aucune donnée reçue"); return; }
-    container.appendChild(createTable(detectedUnits.extUnits,"Exterieure"));
-    container.appendChild(createTable(detectedUnits.intUnits,"Interieure"));
-    document.getElementById("exportGreeBtn").disabled=false;
-    document.getElementById("exportFuxaBtn").disabled=false;
+    if(!detectedUnits){
+        latestDetectedUnits = null;
+        showError("Aucune donnée reçue");
+        return;
+    }
+
+    latestDetectedUnits = detectedUnits;
+    const extTable = createTable(detectedUnits.extUnits,"Exterieure");
+    const intTable = createTable(detectedUnits.intUnits,"Interieure");
+
+    if(extTable) container.appendChild(extTable);
+    if(intTable) container.appendChild(intTable);
+
+    const hasUnits = Boolean(extTable || intTable);
+    document.getElementById("exportGreeBtn").disabled=!hasUnits;
+    document.getElementById("exportFuxaBtn").disabled=!hasUnits;
+
+    if(!hasUnits) showError("Aucune unité détectée après le scan Gree");
+}
+
+function getFallbackNamesFromLastScan(){
+    if(!latestDetectedUnits) return {};
+    const allUnits = [...(latestDetectedUnits.extUnits || []), ...(latestDetectedUnits.intUnits || [])];
+    return allUnits.reduce((acc, unit) => {
+        acc[unit.id] = unit.name;
+        return acc;
+    }, {});
 }
 
 // Scan Modbus
 async function scan(){
     try{
         clearError();
         container.innerHTML="";
+        latestDetectedUnits = null;
+        document.getElementById("exportGreeBtn").disabled=true;
+        document.getElementById("exportFuxaBtn").disabled=true;
+
         const ip=document.getElementById("ip").value.trim();
         if(!ip) throw new Error("Veuillez saisir l'adresse IP de la passerelle Gree");
         const setIpResp = await fetch(`${API_BASE}/set-ip`,{
             method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ip})
         });
         if(!setIpResp.ok) throw new Error((await setIpResp.json()).error || "Erreur configuration IP");
         const scanResp = await fetch(`${API_BASE}/scan`);
         if(!scanResp.ok) throw new Error((await scanResp.json()).error || "Erreur scan Modbus");
         displayUnits(await scanResp.json());
     }catch(err){ showError(err.message); console.error(err);}
 }
 
 // Récupère les unités depuis le tableau
-function getUnitsFromTable(){
+function getUnitsFromTable({ fallbackNamesById = {} } = {}){
     const inputs=document.querySelectorAll("#unitsContainer input");
     if(!inputs.length) throw new Error("Aucune unité à exporter");
     const intUnits=[], extUnits=[];
     inputs.forEach(i=>{
-        const name=i.value.trim();
+        const fallbackName = fallbackNamesById[i.dataset.id] || "";
+        const name=i.value.trim() || fallbackName;
         if(!name) throw new Error(`Nom manquant pour l'unité ${i.dataset.id} (${i.dataset.type})`);
         const unit={ id:i.dataset.id, name };
         if(i.dataset.type==="Interieure") intUnits.push(unit);
         else extUnits.push(unit);
     });
     return { intUnits, extUnits };
 }
 
 // Export JSON Gree
 async function exportGreeJSON(intUnits, extUnits){
     const resp = await fetch("/plugins/gree/export",{
         method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({intUnits, extUnits})
     });
     if(!resp.ok) throw new Error((await resp.json()).error || "Erreur export Gree");
     const blob = await resp.blob();
     downloadBlob(blob,"gree_fuxa.json");
 }
 
 // Export Vue FUXA
 function exportFuxaJSON(intUnits, extUnits){
     const viewId = `v_${crypto.randomUUID()}`;
     const tableId = `OXC_${crypto.randomUUID()}`;
     const allUnits = [...intUnits,...extUnits];
     const rows = allUnits.map(u=>({
         cells:[
