const db = require("../db");

// =============================
// Get all expenses for a group
// =============================
exports.getGroupExpenses = (req, res) => {
  const groupId = req.params.groupId;

  const sql = `
    SELECT e.*, 
           GROUP_CONCAT(es.member_id || ':' || es.amount) as splits_data
    FROM expenses e
    LEFT JOIN expense_splits es ON e.id = es.expense_id
    WHERE e.group_id = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;

  db.all(sql, [groupId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const expenses = rows.map((row) => {
      const splits = {};
      if (row.splits_data) {
        row.splits_data.split(",").forEach((split) => {
          const [memberId, amount] = split.split(":");
          splits[memberId] = parseFloat(amount);
        });
      }
      delete row.splits_data;

      return { ...row, splits };
    });

    res.json(expenses);
  });
};

// =============================
// Get one expense
// =============================
exports.getExpense = (req, res) => {
  const sql = `
    SELECT e.*, 
           GROUP_CONCAT(es.member_id || ':' || es.amount) as splits_data
    FROM expenses e
    LEFT JOIN expense_splits es ON e.id = es.expense_id
    WHERE e.id = ?
    GROUP BY e.id
  `;

  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Expense not found" });

    const splits = {};
    if (row.splits_data) {
      row.splits_data.split(",").forEach((split) => {
        const [memberId, amount] = split.split(":");
        splits[memberId] = parseFloat(amount);
      });
    }

    delete row.splits_data;

    res.json({ ...row, splits });
  });
};

// =============================
// Create a new expense
// =============================
exports.createExpense = (req, res) => {
  const groupId = req.params.groupId;
  const { description, amount, paidBy, category, splitType, splits } = req.body;

  if (!description || !amount || !paidBy || !category || !splitType || !splits) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sql = `
    INSERT INTO expenses (group_id, description, amount, paid_by, category, split_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [groupId, description, amount, paidBy, category, splitType], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    const expenseId = this.lastID;

    const splitSQL = `INSERT INTO expense_splits (expense_id, member_id, amount) VALUES (?, ?, ?)`;
    const stmt = db.prepare(splitSQL);

    Object.entries(splits).forEach(([memberId, amt]) => {
      stmt.run([expenseId, memberId, amt]);
    });

    stmt.finalize();

    res.status(201).json({
      id: expenseId,
      group_id: parseInt(groupId),
      description,
      amount: parseFloat(amount),
      paid_by: parseInt(paidBy),
      category,
      split_type: splitType,
      splits,
      created_at: new Date().toISOString(),
    });
  });
};

// =============================
// Update expense
// =============================
exports.updateExpense = (req, res) => {
  const expenseId = req.params.id;
  const { description, amount, paidBy, category, splitType, splits } = req.body;

  const updateSQL = `
    UPDATE expenses
    SET description = ?, amount = ?, paid_by = ?, category = ?, split_type = ?
    WHERE id = ?
  `;

  db.run(updateSQL, [description, amount, paidBy, category, splitType, expenseId], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // Delete old splits
    db.run(`DELETE FROM expense_splits WHERE expense_id = ?`, [expenseId], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Insert new splits
      const insertSQL = `INSERT INTO expense_splits (expense_id, member_id, amount) VALUES (?, ?, ?)`;
      const stmt = db.prepare(insertSQL);

      Object.entries(splits).forEach(([memberId, amt]) => {
        stmt.run([expenseId, memberId, amt]);
      });

      stmt.finalize();

      res.json({ message: "Expense updated successfully" });
    });
  });
};

// =============================
// Delete expense
// =============================
exports.deleteExpense = (req, res) => {
  const sql = `DELETE FROM expenses WHERE id = ?`;

  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      message: "Expense deleted",
      changes: this.changes,
    });
  });
};
