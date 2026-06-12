/**
 * ReAct Agent — Thought → Action → Observation loop
 * Max 6 tool calls. Never auto-replies to Critical emails.
 */

const AgentRun = require("../models/AgentRun");
const AuditLog = require("../models/AuditLog");
const Email = require("../models/Email");
const Thread = require("../models/Thread");

const searchKnowledgeBase = require("../tools/searchKnowledgeBase");
const fetchThread = require("../tools/fetchThread");
const escalateCase = require("../tools/escalateCase");
const createTicket = require("../tools/createTicket");
const flagForLegal = require("../tools/flagForLegal");
const getContactProfile = require("../tools/getContactProfile");
const checkAccountStatus = require("../tools/checkAccountStatus");
const draftReply = require("../tools/draftReply");
const sendReply = require("../tools/sendReply");

const MAX_STEPS = 6;

// ── Tool dispatcher ────────────────────────────────────────────────────────────
async function dispatchTool(toolName, toolInput, email) {
  switch (toolName) {
    case "search_knowledge_base":
      return searchKnowledgeBase(toolInput.query);

    case "get_thread_history":
      return fetchThread(toolInput.sender_email || email.sender);

    case "get_contact_profile":
      return getContactProfile(toolInput.email || email.sender);

    case "check_account_status":
      return checkAccountStatus(toolInput.email || email.sender);

    case "draft_reply":
      return draftReply(toolInput.context, toolInput.tone, toolInput.policy_refs);

    case "escalate_to_human":
      return escalateCase(email, toolInput.reason || "Agent escalation", toolInput.priority || "High");

    case "create_internal_ticket":
      return createTicket(toolInput.title, toolInput.body, toolInput.assignee);

    case "flag_for_legal":
      return flagForLegal(email._id.toString(), toolInput.issue_type || "legal_threat");

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ── Decide which tools to invoke based on classification ──────────────────────
function buildAgentPlan(email, classification) {
  const steps = [];
  const body = (email.body || "").toLowerCase();
  const cat = (classification.category || "").toLowerCase();
  const urgency = (classification.urgency || "").toLowerCase();

  // Always start with thread history for context
  steps.push({
    thought: "Retrieve full thread history to understand conversation context before acting.",
    action: "get_thread_history",
    actionInput: { sender_email: email.sender },
  });

  // GDPR path
  if (body.includes("gdpr") || body.includes("article 20") || body.includes("data portability")) {
    steps.push({
      thought: "This is a GDPR data portability request — a legal obligation. Must search compliance KB.",
      action: "search_knowledge_base",
      actionInput: { query: "GDPR data portability Article 20 compliance DPA 30 day window" },
    });
    steps.push({
      thought: "Flagging as legal/compliance matter and creating an internal compliance ticket.",
      action: "flag_for_legal",
      actionInput: { issue_type: "gdpr_data_request" },
    });
    steps.push({
      thought: "Creating internal compliance ticket to track the 30-day statutory window.",
      action: "create_internal_ticket",
      actionInput: {
        title: `GDPR Article 20 Request — ${email.sender}`,
        body: `Sender: ${email.sender}\nSubject: ${email.subject}\nBody preview: ${(email.body || "").slice(0, 300)}\n\nStatutory deadline: 30 days from receipt.`,
        assignee: "compliance-team",
      },
    });
    steps.push({
      thought: "Drafting a statutory acknowledgment that cites the 30-day window. Must NOT be generic.",
      action: "draft_reply",
      actionInput: {
        context: `GDPR Article 20 data portability request from ${email.sender}`,
        tone: "formal_legal",
        policy_refs: ["compliance_faq", "escalation_matrix"],
      },
    });
    return steps;
  }

  // Ransomware / security threat — NEVER auto-reply, escalate immediately
  if (body.includes("ransomware") || body.includes("btc") || body.includes("publish data") || body.includes("bitcoin")) {
    steps.push({
      thought: "This is a ransomware/extortion threat. Immediate escalation to security. MUST NOT auto-reply.",
      action: "flag_for_legal",
      actionInput: { issue_type: "ransomware_threat" },
    });
    steps.push({
      thought: "Escalating to security team with high priority. No reply should be sent to attacker.",
      action: "escalate_to_human",
      actionInput: {
        reason: "Ransomware/extortion threat detected. Do NOT reply to sender.",
        priority: "Critical",
      },
    });
    return steps;
  }

  // Legal threat path
  if (cat === "legal" || body.includes("cease and desist") || body.includes("lawsuit") || body.includes("attorney")) {
    steps.push({
      thought: "Legal threat detected. Must flag for legal team and check account status.",
      action: "check_account_status",
      actionInput: { email: email.sender },
    });
    steps.push({
      thought: "Flagging for legal review.",
      action: "flag_for_legal",
      actionInput: { issue_type: "legal_threat" },
    });
    steps.push({
      thought: "Searching SLA policy for credit obligations in case of SLA breach claim.",
      action: "search_knowledge_base",
      actionInput: { query: "SLA breach credit calculation legal obligations enterprise" },
    });
    steps.push({
      thought: "Escalating to human with pre-filled brief. Critical urgency — no auto-reply.",
      action: "escalate_to_human",
      actionInput: { reason: "Legal threat requires human review", priority: "Critical" },
    });
    return steps;
  }

  // Complaint / churn / refund path
  if (cat === "complaint" || body.includes("refund") || body.includes("cancel") || body.includes("churn")) {
    steps.push({
      thought: "Complaint or refund request. Need to check if sender is VIP and get account value.",
      action: "get_contact_profile",
      actionInput: { email: email.sender },
    });
    steps.push({
      thought: "Searching refund policy and retention playbook for appropriate response.",
      action: "search_knowledge_base",
      actionInput: { query: "refund policy retention playbook churn credits exception process" },
    });
    if (body.includes("review") || body.includes("trustpilot") || body.includes("publicly")) {
      steps.push({
        thought: "Public review threat detected. Need to escalate with urgency and draft retention offer.",
        action: "escalate_to_human",
        actionInput: { reason: "Churn threat + public review threat. High reputation risk.", priority: "High" },
      });
    } else {
      steps.push({
        thought: "Drafting empathetic reply citing refund/retention policy.",
        action: "draft_reply",
        actionInput: {
          context: `Complaint/refund request from ${email.sender}: ${email.subject}`,
          tone: "empathetic",
          policy_refs: ["refund_policy", "escalation_matrix"],
        },
      });
    }
    return steps;
  }

  // SLA / P0 / outage path
  if (urgency === "critical" || body.includes("p0") || body.includes("outage") || body.includes("sla")) {
    steps.push({
      thought: "Critical/P0 issue. Checking account status and SLA obligations first.",
      action: "check_account_status",
      actionInput: { email: email.sender },
    });
    steps.push({
      thought: "Searching SLA policy for incident response obligations.",
      action: "search_knowledge_base",
      actionInput: { query: "P0 incident response SLA uptime credit RCA 24 hour" },
    });
    steps.push({
      thought: "Critical urgency — must escalate to human. No auto-reply allowed.",
      action: "escalate_to_human",
      actionInput: { reason: "P0/Critical urgency requires immediate human response.", priority: "Critical" },
    });
    return steps;
  }

  // Billing path
  if (cat === "billing" || body.includes("invoice") || body.includes("billing") || body.includes("pro-rata")) {
    steps.push({
      thought: "Billing question. Searching pricing policy for correct tier/pro-rata information.",
      action: "search_knowledge_base",
      actionInput: { query: "billing pro-rata pricing tier upgrade invoice" },
    });
    steps.push({
      thought: "Checking account status to confirm current tier.",
      action: "check_account_status",
      actionInput: { email: email.sender },
    });
    steps.push({
      thought: "Drafting reply with correct pricing information from KB.",
      action: "draft_reply",
      actionInput: {
        context: `Billing inquiry from ${email.sender}: ${email.subject}`,
        tone: "professional",
        policy_refs: ["pricing_policy"],
      },
    });
    return steps;
  }

  // Chatbot misinformation path
  if (body.includes("chatbot") || body.includes("bot told me") || body.includes("your ai said")) {
    steps.push({
      thought: "Chatbot gave wrong information. Must retrieve actual policy and acknowledge discrepancy carefully.",
      action: "search_knowledge_base",
      actionInput: { query: "refund policy actual terms chatbot discrepancy" },
    });
    steps.push({
      thought: "Escalating with context about what chatbot said vs actual policy. No legal liability admission.",
      action: "escalate_to_human",
      actionInput: { reason: "Chatbot misinformation — potential liability issue. Needs careful human response.", priority: "High" },
    });
    steps.push({
      thought: "Drafting empathetic holding reply that does not admit legal liability.",
      action: "draft_reply",
      actionInput: {
        context: `Customer received incorrect information from chatbot. Subject: ${email.subject}`,
        tone: "empathetic_no_liability",
        policy_refs: ["refund_policy", "escalation_matrix"],
      },
    });
    return steps;
  }

  // Generic inquiry — search KB then draft
  steps.push({
    thought: "General inquiry. Searching knowledge base for relevant context.",
    action: "search_knowledge_base",
    actionInput: { query: `${email.subject} ${(email.body || "").slice(0, 150)}` },
  });
  steps.push({
    thought: "Drafting helpful reply based on KB context.",
    action: "draft_reply",
    actionInput: {
      context: `General inquiry from ${email.sender}: ${email.subject}`,
      tone: "helpful",
      policy_refs: [],
    },
  });

  return steps;
}

// ── Main agent runner ─────────────────────────────────────────────────────────
const runAgent = async (email, classification, isDryRun = false) => {
  const plannedSteps = buildAgentPlan(email, classification);
  const reasoningTrace = [];
  let stepCount = 0;
  let finalAction = "ESCALATE_HUMAN";
  let finalDecision = "";
  let proposedReply = null;
  let escalationBrief = null;
  let maxStepsReached = false;

  for (const step of plannedSteps) {
    if (stepCount >= MAX_STEPS) {
      maxStepsReached = true;
      finalDecision = `Max steps (${MAX_STEPS}) reached. Escalating to human with reasoning summary.`;
      finalAction = "MAX_STEPS_EXCEEDED";
      break;
    }

    stepCount++;
    let observation = "";

    if (!isDryRun) {
      try {
        const result = await dispatchTool(step.action, step.actionInput, email);
        observation = typeof result === "string" ? result : JSON.stringify(result);

        // Capture reply from draft_reply tool
        if (step.action === "draft_reply" && result && result.reply) {
          proposedReply = result.reply;
        }
        // Capture escalation brief
        if (step.action === "escalate_to_human") {
          escalationBrief = `Escalated: ${step.actionInput.reason || "Human review required"}`;
        }
      } catch (err) {
        observation = `Tool error: ${err.message}`;
      }
    } else {
      observation = "[DRY RUN — not executed]";
    }

    reasoningTrace.push({
      stepNumber: stepCount,
      thought: step.thought,
      action: step.action,
      actionInput: step.actionInput,
      observation,
    });
  }

  // Determine final action from last planned step
  const lastStep = plannedSteps[plannedSteps.length - 1];
  if (!maxStepsReached) {
    if (lastStep.action === "draft_reply" && !classification.requires_human && classification.urgency !== "Critical") {
      finalAction = "AUTO_REPLY";
      finalDecision = "Email handled automatically with drafted reply.";
    } else if (lastStep.action === "flag_for_legal" || plannedSteps.some(s => s.action === "flag_for_legal")) {
      const flagStep = plannedSteps.find(s => s.action === "flag_for_legal");
      finalAction = flagStep?.actionInput?.issue_type?.includes("gdpr") ? "GDPR_ACK" : "FLAG_LEGAL";
      finalDecision = "Flagged for legal/compliance review.";
    } else if (plannedSteps.some(s => s.action === "escalate_to_human")) {
      finalAction = classification.urgency === "Critical" ? "FLAG_SECURITY" : "ESCALATE_HUMAN";
      finalDecision = "Escalated to human with full reasoning trace.";
    } else {
      finalAction = "AUTO_REPLY";
      finalDecision = "Handled automatically.";
    }
  }

  // Persist the run
  const agentRun = await AgentRun.create({
    emailId: email._id,
    reasoningTrace,
    finalDecision,
    finalAction,
    proposedReply,
    escalationBrief,
    totalSteps: stepCount,
    maxStepsReached,
    isDryRun,
    executedAt: isDryRun ? null : new Date(),
    // legacy fields
    thought: reasoningTrace[0]?.thought || "",
    action: finalAction,
    observation: reasoningTrace[reasoningTrace.length - 1]?.observation || "",
    toolUsed: reasoningTrace.map(s => s.action).join(","),
    result: { finalAction, finalDecision },
  });

  if (!isDryRun) {
    // Update email status
    const newStatus =
      finalAction === "AUTO_REPLY" ? "Replied"
      : finalAction === "FLAG_SECURITY" ? "Escalated"
      : finalAction === "IGNORE_SPAM" ? "Ignored"
      : "Escalated";

    await Email.findByIdAndUpdate(email._id, {
      status: newStatus,
      processingCompletedAt: new Date(),
    });

    // Audit log
    await AuditLog.create({
      entityType: "Email",
      entityId: email._id.toString(),
      action: finalAction,
      performedBy: "Agent",
      diff: { finalDecision, totalSteps: stepCount, isDryRun },
    });
  }

  return agentRun;
};

module.exports = runAgent;
