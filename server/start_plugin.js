const express = require("express");
const bodyParser = require("body-parser");
const apiGree = require("./api_gree");

const app = express();
app.use(bodyParser.json());
app.use("/plugins/gree", apiGree);

const port = 3001;
app.listen(port, () => console.log(`Gree plugin running at http://localhost:${port}`));
