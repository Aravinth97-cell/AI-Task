# AI Multi-Step Customer Support Workflow (Node.js + Groq)

A workshop-style AI workflow inspired by the provided sample project. It accepts a customer support ticket, classifies it, selects relevant support guidance, drafts a reply, creates an internal note, reviews the reply, revises it once if necessary, then uses deterministic code to either mark the reply as approved for a demo or place the ticket in a human-review queue.

> **Safety note:** This demo does not send real email. Approved replies are printed to the terminal. Tickets requiring human review are saved to `review_queue.jsonl`.

## Problem statement

Support teams receive tickets with different categories, urgency levels, and customer sentiment. Manually reading every ticket, drafting a reply, checking it for unsafe promises, and preparing an internal note takes time. This workflow demonstrates how an LLM can assist with those steps while keeping routing and final decisions in ordinary application code.

## Workflow overview

```text
Customer form / POST /api/tickets
             |
             v
      AI 1: Triage (Groq)
 category, priority, sentiment, language, needs_human
             |
             v
       Code: select knowledge
             |
             +-----------------------+
             |                       |
             v                       v
  AI 2: Draft reply          AI 3: Internal note
             |                       |
             +-----------+-----------+
                         |
                         v
                 AI 4: Review reply
                         |
               rejected? | approved?
                  yes    |    no
                   v     |     v
              AI 5: Revise     Code checks risk flags
                   |                 |
                   +--> AI 4 review  |
                         (once)      |
                                     v
                 Code decides: demo-approved or human review
                                     |
                       +-------------+-------------+
                       |                           |
                       v                           v
              Print demo reply              review_queue.jsonl
                       \                           /
                        +---- ticket_log.csv -----+
```

### The five AI steps

| Step | Purpose | Model choice |
|---|---|---|
| AI 1 — Triage | Classifies category, priority, sentiment, language, and human-review need | `GROQ_MODEL_FAST` |
| AI 2 — Draft reply | Writes a customer-friendly response using only category-specific guidance | `GROQ_MODEL_SMART` |
| AI 3 — Internal note | Produces a short summary, likely cause, and next step | `GROQ_MODEL_FAST` |
| AI 4 — Review | Checks the draft for unsupported promises, unsafe requests, and policy issues | `GROQ_MODEL_FAST` |
| AI 5 — Revise | Revises the draft only if review rejects it; maximum one revision | `GROQ_MODEL_SMART` |

AI 2 and AI 3 run in parallel using `Promise.all`. Application code—not the LLM—chooses the knowledge section, limits revisions, and decides whether human review is mandatory.

## Requirements

- Node.js 18 or newer
- A Groq API key for live LLM calls (optional if using mock mode)

## Setup

1. Extract this project and open the folder in a terminal.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`.

   Windows PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux:
   ```bash
   cp .env.example .env
   ```

4. For live Groq calls, add your own key in `.env` and set `MOCK_LLM=false`:

   ```env
 GROQ_API_KEY=your_actual_groq_api_key
MOCK_LLM=false
GROQ_MODEL_FAST=openai/gpt-oss-20b
GROQ_MODEL_SMART=openai/gpt-oss-120b
   ```

   Keep `.env` private. Never paste your API key into source code or commit it to GitHub.

5. To try the workflow without a key or network, leave `MOCK_LLM=true`. Mock mode uses local rules/templates to demonstrate the same control flow; it does not call the LLM.

## Run the project

Start the web form:

```bash
npm start
```

Open `http://localhost:3000` and submit a sample ticket.

Health check:

```text
GET http://localhost:3000/health
```

JSON API:

```http
POST http://localhost:3000/api/tickets
Content-Type: application/json
```

Example body:

```json
{
  "name": "Arjun Mehta",
  "email": "arjun@example.com",
  "subject": "App keeps crashing",
  "message": "The app crashes whenever I open a notebook. I cannot work like this."
}
```

Run built-in examples in the terminal:

```bash
npm run samples
npm run samples -- 4
```

Run tests:

```bash
npm test
```

## Output files

- `ticket_log.csv`: one row per processed ticket with category, priority, decision, step count, elapsed time, and token count where available.
- `review_queue.jsonl`: one JSON record per ticket that must be reviewed by a person.

These generated output files are ignored by Git.

## Project structure

```text
app.js                 Express web form and JSON API
run-samples.js         Example tickets for demos
src/workflow.js        Workflow orchestration and code-based decisions
src/steps.js           Five AI steps and mock implementations
src/llm.js             Groq API integration using Node.js fetch
src/knowledge.js       Small category-based support knowledge base
src/actions.js         CSV logging, review queue, demo reply output
test/workflow.test.js  Automated tests (no API key required in mock mode)
.env.example           Environment variable template
.gitignore             Prevents secrets and generated files being committed
```

## Safety and limitations

- The model's output is checked and normalized before routing.
- The workflow treats customer ticket content as untrusted input.
- Replies must not promise refunds, compensation, fixes, or timelines without evidence.
- It must never ask for passwords, MFA codes, recovery codes, full card numbers, or API keys.
- Urgent, legal, security-sensitive, and uncertain cases should be routed to a human.
- The final decision is made by deterministic application code, not by the model.
- The reviewer is an LLM, so it is not a guarantee of correctness. Review real-world replies before enabling any external sending integration.
- No real email is sent by this project.

## Publish to a public GitHub repository

1. On GitHub, create a new **public** empty repository, for example `ai-multistep-support-workflow`. Do not add a README from GitHub because this folder already has one.
2. From this project folder, run:

   ```bash
   git init
   git add .
   git status
   git commit -m "Build multi-step AI support workflow with Groq"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ai-multistep-support-workflow.git
   git push -u origin main
   ```

3. Replace `YOUR_GITHUB_USERNAME` with your GitHub username.
4. Before committing, verify `.env` is not listed by `git status`. Only `.env.example` should be committed.

The project files are prepared locally; you must create/use your GitHub account and authorize the push. This environment has not pushed the repository on your behalf.
