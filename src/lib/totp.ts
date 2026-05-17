// Simple TOTP (RFC 6238) implementation using Web Crypto API

function base32Decode(input: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.replace(/=+$/, '').toUpperCase().replace(/\s+/g, '');
  let bits = '';
  for (const ch of clean) {
    const val = alphabet.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

export async function generateTOTP(secret: string, period = 30, digits = 6): Promise<{ code: string; secondsRemaining: number }> {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / period);
  const secondsRemaining = period - (epoch % period);

  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  view.setUint32(4, counter, false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, counterBytes));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = (binCode % 10 ** digits).toString().padStart(digits, '0');
  return { code, secondsRemaining };
}