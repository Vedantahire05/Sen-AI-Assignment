const express = require("express");
const router = express.Router();
const { reputationCheck, enrichEmailContext } = require("../controllers/intelligenceController");

router.get("/reputation", reputationCheck);
router.post("/enrich", enrichEmailContext);

module.exports = router;
