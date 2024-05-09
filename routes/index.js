var express = require("express");
var { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://qzfthdxqonaeeobbzvra.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/supa", function (req, res, next) {
  res.json;
});

module.exports = router;
