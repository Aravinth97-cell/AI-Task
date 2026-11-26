import { performance } from 'node:perf_hooks';
import { knowledgeFor } from './knowledge.js';
import { triageTicket, draftReply, writeInternalNote, reviewReply, reviseReply } from './steps.js';
import { queueForHuman, logTicket, sendReply } from './actions.js';

const MAX_REVISIONS = 1;

export async function runWorkflow(input) {
  const started = performance.now();
  const ticket = {
    name: String(input.name || 'Customer').trim().slice(0, 100),
    email: String(input.email || '').trim().slice(0, 254),
    subject: String(input.subject || '').trim().slice(0, 200),
    message: String(input.message || '').trim().slice(0, 6000),
  };
  if (!ticket.name || !ticket.subject || !ticket.message) throw new Error('Name, subject, and message are required.');

  const trace = [];
  const triageStep = await triageTicket(ticket);
  const triage = triageStep.data;
  trace.push(triageStep.trace);
  const knowledge = knowledgeFor(triage.category);

  // The reply and internal note are independent, so run them concurrently.
  const [draftStep, noteStep] = await Promise.all([
    draftReply(ticket, triage, knowledge),
    writeInternalNote(ticket, triage),
  ]);
  let reply = draftStep.data;
  const internalNote = noteStep.data;
  trace.push(draftStep.trace, noteStep.trace);

  let reviewStep = await reviewReply(ticket, triage, reply, knowledge);
  let review = reviewStep.data;
  trace.push(reviewStep.trace);
  let revisions = 0;

  if (!review.approved && revisions < MAX_REVISIONS) {
    const revisedStep = await reviseReply(ticket, reply, review, knowledge);
    reply = revisedStep.data;
    trace.push(revisedStep.trace);
    revisions += 1;
    reviewStep = await reviewReply(ticket, triage, reply, knowledge);
    review = reviewStep.data;
    trace.push(reviewStep.trace);
  }

  // Deterministic code—not the LLM—decides whether the reply may be auto-approved.
  const canAutoSend = review.approved && !triage.needs_human && triage.priority !== 'urgent';
  const decision = canAutoSend ? 'auto-approved-demo' : 'human-review';
  let why = canAutoSend ? 'Reply passed review and the ticket does not require a human.' : 'Human review is required because the ticket is urgent/high-risk, flagged by triage, or the reply did not pass review.';
  const result = { ticket, triage, reply, internalNote, review, revisions, decision, why, trace, totalMs: Math.round(performance.now() - started) };

  if (canAutoSend) sendReply(reply);
  else await queueForHuman(result);
  await logTicket(result);
  return result;
}
