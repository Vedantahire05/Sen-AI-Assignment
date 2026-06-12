# System Architecture

## Full System Flow

```mermaid
flowchart TD
    A[Email Source\nemail-data-advanced.json] -->|POST /api/ingest| B[Ingest Service\nSchema validation · Dedup · Thread linking]
    B --> C{Heuristic\nPre-filter\nLayer 1}
    C -->|Spam detected| D[Spam Sink\nStatus: Ignored\nNever auto-replied]
    C -->|Internal domain| E[Internal Queue\n@internal.com]
    C -->|Ransomware / Security| F[Security Queue\nCritical · No reply ever]
    C -->|Clean email| G[Priority Queue\nKeyword urgency score]

    G --> H[LLM Classifier\nLayer 2 — Gemini API]
    H <-->|Top-3 chunks| I[RAG Pipeline\nPython FastAPI service]
    I <-->|Vector search| J[(ChromaDB\nVector Store)]
    I <-->|6 policy docs| K[Knowledge Base\npricing · sla · refund\napi · compliance · escalation]

    H -->|Structured JSON output| L[Classification Result\ncategory · sentiment · urgency\nrequires_human · confidence]
    L --> M[Sentiment Tracker\nLayer 3\nMoving average · Escalation alert]
    M --> N[ReAct Agent\nThought → Action → Observation\nMax 6 tool calls]

    N --> O{Tool Dispatcher}
    O --> P[search_knowledge_base]
    O --> Q[get_thread_history]
    O --> R[get_contact_profile]
    O --> S[check_account_status]
    O --> T[draft_reply]
    O --> U[escalate_to_human]
    O --> V[create_internal_ticket]
    O --> W[flag_for_legal]

    P --> I
    Q --> X[(MongoDB\nPrimary Store)]
    R --> X
    S --> X
    T --> AA[Gemini API]
    U --> X
    V --> X
    W --> X

    N -->|Reasoning trace| X
    L --> X
    B --> X

    X <-->|REST API| Y[Express.js API\n15 endpoints · OpenAPI spec]
    Y <-->|HTTP + WebSocket| Z[React Frontend\nMission Control · Thread Workspace\nAnalytics · RAG Debug]

    N -.->|Trigger on reputation risk| AB[Web Intelligence\nG2 · Trustpilot scraper\n6h cache]
    AB --> X
```

## Component Breakdown

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Ingest | Node.js / Express | Schema validation, dedup via `message_id`, thread linking, priority scoring |
| Heuristic Filter | Custom JS (sync, <10ms) | Spam blocklist, urgency keywords, security flagging, internal routing |
| LLM Classifier | Gemini API | Multi-dimensional classification with structured JSON output |
| RAG Pipeline | Python FastAPI + ChromaDB | Semantic retrieval of policy chunks; injects top-3 into LLM context |
| Embeddings | `sentence-transformers` (all-MiniLM-L6-v2) | Local embeddings, no external API cost |
| Agent | ReAct loop (Node.js) | Multi-step reasoning with 10 tools, max 6 calls, dry-run mode |
| Database | MongoDB (Mongoose) | All persistent state: emails, threads, contacts, agent runs, audit logs |
| Web Intelligence | Puppeteer + node-cache | Async public sentiment scraping with 6h TTL cache |
| API | Express.js + Swagger UI | 15 REST endpoints with consistent error envelopes |
| Frontend | React (CRA) + Recharts | 4-page SPA: inbox, analytics, contacts, RAG debug |
| Real-time | Socket.io | WebSocket push for live email events and stream progress |

---

## ER Diagram (MongoDB Collections)

```mermaid
erDiagram
    EMAILS {
        ObjectId _id PK
        string message_id UK
        string thread_id FK
        string sender
        string subject
        string body
        datetime timestamp
        string category
        string sentiment
        float sentiment_score
        string urgency
        bool requires_human
        float confidence
        string escalation_reason
        string suggested_reply
        json detected_entities
        string status
        string processing_job_id FK
        datetime processing_completed_at
    }

    THREADS {
        ObjectId _id PK
        string thread_id UK
        string subject
        string sender_email FK
        datetime first_seen_at
        datetime last_updated_at
        string status
        string assigned_to
    }

    CONTACTS {
        ObjectId _id PK
        string email UK
        string name
        string company
        string status
        float account_value
        float churn_risk_score
        int open_tickets
        string subscription_tier
        int overdue_invoices
        datetime last_contact_at
    }

    AGENT_RUNS {
        ObjectId _id PK
        ObjectId email_id FK
        json reasoning_trace
        string final_action
        string final_decision
        string proposed_reply
        string escalation_brief
        int total_steps
        bool max_steps_reached
        bool is_dry_run
        datetime executed_at
    }

    ACTIONS {
        ObjectId _id PK
        ObjectId email_id FK
        string action_type
        string proposed_content
        bool is_approved
        string approved_by
        datetime executed_at
        json agent_reasoning_log
    }

    DRAFTS {
        ObjectId _id PK
        string email_id FK
        string draft_text
        string status
        string approved_by
        datetime approved_at
    }

    JOB_STATUS {
        ObjectId _id PK
        string job_id UK
        string email_id FK
        string status
        json result
        string error
        datetime started_at
        datetime completed_at
    }

    AUDIT_LOG {
        ObjectId _id PK
        string entity_type
        string entity_id FK
        string action
        string performed_by
        datetime timestamp
        json diff
    }

    WEB_CACHE {
        ObjectId _id PK
        string source_url
        string target_entity UK
        json scraped_data
        datetime scraped_at
        datetime expires_at
    }

    EMAILS ||--o{ AGENT_RUNS : "triggers"
    EMAILS ||--o{ ACTIONS : "generates"
    EMAILS ||--o{ DRAFTS : "produces"
    EMAILS ||--o{ JOB_STATUS : "tracked by"
    EMAILS }o--|| THREADS : "belongs to"
    THREADS }o--|| CONTACTS : "from sender"
    EMAILS ||--o{ AUDIT_LOG : "audited in"
    ACTIONS ||--o{ AUDIT_LOG : "audited in"
    DRAFTS ||--o{ AUDIT_LOG : "audited in"
```

---

## Architectural Decisions & Trade-offs

### Why MongoDB over PostgreSQL?
The email data is document-oriented with variable JSON fields (`detected_entities`, `agent_reasoning_log`). MongoDB's flexible schema avoids complex migrations as the AI output schema evolves. The trade-off is no native vector search — solved by delegating vector operations to ChromaDB via the Python ai-service.

### Why a separate Python service for RAG?
The best embedding models (`sentence-transformers`) and vector DBs (ChromaDB) have mature Python SDKs. Running a FastAPI sidecar keeps the Node.js core clean while giving access to the Python ML ecosystem. Communication is HTTP-local, adding <5ms latency.

### Why Gemini over GPT-4?
Gemini 1.5 Pro offers a 1M token context window — ideal for injecting full thread history + RAG chunks into a single prompt without truncation. Gemini Flash is used for high-volume classification (faster, cheaper) while Pro is reserved for complex agent reasoning.

### Why ReAct pattern over simple chain?
ReAct (Reason + Act) produces an explicit Thought → Action → Observation trace per step. This satisfies the spec requirement for a logged reasoning trace, enables dry-run mode naturally, and makes agent decisions auditable and debuggable in the UI.

### Conflicting Signal Resolution Strategy
When an email contains mixed signals (e.g., "I love the product but want a refund"), the classifier resolves by **priority ordering**: Legal > Security > Complaint > Billing > Inquiry. The highest-priority signal determines `category` and `urgency`. The mixed nature is captured in `sentiment: "Mixed"` and a lower `confidence` score. Confidence below 0.70 automatically sets `requires_human: true`.

### Known Limitations
- Web scraper returns simulated data in test mode (real Trustpilot scraping would require headless browser + proxy rotation to avoid rate limits)
- ChromaDB runs in-process; for production, would use a persistent Chroma server or migrate to Pinecone
- No message queue (Bull/RabbitMQ) — agent runs are synchronous; at scale would be async workers
- Agent plan is deterministic (rule-based routing) rather than LLM-driven tool selection; the trade-off is reliability and predictability over flexibility
