const express = require("express");

const router = express.Router();

const {
  getAuditLogs,
} = require(
  "../controllers/auditController"
);

router.get(
  "/:entityType/:entityId",
  getAuditLogs
);

module.exports = router;