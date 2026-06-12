const mongoose = require("mongoose");

const ActionSchema = new mongoose.Schema(
  {
    emailId: String,

    actionType: String,

    reasoningLog: Object,

    proposedContent: String,

    approved: {
      type: Boolean,
      default: false,
    },

    executedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Action",
  ActionSchema
);