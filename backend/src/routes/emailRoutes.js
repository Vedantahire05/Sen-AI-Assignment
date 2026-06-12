const express = require("express");
const router = express.Router();
const { ingest, getStatus } = require("../controllers/emailController");

router.post("/ingest", ingest);
router.get("/status/:jobId", getStatus);

module.exports = router;
