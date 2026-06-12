const express = require("express");
const router = express.Router();
const {
  sentimentAnalytics,
  categoryAnalytics,
  escalationAnalytics,
  sentimentTrend,
  atRiskAccounts,
  agentPerformance,
} = require("../controllers/analyticsController");

router.get("/sentiment", sentimentAnalytics);
router.get("/categories", categoryAnalytics);
router.get("/escalations", escalationAnalytics);
router.get("/sentiment-trend", sentimentTrend);
router.get("/at-risk", atRiskAccounts);
router.get("/agent-performance", agentPerformance);

module.exports = router;
