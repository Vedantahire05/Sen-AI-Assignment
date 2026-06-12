const Email = require("../models/Email");
const AgentRun = require("../models/AgentRun");
const runAgent = require("../services/agent");

// POST /agent/run/:emailId
const run = async (req, res) => {
  try {
    const { emailId } = req.params;

    const email = await Email.findById(emailId);
    if (!email) {
      return res.status(404).json({
        error_code: "NOT_FOUND",
        message: "Email not found",
        details: { emailId },
      });
    }

    const classification = {
      category: email.category,
      sentiment: email.sentiment,
      urgency: email.urgency,
      requires_human: email.requiresHuman,
      escalation_reason: email.escalationReason,
      suggested_reply: email.suggestedReply,
      confidence: email.confidence,
    };

    const agentRun = await runAgent(email, classification, false);

    res.json({
      success: true,
      emailId,
      agentRun: {
        id: agentRun._id,
        finalAction: agentRun.finalAction,
        finalDecision: agentRun.finalDecision,
        totalSteps: agentRun.totalSteps,
        maxStepsReached: agentRun.maxStepsReached,
        reasoningTrace: agentRun.reasoningTrace,
        proposedReply: agentRun.proposedReply,
        escalationBrief: agentRun.escalationBrief,
        executedAt: agentRun.executedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      error_code: "AGENT_ERROR",
      message: error.message,
      details: {},
    });
  }
};

// POST /agent/dry-run/:emailId — plan but don't execute
const dryRun = async (req, res) => {
  try {
    const { emailId } = req.params;

    const email = await Email.findById(emailId);
    if (!email) {
      return res.status(404).json({
        error_code: "NOT_FOUND",
        message: "Email not found",
        details: { emailId },
      });
    }

    const classification = {
      category: email.category,
      sentiment: email.sentiment,
      urgency: email.urgency,
      requires_human: email.requiresHuman,
      escalation_reason: email.escalationReason,
      suggested_reply: email.suggestedReply,
      confidence: email.confidence,
    };

    const agentRun = await runAgent(email, classification, true);

    res.json({
      success: true,
      isDryRun: true,
      emailId,
      emailSummary: {
        sender: email.sender,
        subject: email.subject,
        category: email.category,
        urgency: email.urgency,
        requiresHuman: email.requiresHuman,
      },
      plannedSteps: agentRun.reasoningTrace.map((step) => ({
        stepNumber: step.stepNumber,
        thought: step.thought,
        plannedAction: step.action,
        actionInput: step.actionInput,
        note: "Not executed (dry run)",
      })),
      willAutoReply: agentRun.finalAction === "AUTO_REPLY",
      willEscalate:
        agentRun.finalAction === "ESCALATE_HUMAN" ||
        agentRun.finalAction === "FLAG_LEGAL" ||
        agentRun.finalAction === "FLAG_SECURITY",
      estimatedFinalAction: agentRun.finalAction,
    });
  } catch (error) {
    res.status(500).json({
      error_code: "AGENT_DRY_RUN_ERROR",
      message: error.message,
      details: {},
    });
  }
};

// GET /agent/runs/:emailId — get all runs for an email
const getRuns = async (req, res) => {
  try {
    const { emailId } = req.params;
    const runs = await AgentRun.find({ emailId }).sort({ createdAt: -1 });
    res.json({ success: true, runs });
  } catch (error) {
    res.status(500).json({ error_code: "SERVER_ERROR", message: error.message, details: {} });
  }
};

module.exports = { run, dryRun, getRuns };
