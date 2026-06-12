const express = require("express");
const path = require("path");

const router = express.Router();

router.get(
  "/openapi",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "../../openapi.json"
      )
    );
  }
);

module.exports = router;