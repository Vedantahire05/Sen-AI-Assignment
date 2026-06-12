const Email = require("../models/Email");
const Thread = require("../models/Thread");
const Contact = require("../models/Contact");
const runHeuristic = require("./heuristic");

// Priority score heuristic (higher = more urgent)
const computePriorityScore = (heuristic, body, subject) => {
  let score = 0;
  if (heuristic.security) score += 100;
  if (heuristic.urgent) score += 50;
  const text = `${subject} ${body}`.toLowerCase();
  if (text.includes("p0")) score += 40;
  if (text.includes("gdpr") || text.includes("article 20")) score += 35;
  if (text.includes("legal") || text.includes("lawsuit")) score += 30;
  if (text.includes("refund") || text.includes("churn")) score += 20;
  if (text.includes("ransomware") || text.includes("btc")) score += 100;
  if (text.includes("vip") || text.includes("enterprise")) score += 15;
  if (heuristic.spam) score -= 50;
  return Math.max(0, score);
};

const ingestEmail = async (emailData) => {
  const {
    message_id,
    sender,
    subject,
    body,
    timestamp,
    thread_id,
  } = emailData;

  // ── Schema validation ────────────────────────────────────────────────────────
  const errors = [];
  if (!message_id) errors.push("message_id is required");
  if (!sender) errors.push("sender is required");
  if (!thread_id) errors.push("thread_id is required");
  if (errors.length > 0) {
    const err = new Error("Schema validation failed");
    err.validationErrors = errors;
    throw err;
  }

  // ── Normalise body ────────────────────────────────────────────────────────────
  let cleanBody = (body || "").trim();
  // Strip HTML entities to plain text (basic)
  cleanBody = cleanBody.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
  // Truncate extremely long bodies for LLM processing
  const MAX_BODY = 10000;
  const truncated = cleanBody.length > MAX_BODY;
  if (truncated) cleanBody = cleanBody.slice(0, MAX_BODY) + "\n[... truncated ...]";

  const cleanSubject = (subject || "").trim();

  // ── Deduplication ─────────────────────────────────────────────────────────────
  const existing = await Email.findOne({ messageId: message_id });
  if (existing) {
    return {
      success: false,
      duplicate: true,
      message: `Duplicate message_id ignored: ${message_id}`,
      emailId: existing._id,
    };
  }

  // ── Thread linking ────────────────────────────────────────────────────────────
  let thread = await Thread.findOne({ threadId: thread_id });
  if (!thread) {
    thread = await Thread.create({
      threadId: thread_id,
      senderEmail: sender,
      subject: cleanSubject,
      firstSeenAt: timestamp || new Date(),
      lastUpdatedAt: timestamp || new Date(),
    });
  } else {
    await Thread.findByIdAndUpdate(thread._id, {
      lastUpdatedAt: new Date() > new Date(timestamp || 0) ? new Date() : timestamp,
    });
  }

  // ── Contact upsert ────────────────────────────────────────────────────────────
  let contact = await Contact.findOne({ email: sender });
  if (!contact) {
    contact = await Contact.create({
      email: sender,
      lastContactAt: timestamp || new Date(),
    });
  } else {
    await Contact.findByIdAndUpdate(contact._id, { lastContactAt: new Date() });
  }

  // ── Heuristic layer (<10ms) ───────────────────────────────────────────────────
  const heuristic = runHeuristic({ sender, subject: cleanSubject, body: cleanBody });
  const priorityScore = computePriorityScore(heuristic, cleanBody, cleanSubject);

  let initialCategory = "Other";
  let initialUrgency = "Low";
  let initialStatus = "Received";

  if (heuristic.spam) {
    initialCategory = "Spam";
    initialUrgency = "Low";
    initialStatus = "Ignored";
  } else if (heuristic.security) {
    initialUrgency = "Critical";
    initialStatus = "Escalated";
  } else if (heuristic.urgent) {
    initialUrgency = "High";
  } else if (heuristic.internal) {
    initialCategory = "Internal";
  }

  const email = await Email.create({
    messageId: message_id,
    threadId: thread_id,
    sender,
    subject: cleanSubject,
    body: cleanBody,
    timestamp: timestamp || new Date(),
    category: initialCategory,
    urgency: initialUrgency,
    status: initialStatus,
  });

  return {
    success: true,
    email,
    heuristic,
    priorityScore,
    truncated,
    threadCreated: !thread.createdAt || thread.firstSeenAt?.toString() === email.timestamp?.toString(),
  };
};

module.exports = ingestEmail;
