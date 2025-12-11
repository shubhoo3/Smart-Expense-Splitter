const express = require("express");
const router = express.Router();

const {
  getMembers,
  addMember,
  deleteMember,
} = require("../controllers/membersController");

// /api/groups/:groupId/members
router.get("/:groupId/members", getMembers);
router.post("/:groupId/members", addMember);

// /api/members/:id
router.delete("/:id", deleteMember);

module.exports = router;
