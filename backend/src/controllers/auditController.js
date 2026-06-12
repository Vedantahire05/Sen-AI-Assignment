const AuditLog = require(
  "../models/AuditLog"
);

const getAuditLogs = async (
  req,
  res
) => {
  try {

    const logs =
      await AuditLog.find({
        entityType:
          req.params.entityType,

        entityId:
          req.params.entityId,
      }).sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      count: logs.length,
      logs,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  getAuditLogs,
};