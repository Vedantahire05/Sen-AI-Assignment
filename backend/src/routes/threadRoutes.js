const express = require("express");
const router = express.Router();

const {
  getThreadByEmail,
  getThreadByThreadId,
} = require("../controllers/threadController");

router.get("/thread/:threadId", getThreadByThreadId);

router.get("/:contact_email", getThreadByEmail);

module.exports = router;