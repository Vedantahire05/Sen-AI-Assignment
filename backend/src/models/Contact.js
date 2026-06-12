const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      default: "",
    },

    company: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "VIP",
        "Blocked",
        "Active",
        "Churned",
      ],
      default: "Active",
    },

    accountValue: {
      type: Number,
      default: 0,
    },

    churnRiskScore: {
      type: Number,
      default: 0,
    },

    openTickets: {
      type: Number,
      default: 0,
    },

    subscriptionTier: {
      type: String,
      default: "Standard",
    },

    overdueInvoices: {
      type: Number,
      default: 0,
    },

    lastContactAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Contact",
    ContactSchema
  );