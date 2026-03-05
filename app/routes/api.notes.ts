import { data } from "react-router";
import { nanoid } from "nanoid";
import { saveNote, getNote, readNote, burnNote } from "~/lib/store.server";

const NOTE_ID_REGEX = /^[A-Za-z0-9_-]{12}$/;
const KEY_PROOF_REGEX = /^[a-f0-9]{64}$/;
const MAX_FORM_BYTES = 200_000;
const MAX_CIPHERTEXT_LENGTH = 120_000;
const MAX_SALT_LENGTH = 128;
const MAX_IV_LENGTH = 128;
const ALLOWED_TTL_MINUTES = new Set([
  5, 10, 30, 60, 180, 360, 720, 1440, 4320, 10080,
]);
const LEGACY_KDF_ITERATIONS = 100_000;
const ALLOWED_KDF_ITERATIONS = new Set([LEGACY_KDF_ITERATIONS, 310_000]);
const RATE_WINDOW_MS = 60_000;
const RATE_LIMITS = {
  loader: 120,
  create: 20,
  read: 60,
} as const;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function apiData(
  payload: unknown,
  init: number | ResponseInit = 200
) {
  const responseInit: ResponseInit =
    typeof init === "number" ? { status: init } : { ...init };
  const headers = new Headers(responseInit.headers);
  headers.set("Cache-Control", "no-store");
  responseInit.headers = headers;
  return data(payload, responseInit);
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function cleanupRateBuckets(now: number) {
  if (rateBuckets.size <= 2_000) return;
  for (const [key, value] of rateBuckets) {
    if (value.resetAt <= now) {
      rateBuckets.delete(key);
    }
  }
}

function checkRateLimit(
  request: Request,
  intent: keyof typeof RATE_LIMITS
): number | null {
  const now = Date.now();
  cleanupRateBuckets(now);
  const key = `${intent}:${getClientIp(request)}`;
  const limit = RATE_LIMITS[intent];
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }

  if (current.count >= limit) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }

  current.count += 1;
  return null;
}

function isValidNoteId(id: string): boolean {
  return NOTE_ID_REGEX.test(id);
}

function isValidKeyProof(keyProof: string): boolean {
  return KEY_PROOF_REGEX.test(keyProof);
}

function parseTtl(ttlRaw: FormDataEntryValue | null): number | null {
  const ttl = Number(ttlRaw);
  if (!Number.isInteger(ttl)) return null;
  if (!ALLOWED_TTL_MINUTES.has(ttl)) return null;
  return ttl;
}

function parseKdfIterations(value: FormDataEntryValue | null): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return LEGACY_KDF_ITERATIONS;
  if (!ALLOWED_KDF_ITERATIONS.has(parsed)) return LEGACY_KDF_ITERATIONS;
  return parsed;
}

function asFormString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" ? value : null;
}

function tooManyRequests(retryAfterSeconds: number) {
  return apiData(
    { error: "Too many requests, please retry later" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

function isOversizedBody(request: Request): boolean {
  const contentLength = Number(request.headers.get("content-length"));
  return Number.isFinite(contentLength) && contentLength > MAX_FORM_BYTES;
}

// GET /api/notes?id=xxx — check if note exists
export function loader({ request }: { request: Request }) {
  const rateLimitWait = checkRateLimit(request, "loader");
  if (rateLimitWait) {
    return tooManyRequests(rateLimitWait);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id || !isValidNoteId(id)) {
    return apiData({ error: "Missing or invalid note ID" }, 400);
  }
  const note = getNote(id);
  if (!note) {
    return apiData({ status: "not_found" as const });
  }
  return apiData({
    status: "exists" as const,
    hasPassword: note.hasPassword,
    burnAfterRead: note.burnAfterRead,
    id,
  });
}

// POST /api/notes — create or read/burn a note
export async function action({ request }: { request: Request }) {
  if (isOversizedBody(request)) {
    return apiData({ error: "Request body too large" }, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiData({ error: "Malformed form data" }, 400);
  }

  const intent = asFormString(formData.get("intent"));

  if (intent === "create") {
    const rateLimitWait = checkRateLimit(request, "create");
    if (rateLimitWait) {
      return tooManyRequests(rateLimitWait);
    }

    const ciphertext = asFormString(formData.get("ciphertext"));
    const salt = asFormString(formData.get("salt"));
    const iv = asFormString(formData.get("iv"));
    const keyProof = asFormString(formData.get("keyProof"));
    const kdfIterations = parseKdfIterations(formData.get("kdfIterations"));
    const hasPassword = formData.get("hasPassword") === "1";
    const burnAfterRead = formData.get("burnAfterRead") === "1";
    const ttl = parseTtl(formData.get("ttl"));

    if (!ciphertext || !salt || !iv || !keyProof) {
      return apiData({ error: "Incomplete encrypted data" }, 400);
    }
    if (
      ciphertext.length > MAX_CIPHERTEXT_LENGTH ||
      salt.length > MAX_SALT_LENGTH ||
      iv.length > MAX_IV_LENGTH
    ) {
      return apiData({ error: "Encrypted payload exceeds size limits" }, 400);
    }
    if (!isValidKeyProof(keyProof)) {
      return apiData({ error: "Missing or invalid key proof" }, 400);
    }
    if (ttl === null) {
      return apiData({ error: "Invalid TTL value" }, 400);
    }

    const id = nanoid(12);
    const saved = saveNote(
      id,
      ciphertext,
      salt,
      iv,
      keyProof,
      kdfIterations,
      hasPassword,
      burnAfterRead,
      ttl
    );
    if (!saved) {
      return apiData(
        {
          error:
            "Storage limit reached, please retry in a moment or reduce note size",
        },
        503
      );
    }

    return apiData({ noteId: id });
  }

  if (intent === "read") {
    const rateLimitWait = checkRateLimit(request, "read");
    if (rateLimitWait) {
      return tooManyRequests(rateLimitWait);
    }

    const id = asFormString(formData.get("id"));
    const keyProof = asFormString(formData.get("keyProof"));
    if (!id || !isValidNoteId(id)) {
      return apiData({ error: "Missing or invalid note ID" }, 400);
    }
    if (!keyProof || !isValidKeyProof(keyProof)) {
      return apiData({ error: "Missing or invalid key proof" }, 400);
    }

    const burn = formData.get("burn") === "1";
    const note = burn ? burnNote(id, keyProof) : readNote(id, keyProof);
    if (!note) {
      return apiData(
        { error: "This note does not exist or has been destroyed" },
        404
      );
    }

    return apiData({
      ciphertext: note.ciphertext,
      salt: note.salt,
      iv: note.iv,
      kdfIterations: note.kdfIterations ?? LEGACY_KDF_ITERATIONS,
      burned: burn,
    });
  }

  return apiData({ error: "Unknown intent" }, 400);
}
