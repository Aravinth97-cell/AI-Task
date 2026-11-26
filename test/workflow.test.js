import test from 'node:test';
import assert from 'node:assert/strict';
import { knowledgeFor } from '../src/knowledge.js';
import { triageTicket } from '../src/steps.js';
import { runWorkflow } from '../src/workflow.js';

// These tests run in mock mode and need no API key or network.
test('triage identifies billing and legal-risk tickets', async () => {
  const result = await triageTicket({ name: 'A', subject: 'Refund or lawyer', message: 'Refund me or my lawyer will contact you.' });
  assert.equal(result.data.category, 'billing');
  assert.equal(result.data.priority, 'urgent');
  assert.equal(result.data.needs_human, true);
});

test('knowledge routing returns safe fallback guidance', () => {
  assert.match(knowledgeFor('billing'), /do not promise refunds/i);
  assert.match(knowledgeFor('unknown'), /answer only what the ticket/i);
});

test('workflow routes an urgent ticket to human review', async () => {
  process.env.MOCK_LLM = 'true';
  const result = await runWorkflow({ name: 'Rahul', subject: 'Lawyer and refund', message: 'Refund now or my lawyer will contact you.' });
  assert.equal(result.decision, 'human-review');
  assert.equal(result.triage.needs_human, true);
  assert.ok(result.trace.length >= 4);
});
