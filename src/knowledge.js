export const KNOWLEDGE = {
  billing: `Billing support guidance: acknowledge the concern, do not promise refunds or account credits, and say the billing team must verify the account. Never request full card numbers, passwords, or one-time codes.`,
  technical: `Technical support guidance: acknowledge the problem, suggest safe basic troubleshooting only (restart the app, update to the latest version, check service status). Do not claim a bug is fixed or ask users to disable security protections.`,
  feature_request: `Feature request guidance: thank the customer, explain that feedback can be shared with the product team, and do not promise a delivery date or claim a feature is on the roadmap unless provided in the ticket.`,
  account_access: `Account access guidance: suggest the official password-reset flow. Never ask for passwords, authentication codes, recovery codes, or API keys. Route suspicious account takeover or MFA-reset requests to a human.`,
  general: `General support guidance: be polite, answer only what the ticket and this knowledge text support, and ask one clear follow-up question if needed. Never invent policies or make commitments.`,
};

export function knowledgeFor(category) {
  return KNOWLEDGE[category] || KNOWLEDGE.general;
}
