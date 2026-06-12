const mongoose = require("mongoose");

const ActionSchema = new mongoose.Schema(
  {
    emailId: String,

    actionType: {
      type: String,
      enum: ["Auto-Reply", "Escalate", "Legal-Flag", "Ticket-Created", "Ignored"],
    },

    // matches what agent tools write
    agentReasoningLog: Object,

    proposedContent: String,

    isApproved: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: String,
      default: null,
    },

    executedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Action", ActionSchema);