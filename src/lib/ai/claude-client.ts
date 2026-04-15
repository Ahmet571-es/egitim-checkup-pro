import Anthropic from '@anthropic-ai/sdk';

// Claude API modeli
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4000;
const MAX_RETRIES = 2;

let _client: Anthropic | null = null;

export function getClaudeClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!_client) {
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function generateAIReport(prompt: string): Promise<string> {
  const client = getClaudeClient();
  if (!client) {
    return '⚠️ Hata: ANTHROPIC_API_KEY bulunamadı. Lütfen .env.local dosyasına ekleyin.';
  }

  let lastError = '';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      return '⚠️ Beklenmeyen yanıt formatı.';
    } catch (err) {
      const msg = String(err);
      lastError = msg;

      if (msg.toLowerCase().includes('authentication')) {
        return '⚠️ API Key hatalı veya geçersiz. ANTHROPIC_API_KEY değerini kontrol edin.';
      }
      if (msg.toLowerCase().includes('rate_limit') || msg.toLowerCase().includes('overloaded')) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
          continue;
        }
        return '⚠️ API istek limiti aşıldı. Birkaç dakika bekleyip tekrar deneyin.';
      }
      if (msg.toLowerCase().includes('invalid_request') || msg.toLowerCase().includes('model')) {
        return `⚠️ Model hatası: ${msg}`;
      }
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
    }
  }
  return `⚠️ Analiz sırasında bir hata oluştu: ${lastError}`;
}
