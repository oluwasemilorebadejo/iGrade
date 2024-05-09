const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = 3000;
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  res.render("index");
});

app.post("/grade", async (req, res) => {
  const registrationNumber = req.body.registrationNumber;
  res.render("grade", { registrationNumber });
});

app.listen(port, () => console.log(`http://localhost:${port}`));
