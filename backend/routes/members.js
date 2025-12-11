const express = require("express");
const router = express.Router();

const {
  getMembers,
  addMember,
  deleteMember,
} = require("../controllers/membersController");

// members in a group
router.get("/groups/:groupId/members", getMembers);
router.post("/groups/:groupId/members", addMember);

// delete a member
router.delete("/members/:id", deleteMember);

module.exports = router;
