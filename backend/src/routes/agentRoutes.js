const express = require("express");
const router = express.Router();
const { run, dryRun, getRuns } = require("../controllers/agentController");

router.post("/run/:emailId", run);
router.post("/dry-run/:emailId", dryRun);
router.get("/runs/:emailId", getRuns);

module.exports = router;
