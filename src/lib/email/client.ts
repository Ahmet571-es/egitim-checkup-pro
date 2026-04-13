/**
 * E-posta Client — Resend entegrasyonu
 * RESEND_API_KEY environment variable gereklidir
 */
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@egitimcheckup.com';
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * E-posta gönder — retry mekanizmalı
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY tanımlı değil. E-posta gönderilmedi:', options.subject);
    return { success: false, error: 'E-posta servisi yapılandırılmamış.' };
  }

  const MAX_RETRIES = 2;
  let lastError: string = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        lastError = error.message ?? 'Bilinmeyen Resend hatası';
        console.error(`[email] Deneme ${attempt}/${MAX_RETRIES} başarısız:`, lastError);
        continue;
      }

      return { success: true };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[email] Deneme ${attempt}/${MAX_RETRIES} istisna:`, lastError);
    }
  }

  return { success: false, error: lastError };
}
