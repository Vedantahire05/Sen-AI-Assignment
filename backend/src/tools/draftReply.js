const getRagContext = require("../services/ragService");

/**
 * Draft a contextual reply using RAG-grounded context.
 * Returns { reply, policyRefs }
 */
const draftReply = async (
  context,
  tone = "professional",
  policyRefs = []
) => {

  let ragContext = [];

  try {

    const ragResults =
      await getRagContext(context);

    if (
      ragResults &&
      ragResults.documents &&
      ragResults.documents[0]
    ) {

      ragContext =
        ragResults.documents[0].map(
          (doc, index) => ({
            text: doc,
            source:
              ragResults.metadatas?.[0]?.[index]
                ?.source_doc ||
              "knowledge_base"
          })
        );

    }

  } catch (error) {

    console.log(
      "Draft Reply RAG Error:",
      error.message
    );

  }

  const ragSnippet =
    ragContext.length > 0
      ? ragContext
          .slice(0, 3)
          .map(
            (r, i) =>
              `[${i + 1}] (${r.source})\n${r.text}`
          )
          .join("\n\n")
      : "";

  const toneMap = {
    empathetic:
      "warm and empathetic, acknowledging the customer's frustration",

    formal_legal:
      "formal and legally precise, citing statutory obligations",

    professional:
      "professional and helpful",

    helpful:
      "friendly and helpful",

    empathetic_no_liability:
      "empathetic and apologetic without admitting legal liability",
  };

  const toneDesc =
    toneMap[tone] ||
    "professional";

  const reply = `
[DRAFTED — tone: ${toneDesc}]

Context:
${context}

Policy references:
${policyRefs.join(", ") || "general KB"}

KB grounding:
${ragSnippet || "(RAG unavailable — fallback reply)"}

---

Dear Customer,

Thank you for reaching out.

Based on the applicable policy information above, your request has been reviewed and routed appropriately.

A member of our team will follow up if additional review is required.

Best regards,
Support Team
`;

  return {
    reply,
    policyRefs,
    ragChunksUsed:
      ragContext.length,
  };
};

module.exports =
  draftReply;