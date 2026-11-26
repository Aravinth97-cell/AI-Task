# Import the CloudNote AI workflow into n8n

## Import
1. Open n8n.
2. Create/open a workflow.
3. Use **Import from File** and select `n8n-workflow.json`.
4. Open each of the 5 HTTP Request nodes and replace `YOUR_GROQ_API_KEY` in the Authorization header with your Groq API key. Do not share the exported workflow after adding your key.
5. Save the workflow and click **Test workflow** / listen for the test webhook.

## Test request
Send a POST request to the Test URL shown by the **Ticket Webhook** node. Example JSON body:

```json
{
  "ticketId": "T-1001",
  "customerName": "Alex",
  "email": "alex@example.com",
  "subject": "Cannot access my account",
  "message": "I reset my password but still cannot sign in.",
  "plan": "Pro"
}
```

The workflow responds with the triage, customer reply draft, internal note, review verdict, and final decision. Activate the workflow to use its production webhook URL.

## Workflow steps
Webhook → Normalize Ticket → AI 1 Triage → AI 2 Draft Reply + AI 3 Internal Note (parallel) → Merge → AI 4 Review → Approved? → (approved) Finalize / (rejected) AI 5 Revise → AI 4 Review Revised Reply → Human Review finalization.

## Important
- This workflow uses Groq's OpenAI-compatible Chat Completions endpoint.
- The imported HTTP nodes use a placeholder API key; replace it in each AI HTTP Request node before running.
- It does **not** send emails or messages. It only returns a recommended decision and drafted text.
- The workflow is a starter template; validate it in your n8n version before production use.
