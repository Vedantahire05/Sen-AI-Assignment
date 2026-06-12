import React, { useState } from 'react';
import { Button, Spinner, ConfidenceBar } from './UI';
import { api } from '../utils/api';
import { toast } from './UI';

const ACTION_ICONS = {
  get_thread_history: '🧵',
  search_knowledge_base: '🔍',
  get_contact_profile: '👤',
  check_account_status: '💳',
  draft_reply: '✏️',
  escalate_to_human: '🚨',
  create_internal_ticket: '🎫',
  flag_for_legal: '⚖️',
};

const FINAL_ACTION_STYLES = {
  AUTO_REPLY:        { color: 'var(--positive)', label: 'Auto-replied' },
  ESCALATE_HUMAN:    { color: 'var(--high)',     label: 'Escalated' },
  FLAG_LEGAL:        { color: 'var(--critical)', label: 'Legal flagged' },
  FLAG_SECURITY:     { color: 'var(--critical)', label: 'Security flagged' },
  GDPR_ACK:          { color: 'var(--mixed)',    label: 'GDPR acknowledged' },
  CREATE_TICKET:     { color: 'var(--medium)',   label: 'Ticket created' },
  IGNORE_SPAM:       { color: 'var(--text-muted)', label: 'Ignored (spam)' },
  MAX_STEPS_EXCEEDED:{ color: 'var(--high)',     label: 'Max steps — escalated' },
};

function Step({ step, index }) {
  const [open, setOpen] = useState(index === 0);
  const icon = ACTION_ICONS[step.action] || '⚙️';
  return (
    <div style={{
      borderLeft: '2px solid var(--border)', paddingLeft: 16, position: 'relative', marginLeft: 8,
    }}>
      {/* dot */}
      <div style={{
        position: 'absolute', left: -6, top: 4, width: 10, height: 10,
        borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-surface)',
      }} />

      <div
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '2px 0 10px' }}
      >
        <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Step {step.stepNumber}
            </span>
            <code style={{
              fontSize: 11, background: 'var(--bg-elevated)', padding: '1px 6px',
              borderRadius: 4, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
            }}>{step.action || step.plannedAction}</code>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, fontStyle: 'italic' }}>
            "{step.thought}"
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {step.actionInput && Object.keys(step.actionInput).length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Input</div>
              <pre style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '8px 12px', fontSize: 11,
                color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 120,
                fontFamily: 'var(--font-mono)', margin: 0,
              }}>{JSON.stringify(step.actionInput, null, 2)}</pre>
            </div>
          )}

          {step.observation && step.observation !== '[DRY RUN — not executed]' && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Observation</div>
              <pre style={{
                background: 'rgba(79,125,243,0.04)', border: '1px solid rgba(79,125,243,0.15)',
                borderRadius: 6, padding: '8px 12px', fontSize: 11,
                color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 140,
                fontFamily: 'var(--font-mono)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>{typeof step.observation === 'string' && step.observation.length > 600
                ? step.observation.slice(0, 600) + '…' : step.observation}</pre>
            </div>
          )}

          {step.note && (
            <div style={{ fontSize: 11, color: 'var(--medium)', fontStyle: 'italic' }}>⚠ {step.note}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentPanel({ emailId, emailUrgency }) {
  const [mode, setMode] = useState(null); // null | 'dry' | 'live'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async (dry) => {
    setLoading(true);
    setMode(dry ? 'dry' : 'live');
    try {
      const r = dry ? await api.agentDryRun(emailId) : await api.agentRun(emailId);
      setData(r);
      toast(dry ? 'Dry-run plan generated' : `Agent completed: ${r.agentRun?.finalAction}`, 'success');
    } catch (e) {
      toast(e.message, 'error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const trace = data?.agentRun?.reasoningTrace || data?.plannedSteps || [];
  const finalAction = data?.agentRun?.finalAction || data?.estimatedFinalAction;
  const fas = FINAL_ACTION_STYLES[finalAction];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button onClick={() => run(true)} disabled={loading} size="sm" variant="ghost" loading={loading && mode === 'dry'}>
          Dry-run plan
        </Button>
        <Button
          onClick={() => run(false)}
          disabled={loading || emailUrgency === 'Critical'}
          size="sm"
          loading={loading && mode === 'live'}
        >
          Run agent
        </Button>
        {emailUrgency === 'Critical' && (
          <span style={{ fontSize: 11, color: 'var(--critical)' }}>Critical — manual only</span>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
          <Spinner size={14} />
          {mode === 'dry' ? 'Planning…' : 'Agent running…'}
        </div>
      )}

      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'slide-in 0.2s ease' }}>
          {/* Summary bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '10px 14px', background: 'var(--bg-elevated)',
            border: `1px solid ${fas?.color || 'var(--border)'}25`,
            borderRadius: 'var(--radius)',
          }}>
            {mode === 'dry' && (
              <span style={{ fontSize: 11, color: 'var(--medium)', fontWeight: 600 }}>DRY RUN</span>
            )}
            {fas && (
              <span style={{ fontSize: 12, fontWeight: 600, color: fas.color }}>{fas.label}</span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {trace.length} step{trace.length !== 1 ? 's' : ''}
              {data?.agentRun?.maxStepsReached && ' (max reached)'}
            </span>
            {data?.agentRun?.proposedReply && (
              <span style={{ fontSize: 11, color: 'var(--positive)' }}>✓ Reply drafted</span>
            )}
          </div>

          {/* Proposed reply */}
          {data?.agentRun?.proposedReply && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Proposed reply</div>
              <div style={{
                background: 'rgba(76,175,130,0.04)', border: '1px solid rgba(76,175,130,0.2)',
                borderRadius: 'var(--radius)', padding: '10px 14px',
                fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7,
              }}>{data.agentRun.proposedReply}</div>
            </div>
          )}

          {/* Reasoning trace */}
          {trace.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Reasoning trace
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {trace.map((step, i) => <Step key={i} step={step} index={i} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
