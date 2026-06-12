const Action = require("../models/Action");
const AuditLog = require("../models/AuditLog");
const Email = require("../models/Email");

const escalateCase = async (email, reason, priority = "High") => {
  const action = await Action.create({
    emailId: email._id,
    actionType: "Escalate",
    proposedContent: reason,
    isApproved: true,
    approvedBy: "Agent",
    executedAt: new Date(),
    agentReasoningLog: {
      tool: "escalate_to_human",
      reason,
      priority,
      sender: email.sender,
      subject: email.subject,
    },
  });

  await Email.findByIdAndUpdate(email._id, { status: "Escalated" });

  await AuditLog.create({
    entityType: "Email",
    entityId: email._id.toString(),
    action: "ESCALATE_TO_HUMAN",
    performedBy: "Agent",
    diff: { reason, priority, actionId: action._id.toString() },
  });

  return {
    escalated: true,
    actionId: action._id,
    team: priority === "Critical" ? "security" : "support",
    priority,
    reason,
    emailId: email._id,
    timestamp: new Date(),
  };
};

module.exports = escalateCase;