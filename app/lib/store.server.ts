interface EncryptedNote {
  ciphertext: string;
  salt: string;
  iv: string;
  keyProof: string;
  kdfIterations: number;
  hasPassword: boolean;
  burnAfterRead: boolean;
  createdAt: number;
  expiresAt: number;
}

const store = new Map<string, EncryptedNote>();
const MAX_STORE_NOTES = 5_000;
const MAX_STORE_CHARS = 8_000_000;
let totalStoredChars = 0;

function estimateStoredChars(note: EncryptedNote): number {
  return (
    note.ciphertext.length +
    note.salt.length +
    note.iv.length +
    note.keyProof.length
  );
}

function deleteNote(id: string) {
  const existing = store.get(id);
  if (!existing) return;
  totalStoredChars -= estimateStoredChars(existing);
  if (totalStoredChars < 0) totalStoredChars = 0;
  store.delete(id);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function cleanup() {
  const now = Date.now();
  for (const [id, note] of store) {
    if (note.expiresAt < now) {
      deleteNote(id);
    }
  }
}

setInterval(cleanup, 60_000);

export function saveNote(
  id: string,
  ciphertext: string,
  salt: string,
  iv: string,
  keyProof: string,
  kdfIterations: number,
  hasPassword: boolean,
  burnAfterRead: boolean,
  ttlMinutes: number
): boolean {
  cleanup();

  const nextNote: EncryptedNote = {
    ciphertext,
    salt,
    iv,
    keyProof,
    kdfIterations,
    hasPassword,
    burnAfterRead,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  };
  const nextChars = estimateStoredChars(nextNote);

  const existing = store.get(id);
  const existingChars = existing ? estimateStoredChars(existing) : 0;
  const projectedNotes = existing ? store.size : store.size + 1;
  const projectedChars = totalStoredChars - existingChars + nextChars;

  if (projectedNotes > MAX_STORE_NOTES || projectedChars > MAX_STORE_CHARS) {
    return false;
  }

  if (existing) {
    totalStoredChars -= existingChars;
  }
  store.set(id, nextNote);
  totalStoredChars += nextChars;
  return true;
}

export function getNote(id: string): EncryptedNote | undefined {
  const note = store.get(id);
  if (!note) return undefined;
  if (note.expiresAt < Date.now()) {
    deleteNote(id);
    return undefined;
  }
  return note;
}

export function readNote(id: string, keyProof: string): EncryptedNote | undefined {
  const note = getNote(id);
  if (!note) return undefined;
  if (!safeEqual(note.keyProof, keyProof)) return undefined;
  return note;
}

export function burnNote(id: string, keyProof: string): EncryptedNote | undefined {
  const note = readNote(id, keyProof);
  if (note) {
    deleteNote(id);
  }
  return note;
}
