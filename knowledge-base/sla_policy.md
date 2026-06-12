# SLA Policy

## Uptime Guarantee by Tier
| Plan         | Uptime SLA | Period  |
|--------------|------------|---------|
| Starter      | None       | —       |
| Professional | 99.5%      | Monthly |
| Enterprise   | 99.9%      | Monthly |

Scheduled maintenance (48h notice) is excluded from downtime calculation.

## Incident Severity

### P0 — Critical (Platform Down)
- Initial response: **15 minutes**
- Resolution target: **4 hours**
- RCA delivery: **within 24 hours** of resolution
- Status page update: 5 min; Enterprise email: 15 min

### P1 — High (Major Feature Degraded)
- Response: 1 hour | Resolution: 8 hours | RCA: 48 hours

### P2 — Medium (Minor Degradation)
- Response: 4 hours | Resolution: 3 business days

### P3 — Low
- Response: 1 business day | Resolution: next release

## Service Credit Calculation

Credits apply to next invoice. Credits are NOT cash refunds.

### Professional Plan
| Uptime          | Credit              |
|-----------------|---------------------|
| 99.0% – 99.5%   | 10% of monthly fee  |
| 95.0% – 99.0%   | 20% of monthly fee  |
| Below 95.0%     | 30% of monthly fee  |

### Enterprise Plan
| Uptime          | Credit              |
|-----------------|---------------------|
| 99.5% – 99.9%   | 10% of monthly fee  |
| 99.0% – 99.5%   | 25% of monthly fee  |
| Below 99.0%     | 50% of monthly fee  |

**Formula:**

**Example:** Enterprise at $2,000/month, 98.8% uptime → $2,000 × 25% = **$500 credit**

## Credit Request Process
1. Submit within **30 days** of incident
2. Email: support@company.com, subject: "SLA Credit Request — [Incident ID]"
3. Reviewed within 5 business days; applied to next cycle

## Enterprise P0 Escalation Path
1. Automated alert → On-call engineering (PagerDuty)
2. 15 min → Engineering Lead + VP Engineering
3. 30 min → CEO + Enterprise account managers
4. 1 hour unresolved → Major incident declared on status page
5. Post-resolution → RCA to all Enterprise customers within 24h

## Legal Threshold
If claimed damages exceed **$10,000**, escalate to legal before any credit offer. Do not admit liability in writing.

## SLA Exclusions
- Customer infrastructure failures
- Force majeure
- Scheduled maintenance (48h+ notice)
- Customer rate limit violations