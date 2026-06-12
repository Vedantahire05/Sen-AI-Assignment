const mongoose = require("mongoose");

const EmailSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    threadId: {
      type: String,
      required: true,
      index: true,
    },

    sender: {
      type: String,
      required: true,
      index: true,
    },

    subject: {
      type: String,
      default: "",
    },

    body: {
      type: String,
      default: "",
    },

    timestamp: {
      type: Date,
      index: true,
    },

    // LLM Classification

    category: {
      type: String,
      enum: [
        "Complaint",
        "Inquiry",
        "Bug Report",
        "Feature Request",
        "Compliance",
        "Legal",
        "Billing",
        "Spam",
        "Internal",
        "Other",
      ],
      default: "Other",
    },

    sentiment: {
      type: String,
      enum: [
        "Positive",
        "Neutral",
        "Negative",
        "Mixed",
      ],
      default: "Neutral",
    },

    sentimentScore: {
      type: Number,
      default: 0,
    },

    urgency: {
      type: String,
      enum: [
        "Critical",
        "High",
        "Medium",
        "Low",
      ],
      default: "Low",
    },

    requiresHuman: {
      type: Boolean,
      default: false,
    },

    escalationReason: {
      type: String,
      default: null,
    },

    suggestedReply: {
      type: String,
      default: null,
    },

    confidence: {
      type: Number,
      default: 0,
    },

    // Entity Extraction

    detectedEntities: {
      order_ids: {
        type: [String],
        default: [],
      },

      ticket_ids: {
        type: [String],
        default: [],
      },

      monetary_amounts: {
        type: [String],
        default: [],
      },

      deadlines: {
        type: [String],
        default: [],
      },

      products_mentioned: {
        type: [String],
        default: [],
      },
    },

    // Heuristic Engine Output

    rawEntities: {
      type: Object,
      default: {},
    },

    // Processing Status

    status: {
      type: String,
      enum: [
        "Received",
        "Processing",
        "Replied",
        "Escalated",
        "Ignored",
      ],
      default: "Received",
    },

    // Agent Information

    assignedAgent: {
      type: String,
      default: null,
    },

    processingStartedAt: {
      type: Date,
      default: null,
    },

    processingCompletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Email",
  EmailSchema
);