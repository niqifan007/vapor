export const LEGACY_PBKDF2_ITERATIONS = 100_000;
export const DEFAULT_PBKDF2_ITERATIONS = 310_000;
const MAX_PBKDF2_ITERATIONS = 1_000_000;
const KEY_LENGTH = 256;
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 128;

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(buffer: ArrayBuffer): string {
  return toBase64(buffer)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return fromBase64(s);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeIterations(iterations?: number): number {
  if (typeof iterations !== "number" || !Number.isInteger(iterations)) {
    return LEGACY_PBKDF2_ITERATIONS;
  }
  if (
    iterations < LEGACY_PBKDF2_ITERATIONS ||
    iterations > MAX_PBKDF2_ITERATIONS
  ) {
    return LEGACY_PBKDF2_ITERATIONS;
  }
  return iterations;
}

async function deriveKey(
  keyMaterial: Uint8Array,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial.buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

function buildKeyMaterial(
  pasteKey: Uint8Array,
  password?: string
): Uint8Array {
  if (!password) return pasteKey;
  const pwBytes = new TextEncoder().encode(password);
  const combined = new Uint8Array(pasteKey.length + pwBytes.length);
  combined.set(pasteKey);
  combined.set(pwBytes, pasteKey.length);
  return combined;
}

export interface EncryptResult {
  ciphertext: string;
  salt: string;
  iv: string;
  pasteKey: string;
  kdfIterations: number;
}

export async function deriveKeyProof(pasteKeyB64Url: string): Promise<string> {
  const pasteKeyBytes = fromBase64Url(pasteKeyB64Url);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    pasteKeyBytes.buffer as ArrayBuffer
  );
  return toHex(digest);
}

export async function encrypt(
  plaintext: string,
  password?: string
): Promise<EncryptResult> {
  const pasteKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const keyMaterial = buildKeyMaterial(pasteKeyBytes, password);
  const key = await deriveKey(keyMaterial, salt, DEFAULT_PBKDF2_ITERATIONS);

  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer, tagLength: TAG_LENGTH },
    key,
    encoded
  );

  return {
    ciphertext: toBase64(encrypted),
    salt: toBase64(salt.buffer as ArrayBuffer),
    iv: toBase64(iv.buffer as ArrayBuffer),
    pasteKey: toBase64Url(pasteKeyBytes.buffer as ArrayBuffer),
    kdfIterations: DEFAULT_PBKDF2_ITERATIONS,
  };
}

export async function decrypt(
  ciphertext: string,
  saltB64: string,
  ivB64: string,
  pasteKeyB64Url: string,
  password?: string,
  kdfIterations?: number
): Promise<string> {
  const pasteKeyBytes = fromBase64Url(pasteKeyB64Url);
  const salt = fromBase64(saltB64);
  const iv = fromBase64(ivB64);
  const data = fromBase64(ciphertext);

  const keyMaterial = buildKeyMaterial(pasteKeyBytes, password);
  const key = await deriveKey(
    keyMaterial,
    salt,
    normalizeIterations(kdfIterations)
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer, tagLength: TAG_LENGTH },
    key,
    data.buffer as ArrayBuffer
  );

  return new TextDecoder().decode(decrypted);
}
