const express = require("express");
const bodyParser = require("body-parser");
const papa = require("papaparse");
const session = require("express-session");
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
  "Agricultural and Environmental Engineering",
  "Aerospace Engineering",
  "Botany",
  "Building",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Food Science and Technology",
  "Geology",
  "Management and Accounting",
  "Materials Science and Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Microbiology",
  "Physics",
  "Science and Technology Education",
  "Surveying and Geoinformatics",
  "Zoology",
];
const weeks = [1, 2, 3, 4, 5, 6, 7];

var week_number = 1;

function titleCase(string) {
  let title = string.toLowerCase();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect("/");
  }
}

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  req.session.isAuthenticated = false;
  var message = req.query.message || "";
  res.render("auth", { message });
});

app.post("/verify", async (req, res) => {
  if (req.body.passcode === process.env.PASSCODE) {
    req.session.isAuthenticated = true;
    res.redirect("/index");
  } else {
    var message;
    message = "I:Passcode incorrect.";
    res.redirect(`/?message=${message}`);
  }
});

app.get("/index", isAuthenticated, async (req, res) => {
  var message = req.query.message || "";
  res.render("index", { week_number, message });
});

app.post("/grade", isAuthenticated, async (req, res) => {
  var message;
  var registration_number = req.body.registration_number;
  registration_number = registration_number.toUpperCase();

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM student_scores WHERE registration_number = '${registration_number}'`
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
    message = "I:Student does not exist in database.";
    res.redirect(`/index?message=${message}`);
  }
});

app.post("/score", isAuthenticated, async (req, res) => {
  var message;
  var { score, registration_number } = req.body;
  registration_number = registration_number.toUpperCase();

  try {
    const client = await pool.connect();
    await client.query(
      `UPDATE student_scores SET week${week_number} = ${score} WHERE registration_number = '${registration_number}'`
    );
    client.release();
    message = `S:Set ${registration_number} score to ${score}.`;
  } catch (error) {
    message = `E:Could not set score for ${registration_number}.`;
  }

  res.redirect(`/index?message=${message}`);
});

app.get("/register", isAuthenticated, async (req, res) => {
  res.render("register", { departments });
});

app.post("/student", isAuthenticated, async (req, res) => {
  var message = null;
  var {
    registration_number,
    first_name,
    middle_name,
    last_name,
    department,
    score,
  } = req.body;

  registration_number = registration_number.toUpperCase();
  first_name = titleCase(first_name);
  middle_name = titleCase(middle_name);
  last_name = titleCase(last_name);

  try {
    const client = await pool.connect();
    await client.query(
      `INSERT INTO student_scores (registration_number, first_name, middle_name, last_name, department, week${week_number}) VALUES ('${registration_number}', '${first_name}', '${middle_name}', '${last_name}', '${department}', ${score})`
    );

    client.release();
    message = `S:Created record for ${registration_number}.`;
  } catch (error) {
    console.log(error);
    message = "E:Error in connecting to database.";
  }

  res.redirect(`/index?message=${message}`);
});

app.get("/download", isAuthenticated, async (req, res) => {
  try {
    const client = await pool.connect();
    const results = await client.query(
      "SELECT * FROM student_scores LIMIT 3000"
    );
    const json_data = results.rows;
    client.release();

    const csv_data = papa.unparse(json_data);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=student_scores.csv"
    );
    res.send(csv_data);
  } catch (error) {
    res.status(500).send("Error generating download");
  }
});

app.get("/week", isAuthenticated, async (req, res) => {
  res.render("week", { week_number, weeks });
});

app.post("/reset", isAuthenticated, (req, res) => {
  var message = null;
  const { week, passcode } = req.body;

  if (passcode === process.env.PASSCODE) {
    week_number = week;
    message = `S:Set current week to ${week_number}.`;
  } else {
    message = "I:Passcode incorrect.";
  }

  res.redirect(`/index?message=${message}`);
});

app.get("/logout", isAuthenticated, async (req, res) => {
  req.session.isAuthenticated = false;
  res.redirect("/");
});

app.listen(port);
