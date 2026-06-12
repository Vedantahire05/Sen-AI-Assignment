const fs = require("fs");
const path = require("path");
const ingestEmail = require("../services/ingest");
const JobStatus = require("../models/JobStatus");
const classifyEmail = require("../services/classifier");
const getRagContext = require("../services/ragService");
const runAgent = require("../services/agent");
const Email = require("../models/Email");
const { v4: uuidv4 } = require("uuid");

const DATA_PATH = path.resolve(__dirname, "../../../../data/email-data-advanced.json");

// POST /api/stream/start — replay dataset at configurable speed
const startStream = async (req, res) => {
  const { speed = 1, limit } = req.body; // speed: emails per second
  const io = req.app.get("io");

  let emails;
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    emails = JSON.parse(raw);
    if (!Array.isArray(emails)) emails = Object.values(emails);
  } catch (err) {
    return res.status(500).json({
      error_code: "DATA_READ_ERROR",
      message: `Could not read dataset: ${err.message}`,
      details: {},
    });
  }

  const toStream = limit ? emails.slice(0, parseInt(limit)) : emails;
  const intervalMs = Math.max(100, Math.round(1000 / speed));

  res.json({
    success: true,
    message: `Streaming ${toStream.length} emails at ${speed} email(s)/sec (${intervalMs}ms interval)`,
    total: toStream.length,
    estimatedSeconds: Math.ceil(toStream.length / speed),
  });

  // Emit emails asynchronously after response
  let i = 0;
  const interval = setInterval(async () => {
    if (i >= toStream.length) {
      clearInterval(interval);
      if (io) io.emit("stream_complete", { total: toStream.length });
      return;
    }

    const emailData = toStream[i];
    i++;

    try {
      const result = await ingestEmail(emailData);

      if (io) {
        io.emit("email_ingested", {
          index: i,
          total: toStream.length,
          success: result.success,
          duplicate: result.duplicate || false,
          messageId: emailData.message_id,
          sender: emailData.sender,
          subject: emailData.subject,
          priorityScore: result.priorityScore,
          heuristic: result.heuristic,
        });
      }
    } catch (err) {
      if (io) {
        io.emit("email_ingest_error", {
          index: i,
          messageId: emailData.message_id,
          error: err.message,
        });
      }
    }
  }, intervalMs);
};

// GET /api/stream/status — how many emails are in each status
const streamStatus = async (req, res) => {
  try {
    const total = await Email.countDocuments();
    const byStatus = await Email.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const byCategory = await Email.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const jobs = await JobStatus.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      totalEmails: total,
      byStatus,
      byCategory,
      processingJobs: jobs,
    });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

module.exports = { startStream, streamStatus };
