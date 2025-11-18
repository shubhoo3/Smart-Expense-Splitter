// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./expense_splitter.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Groups table
    db.run(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Members table
    db.run(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      )
    `);

    // Expenses table
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        paid_by INTEGER NOT NULL,
        category TEXT NOT NULL,
        split_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (paid_by) REFERENCES members(id)
      )
    `);

    // Expense splits table (for tracking individual splits)
    db.run(`
      CREATE TABLE IF NOT EXISTS expense_splits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id)
      )
    `);

    console.log('Database tables initialized');
  });
}

// ==================== GROUP ROUTES ====================

// Get all groups
app.get('/api/groups', (req, res) => {
  const query = `SELECT * FROM groups ORDER BY created_at DESC`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single group
app.get('/api/groups/:id', (req, res) => {
  const query = `SELECT * FROM groups WHERE id = ?`;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(row);
  });
});

// Create group
app.post('/api/groups', (req, res) => {
  const { name, type } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const query = `INSERT INTO groups (name, type) VALUES (?, ?)`;
  
  db.run(query, [name, type], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      name,
      type,
      created_at: new Date().toISOString()
    });
  });
});

// Delete group
app.delete('/api/groups/:id', (req, res) => {
  const query = `DELETE FROM groups WHERE id = ?`;
  
  db.run(query, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Group deleted successfully', changes: this.changes });
  });
});

// ==================== MEMBER ROUTES ====================

// Get all members in a group
app.get('/api/groups/:groupId/members', (req, res) => {
  const query = `SELECT * FROM members WHERE group_id = ? ORDER BY name`;
  
  db.all(query, [req.params.groupId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add member to group
app.post('/api/groups/:groupId/members', (req, res) => {
  const { name } = req.body;
  const groupId = req.params.groupId;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const query = `INSERT INTO members (group_id, name) VALUES (?, ?)`;
  
  db.run(query, [groupId, name], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      group_id: parseInt(groupId),
      name,
      created_at: new Date().toISOString()
    });
  });
});

// Delete member
app.delete('/api/members/:id', (req, res) => {
  const query = `DELETE FROM members WHERE id = ?`;
  
  db.run(query, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Member deleted successfully', changes: this.changes });
  });
});

// ==================== EXPENSE ROUTES ====================

// Get all expenses in a group
app.get('/api/groups/:groupId/expenses', (req, res) => {
  const query = `
    SELECT e.*, 
           GROUP_CONCAT(es.member_id || ':' || es.amount) as splits_data
    FROM expenses e
    LEFT JOIN expense_splits es ON e.id = es.expense_id
    WHERE e.group_id = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;
  
  db.all(query, [req.params.groupId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Parse splits data
    const expenses = rows.map(row => {
      const splits = {};
      if (row.splits_data) {
        row.splits_data.split(',').forEach(split => {
          const [memberId, amount] = split.split(':');
          splits[memberId] = parseFloat(amount);
        });
      }
      delete row.splits_data;
      return { ...row, splits };
    });
    
    res.json(expenses);
  });
});

// Get single expense
app.get('/api/expenses/:id', (req, res) => {
  const query = `
    SELECT e.*, 
           GROUP_CONCAT(es.member_id || ':' || es.amount) as splits_data
    FROM expenses e
    LEFT JOIN expense_splits es ON e.id = es.expense_id
    WHERE e.id = ?
    GROUP BY e.id
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Parse splits data
    const splits = {};
    if (row.splits_data) {
      row.splits_data.split(',').forEach(split => {
        const [memberId, amount] = split.split(':');
        splits[memberId] = parseFloat(amount);
      });
    }
    delete row.splits_data;
    
    res.json({ ...row, splits });
  });
});

// Create expense
app.post('/api/groups/:groupId/expenses', (req, res) => {
  const { description, amount, paidBy, category, splitType, splits } = req.body;
  const groupId = req.params.groupId;
  
  if (!description || !amount || !paidBy || !category || !splitType || !splits) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const expenseQuery = `
    INSERT INTO expenses (group_id, description, amount, paid_by, category, split_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(expenseQuery, [groupId, description, amount, paidBy, category, splitType], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const expenseId = this.lastID;
    
    // Insert splits
    const splitQuery = `INSERT INTO expense_splits (expense_id, member_id, amount) VALUES (?, ?, ?)`;
    const stmt = db.prepare(splitQuery);
    
    Object.entries(splits).forEach(([memberId, splitAmount]) => {
      stmt.run([expenseId, memberId, splitAmount]);
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
      created_at: new Date().toISOString()
    });
  });
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
  const { description, amount, paidBy, category, splitType, splits } = req.body;
  const expenseId = req.params.id;
  
  const updateQuery = `
    UPDATE expenses 
    SET description = ?, amount = ?, paid_by = ?, category = ?, split_type = ?
    WHERE id = ?
  `;
  
  db.run(updateQuery, [description, amount, paidBy, category, splitType, expenseId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Delete old splits
    db.run(`DELETE FROM expense_splits WHERE expense_id = ?`, [expenseId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Insert new splits
      const splitQuery = `INSERT INTO expense_splits (expense_id, member_id, amount) VALUES (?, ?, ?)`;
      const stmt = db.prepare(splitQuery);
      
      Object.entries(splits).forEach(([memberId, splitAmount]) => {
        stmt.run([expenseId, memberId, splitAmount]);
      });
      
      stmt.finalize();
      
      res.json({ message: 'Expense updated successfully' });
    });
  });
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  const query = `DELETE FROM expenses WHERE id = ?`;
  
  db.run(query, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Expense deleted successfully', changes: this.changes });
  });
});

// ==================== ANALYTICS ROUTES ====================

// Get group statistics
app.get('/api/groups/:groupId/stats', (req, res) => {
  const groupId = req.params.groupId;
  
  db.all(`
    SELECT 
      COUNT(*) as total_expenses,
      SUM(amount) as total_amount,
      category,
      COUNT(*) as category_count,
      SUM(amount) as category_amount
    FROM expenses
    WHERE group_id = ?
    GROUP BY category
  `, [groupId], (err, categoryStats) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.get(`
      SELECT 
        COUNT(*) as total_expenses,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM expenses
      WHERE group_id = ?
    `, [groupId], (err, overall) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        overall: overall || { total_expenses: 0, total_amount: 0, avg_amount: 0 },
        by_category: categoryStats
      });
    });
  });
});

// Get member balances
app.get('/api/groups/:groupId/balances', (req, res) => {
  const groupId = req.params.groupId;
  
  // Get all members
  db.all(`SELECT id, name FROM members WHERE group_id = ?`, [groupId], (err, members) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Get all expenses and splits
    db.all(`
      SELECT e.paid_by, e.amount, es.member_id, es.amount as split_amount
      FROM expenses e
      LEFT JOIN expense_splits es ON e.id = es.expense_id
      WHERE e.group_id = ?
    `, [groupId], (err, data) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Calculate balances
      const balances = {};
      members.forEach(m => balances[m.id] = { name: m.name, balance: 0 });
      
      data.forEach(row => {
        // Add payment
        if (balances[row.paid_by]) {
          balances[row.paid_by].balance += row.amount;
        }
        // Subtract split
        if (row.member_id && balances[row.member_id]) {
          balances[row.member_id].balance -= row.split_amount;
        }
      });
      
      res.json(balances);
    });
  });
});

// Get settlement suggestions
app.get('/api/groups/:groupId/settlements', (req, res) => {
  const groupId = req.params.groupId;
  
  // Get balances first
  db.all(`SELECT id, name FROM members WHERE group_id = ?`, [groupId], (err, members) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.all(`
      SELECT e.paid_by, e.amount, es.member_id, es.amount as split_amount
      FROM expenses e
      LEFT JOIN expense_splits es ON e.id = es.expense_id
      WHERE e.group_id = ?
    `, [groupId], (err, data) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Calculate balances
      const balances = {};
      members.forEach(m => balances[m.id] = 0);
      
      data.forEach(row => {
        if (balances[row.paid_by] !== undefined) {
          balances[row.paid_by] += row.amount;
        }
        if (row.member_id && balances[row.member_id] !== undefined) {
          balances[row.member_id] -= row.split_amount;
        }
      });
      
      // Calculate settlements (minimize transactions)
      const creditors = [];
      const debtors = [];
      
      Object.entries(balances).forEach(([memberId, balance]) => {
        if (balance > 0.01) creditors.push({ memberId, amount: balance });
        if (balance < -0.01) debtors.push({ memberId, amount: -balance });
      });
      
      const settlements = [];
      let i = 0, j = 0;
      
      while (i < creditors.length && j < debtors.length) {
        const amount = Math.min(creditors[i].amount, debtors[j].amount);
        settlements.push({
          from: debtors[j].memberId,
          to: creditors[i].memberId,
          amount: parseFloat(amount.toFixed(2)),
          fromName: members.find(m => m.id == debtors[j].memberId)?.name,
          toName: members.find(m => m.id == creditors[i].memberId)?.name
        });
        
        creditors[i].amount -= amount;
        debtors[j].amount -= amount;
        
        if (creditors[i].amount < 0.01) i++;
        if (debtors[j].amount < 0.01) j++;
      }
      
      res.json(settlements);
    });
  });
});



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});