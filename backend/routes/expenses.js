const express = require("express");
const router = express.Router();

const {
  getGroupExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expensesController");

// /api/groups/:groupId/expenses
router.get("/groups/:groupId/expenses", getGroupExpenses);
router.post("/groups/:groupId/expenses", createExpense);

// /api/expenses/:id
router.get("/:id", getExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
