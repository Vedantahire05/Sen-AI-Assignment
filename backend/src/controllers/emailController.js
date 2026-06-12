const { v4: uuidv4 } = require("uuid");
const ingestEmail = require("../services/ingest");
const JobStatus = require("../models/JobStatus");
const classifyEmail = require("../services/classifier");
const getRagContext = require("../services/ragService");
const runAgent = require("../services/agent");
const Email = require("../models/Email");

// ── Background processing pipeline ───────────────────────────────────────────
const processEmailAsync = async (jobId, emailDoc) => {
  try {
    await JobStatus.findOneAndUpdate(
      { jobId },
      { status: "processing", startedAt: new Date() }
    );

    // Build thread history for context
    const threadEmails = await Email.find({ threadId: emailDoc.threadId })
      .sort({ timestamp: 1 })
      .lean();

    const threadHistory = threadEmails.map((e) => ({
      sender: e.sender,
      subject: e.subject,
      body: (e.body || "").slice(0, 800),
      timestamp: e.timestamp,
      category: e.category,
      sentiment: e.sentiment,
    }));

    // RAG context
    const ragQuery = `${emailDoc.subject} ${(emailDoc.body || "").slice(0, 200)}`;
    const ragContext = await getRagContext(ragQuery);

    await JobStatus.findOneAndUpdate({ jobId }, { status: "classified" });

    // LLM Classification
    const rawClassification = await classifyEmail(emailDoc, threadHistory, ragContext);
    const classification = JSON.parse(rawClassification);

    // Update email with classification results
    await Email.findByIdAndUpdate(emailDoc._id, {
      category: classification.category || emailDoc.category,
      sentiment: classification.sentiment,
      sentimentScore: classification.sentiment_score,
      urgency: classification.urgency || emailDoc.urgency,
      requiresHuman: classification.requires_human,
      escalationReason: classification.escalation_reason,
      suggestedReply: classification.suggested_reply,
      confidence: classification.confidence,
      detectedEntities: classification.detected_entities || {},
      status: "Processing",
      processingStartedAt: new Date(),
    });

    await JobStatus.findOneAndUpdate({ jobId }, { status: "agent_running" });

    // Run agent
    const agentRun = await runAgent(emailDoc, classification, false);

    await JobStatus.findOneAndUpdate(
      { jobId },
      {
        status: "completed",
        completedAt: new Date(),
        result: {
          classification: {
            category: classification.category,
            sentiment: classification.sentiment,
            urgency: classification.urgency,
            requires_human: classification.requires_human,
            confidence: classification.confidence,
          },
          agentFinalAction: agentRun.finalAction,
          agentTotalSteps: agentRun.totalSteps,
        },
      }
    );
  } catch (err) {
    await JobStatus.findOneAndUpdate(
      { jobId },
      { status: "failed", error: err.message, completedAt: new Date() }
    );
    console.error(`Job ${jobId} failed:`, err.message);
  }
};

// POST /api/ingest
const ingest = async (req, res) => {
  try {
    const result = await ingestEmail(req.body);

    if (!result.success) {
      return res.status(200).json(result); // duplicate — not an error
    }

    const jobId = uuidv4();

    await JobStatus.create({
      jobId,
      emailId: result.email._id,
      messageId: result.email.messageId,
      status: "queued",
    });

    // Fire and forget — don't block the response
    processEmailAsync(jobId, result.email).catch((err) =>
      console.error("Background processing error:", err.message)
    );

    return res.status(202).json({
      success: true,
      job_id: jobId,
      message: "Email ingested and queued for AI processing",
      heuristic: result.heuristic,
      email: {
        id: result.email._id,
        messageId: result.email.messageId,
        threadId: result.email.threadId,
        initialCategory: result.email.category,
        initialUrgency: result.email.urgency,
      },
    });
  } catch (error) {
    return res.status(400).json({
      error_code: "INGEST_ERROR",
      message: error.message,
      details: {},
    });
  }
};

// GET /api/status/:jobId
const getStatus = async (req, res) => {
  try {
    const job = await JobStatus.findOne({ jobId: req.params.jobId });
    if (!job) {
      return res.status(404).json({
        error_code: "NOT_FOUND",
        message: "Job not found",
        details: { jobId: req.params.jobId },
      });
    }
    res.json({
      job_id: job.jobId,
      status: job.status,
      emailId: job.emailId,
      messageId: job.messageId,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

module.exports = { ingest, getStatus };
