import './src/env.js';
import express from 'express';
import { runWorkflow } from './src/workflow.js';

const app = express();
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function resultHtml(r) {
  const chips = [r.triage.category, r.triage.priority, r.triage.sentiment, r.triage.language, ...(r.triage.needs_human ? ['needs human'] : [])].map((c) => `<span class="chip">${esc(c)}</span>`).join('');
  const rows = r.trace.map((s) => `<tr><td>${esc(s.step)}</td><td>${esc(s.model)}</td><td>${s.ms} ms</td><td>${s.inputTokens + s.outputTokens}</td></tr>`).join('');
  const safe = r.decision === 'auto-approved-demo';
  return `<section class="result"><div class="decision ${safe ? 'ok' : 'human'}"><b>${safe ? 'Auto-approved (demo only)' : 'Queued for human review'}</b><br>${esc(r.why)}</div><p>${chips}</p><h3>Suggested reply ${r.revisions ? `<small>(revised ${r.revisions} time)</small>` : ''}</h3><pre>${esc(r.reply)}</pre><h3>Review result</h3><p>${r.review.approved ? 'Approved' : 'Rejected'} · score ${esc(r.review.score)}${r.review.issues.length ? '<br>' + r.review.issues.map(esc).join('<br>') : ''}</p><h3>Internal note</h3><pre>${esc(r.internalNote)}</pre><h3>Workflow trace</h3><table><tr><th>Step</th><th>Model</th><th>Time</th><th>Tokens</th></tr>${rows}</table><p class="muted">Total ${r.totalMs} ms · ${r.trace.length} AI calls/steps</p><p class="muted">Demo safety: no email is sent. Human-review tickets are written to review_queue.jsonl.</p></section>`;
}

function page(body = '') {
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI Support Workflow</title><style>
 body{font-family:system-ui,sans-serif;background:#f4f1ea;color:#16202c;margin:0}main{max-width:760px;margin:32px auto;background:#fff;padding:28px 32px;border-radius:12px;border:1px solid #ddd8cf}h1{margin:0 0 6px}h3{margin:22px 0 6px;color:#1e5e5a}.muted,.sub{color:#68727d}label{display:block;font-weight:600;margin:14px 0 6px}input,textarea{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d4d0c8;border-radius:6px;font:inherit}button{margin-top:18px;background:#1e5e5a;color:white;border:0;padding:11px 20px;border-radius:6px;font-weight:600;cursor:pointer}.chip{display:inline-block;background:#eaf2f1;color:#1e5e5a;border-radius:99px;padding:3px 10px;margin:0 6px 6px 0;font-size:13px}.decision{padding:12px 14px;border-radius:8px;margin-top:24px}.ok{background:#eaf2f1;color:#1e5e5a}.human{background:#fbefe8;color:#a94f28}pre{white-space:pre-wrap;background:#fbf9f5;border:1px solid #ddd8cf;border-radius:6px;padding:12px;font:14px/1.5 system-ui,sans-serif}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #ddd8cf;padding:7px 4px;text-align:left}.error{background:#fbefe8;color:#a33;padding:12px;border-radius:8px;margin-top:20px}@media(max-width:600px){main{margin:0;padding:20px;border-radius:0}}
 </style></head><body><main><h1>AI Customer Support Workflow</h1><p class="sub">Five focused AI steps classify a ticket, draft a reply, write an internal note, review the reply, and revise once if needed.</p><form method="post" action="/"><label for="name">Name</label><input id="name" name="name" required maxlength="100"><label for="email">Email (demo only)</label><input id="email" name="email" type="email" maxlength="254"><label for="subject">Subject</label><input id="subject" name="subject" required maxlength="200"><label for="message">Message</label><textarea id="message" name="message" rows="5" required maxlength="6000"></textarea><button type="submit">Run AI workflow</button></form>${body}</main></body></html>`;
}

app.get('/', (_req, res) => res.send(page()));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'ai-multistep-support-workflow' }));
app.post('/', async (req, res) => {
 try { const result = await runWorkflow(req.body || {}); res.send(page(resultHtml(result))); }
 catch (err) { console.error(err); res.status(500).send(page(`<div class="error">Workflow failed: ${esc(err.message)}</div>`)); }
});
app.post('/api/tickets', async (req, res) => {
 try { const result = await runWorkflow(req.body || {}); res.json({ ok: true, result }); }
 catch (err) { res.status(400).json({ ok: false, error: err.message }); }
});
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`AI Support Workflow running at http://localhost:${PORT}`));
