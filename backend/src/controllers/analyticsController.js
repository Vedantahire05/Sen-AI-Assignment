const Email = require("../models/Email");
const Contact = require("../models/Contact");

// GET /analytics/sentiment — grouped counts
const sentimentAnalytics = async (req, res) => {
  try {
    const data = await Email.aggregate([
      { $group: { _id: "$sentiment", count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

// GET /analytics/categories
const categoryAnalytics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const match = {};
    if (start_date || end_date) {
      match.timestamp = {};
      if (start_date) match.timestamp.$gte = new Date(start_date);
      if (end_date) match.timestamp.$lte = new Date(end_date);
    }
    const data = await Email.aggregate([
      { $match: match },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

// GET /analytics/escalations
const escalationAnalytics = async (req, res) => {
  try {
    const data = await Email.aggregate([
      { $match: { requiresHuman: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

// GET /analytics/sentiment-trend?sender=X&days=30
const sentimentTrend = async (req, res) => {
  try {
    const { sender, days } = req.query;
    const lookback = parseInt(days) || 30;

    const filter = {};
    if (sender) filter.sender = sender;
    filter.timestamp = { $gte: new Date(Date.now() - lookback * 24 * 60 * 60 * 1000) };

    const emails = await Email.find(filter).sort({ timestamp: 1 }).lean();

    // Moving average window of 3
    const WINDOW = 3;
    let consecutiveNegative = 0;

    const trend = emails.map((email, idx) => {
      // Compute moving average over last WINDOW emails
      const windowEmails = emails.slice(Math.max(0, idx - WINDOW + 1), idx + 1);
      const movingAvg =
        windowEmails.reduce((sum, e) => sum + (e.sentimentScore || 0), 0) / windowEmails.length;

      if (email.sentiment === "Negative") {
        consecutiveNegative++;
      } else {
        consecutiveNegative = 0;
      }

      return {
        date: email.timestamp,
        messageId: email.messageId,
        sentiment: email.sentiment,
        score: email.sentimentScore,
        movingAvg: parseFloat(movingAvg.toFixed(3)),
        category: email.category,
        urgency: email.urgency,
      };
    });

    const escalationAlert = consecutiveNegative >= 3;

    // Update contact churn risk if escalation alert triggered
    if (escalationAlert && sender) {
      const currentChurnRisk = Math.min(
        1.0,
        0.3 + consecutiveNegative * 0.15 + (emails.length > 0 ? Math.abs(emails[emails.length - 1].sentimentScore || 0) * 0.3 : 0)
      );
      await Contact.findOneAndUpdate(
        { email: sender },
        { churnRiskScore: parseFloat(currentChurnRisk.toFixed(2)) }
      );
    }

    res.json({
      success: true,
      sender: sender || "global",
      lookbackDays: lookback,
      totalEmails: emails.length,
      consecutiveNegative,
      escalationAlert,
      escalationAlertMessage: escalationAlert
        ? `⚠️ ${consecutiveNegative} consecutive negative emails from ${sender} — immediate attention required`
        : null,
      averageSentimentScore:
        emails.length > 0
          ? parseFloat(
              (emails.reduce((s, e) => s + (e.sentimentScore || 0), 0) / emails.length).toFixed(3)
            )
          : null,
      trend,
    });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

// GET /analytics/at-risk — senders with deteriorating sentiment or old unresolved threads
const atRiskAccounts = async (req, res) => {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Contacts with high churn risk
    const highChurnContacts = await Contact.find({ churnRiskScore: { $gt: 0.5 } })
      .sort({ churnRiskScore: -1 })
      .limit(20)
      .lean();

    // Unresolved Critical/High emails older than 48h
    const staleCritical = await Email.find({
      urgency: { $in: ["Critical", "High"] },
      status: { $in: ["Received", "Processing"] },
      timestamp: { $lt: fortyEightHoursAgo },
    })
      .sort({ timestamp: 1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      highChurnRiskContacts: highChurnContacts.map((c) => ({
        email: c.email,
        name: c.name,
        company: c.company,
        churnRiskScore: c.churnRiskScore,
        accountValue: c.accountValue,
        status: c.status,
      })),
      staleCriticalEmails: staleCritical.map((e) => ({
        id: e._id,
        sender: e.sender,
        subject: e.subject,
        urgency: e.urgency,
        category: e.category,
        timestamp: e.timestamp,
        hoursOld: Math.floor((Date.now() - new Date(e.timestamp)) / 3600000),
      })),
    });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

// GET /analytics/agent-performance
const agentPerformance = async (req, res) => {
  try {
    const total = await Email.countDocuments({ status: { $ne: "Received" } });
    const autoReplied = await Email.countDocuments({ status: "Replied", requiresHuman: false });
    const escalated = await Email.countDocuments({ status: "Escalated" });
    const avgConfidence = await Email.aggregate([
      { $match: { confidence: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$confidence" } } },
    ]);

    res.json({
      success: true,
      totalProcessed: total,
      autoReplyRate: total > 0 ? parseFloat(((autoReplied / total) * 100).toFixed(1)) : 0,
      escalationRate: total > 0 ? parseFloat(((escalated / total) * 100).toFixed(1)) : 0,
      averageConfidence:
        avgConfidence.length > 0 ? parseFloat(avgConfidence[0].avg.toFixed(3)) : 0,
    });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

module.exports = {
  sentimentAnalytics,
  categoryAnalytics,
  escalationAnalytics,
  sentimentTrend,
  atRiskAccounts,
  agentPerformance,
};
