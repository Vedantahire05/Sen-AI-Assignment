const Email = require("../models/Email");
const Thread = require("../models/Thread");
const Contact = require("../models/Contact");

// GET /dashboard/stats
const getStats = async (req, res) => {
  try {
    const [pending, replied, escalated, critical, spam, total, threads, contacts] =
      await Promise.all([
        Email.countDocuments({ status: "Received" }),
        Email.countDocuments({ status: "Replied" }),
        Email.countDocuments({ status: "Escalated" }),
        Email.countDocuments({ urgency: "Critical" }),
        Email.countDocuments({ category: "Spam" }),
        Email.countDocuments(),
        Thread.countDocuments(),
        Contact.countDocuments(),
      ]);

    // At-risk: contacts with churn risk > 0.5
    const atRiskCount = await Contact.countDocuments({ churnRiskScore: { $gt: 0.5 } });

    res.json({
      success: true,
      stats: {
        pending,
        replied,
        escalated,
        critical,
        spam,
        total,
        threads,
        contacts,
        atRisk: atRiskCount,
        autoReplyRate: total > 0 ? parseFloat(((replied / total) * 100).toFixed(1)) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

module.exports = { getStats };
