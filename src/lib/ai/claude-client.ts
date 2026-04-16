import Anthropic from '@anthropic-ai/sdk';

// Claude API modeli — Haiku 4.5: hızlı, 200k context, 64k max output
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

// Varsayılan token limiti — uzun psikometrik raporlar için yeterli
// Haiku 4.5'in teorik max'ı 64000, Vercel 60s timeout için makul değer 16000
const DEFAULT_MAX_TOKENS = 16000;

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

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Claude API ile rapor üret.
 * Haiku 4.5 tek yanıtta 64k token destekler; Vercel 60s timeout için 16k-20k önerilir.
 */
export async function generateAIReport(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const client = getClaudeClient();
  if (!client) {
    return '⚠️ Hata: ANTHROPIC_API_KEY bulunamadı. Lütfen .env.local dosyasına ekleyin.';
  }

  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const temperature = options.temperature ?? 0.3;

  let lastError = '';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return '⚠️ Beklenmeyen yanıt formatı.';
      }

      // stop_reason: max_tokens → rapor kesildi
      if (response.stop_reason === 'max_tokens') {
        console.warn(`[claude] max_tokens (${maxTokens}) limitine ulaşıldı. Output: ${response.usage?.output_tokens}`);
        return content.text + '\n\n---\n\n⚠️ **Not:** Rapor maksimum token sınırına ulaştığı için sonunda kesilmiş olabilir. Daha az test seçerek tekrar deneyebilirsiniz.';
      }

      return content.text;
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
