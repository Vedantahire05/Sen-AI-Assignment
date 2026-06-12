const Contact = require("../models/Contact");
const Email = require("../models/Email");
const Thread = require("../models/Thread");

/**
 * Compute churn risk score (0–1) based on:
 * - Average sentiment score (negative = higher risk)
 * - Number of unresolved emails
 * - Consecutive negative emails
 * - Account value (VIP gets more leniency in display, but risk is objective)
 */
const computeChurnRisk = async (senderEmail) => {
  const emails = await Email.find({ sender: senderEmail }).sort({ timestamp: 1 }).lean();
  if (emails.length === 0) return 0;

  const avgSentiment = emails.reduce((s, e) => s + (e.sentimentScore || 0), 0) / emails.length;
  const negCount = emails.filter((e) => e.sentiment === "Negative").length;
  const unresolvedCount = emails.filter((e) => ["Received", "Processing"].includes(e.status)).length;

  let consecutive = 0;
  for (let i = emails.length - 1; i >= 0; i--) {
    if (emails[i].sentiment === "Negative") consecutive++;
    else break;
  }

  // Weighted formula
  const sentimentRisk = Math.max(0, -avgSentiment) * 0.3;      // 0–0.3
  const negRatio = emails.length > 0 ? (negCount / emails.length) * 0.3 : 0; // 0–0.3
  const consecutiveRisk = Math.min(consecutive * 0.08, 0.24);   // 0–0.24
  const unresolvedRisk = Math.min(unresolvedCount * 0.04, 0.16); // 0–0.16

  return parseFloat(Math.min(1.0, sentimentRisk + negRatio + consecutiveRisk + unresolvedRisk).toFixed(2));
};

// GET /contacts/:email
const getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({ email: req.params.email });
    if (!contact) {
      return res.status(404).json({
        error_code: "NOT_FOUND",
        message: "Contact not found",
        details: { email: req.params.email },
      });
    }

    // Refresh churn risk on fetch
    const freshChurnRisk = await computeChurnRisk(req.params.email);
    await Contact.findByIdAndUpdate(contact._id, { churnRiskScore: freshChurnRisk });

    // Get open thread count
    const openThreads = await Thread.countDocuments({
      senderEmail: req.params.email,
      status: { $in: ["Open", "Escalated"] },
    });

    const recentEmails = await Email.find({ sender: req.params.email })
      .sort({ timestamp: -1 })
      .limit(5)
      .select("subject category sentiment urgency status timestamp")
      .lean();

    res.json({
      success: true,
      contact: {
        ...contact.toObject(),
        churnRiskScore: freshChurnRisk,
        churnRiskLabel:
          freshChurnRisk > 0.7 ? "High" : freshChurnRisk > 0.4 ? "Medium" : "Low",
        openThreads,
        recentEmails,
      },
    });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

// PATCH /contacts/:email/status
const updateStatus = async (req, res) => {
  try {
    const validStatuses = ["VIP", "Blocked", "Active", "Churned"];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({
        error_code: "INVALID_STATUS",
        message: `Status must be one of: ${validStatuses.join(", ")}`,
        details: {},
      });
    }

    const contact = await Contact.findOneAndUpdate(
      { email: req.params.email },
      { status: req.body.status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error_code: "NOT_FOUND", message: "Contact not found", details: {} });
    }

    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

// GET /contacts — list all contacts with churn risk
const listContacts = async (req, res) => {
  try {
    const { status, min_churn_risk } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (min_churn_risk) filter.churnRiskScore = { $gte: parseFloat(min_churn_risk) };

    const contacts = await Contact.find(filter).sort({ churnRiskScore: -1 }).lean();
    res.json({ success: true, total: contacts.length, contacts });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

module.exports = { getContact, updateStatus, listContacts, computeChurnRisk };
