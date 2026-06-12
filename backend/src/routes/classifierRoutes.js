const express = require("express");

const router = express.Router();

const {
  classify,
} = require("../controllers/classifierController");

router.get(
  "/:emailId",
  classify
);

module.exports = router;