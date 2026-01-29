async function scanGree() {
    const ip = document.getElementById("ip_input").value;
    await fetch('http://localhost:3001/plugins/gree/setIP', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ip })
    });

    const res = await fetch('http://localhost:3001/plugins/gree/scan');
    const data = await res.json();

    const container = document.getElementById("units_container");
    container.innerHTML = "";

    data.extUnits.forEach(u=>{
        const div = document.createElement("div");
        div.textContent = u + " (Ext)";
        div.style.color="blue";
        container.appendChild(div);
    });

    data.intUnits.forEach(u=>{
        const div = document.createElement("div");
        div.textContent = u + " (Int)";
        div.style.color="green";
        container.appendChild(div);
    });
}
