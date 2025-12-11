const db = require("../db");

exports.getGroups = (req, res) => {
  const sql = `SELECT * FROM groups ORDER BY created_at DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getGroup = (req, res) => {
  const sql = `SELECT * FROM groups WHERE id = ?`;

  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Group not found" });

    res.json(row);
  });
};

exports.createGroup = (req, res) => {
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: "Name and type are required" });
  }

  const sql = `INSERT INTO groups (name, type) VALUES (?, ?)`;

  db.run(sql, [name, type], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      name,
      type,
      created_at: new Date().toISOString(),
    });
  });
};

exports.deleteGroup = (req, res) => {
  const sql = `DELETE FROM groups WHERE id = ?`;

  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      message: "Group deleted successfully",
      changes: this.changes,
    });
  });
};
