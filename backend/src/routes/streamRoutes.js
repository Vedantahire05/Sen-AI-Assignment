const express = require("express");
const router = express.Router();
const { startStream, streamStatus } = require("../controllers/streamController");

router.post("/start", startStream);
router.get("/status", streamStatus);

module.exports = router;
