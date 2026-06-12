const Action = require("../models/Action");
const AuditLog = require("../models/AuditLog");

const createTicket = async (title, body, assignee = "support-team") => {
  const ticketId = "TICKET-" + Date.now();

  const action = await Action.create({
    actionType: "Ticket-Created",
    proposedContent: `${title}\n\n${body}`,
    isApproved: true,
    approvedBy: "Agent",
    executedAt: new Date(),
    agentReasoningLog: {
      tool: "create_internal_ticket",
      ticketId,
      title,
      assignee,
      bodyPreview: (body || "").slice(0, 300),
    },
  });

  await AuditLog.create({
    entityType: "Action",
    entityId: action._id.toString(),
    action: "TICKET_CREATED",
    performedBy: "Agent",
    diff: { ticketId, title, assignee },
  });

  return {
    ticketId,
    actionId: action._id,
    title,
    assignee,
    status: "Open",
    createdAt: new Date(),
  };
};

module.exports = createTicket;