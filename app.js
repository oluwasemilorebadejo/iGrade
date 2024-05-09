const express = require("express");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const port = 3000;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);



app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.listen(port);
