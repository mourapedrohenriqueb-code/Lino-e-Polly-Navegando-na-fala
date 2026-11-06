import { describe, expect, test } from 'vitest';
import { verifyMercadoPagoSignature } from '../../supabase/functions/_shared/mercadoPagoSignature.ts';

async function createSignature(secret, requestId, timestamp, paymentId) {
  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest)));
  const hex = Array.from(signature, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `ts=${timestamp},v1=${hex}`;
}

describe('assinatura do webhook Mercado Pago', () => {
  test('aceita somente assinatura HMAC válida para o pagamento e a requisição', async () => {
    const secret = 'webhook-secret';
    const requestId = 'request-123';
    const paymentId = '123456789';
    const signature = await createSignature(secret, requestId, '1700000000', paymentId);

    await expect(verifyMercadoPagoSignature(secret, signature, requestId, paymentId)).resolves.toBe(true);
    await expect(verifyMercadoPagoSignature(secret, signature, 'other-request', paymentId)).resolves.toBe(false);
    await expect(verifyMercadoPagoSignature(secret, signature, requestId, '987654321')).resolves.toBe(false);
    await expect(verifyMercadoPagoSignature('wrong-secret', signature, requestId, paymentId)).resolves.toBe(false);
  });

  test('rejeita cabeçalhos ausentes ou malformados', async () => {
    await expect(verifyMercadoPagoSignature('secret', null, 'request', '123')).resolves.toBe(false);
    await expect(verifyMercadoPagoSignature('secret', 'v1=abc', 'request', '123')).resolves.toBe(false);
    await expect(verifyMercadoPagoSignature('secret', 'ts=1,v1=not-hex', 'request', '123')).resolves.toBe(false);
  });
});
