const mongoose = require("mongoose");

const JobStatusSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    emailId: { type: mongoose.Schema.Types.ObjectId, ref: "Email", default: null },
    messageId: { type: String, default: null },
    status: {
      type: String,
      enum: ["queued", "processing", "classified", "agent_running", "completed", "failed"],
      default: "queued",
    },
    error: { type: String, default: null },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobStatus", JobStatusSchema);
