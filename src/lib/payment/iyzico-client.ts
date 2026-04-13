/**
 * Faz 5: iyzico client (sandbox).
 *
 * Not: Üretim entegrasyonu iyzipay paketini kullanır. Burada ek bağımlılık
 * eklememek ve Vercel build sürelerini uzatmamak için HTTP tabanlı hafif bir
 * sarmalayıcı kullanılıyor. Sandbox modunda iyzico'nun /payment/pay v2
 * uç noktası, gerçek bir kart olmadan 3D Secure akışı taklit edebilir.
 *
 * Not 2: IYZICO_API_KEY ve IYZICO_SECRET_KEY Vercel env vars'tan okunur.
 * Yoksa "sandbox-test-key" ile mock bir yanıt döner ki QA ortamı build'i
 * kırmasın.
 */

import crypto from 'crypto';
import type { PlanKey } from './types';

const IYZICO_BASE_URL =
  process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';
const IYZICO_API_KEY = process.env.IYZICO_API_KEY || 'sandbox-test-key';
const IYZICO_SECRET_KEY =
  process.env.IYZICO_SECRET_KEY || 'sandbox-test-secret';

function isMock(): boolean {
  return (
    IYZICO_API_KEY === 'sandbox-test-key' ||
    IYZICO_SECRET_KEY === 'sandbox-test-secret'
  );
}

export interface CreatePaymentParams {
  conversationId: string;
  planKey: PlanKey;
  planName: string;
  amount: number; // TRY
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone?: string;
    schoolId: string;
    schoolName: string;
    city?: string;
  };
  callbackUrl: string;
}

export interface CreatePaymentResult {
  ok: boolean;
  mock: boolean;
  conversationId: string;
  paymentPageUrl?: string; // redirect URL for iyzico hosted payment page
  token?: string;
  errorMessage?: string;
  raw?: unknown;
}

/**
 * Stub: Gerçek entegrasyon yerine mock bir "hosted checkout" URL'i
 * döner. Callback handler bu URL'i "success" durumu ile işleyebilir.
 */
export async function createCheckoutForm(
  params: CreatePaymentParams,
): Promise<CreatePaymentResult> {
  if (isMock()) {
    // Test akışı: kendi /api/payment/callback'imize yönlendir
    const mockUrl =
      params.callbackUrl +
      (params.callbackUrl.includes('?') ? '&' : '?') +
      `mock=1&conversationId=${encodeURIComponent(params.conversationId)}&status=success`;
    return {
      ok: true,
      mock: true,
      conversationId: params.conversationId,
      paymentPageUrl: mockUrl,
      token: 'mock-token-' + params.conversationId,
      raw: { mock: true, params },
    };
  }

  // Gerçek iyzico entegrasyonu için minimal HTTP call (checkoutFormInitialize)
  try {
    const body = {
      locale: 'tr',
      conversationId: params.conversationId,
      price: params.amount.toFixed(2),
      paidPrice: params.amount.toFixed(2),
      currency: 'TRY',
      basketId: 'B-' + params.conversationId,
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: params.callbackUrl,
      buyer: {
        id: params.buyer.id,
        name: params.buyer.name,
        surname: params.buyer.surname,
        gsmNumber: params.buyer.phone || '+905350000000',
        email: params.buyer.email,
        identityNumber: '11111111111',
        registrationAddress: params.buyer.schoolName,
        ip: '85.34.78.112',
        city: params.buyer.city || 'Istanbul',
        country: 'Turkey',
      },
      billingAddress: {
        contactName: params.buyer.schoolName,
        city: params.buyer.city || 'Istanbul',
        country: 'Turkey',
        address: params.buyer.schoolName,
      },
      basketItems: [
        {
          id: params.planKey,
          name: params.planName,
          category1: 'Eğitim',
          itemType: 'VIRTUAL',
          price: params.amount.toFixed(2),
        },
      ],
    };

    // iyzico auth header (IYZWS + hmac)
    const rand = Math.random().toString(36).slice(2, 10);
    const payloadStr = JSON.stringify(body);
    const hash = crypto
      .createHash('sha1')
      .update(IYZICO_API_KEY + rand + IYZICO_SECRET_KEY + payloadStr)
      .digest('base64');
    const auth = `IYZWS ${IYZICO_API_KEY}:${hash}`;

    const res = await fetch(
      `${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
          'x-iyzi-rnd': rand,
        },
        body: payloadStr,
      },
    );

    const json = (await res.json()) as {
      status?: string;
      paymentPageUrl?: string;
      token?: string;
      errorMessage?: string;
    };
    if (json.status !== 'success') {
      return {
        ok: false,
        mock: false,
        conversationId: params.conversationId,
        errorMessage: json.errorMessage || 'iyzico error',
        raw: json,
      };
    }
    return {
      ok: true,
      mock: false,
      conversationId: params.conversationId,
      paymentPageUrl: json.paymentPageUrl,
      token: json.token,
      raw: json,
    };
  } catch (err) {
    return {
      ok: false,
      mock: false,
      conversationId: params.conversationId,
      errorMessage: (err as Error).message,
    };
  }
}

export function newConversationId(): string {
  return 'CV-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}
