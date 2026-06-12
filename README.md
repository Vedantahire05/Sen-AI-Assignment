# SenAI CRM Intelligence Platform

> AI-powered Customer Relationship Management with autonomous triage agent, RAG pipeline, and real-time email operations.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Vedantahire05/Sen-AI-Assignment) &nbsp; **[github.com/Vedantahire05/Sen-AI-Assignment](https://github.com/Vedantahire05/Sen-AI-Assignment)**

---

## Architecture Overview

```
Email Input
    │
    ▼
POST /api/ingest
    │
    ├─► Schema Validation (rejects malformed payloads with descriptive errors)
    ├─► Body Sanitization (HTML entity decode, truncate >10k chars)
    ├─► Deduplication (idempotent by message_id — re-delivery safe)
    ├─► Thread Linking (create or attach to existing thread)
    ├─► Contact Upsert
    ├─► Heuristic Pre-filter (<10ms sync)
    │       ├─ Spam → status=Ignored
    │       ├─ Security → status=Escalated, Critical
    │       └─ Priority Score (0–100+)
    │
    ▼
Job queued → Returns job_id immediately (202 Accepted)
    │
    ▼ [background async]
    │
    ├─► Thread History Fetch (full context for LLM)
    ├─► RAG Retrieval (top-3 KB chunks via ChromaDB)
    │
    ▼
LLM Classification (Gemini 2.5 Flash)
    │   - Full thread history in context
    │   - RAG policy docs cited
    │   - Safety enforcement (Critical always → requires_human)
    │   - Conflicting signal resolution
    │   - confidence < 0.70 → auto-flag for human review
    │
    ▼
ReAct Agent (max 6 tool calls)
    │
    ├─ Thought → Action → Observation × N steps
    │
    ├─ Tools available:
    │   ├─ search_knowledge_base(query)     → RAG retrieval
    │   ├─ get_thread_history(sender)       → full email history
    │   ├─ get_contact_profile(email)       → VIP status, account value
    │   ├─ check_account_status(email)      → tier, billing, churn risk
    │   ├─ draft_reply(context, tone, refs) → RAG-grounded reply
    │   ├─ escalate_to_human(reason, prio)  → human handoff
    │   ├─ create_internal_ticket(...)      → ticket creation
    │   └─ flag_for_legal(issue_type)       → legal/compliance routing
    │
    ├─ Special paths:
    │   ├─ GDPR → flag_for_legal + create_ticket + draft_ack
    │   ├─ Ransomware → flag_for_legal + escalate (NEVER auto-reply)
    │   ├─ Legal threat → flag_for_legal + check_account + escalate
    │   ├─ Complaint/churn → get_contact + search_KB + draft or escalate
    │   └─ Chatbot misinformation → search_KB + escalate + draft_no_liability
    │
    ▼
DB: Email updated, AgentRun stored (full ReAct trace), AuditLog entry
WebSocket: events pushed to connected clients
```

---

## Tech Stack & Decisions

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Node.js + Express | Async I/O fits email queue model well; team familiarity |
| Database | MongoDB (Mongoose) | Flexible schema for evolving email/entity models; JSON-native |
| Vector DB | ChromaDB (Python service) | Simple local deployment; good for prototyping; swap to Pinecone at scale |
| Embeddings | Sentence Transformers via ChromaDB | Free, no API key required; sufficient for policy docs retrieval |
| LLM | Google Gemini 2.5 Flash | Fast, cost-effective for classification; 1M context window for long threads |
| Real-time | Socket.IO | Simple WebSocket abstraction; handles reconnection |
| HTTP client | Axios | For internal RAG service calls and web scraping |

### Trade-offs Documented

**MongoDB vs PostgreSQL:** MongoDB was chosen for faster schema iteration during development. At production scale, PostgreSQL with pgvector would eliminate the need for a separate Python vector service, reduce infrastructure complexity, and enable ACID transactions for email+thread+contact upserts. Migration path: keep the same Mongoose schemas and translate to Sequelize.

**Gemini vs OpenAI:** Gemini 2.5 Flash has a 1M token context window, which is critical for long email threads. GPT-4o has better instruction following but costs ~10x more per token. For classification at scale, Gemini is the pragmatic choice; for reply drafting on high-value tickets, a more expensive model could be selectively used.

**Async job model vs sync:** Returning a `job_id` immediately and processing in the background keeps the ingest endpoint fast (<50ms) regardless of LLM latency. The tradeoff is that clients must poll `/api/status/:jobId` or listen on WebSocket. For a real production system, a proper queue (BullMQ + Redis) would replace the fire-and-forget pattern.

**Conflicting Signal Resolution:** When an email contains mixed signals (e.g. "I love the product but want a refund"), the classifier prompt instructs the LLM to: (1) set sentiment="Mixed", (2) prioritize the most operationally urgent signal (refund request outweighs positive sentiment), (3) document the resolution in `conflicting_signals_resolved`. This is then safety-checked post-LLM to ensure Critical urgency and legal signals always force `requires_human=true`.

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

### 1. Backend
```bash
cd backend
cp .env.example .env   # fill in GEMINI_API_KEY, MONGO_URI
npm install
npm run dev
```

### 2. RAG / AI Service (Python)
```bash
cd ai-service
pip install -r requirements.txt
python ingest_kb.py     # seeds ChromaDB with knowledge-base/*.md
python main.py          # starts FastAPI on port 8000
```

### 3. Seed Knowledge Base
The 6 policy documents in `knowledge-base/` are chunked into 300–500 token segments with overlap and embedded. Run `python ingest_kb.py` to seed.

### 4. Stream the Dataset
```bash
# Stream at 1 email/sec (dev)
curl -X POST http://localhost:5000/api/stream/start \
  -H "Content-Type: application/json" \
  -d '{"speed": 1}'

# Stream at 5/sec (load test)
curl -X POST http://localhost:5000/api/stream/start \
  -H "Content-Type: application/json" \
  -d '{"speed": 5, "limit": 20}'
```

### 5. Environment Variables
```env
MONGO_URI=mongodb://localhost:27017/senai-crm
GEMINI_API_KEY=your_key_here
PORT=5000
RAG_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

---

## Special Scenario Handling

### GDPR Request (msg_052)
- Heuristic detects `gdpr` / `article 20` → forces `requires_human=true`, `category=Compliance`
- Agent path: `get_thread_history` → `search_knowledge_base("GDPR data portability")` → `flag_for_legal` → `create_internal_ticket` → `draft_reply(formal_legal)`
- Auto-reply suppressed — only a statutory acknowledgment is drafted for human approval
- 30-day deadline extracted as detected entity

### Ransomware Threat (msg_038)
- Heuristic flags `btc` + `publish data` → `urgency=Critical`, `status=Escalated` immediately
- Agent: `flag_for_legal(ransomware_threat)` → `escalate_to_human(Critical)`
- **NEVER auto-replies** to attacker — enforced at both heuristic and agent level

### Chatbot Misinformation (msg_056)
- Agent detects chatbot references → `search_knowledge_base` for actual policy → `escalate_to_human` with discrepancy summary → `draft_reply(empathetic_no_liability)`
- Reply explicitly avoids admitting legal liability while acknowledging the customer's frustration

### Karen Churn Threat (msg_033)
- Sentiment trend query detects 3+ consecutive negative emails → `escalation_alert=true`
- Churn risk score auto-updated on trend fetch
- Intelligence enrichment triggered (review mention + Complaint + High urgency)
- Agent: `get_contact_profile` → `search_knowledge_base("refund retention playbook")` → `escalate_to_human`

### Bob SLA Escalation (msg_060)
- Agent: `get_thread_history` (4 prior emails) → `check_account_status` → `search_knowledge_base("SLA breach credit")` → `flag_for_legal` → `draft_reply` → `escalate_to_human` with pre-filled brief

### Alice Pro-Rata Billing (msg_041)
- Full 5-email thread history loaded before classification
- RAG retrieves correct pricing tier (non-profit discount) based on thread context
- Reply cites `pricing_policy` by name

---

## API Reference

See `backend/openapi.yaml` for the full OpenAPI 3.0 spec.

Quick reference:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ingest` | Ingest email → returns `job_id` |
| GET | `/api/status/:jobId` | Poll async processing status |
| POST | `/api/stream/start` | Replay dataset at configurable speed |
| GET | `/threads/:email` | Full thread with emails + agent logs |
| POST | `/agent/run/:emailId` | Run ReAct agent (executes tools) |
| POST | `/agent/dry-run/:emailId` | Plan without executing (shows reasoning trace) |
| GET | `/analytics/sentiment-trend` | Time-series with moving avg + escalation alert |
| GET | `/analytics/at-risk` | High churn risk contacts + stale critical emails |
| GET | `/analytics/agent-performance` | Auto-reply rate, escalation rate, avg confidence |
| GET | `/rag/search?q=...` | Debug KB retrieval + similarity scores |
| GET | `/intelligence/reputation` | Live G2/Trustpilot scrape (6h cache) |
| POST | `/intelligence/enrich` | Conditional web scraping for email context |
| GET | `/contacts/:email` | Contact profile with live churn risk score |
| GET | `/audit/:type/:id` | Full audit trail for any entity |

---

## WebSocket Events

Connect to `ws://localhost:5000` with Socket.IO:

| Event | Direction | Payload |
|---|---|---|
| `email_ingested` | Server → Client | `{ index, total, sender, subject, priorityScore, heuristic }` |
| `stream_complete` | Server → Client | `{ total }` |
| `email_ingest_error` | Server → Client | `{ index, messageId, error }` |
| `subscribe` | Client → Server | Room name (e.g. `"inbox"`) |

---

## Database Schema

See `backend/src/models/` for Mongoose schemas. Key fields:

- `Email`: messageId (unique), threadId, sender, body, sentiment_score, category, urgency, requiresHuman, confidence, detectedEntities, status
- `AgentRun`: emailId, reasoningTrace (array of ReAct steps), finalAction, totalSteps, isDryRun
- `Contact`: email, churnRiskScore (auto-computed), accountValue, subscriptionTier, status
- `WebCache`: source_url, scraped_data, expires_at (TTL index)
- `JobStatus`: jobId, status (queued→processing→classified→agent_running→completed/failed)
- `AuditLog`: entityType, entityId, action, performedBy, diff (full change object)

---

## Known Limitations

1. **No persistent queue**: The async job processing uses `setTimeout`-style fire-and-forget. In production, replace with BullMQ + Redis for retries, dead-letter queues, and concurrency control.
2. **Web scraping**: G2/Trustpilot URLs are illustrative; actual pages may require Playwright/Puppeteer for JS-rendered content. The current implementation fetches HTML and extracts metadata.
3. **Single RAG service**: The Python ChromaDB service is a sidecar. At scale, this should be a proper vector DB (Pinecone, pgvector) with horizontal scaling.
4. **No auth layer**: The API has no authentication. In production, add JWT + API key middleware before any endpoint.
5. **LLM safety enforcement**: Post-LLM safety checks (Critical → requires_human) provide a safety net but the primary defense is the prompt. Prompt injection via email body is a known risk that should be mitigated with input sanitization.