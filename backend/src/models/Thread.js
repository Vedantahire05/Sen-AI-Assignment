const mongoose = require("mongoose");

const ThreadSchema = new mongoose.Schema(
  {
    threadId: {
      type: String,
      unique: true,
      required: true,
    },

    senderEmail: String,

    subject: String,

    firstSeenAt: Date,

    lastUpdatedAt: Date,

    status: {
      type: String,
      enum: [
        "Open",
        "Resolved",
        "Escalated",
        "Ignored",
      ],
      default: "Open",
    },

    assignedTo: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Thread",
  ThreadSchema
);