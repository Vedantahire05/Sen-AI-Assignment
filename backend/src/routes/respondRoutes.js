const express =
require("express");

const router =
express.Router();

const {
  respond,
} = require(
  "../controllers/respondController"
);

router.post(
  "/:emailId",
  respond
);

module.exports = router;