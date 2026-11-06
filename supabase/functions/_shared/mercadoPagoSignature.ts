function decodeHex(value: string) {
  if (!/^[\da-f]+$/i.test(value) || value.length % 2 !== 0) return null;
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

export async function verifyMercadoPagoSignature(
  secret: string,
  signatureHeader: string | null,
  requestId: string | null,
  paymentId: string
) {
  if (!signatureHeader || !requestId) return false;
  const parts = Object.fromEntries(signatureHeader.split(',').map((part) => {
    const separator = part.indexOf('=');
    return separator < 0 ? ['', ''] : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
  }));
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest)));
  const received = decodeHex(parts.v1);
  if (!received || received.length !== expected.length) return false;
  return expected.reduce((difference, byte, index) => difference | (byte ^ received[index]), 0) === 0;
}
