const express = require("express");
const router = express.Router();

const {
  getGroups,
  getGroup,
  createGroup,
  deleteGroup,
} = require("../controllers/groupsController");

// /api/groups
router.get("/", getGroups);
router.post("/", createGroup);

// /api/groups/:id
router.get("/:id", getGroup);
router.delete("/:id", deleteGroup);

module.exports = router;
