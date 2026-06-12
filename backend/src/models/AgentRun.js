const mongoose = require("mongoose");

// Each step in the ReAct loop
const ReActStepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true },
    thought: { type: String, required: true },
    action: { type: String, required: true },
    actionInput: { type: mongoose.Schema.Types.Mixed, default: {} },
    observation: { type: String, default: "" },
  },
  { _id: false }
);

const AgentRunSchema = new mongoose.Schema(
  {
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email",
      index: true,
    },

    // Full ReAct reasoning trace (array of steps)
    reasoningTrace: {
      type: [ReActStepSchema],
      default: [],
    },

    // Final decision after all steps
    finalDecision: { type: String, default: "" },
    finalAction: {
      type: String,
      enum: [
        "AUTO_REPLY",
        "ESCALATE_HUMAN",
        "FLAG_LEGAL",
        "FLAG_SECURITY",
        "CREATE_TICKET",
        "IGNORE_SPAM",
        "GDPR_ACK",
        "MAX_STEPS_EXCEEDED",
      ],
      default: "ESCALATE_HUMAN",
    },

    // Summary for dry-run or human review
    proposedReply: { type: String, default: null },
    escalationBrief: { type: String, default: null },

    // Meta
    totalSteps: { type: Number, default: 0 },
    maxStepsReached: { type: Boolean, default: false },
    isDryRun: { type: Boolean, default: false },
    executedAt: { type: Date, default: null },

    // Legacy single-step fields (kept for backwards compat)
    thought: String,
    action: String,
    observation: String,
    toolUsed: String,
    result: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AgentRun", AgentRunSchema);
