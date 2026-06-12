const fs = require("fs");
const path = require("path");
const axios = require("axios");

const filePath = path.join(
  __dirname,
  "../data/email-data-advanced.json"
);

const emails = JSON.parse(
  fs.readFileSync(filePath, "utf-8")
);

const loadEmails = async () => {
  for (const email of emails) {
    try {
      await axios.post(
        "http://localhost:5000/api/ingest",
        email
      );

      console.log(
        `Loaded ${email.message_id}`
      );
    } catch (error) {
      console.log(
        `Failed ${email.message_id}`
      );
    }
  }

  console.log("Import Complete");
};

loadEmails();