const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./expense_splitter.db", (err) => {
  if (err) console.error("Error opening DB:", err.message);
  else console.log("Connected to SQLite DB");
});

module.exports = db;
