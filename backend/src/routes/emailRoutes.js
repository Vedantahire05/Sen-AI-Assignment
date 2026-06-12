const express = require("express");
const router = express.Router();
const { ingest, getStatus, getEmails } = require("../controllers/emailController");

router.get("/emails", getEmails);
router.post("/ingest", ingest);
router.get("/status/:jobId", getStatus);

module.exports = router;