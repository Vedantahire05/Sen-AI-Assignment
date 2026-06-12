const Draft = require("../models/Draft");
const AuditLog = require("../models/AuditLog");

const updateDraft = async (
  req,
  res
) => {
  try {

    const draft =
      await Draft.findByIdAndUpdate(
        req.params.id,
        {
          draftText:
            req.body.draftText,
        },
        {
          new: true,
        }
      );

    await AuditLog.create({
      entityType: "Draft",
      entityId: draft._id.toString(),
      action: "DRAFT_UPDATED",
      performedBy: "Human Reviewer",
    });

    return res.json({
      success: true,
      draft,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

const approveDraft = async (
  req,
  res
) => {
  try {

    const draft =
      await Draft.findByIdAndUpdate(
        req.params.id,
        {
          status: "APPROVED",
          approvedBy:
            req.body.approvedBy ||
            "Manager",
          approvedAt:
            new Date(),
        },
        {
          new: true,
        }
      );

    await AuditLog.create({
      entityType: "Draft",
      entityId: draft._id.toString(),
      action: "DRAFT_APPROVED",
      performedBy:
        draft.approvedBy,
    });

    return res.json({
      success: true,
      draft,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  updateDraft,
  approveDraft,
};