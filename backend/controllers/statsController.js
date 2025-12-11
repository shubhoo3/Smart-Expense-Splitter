const db = require("../db");
const calculateSettlements = require("../utils/settlements");

// ===============================
// GROUP ANALYTICS (TOTAL, CATEGORY)
// ===============================
exports.getGroupStats = (req, res) => {
  const groupId = req.params.groupId;

  db.all(
    `
    SELECT 
      category,
      COUNT(*) as category_count,
      SUM(amount) as category_amount
    FROM expenses
    WHERE group_id = ?
    GROUP BY category
  `,
    [groupId],
    (err, categoryStats) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get(
        `
      SELECT 
        COUNT(*) as total_expenses,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM expenses
      WHERE group_id = ?
    `,
        [groupId],
        (err, overall) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            overall: overall || {
              total_expenses: 0,
              total_amount: 0,
              avg_amount: 0,
            },
            by_category: categoryStats,
          });
        }
      );
    }
  );
};

// ===============================
// BALANCES FOR EACH MEMBER
// ===============================
exports.getBalances = (req, res) => {
  const groupId = req.params.groupId;

  db.all(
    `SELECT id, name FROM members WHERE group_id = ?`,
    [groupId],
    (err, members) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(
        `
      SELECT e.paid_by, e.amount, es.member_id, es.amount AS split_amount
      FROM expenses e
      LEFT JOIN expense_splits es ON e.id = es.expense_id
      WHERE e.group_id = ?
    `,
        [groupId],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });

          const balances = {};
          members.forEach((m) => (balances[m.id] = { name: m.name, balance: 0 }));

          rows.forEach((row) => {
            // Payment added to payer
            if (balances[row.paid_by]) {
              balances[row.paid_by].balance += row.amount;
            }

            // Split deducted from participant
            if (row.member_id && balances[row.member_id]) {
              balances[row.member_id].balance -= row.split_amount;
            }
          });

          res.json(balances);
        }
      );
    }
  );
};

// ===============================
// SETTLEMENTS (MINIMIZE TRANSACTIONS)
// ===============================
exports.getSettlements = (req, res) => {
  const groupId = req.params.groupId;

  db.all(
    `SELECT id, name FROM members WHERE group_id = ?`,
    [groupId],
    (err, members) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(
        `
      SELECT e.paid_by, e.amount, es.member_id, es.amount AS split_amount
      FROM expenses e
      LEFT JOIN expense_splits es ON e.id = es.expense_id
      WHERE e.group_id = ?
    `,
        [groupId],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });

          const settlements = calculateSettlements(members, rows);
          res.json(settlements);
        }
      );
    }
  );
};
