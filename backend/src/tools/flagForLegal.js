const AuditLog =
require("../models/AuditLog");

const flagForLegal =
async (
  emailId,
  issueType
) => {

  await AuditLog.create({
    entityType: "Email",
    entityId: emailId,
    action:
      "LEGAL_FLAG",
    performedBy:
      "Agent",
    diff: {
      issueType,
    },
  });

  return {
    flagged: true,
    team: "Legal",
    issueType,
  };
};

module.exports =
  flagForLegal;