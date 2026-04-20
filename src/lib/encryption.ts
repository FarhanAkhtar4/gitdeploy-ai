/**
 * AES-256-GCM Encryption — Edge-Compatible (Web Crypto API only)
 *
 * Uses the Web Crypto API (SubtleCrypto) which is available in:
 * - Cloudflare Workers / Edge Runtime
 * - All modern browsers
 * - Node.js 18+ (crypto.subtle)
 *
 * Output format: { encrypted, iv, authTag } as hex strings.
 */

const IV_LENGTH = 12; // 12 bytes for GCM (Web Crypto standard)
const TAG_LENGTH = 16; // 16 bytes auth tag

function getKeyBytes(): Uint8Array {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error(
      '[GitDeploy AI] ENCRYPTION_KEY env var is missing or too short (need 32+ chars). ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  return new TextEncoder().encode(key.slice(0, 32));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Import AES key for Web Crypto API
 */
async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    getKeyBytes(),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─── Encrypt (Web Crypto API) ───
async function encrypt(text: string): Promise<{ encrypted: string; iv: string; authTag: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await importKey();
  const encoded = new TextEncoder().encode(text);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LENGTH * 8 },
    key,
    encoded
  );

  // Web Crypto returns ciphertext + authTag concatenated
  const result = new Uint8Array(ciphertext);
  const encryptedBytes = result.slice(0, result.length - TAG_LENGTH);
  const authTagBytes = result.slice(result.length - TAG_LENGTH);

  return {
    encrypted: bytesToHex(encryptedBytes),
    iv: bytesToHex(iv),
    authTag: bytesToHex(authTagBytes),
  };
}

// ─── Decrypt (Web Crypto API) ───
async function decrypt(encrypted: string, iv: string, authTag: string): Promise<string> {
  const key = await importKey();
  const ivBytes = hexToBytes(iv);
  const encryptedBytes = hexToBytes(encrypted);
  const authTagBytes = hexToBytes(authTag);

  // Web Crypto expects ciphertext + authTag concatenated
  const combined = new Uint8Array(encryptedBytes.length + authTagBytes.length);
  combined.set(encryptedBytes);
  combined.set(authTagBytes, encryptedBytes.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes, tagLength: TAG_LENGTH * 8 },
    key,
    combined
  );

  return new TextDecoder().decode(decrypted);
}

export { encrypt, decrypt };

export function getTokenHint(token: string): string {
  if (token.length <= 4) return '****';
  return `****${token.slice(-4)}`;
}
