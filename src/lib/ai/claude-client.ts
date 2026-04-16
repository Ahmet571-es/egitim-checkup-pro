import Anthropic from '@anthropic-ai/sdk';

// Claude API modeli — Haiku 4.5: hızlı, 200k context, 64k max output
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

// Varsayılan token limiti — uzun psikometrik raporlar için yeterli
// Haiku 4.5'in teorik max'ı 64000, Vercel 60s timeout için makul değer 16000
const DEFAULT_MAX_TOKENS = 16000;

const MAX_RETRIES = 2;
// Continuation için ek token bütçesi (devam çağrısında ayrılacak)
const CONTINUATION_MAX_TOKENS = 8000;
// Son N karakter continuation context'i olarak kullanılır (bağlantı için)
const CONTINUATION_CONTEXT_CHARS = 1500;

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
  /** Kesilme durumunda otomatik devam çağrısı yap (default: true) */
  enableContinuation?: boolean;
}

/**
 * Rapor kesildiyse "devam et" çağrısı yapıp iki metni birleştirir.
 * @returns birleştirilmiş metin
 */
async function continueGeneration(
  client: Anthropic,
  originalPrompt: string,
  truncatedText: string,
  options: { temperature: number }
): Promise<{ text: string; stillTruncated: boolean }> {
  // Bağlantı için son parçayı al (son 1500 karakter)
  const tail = truncatedText.length > CONTINUATION_CONTEXT_CHARS
    ? truncatedText.slice(-CONTINUATION_CONTEXT_CHARS)
    : truncatedText;

  const continuationPrompt = `Aşağıda bir psikometrik rapor var ama token limiti nedeniyle ortadan kesildi. Senin görevin bu raporu TAM KESİLDİĞİ YERDEN devam ettirmek ve tamamlamaktır.

KURALLAR:
- HİÇBİR ŞEYİ TEKRAR ETME. Son cümleden devam et.
- Yeni bir başlık veya giriş yapma, kaldığı yerden yaz.
- Raporu gerçekten kapat: kalan bölümleri yaz, sonuç notu ekle, bitiş ifadesiyle sonlandır.
- Orijinal raporun üslubunu, formatını ve detay seviyesini koru.
- Markdown formatı (başlıklar, tablolar, listeler) kullan.

ORİJİNAL PROMPT (bağlam için):
${originalPrompt.slice(0, 2000)}...

RAPORUN SON KISMI (bu cümlelerden HEMEN SONRA devam et):
---
${tail}
---

Şimdi yukarıdaki son kısımdan KESİNTİSİZCE devam et ve raporu tamamla:`;

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CONTINUATION_MAX_TOKENS,
      temperature: options.temperature,
      messages: [{ role: 'user', content: continuationPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return { text: truncatedText, stillTruncated: true };
    }

    // Birleştirme: orijinal + devam (araya bir boşluk)
    // Devamın başında boşluk/yeni satır varsa temizle
    const continuation = content.text.trimStart();
    const merged = truncatedText + '\n' + continuation;

    const stillTruncated = response.stop_reason === 'max_tokens';
    return { text: merged, stillTruncated };
  } catch (err) {
    console.error('[claude] Continuation çağrısı başarısız:', err);
    return { text: truncatedText, stillTruncated: true };
  }
}

/**
 * Claude API ile rapor üret.
 * Haiku 4.5 tek yanıtta 64k token destekler.
 *
 * HİBRİT STRATEJİ:
 * - İlk çağrı max_tokens ile sınırlı
 * - Eğer kesilirse (stop_reason === 'max_tokens'), otomatik bir devam çağrısı yapılır
 * - Yine kesilirse kullanıcıya bildirim notu eklenir
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
  const enableContinuation = options.enableContinuation ?? true;

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

      let finalText = content.text;

      // HİBRİT FALLBACK: max_tokens'a takıldıysa devam çağrısı yap
      if (response.stop_reason === 'max_tokens') {
        console.warn(`[claude] İlk çağrı max_tokens (${maxTokens}) limitine ulaştı. Output: ${response.usage?.output_tokens}`);

        if (enableContinuation) {
          console.log('[claude] Continuation çağrısı başlatılıyor...');
          const continuation = await continueGeneration(client, prompt, finalText, { temperature });
          finalText = continuation.text;

          if (continuation.stillTruncated) {
            // Devam çağrısı da kesildi — kullanıcıya bildir ama mevcut metni dön
            console.warn('[claude] Continuation çağrısı da kesildi.');
            finalText += '\n\n---\n\n*ℹ️ **Not:** Rapor çok uzun olduğu için sisteme sığmayacak şekilde üretildi. Daha az test seçerek veya "Yenile" butonuyla yeniden deneyebilirsiniz.*';
          } else {
            console.log('[claude] Continuation başarılı, rapor tamamlandı.');
          }
        } else {
          finalText += '\n\n---\n\n*ℹ️ **Not:** Rapor maksimum token sınırına ulaştı.*';
        }
      }

      return finalText;
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
