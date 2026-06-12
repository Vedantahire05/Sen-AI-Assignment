const Email = require("../models/Email");

const getRagContext = require(
  "../services/ragService"
);

const classifyEmail = require(
  "../services/classifier"
);

const classify = async (req, res) => {
  try {
    const { emailId } = req.params;

    const email = await Email.findById(
      emailId
    );

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    const threadHistory =
      await Email.find({
        threadId: email.threadId,
      }).sort({
        timestamp: 1,
      });

    const ragContext =
      await getRagContext(
        `${email.subject} ${email.body}`
      );

    console.log("\n========== RAG DEBUG ==========");
    console.log(
      JSON.stringify(
        ragContext,
        null,
        2
      )
    );
    console.log("===============================\n");

    const result = await classifyEmail(
      email,
      threadHistory,
      ragContext
    );

    let parsed;

    try {
      parsed = JSON.parse(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          "Failed to parse classifier response",
        raw: result,
      });
    }

    await Email.findByIdAndUpdate(
      email._id,
      {
        category: parsed.category,
        sentiment: parsed.sentiment,
        sentimentScore:
          parsed.sentiment_score,
        urgency: parsed.urgency,
        requiresHuman:
          parsed.requires_human,
        escalationReason:
          parsed.escalation_reason,
        suggestedReply:
          parsed.suggested_reply,
        confidence:
          parsed.confidence,
        detectedEntities:
          parsed.detected_entities,
        status:
          parsed.requires_human
            ? "Escalated"
            : "Processing",
      }
    );

    return res.json({
      success: true,
      emailId: email._id,
      classification: parsed,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  classify,
};