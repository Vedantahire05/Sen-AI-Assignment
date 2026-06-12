const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
    },

    entityId: {
      type: String,
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
    },

    performedBy: {
      type: String,
      default: "Agent",
    },

    diff: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AuditLog",
  AuditLogSchema
);