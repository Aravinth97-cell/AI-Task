import './env.js';

export const MOCK = String(process.env.MOCK_LLM ?? 'true').toLowerCase() === 'true';
export const MODELS = {
fast: process.env.GROQ_MODEL_FAST || 'openai/gpt-oss-20b',
smart: process.env.GROQ_MODEL_SMART || 'openai/gpt-oss-120b',
};

export async function askLLM({ step, model = 'fast', system, prompt, json = false }) {
  const started = Date.now();
  if (MOCK) {
    throw new Error(`Mock mode does not call askLLM directly. Missing mock handler for step: ${step}`);
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is missing. Add it to .env or set MOCK_LLM=true.');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELS[model] || MODELS.fast,
      temperature: 0.2,
      max_tokens: 1200,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Groq API returned HTTP ${response.status}`;
    throw new Error(message);
  }
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Groq returned an empty response for ${step}`);
  return {
    content,
    model: payload?.model || MODELS[model] || MODELS.fast,
    ms: Date.now() - started,
    inputTokens: payload?.usage?.prompt_tokens || 0,
    outputTokens: payload?.usage?.completion_tokens || 0,
  };
}
