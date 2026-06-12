const express =
require("express");

const router =
express.Router();

const {
  searchRag,
} = require(
  "../controllers/ragController"
);

router.get(
  "/search",
  searchRag
);

module.exports = router;