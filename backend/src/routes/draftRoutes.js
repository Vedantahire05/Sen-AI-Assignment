const express =
require("express");

const router =
express.Router();

const {
  updateDraft,
  approveDraft,
} = require(
  "../controllers/draftController"
);

router.patch(
  "/:id",
  updateDraft
);

router.post(
  "/:id/approve",
  approveDraft
);

module.exports = router;