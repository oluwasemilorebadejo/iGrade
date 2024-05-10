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

const departments = [
  "Building",
  "Chemical Engineering",
  "Food Science and Engineering",
  "Education",
  "Agricultural and Environmental Engineering",
  "Geology",
  "Botany",
  "Civil Engineering",
  "Surveying and Geoinformatics",
  "Mechanical Engineering and Aerospace Engineering",
  "Material Science and Engineering",
  "Microbiology",
  "Physics and Physics Engineering",
  "Computer Science and Engineering",
  "Postgraduate Computer Science and Engineering",
  "Mathematics",
  "Zoology",
];

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  let message = req.query.message || "";
  res.render("index", { message });
});

app.post("/grade", async (req, res) => {
  let message;
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
    message = "Could not score student.";
    res.redirect(`/?message=${message}`);
  }
});

app.post("/score", async (req, res) => {
  let message;
  const { score, registration_number } = req.body;

  try {
    const client = await pool.connect();
    await client.query(
      "UPDATE student_scores SET score = $1 WHERE registration_number = $2",
      [score, registration_number]
    );
    client.release();
    message = `Set ${registration_number} score to ${score}.`;
  } catch (error) {
    message = `Could not set score for ${registration_number}.`;
  }

  res.redirect(`/?message=${message}`);
});

app.get("/register", async (req, res) => {
  res.render("register", { departments });
});

app.post("/new_student", async (req, res) => {
  let message;
  const {
    registration_number,
    first_name,
    middle_name,
    last_name,
    department,
    score,
  } = req.body;

  try {
    const client = await pool.connect();
    await client.query(
      "INSERT INTO student_scores (registration_number, first_name, middle_name, last_name, department, score) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        registration_number,
        first_name,
        middle_name,
        last_name,
        department,
        score,
      ]
    );
    client.release();
    message = `Created record for ${registration_number}.`;
  } catch (error) {}

  res.redirect(`/?message=${message}`);
});

app.get("/download", async (req, res) => {
  try {
    const client = await pool.connect();
    const results = await client.query("SELECT * FROM student_scores");
    const json_data = results.rows;
    client.release();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=data.json");
    res.send(JSON.stringify(json_data));
  } catch (error) {}
});

app.get("/passcode", async (req, res) => {
  res.render("passcode");
});

app.post("/reset", async (req, res) => {
  let message;
  const passcode = req.body.passcode;

  if (passcode === process.env.PASSCODE) {
    try {
      const client = await pool.connect();
      await client.query("UPDATE student_scores SET score = 0");
      client.release();
      message = "Reset students' scores.";
    } catch (error) {
      message = "Passcode incorrect.";
    }
  }

  res.redirect(`/?message=${message}`);
});

app.listen(port, () => console.log(`http://localhost:${port}`));
