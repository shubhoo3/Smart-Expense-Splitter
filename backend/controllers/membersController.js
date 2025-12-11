const db = require("../db");

exports.getMembers = (req, res) => {
  const groupId = req.params.groupId;

  const sql = `SELECT * FROM members WHERE group_id = ? ORDER BY name`;

  db.all(sql, [groupId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(rows);
  });
};

exports.addMember = (req, res) => {
  const groupId = req.params.groupId;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const sql = `INSERT INTO members (group_id, name) VALUES (?, ?)`;

  db.run(sql, [groupId, name], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      group_id: parseInt(groupId),
      name,
      created_at: new Date().toISOString(),
    });
  });
};

exports.deleteMember = (req, res) => {
  const memberId = req.params.id;

  const sql = `DELETE FROM members WHERE id = ?`;

  db.run(sql, [memberId], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      message: "Member deleted successfully",
      changes: this.changes,
    });
  });
};
