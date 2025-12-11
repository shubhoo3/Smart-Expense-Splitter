const express = require("express");
const router = express.Router();

const {
  getGroupStats,
  getBalances,
  getSettlements,
} = require("../controllers/statsController");

// /api/groups/:groupId/stats
router.get("/:groupId/stats", getGroupStats);

// /api/groups/:groupId/balances
router.get("/:groupId/balances", getBalances);

// /api/groups/:groupId/settlements
router.get("/:groupId/settlements", getSettlements);

module.exports = router;
