# Escalation Matrix

## Security Incidents

| Trigger | Escalation Path | Response Time |
|---------|----------------|---------------|
| Ransomware / extortion threat | Security Team → CISO → CEO | Immediate — do NOT reply to attacker |
| Suspicious login / unauthorized access | Security Team → affected customer notification | Within 15 minutes |
| Data breach (confirmed) | Security Team → CISO → Legal → CEO → customer notification | Within 72 hours |
| Suspected data leak | Security Team → CISO | Within 30 minutes |

**Critical rule:** Never auto-reply to security threat emails. Never acknowledge receipt to the attacker.

---

## Legal Threats

| Trigger | Escalation Path | Response Time |
|---------|----------------|---------------|
| Cease and desist letter | Legal Team → VP Engineering (if technical) | Same business day |
| Lawsuit threat | Legal Team → CEO | Within 2 hours |
| SLA breach claim > $10,000 | Legal Team → Finance → CEO | Within 4 hours |
| Regulatory complaint | Legal Team → Compliance | Same business day |
| GDPR Article 20 portability request | Compliance Team → Legal review | 72h acknowledgement; 30-day fulfillment |

**Critical rule:** Do not admit liability in any written communication before legal review.

---

## VIP Churn Risk

| Trigger | Escalation Path | Response Time |
|---------|----------------|---------------|
| Enterprise customer signals churn | VP Customer Success → dedicated account manager | Within 1 business hour |
| Account value > $50,000 cancellation risk | VP Customer Success → CEO notification | Within 1 hour |
| 3+ consecutive negative emails, no reply | Customer Success Manager → Senior CSM | Within 2 business hours |
| Customer unresponsive for >48h after complaint | Senior CSM → VP Customer Success | Same day |

---

## Public Review / Reputation Threats

| Trigger | Escalation Path | Response Time |
|---------|----------------|---------------|
| Trustpilot / G2 review threat | Retention Team → Customer Success Manager | Within 2 hours |
| Social media escalation threat | Retention Team → Head of Marketing | Within 1 hour |
| Press / journalist inquiry | Head of Marketing → CEO → Legal | Within 30 minutes |
| Public tweet / post already published | Head of Marketing → CEO | Immediate |
| PR crisis (viral negative coverage) | CEO → Head of Marketing → Legal → all-hands | Immediate |

**Protocol:** When a public review threat is detected, immediately check current G2 and Trustpilot scores for context before responding.

---

## GDPR / Compliance Requests

| Trigger | Escalation Path | Response Time |
|---------|----------------|---------------|
| GDPR Article 20 (data portability) | Compliance Team → Legal | 72h acknowledgement; 30 days to fulfill |
| GDPR Article 17 (erasure) | Compliance Team | 30 days |
| HIPAA BAA request | Compliance Team → Enterprise Sales | 3–5 business days |
| SOC 2 audit report request | Security Team (NDA required) | 3 business days |
| Regulatory audit (government) | Legal Team — do not respond without legal | Same day |

---

## P0 / Critical Outage

| Trigger | Escalation Path | Response Time |
|---------|----------------|---------------|
| P0 — platform fully down | On-call Engineering → Engineering Lead → VP Eng → CEO | 15 min response; 4h resolution |
| P1 — major feature degraded | On-call Engineering → Engineering Lead | 1 hour response |
| SLA breach detected | Customer Success Manager → affected Enterprise accounts | Within 1 hour of detection |
| Enterprise customer reports outage | Support → Engineering → dedicated account manager | Within 15 minutes |

---

## Billing / Financial

| Trigger | Escalation Path | Response Time |
|---------|----------------|---------------|
| Disputed charge > $500 | Finance Team → Customer Success | 2 business days |
| Refund exception request | Support Manager approval required | 3 business days |
| Overdue invoice > 30 days | Finance → Account Manager → VP Customer Success | Same day |
| Annual contract renewal dispute | VP Customer Success → Finance → Legal | 1 week before renewal date |

---

## Chatbot / AI Misinformation

| Trigger | Escalation Path | Response Time |
|---------|----------------|---------------|
| Customer reports incorrect info from chatbot | Support → retrieve actual policy → escalate to human | Within 2 hours |
| Chatbot caused financial harm | Support → Legal → VP Customer Success | Within 1 hour |

**Protocol:** Do not admit that the chatbot's response constitutes a legal commitment. Retrieve actual policy via RAG and cite it explicitly. Escalate to human with: (1) what the chatbot said, (2) what policy actually says, (3) customer impact.