const express = require("express");
const router = express.Router();

const {
  getGroupExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expensesController");

// group expenses
router.get("/groups/:groupId/expenses", getGroupExpenses);
router.post("/groups/:groupId/expenses", createExpense);

// single expense
router.get("/expenses/:id", getExpense);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);

module.exports = router;

