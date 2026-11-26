import './env.js';
import fs from 'node:fs/promises';

export async function queueForHuman(record) {
  const path = process.env.REVIEW_QUEUE || 'review_queue.jsonl';
  await fs.appendFile(path, `${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`, 'utf8');
}

export async function logTicket(record) {
  const path = process.env.TICKET_LOG || 'ticket_log.csv';
  const exists = await fs.access(path).then(() => true).catch(() => false);
  const header = 'timestamp,subject,category,priority,decision,ai_calls,total_ms,total_tokens\n';
  const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const row = [new Date().toISOString(), record.ticket.subject, record.triage.category, record.triage.priority, record.decision, record.trace.length, record.totalMs, record.trace.reduce((sum, s) => sum + s.inputTokens + s.outputTokens, 0)].map(csv).join(',') + '\n';
  await fs.appendFile(path, `${exists ? '' : header}${row}`, 'utf8');
}

// This demo intentionally does not send real email. It records the code decision only.
export function sendReply(reply) {
  console.log('\n--- DEMO AUTO-REPLY (not emailed) ---\n' + reply + '\n------------------------------------\n');
  return { sent: false, mode: 'demo-only' };
}
