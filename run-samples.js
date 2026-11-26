import './src/env.js';
import { runWorkflow } from './src/workflow.js';

const samples = [
  { name: 'Priya Raman', email: 'priya@example.com', subject: 'Charged twice this month', message: 'I was charged twice for my subscription this month. Can you please check this?' },
  { name: 'Arjun Mehta', email: 'arjun@example.com', subject: 'App keeps crashing', message: 'The app crashes whenever I open a notebook. I cannot work like this.' },
  { name: 'Meena Iyer', email: 'meena@example.com', subject: 'Dark mode suggestion', message: 'It would be nice to have a dark mode for late-night writing.' },
  { name: 'Rahul Verma', email: 'rahul@example.com', subject: 'Refund or lawyer', message: 'Refund me today or my lawyer will contact you. This is unacceptable!' },
  { name: 'Sunita Sharma', email: 'sunita@example.com', subject: 'Cannot log in', message: 'I cannot log in to my account and need help resetting my password.' },
];
const only = Number(process.argv[2]);
const chosen = only ? [samples[only - 1]].filter(Boolean) : samples;
if (!chosen.length) { console.error(`Choose sample number 1-${samples.length}.`); process.exitCode = 1; }
for (const [i, ticket] of chosen.entries()) {
  console.log(`\n========== Sample ${only || i + 1}: ${ticket.subject} ==========`);
  const result = await runWorkflow(ticket);
  console.log(JSON.stringify({ triage: result.triage, decision: result.decision, review: result.review, revisions: result.revisions, trace: result.trace, totalMs: result.totalMs }, null, 2));
}
console.log('\nFinished. Check ticket_log.csv and review_queue.jsonl.');
