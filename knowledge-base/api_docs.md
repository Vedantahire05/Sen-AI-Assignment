# API Documentation

## Authentication

All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_api_token>
```
Tokens are generated in: Dashboard → Settings → API Keys
Tokens do not expire but can be revoked at any time.

---

## Rate Limits by Tier

| Plan         | Requests/minute | Requests/day | Burst allowance |
|--------------|-----------------|--------------|-----------------|
| Starter      | 60              | 10,000       | None            |
| Professional | 500             | 100,000      | 2x for 30s      |
| Enterprise   | 10,000          | Unlimited    | Negotiated      |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1698765432
```

If rate limited, you receive HTTP 429. Retry after the value in `Retry-After` header.
Rate limit increase requests: contact Customer Success with your use case.

---

## API Versioning

### Current version: v2 (stable)
- Base URL: `https://api.company.com/v2/`
- Released: March 2023

### v1 Deprecation Timeline
- **v1 deprecated:** September 1, 2023
- **v1 sunset (shutdown):** March 1, 2024
- Migration guide: docs.company.com/v1-to-v2-migration

### v2 Breaking Changes from v1
1. Authentication header changed from `X-API-Key` to `Authorization: Bearer`
2. All timestamps now return ISO 8601 (UTC) instead of Unix timestamps
3. Pagination uses `cursor` instead of `page`/`offset`
4. `GET /users` renamed to `GET /contacts`
5. Error responses now use consistent envelope: `{ error_code, message, details }`

---

## Core Endpoints

### Contacts
```
GET    /v2/contacts              List all contacts (paginated)
GET    /v2/contacts/:email       Get contact profile
POST   /v2/contacts              Create contact
PATCH  /v2/contacts/:email       Update contact
DELETE /v2/contacts/:email       Delete contact (GDPR erasure)
```

### Emails / Threads
```
POST   /v2/emails/ingest         Ingest a new email
GET    /v2/emails/:id            Get email by ID
GET    /v2/threads/:email        Get full thread for a sender
GET    /v2/threads/:id/summary   Get AI-generated thread summary
```

### Agent
```
POST   /v2/agent/run/:emailId    Run triage agent on email
POST   /v2/agent/dry-run/:id     Preview agent plan without executing
GET    /v2/agent/runs/:emailId   Get all agent runs for an email
```

### Analytics
```
GET    /v2/analytics/sentiment-trend    Sentiment over time
GET    /v2/analytics/categories         Category distribution
GET    /v2/analytics/at-risk            High churn risk accounts
GET    /v2/analytics/agent-performance  Agent auto-reply & escalation rates
```

### Knowledge Base
```
GET    /v2/rag/search?q=...      Debug: search KB and return chunks + scores
```

---

## Error Envelope

All errors return a consistent structure:
```json
{
  "error_code": "CONTACT_NOT_FOUND",
  "message": "No contact found with email user@example.com",
  "details": { "email": "user@example.com" }
}
```

Common error codes:
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Missing or invalid fields |
| `DUPLICATE_MESSAGE` | 409 | message_id already ingested |
| `CONTACT_NOT_FOUND` | 404 | Contact does not exist |
| `RATE_LIMITED` | 429 | Too many requests |
| `RAG_UNAVAILABLE` | 503 | Python RAG service unreachable |
| `AGENT_MAX_STEPS` | 200 | Agent hit 6-step limit; escalated |

---

## Webhooks (Enterprise only)

Subscribe to real-time events:
```
POST /v2/webhooks          Register a webhook URL
GET  /v2/webhooks          List registered webhooks
DELETE /v2/webhooks/:id    Remove webhook
```

Available events:
- `email.ingested` — new email received
- `email.classified` — AI classification complete
- `agent.escalated` — agent escalated to human
- `contact.churn_risk_high` — churn risk crossed 0.70 threshold
- `sla.breach_detected` — uptime SLA breached

Webhook payloads are signed with HMAC-SHA256. Verify using the `X-Webhook-Signature` header.