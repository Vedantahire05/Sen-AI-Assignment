const Email = require("../models/Email");

const getThreadByEmail = async (req, res) => {
  try {
    const { contact_email } = req.params;

    const emails = await Email.find({
      sender: contact_email,
    }).sort({
      timestamp: 1,
    });

    return res.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getThreadByThreadId = async (req, res) => {
  try {
    const { threadId } = req.params;

    const emails = await Email.find({
      threadId,
    }).sort({
      timestamp: 1,
    });

    return res.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getThreadByEmail,
  getThreadByThreadId,
};