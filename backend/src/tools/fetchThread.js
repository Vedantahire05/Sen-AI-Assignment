const Email = require("../models/Email");

/**
 * Get all emails from a sender ordered by timestamp.
 * Used by agent to load full thread context.
 */
const fetchThread = async (senderEmail) => {
  const emails = await Email.find({ sender: senderEmail })
    .sort({ timestamp: 1 })
    .lean();

  return emails.map((e) => ({
    messageId: e.messageId,
    subject: e.subject,
    body: e.body,
    timestamp: e.timestamp,
    sentiment: e.sentiment,
    sentimentScore: e.sentimentScore,
    category: e.category,
    urgency: e.urgency,
    status: e.status,
  }));
};

module.exports = fetchThread;
