const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ── Heuristic fast-path (sync, <10ms) ─────────────────────────────────────────
const heuristicClassification = (emailText) => {
  const text = emailText.toLowerCase();

  if (text.includes("ransomware") || (text.includes("btc") && text.includes("publish"))) {
    return {
      category: "Legal",
      sentiment: "Negative",
      sentiment_score: -1.0,
      urgency: "Critical",
      requires_human: true,
      escalation_reason: "Ransomware / extortion threat — NEVER auto-reply",
      suggested_reply: null,
      confidence: 0.99,
      detected_entities: { order_ids: [], ticket_ids: [], monetary_amounts: [], deadlines: [], products_mentioned: [] },
    };
  }

  if (text.includes("gdpr") || text.includes("article 20") || text.includes("data portability")) {
    return {
      category: "Compliance",
      sentiment: "Neutral",
      sentiment_score: 0,
      urgency: "High",
      requires_human: true,
      escalation_reason: "GDPR Article 20 data portability request — 30-day statutory obligation",
      suggested_reply: null,
      confidence: 0.99,
      detected_entities: { order_ids: [], ticket_ids: [], monetary_amounts: [], deadlines: ["30 days"], products_mentioned: [] },
    };
  }

  if (text.includes("lawsuit") || text.includes("attorney") || text.includes("cease and desist") || text.includes("legal action")) {
    return {
      category: "Legal",
      sentiment: "Negative",
      sentiment_score: -0.95,
      urgency: "Critical",
      requires_human: true,
      escalation_reason: "Legal threat detected",
      suggested_reply: null,
      confidence: 0.95,
      detected_entities: { order_ids: [], ticket_ids: [], monetary_amounts: [], deadlines: [], products_mentioned: [] },
    };
  }

  if (text.includes("refund") || text.includes("cancel") || text.includes("unhappy") || text.includes("disappointed")) {
    return {
      category: "Complaint",
      sentiment: "Negative",
      sentiment_score: -0.7,
      urgency: "High",
      requires_human: false,
      escalation_reason: null,
      suggested_reply: "We understand your concern and are reviewing your request urgently.",
      confidence: 0.8,
      detected_entities: { order_ids: [], ticket_ids: [], monetary_amounts: [], deadlines: [], products_mentioned: [] },
    };
  }

  return {
    category: "Other",
    sentiment: "Neutral",
    sentiment_score: 0,
    urgency: "Medium",
    requires_human: false,
    escalation_reason: null,
    suggested_reply: "Thank you for contacting us. Our team is reviewing your request.",
    confidence: 0.5,
    detected_entities: { order_ids: [], ticket_ids: [], monetary_amounts: [], deadlines: [], products_mentioned: [] },
  };
};

// ── LLM classification ─────────────────────────────────────────────────────────
const classifyEmail = async (currentEmail, threadHistory, ragContext) => {
  try {
    const ragText = Array.isArray(ragContext)
      ? ragContext.map((r, i) => `[Doc ${i + 1}] ${r.source || "KB"}: ${r.text || JSON.stringify(r)}`).join("\n\n")
      : JSON.stringify(ragContext);

    const threadText = Array.isArray(threadHistory)
      ? threadHistory
          .map(
            (e) =>
              `[${e.timestamp || ""}] From: ${e.sender || ""}\nSubject: ${e.subject || ""}\n${(e.body || "").slice(0, 500)}`
          )
          .join("\n---\n")
      : JSON.stringify(threadHistory);

    const prompt = `You are a Senior Enterprise CRM Intelligence Agent. Your output must be valid JSON only.

## CRITICAL RULES (must follow exactly):
1. If email contains ransomware/BTC/extortion threats → category="Legal", urgency="Critical", requires_human=true, suggested_reply=null
2. If email contains GDPR/Article 20/data portability → category="Compliance", urgency="High", requires_human=true, suggested_reply=null
3. If email contains "cease and desist"/lawsuit/attorney → category="Legal", urgency="Critical", requires_human=true, suggested_reply=null
4. If urgency="Critical" → requires_human MUST be true, suggested_reply MUST be null
5. If confidence < 0.70 → requires_human MUST be true (flag for review)
6. For conflicting signals (e.g. happy but wants refund): set sentiment="Mixed", resolve by prioritizing most urgent signal, document resolution in escalation_reason

## THREAD HISTORY (read fully before classifying):
${threadText}

## KNOWLEDGE BASE CONTEXT (cite source docs in your reply):
${ragText}

## EMAIL TO CLASSIFY:
From: ${currentEmail.sender}
Subject: ${currentEmail.subject}
Body: ${currentEmail.body}

## REQUIRED OUTPUT (JSON only, no markdown fences):
{
  "category": "Complaint|Inquiry|Bug Report|Feature Request|Compliance|Legal|Billing|Spam|Internal|Other",
  "sentiment": "Positive|Neutral|Negative|Mixed",
  "sentiment_score": 0.0,
  "urgency": "Critical|High|Medium|Low",
  "requires_human": false,
  "escalation_reason": null,
  "suggested_reply": null,
  "confidence": 0.0,
  "policy_docs_cited": [],
  "conflicting_signals_resolved": null,
  "detected_entities": {
    "order_ids": [],
    "ticket_ids": [],
    "monetary_amounts": [],
    "deadlines": [],
    "products_mentioned": []
  }
}`;

    const result = await model.generateContent(prompt);
    let response = result.response.text().trim();

    // Strip markdown fences if present
    response = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const parsed = JSON.parse(response);

    // Safety enforcement: override any LLM mistakes on critical rules
    const bodyLower = (currentEmail.body || "").toLowerCase();
    if (bodyLower.includes("ransomware") || (bodyLower.includes("btc") && bodyLower.includes("publish"))) {
      parsed.urgency = "Critical";
      parsed.requires_human = true;
      parsed.suggested_reply = null;
    }
    if (bodyLower.includes("gdpr") || bodyLower.includes("article 20")) {
      parsed.requires_human = true;
      parsed.suggested_reply = null;
      if (parsed.category === "Inquiry" || parsed.category === "Other") {
        parsed.category = "Compliance";
      }
    }
    if (parsed.urgency === "Critical") {
      parsed.requires_human = true;
      parsed.suggested_reply = null;
    }
    if (parsed.confidence < 0.7) {
      parsed.requires_human = true;
      parsed.escalation_reason = parsed.escalation_reason || "Low confidence classification — requires human review";
    }

    return JSON.stringify(parsed);
  } catch (error) {
    console.error("LLM classification failed, using heuristic fallback:", error.message);
    const fallback = heuristicClassification(`${currentEmail.subject} ${currentEmail.body}`);
    return JSON.stringify(fallback);
  }
};

module.exports = classifyEmail;
