const express = require("express");
const router = express.Router();
const { getContact, updateStatus, listContacts } = require("../controllers/contactController");

router.get("/", listContacts);
router.get("/:email", getContact);
router.patch("/:email/status", updateStatus);

module.exports = router;
