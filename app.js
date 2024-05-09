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
  const registration_number = req.body.registration_number;

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM student_scores WHERE registration_number = $1",
      [registration_number]
    );
    const student = result.rows[0];
    client.release();

    const { first_name, middle_name, last_name, department } = student;
    res.render("grade", {
      registration_number,
      first_name,
      middle_name,
      last_name,
      department,
    });
  } catch (error) {
    res.redirect("/");
  }
});

app.post("/score", async (req, res) => {
  const { score, registration_number } = req.body;

  try {
    const client = await pool.connect();
    await client.query(
      "UPDATE student_scores SET score = $1 WHERE registration_number = $2",
      [score, registration_number]
    );
    client.release();
  } catch (error) {}

  res.redirect("/");
});

app.get("/register", async (req, res) => {
  res.render("register");
});

app.post("/new_student", async (req, res) => {
  const { registration_number, first_name, middle_name, last_name, score } =
    req.body;

  try {
    const client = await pool.connect();
    await client.query(
      "INSERT INTO student_scores (registration_number, first_name, middle_name, last_name, score) VALUES ($1, $2, $3, $4, $5)",
      [registration_number, first_name, middle_name, last_name, score]
    );
    client.release();
  } catch (error) {}

  res.redirect("/");
});

app.listen(port, () => console.log(`http://localhost:${port}`));
