const path = require("path");
const mongoose = require("mongoose");

// Load backend .env file
require("dotenv").config({
  path: path.join(__dirname, "../backend/.env"),
});

async function clearDB() {
  try {
    console.log("MONGO_URI =", process.env.MONGO_URI);

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI not found. Check backend/.env and dotenv path."
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    const db = mongoose.connection.db;

    const collections = [
      "emails",
      "threads",
      "agentruns",
      "actions",
      "auditlogs",
      "jobstatuses",
      "drafts",
      "contacts",
    ];

    for (const collectionName of collections) {
      try {
        const result = await db
          .collection(collectionName)
          .deleteMany({});

        console.log(
          `🗑️ ${collectionName}: ${result.deletedCount} documents deleted`
        );
      } catch (err) {
        console.log(
          `⚠️ Collection '${collectionName}' not found, skipping`
        );
      }
    }

    console.log("\n✅ Database cleared successfully");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error clearing database:");
    console.error(error.message);

    await mongoose.disconnect().catch(() => {});

    process.exit(1);
  }
}

clearDB();