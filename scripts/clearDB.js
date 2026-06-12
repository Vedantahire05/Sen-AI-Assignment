require("dotenv").config();
const mongoose = require("mongoose");

console.log("MONGO_URI =", process.env.MONGO_URI);

async function clearDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

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
        const result = await db.collection(collectionName).deleteMany({});
        console.log(
          `${collectionName}: ${result.deletedCount} documents deleted`
        );
      } catch (err) {
        console.log(`Collection ${collectionName} not found, skipping`);
      }
    }

    console.log("Database cleared successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  }
}

clearDB();