const express = require("express");
const bodyParser = require("body-parser");
const apiGree = require("./api_gree");

const app = express();
app.use(bodyParser.json());

app.use("/plugins/gree", apiGree);
app.use("/client", express.static(__dirname + "/../client"));

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
    console.log(` ^|^e Gree plugin running on http://0.0.0.0:${PORT}`);
});
