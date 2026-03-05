import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/view";
import { decrypt, deriveKeyProof } from "~/lib/crypto";
import {
  Flame,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle,
  Loader2,
  ShieldX,
  ShieldCheck,
  ArrowLeft,
  Zap,
  Eye,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { VaporBackground } from "~/components/vapor-bg";
import { VaporIcon } from "~/components/vapor-icon";
import { SteampunkCard, ControlPanel, SpecBadge } from "~/components/steampunk-card";
import { VditorPreview } from "~/components/vditor-editor";

export function meta() {
  return [
    { title: "View Secret — Vapor" },
    { name: "description", content: "Burn-after-reading encrypted message" },
  ];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    throw new Response("Missing note ID", { status: 400 });
  }
  const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Response(json.error ?? "Failed to load note", { status: res.status });
  }
  return json as
    | { status: "not_found" }
    | { status: "exists"; hasPassword: boolean; burnAfterRead: boolean; id: string };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  formData.set("intent", "read");

  const res = await fetch("/api/notes", { method: "POST", body: formData });
  const json = await res.json();

  if (!res.ok) {
    return { error: json.error ?? "Failed to read note" };
  }
  return json as {
    ciphertext: string;
    salt: string;
    iv: string;
    kdfIterations: number;
    burned: boolean;
  };
}

// ── Reusable status screen ──
function StatusScreen({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-svh flex flex-col">
      <VaporBackground />
      <ViewHeader />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <SteampunkCard className="text-center">
            <div className="space-y-4 py-4">
              <div className="mx-auto size-16 rounded-full border-2 border-copper/40 flex items-center justify-center bg-iron/30">
                {icon}
              </div>
              <h1 className="text-2xl font-bold text-primary tracking-tight text-wrap-balance">
                {title}
              </h1>
              <p className="text-copper/80 text-sm">{description}</p>
              {children}
            </div>
          </SteampunkCard>
        </div>
      </main>
    </div>
  );
}

const backButton = (
  <div className="pt-2">
    <Button
      asChild
      variant="outline"
      className="cursor-pointer border-copper/30 text-copper hover:text-primary hover:border-primary/50"
    >
      <a href="/">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Console
      </a>
    </Button>
  </div>
);

export default function View() {
  const loaderData = useLoaderData<typeof clientLoader>();
  const fetcher = useFetcher<typeof clientAction>();

  const [pasteKey, setPasteKey] = useState<string | null>(null);
  const [keyProof, setKeyProof] = useState<string | null>(null);
  const [keyProofError, setKeyProofError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [password, setPassword] = useState("");
  const [viewRaw, setViewRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const decryptAttempted = useRef(false);
  const autoBurnTriggered = useRef(false);

  const actionData = fetcher.data;
  const isSubmitting = fetcher.state === "submitting";

  // Read hash only on client after hydration
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    setPasteKey(hash || null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!pasteKey) {
      setKeyProof(null);
      setKeyProofError(null);
      return;
    }

    let cancelled = false;
    deriveKeyProof(pasteKey)
      .then((proof) => {
        if (cancelled) return;
        setKeyProof(proof);
        setKeyProofError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setKeyProof(null);
        setKeyProofError("Failed to initialize decryption proof");
      });

    return () => {
      cancelled = true;
    };
  }, [pasteKey]);

  useEffect(() => {
    if (!actionData || !("ciphertext" in actionData) || !pasteKey) return;
    if (decryptAttempted.current) return;
    decryptAttempted.current = true;

    const doDecrypt = async () => {
      setDecrypting(true);
      setDecryptError(null);
      try {
        const result = await decrypt(
          actionData.ciphertext,
          actionData.salt,
          actionData.iv,
          pasteKey,
          password || undefined,
          actionData.kdfIterations
        );
        setPlaintext(result);
      } catch {
        setDecryptError("Decryption failed: incorrect password or invalid key");
      } finally {
        setDecrypting(false);
      }
    };
    doDecrypt();
  }, [actionData, pasteKey, password]);

  const handleBurn = useCallback(() => {
    if (loaderData.status !== "exists" || !keyProof) return;
    const submitData = new FormData();
    submitData.set("id", loaderData.id);
    submitData.set("keyProof", keyProof);
    submitData.set("burn", loaderData.burnAfterRead ? "1" : "0");
    fetcher.submit(submitData, { method: "post" });
  }, [fetcher, loaderData, keyProof]);

  // Auto-trigger burn when key is present and no password is needed
  useEffect(() => {
    if (!pasteKey || !keyProof || autoBurnTriggered.current) return;
    if (loaderData.status !== "exists") return;
    if (loaderData.hasPassword) return;
    autoBurnTriggered.current = true;
    handleBurn();
  }, [pasteKey, keyProof, loaderData, handleBurn]);

  // ── Waiting for client hydration ──
  if (!hydrated) {
    return (
      <StatusScreen
        icon={
          <Loader2
            className="size-8 text-primary animate-spin"
            aria-hidden="true"
          />
        }
        title="Initializing…"
        description="Preparing secure channel"
      />
    );
  }

  // ── Destroyed ──
  if (loaderData.status === "not_found" && !plaintext && !actionData) {
    return (
      <StatusScreen
        icon={<Flame className="size-8 text-destructive" aria-hidden="true" />}
        title="Transmission Destroyed"
        description="This note does not exist or has already been read and destroyed"
      >
        {backButton}
      </StatusScreen>
    );
  }

  // ── Missing key ──
  if (!pasteKey) {
    return (
      <StatusScreen
        icon={<KeyRound className="size-8 text-primary" aria-hidden="true" />}
        title="Missing Decryption Key"
        description="The link is incomplete — missing the decryption key after #"
      >
        {backButton}
      </StatusScreen>
    );
  }

  if (keyProofError) {
    return (
      <StatusScreen
        icon={<ShieldX className="size-8 text-destructive" aria-hidden="true" />}
        title="Verification Failed"
        description={keyProofError}
      >
        {backButton}
      </StatusScreen>
    );
  }

  // ── Decrypted – show content ──
  const wasBurned = actionData && "burned" in actionData && actionData.burned;

  if (plaintext) {
    return (
      <div className="min-h-svh flex flex-col">
        <VaporBackground />
        <ViewHeader />
        <main className="flex-1 flex flex-col items-center justify-start py-12 px-4">
          <div className="max-w-[720px] w-full space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-primary tracking-tight text-wrap-balance">
                Transmission Decrypted
              </h1>
              {wasBurned ? (
                <p
                  className="text-destructive text-sm flex items-center justify-center gap-1.5"
                  role="alert"
                >
                  <AlertTriangle className="size-4" aria-hidden="true" />
                  This note has been destroyed — it cannot be viewed again after refresh
                </p>
              ) : (
                <p className="text-copper/80 text-sm">
                  This note will be automatically destroyed after expiration
                </p>
              )}
            </div>

            <SteampunkCard>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                    <Unlock className="size-4" aria-hidden="true" />
                    Decrypted Content
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(plaintext);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="cursor-pointer text-copper hover:text-primary hover:bg-primary/10 h-8 px-2.5 gap-1.5"
                    >
                      {copied ? (
                        <Check className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3.5" aria-hidden="true" />
                      )}
                      <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                    <div className="h-4 w-px bg-copper/25" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewRaw((v) => !v)}
                      className="cursor-pointer text-copper hover:text-primary hover:bg-primary/10 h-8 px-2.5 gap-1.5"
                    >
                      {viewRaw ? (
                        <Eye className="size-3.5" aria-hidden="true" />
                      ) : (
                        <FileText className="size-3.5" aria-hidden="true" />
                      )}
                      <span className="text-xs">{viewRaw ? "Preview" : "Source"}</span>
                    </Button>
                  </div>
                </div>

                {viewRaw ? (
                  <div className="rounded-lg border-2 border-iron bg-background/80 p-4 lg:p-6">
                    <pre className="whitespace-pre-wrap wrap-break-word font-mono text-sm leading-relaxed text-foreground">
                      {plaintext}
                    </pre>
                  </div>
                ) : (
                  <VditorPreview markdown={plaintext} />
                )}

                <Button
                  asChild
                  variant="outline"
                  className="w-full cursor-pointer border-copper/30 text-copper hover:text-primary hover:border-primary/50"
                >
                  <a href="/">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    New Transmission
                  </a>
                </Button>
              </div>
            </SteampunkCard>
          </div>
        </main>
      </div>
    );
  }

  // ── Decrypting spinner ──
  if (decrypting) {
    return (
      <StatusScreen
        icon={
          <Loader2
            className="size-8 text-primary animate-spin"
            aria-hidden="true"
          />
        }
        title="Decrypting…"
        description="PBKDF2 key derivation + AES-256-GCM decryption in progress"
      />
    );
  }

  // ── Decrypt failed ──
  if (decryptError) {
    return (
      <StatusScreen
        icon={<ShieldX className="size-8 text-destructive" aria-hidden="true" />}
        title="Decryption Failed"
        description={decryptError}
      >
        {backButton}
      </StatusScreen>
    );
  }

  // ── Auto-decrypting (no password, auto-burn in progress) ──
  const needsPassword =
    loaderData.status === "exists" && loaderData.hasPassword;

  if (!needsPassword && pasteKey && !actionData) {
    return (
      <StatusScreen
        icon={
          <Loader2
            className="size-8 text-primary animate-spin"
            aria-hidden="true"
          />
        }
        title="Decrypting…"
        description="Retrieving and decrypting data"
      />
    );
  }

  // ── Auto-decrypting (response received, decrypt effect about to run) ──
  if (
    !needsPassword &&
    pasteKey &&
    actionData &&
    "ciphertext" in actionData &&
    !plaintext &&
    !decryptError
  ) {
    return (
      <StatusScreen
        icon={
          <Loader2
            className="size-8 text-primary animate-spin"
            aria-hidden="true"
          />
        }
        title="Decrypting…"
        description="Retrieving and decrypting data"
      />
    );
  }

  // ── Auto-decrypting failed (no password flow) ──
  if (!needsPassword && actionData && "error" in actionData) {
    return (
      <StatusScreen
        icon={<ShieldX className="size-8 text-destructive" aria-hidden="true" />}
        title="Read Failed"
        description={actionData.error}
      >
        {backButton}
      </StatusScreen>
    );
  }

  return (
    <div className="min-h-svh flex flex-col">
      <VaporBackground />
      <ViewHeader />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary tracking-tight text-wrap-balance amber-text-glow">
              Incoming Transmission
            </h1>
            <p className="text-copper/80 italic">
              "A sealed message awaits. Break the lock to read."
            </p>
          </div>

          <SteampunkCard>
            <div className="space-y-6">
              <div className="mx-auto size-16 rounded-full border-2 border-primary/40 flex items-center justify-center bg-iron/30">
                <Lock className="size-8 text-primary" aria-hidden="true" />
              </div>

              {needsPassword && (
                <ControlPanel
                  icon={<KeyRound className="size-4" aria-hidden="true" />}
                  label="Access Code Required"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] text-copper uppercase tracking-wider">
                      Enter decryption password
                    </p>
                    <Input
                      id="view-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      className="bg-background border-copper/30 text-primary font-mono text-sm"
                      aria-label="Decryption password"
                      required
                    />
                  </div>
                </ControlPanel>
              )}

              {actionData && "error" in actionData && (
                <p
                  className="text-sm text-destructive text-center"
                  role="alert"
                >
                  {actionData.error}
                </p>
              )}
              {!keyProof && (
                <p className="text-xs text-copper/70 text-center">
                  Initializing key proof…
                </p>
              )}

              <Button
                onClick={handleBurn}
                disabled={
                  isSubmitting ||
                  !keyProof ||
                  Boolean(keyProofError) ||
                  (needsPassword && !password)
                }
                size="lg"
                className="w-full cursor-pointer bg-destructive hover:bg-destructive/90 text-white font-black py-6 text-base uppercase tracking-[0.15em] transition-shadow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="size-5 animate-spin"
                      aria-hidden="true"
                    />
                    Retrieving…
                  </>
                ) : (
                  <>
                    <Zap className="size-5" aria-hidden="true" />
                    {loaderData.status === "exists" && loaderData.burnAfterRead
                      ? "Decrypt & Destroy"
                      : "Decrypt"}
                    <Zap className="size-5" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </SteampunkCard>

          <div className="flex flex-wrap justify-center gap-4">
            <SpecBadge
              icon={
                <ShieldCheck
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
              }
              label="AES-256-GCM"
            />
            <SpecBadge
              icon={
                <Lock className="size-4 text-primary" aria-hidden="true" />
              }
              label="End-to-End"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function ViewHeader() {
  return (
    <header className="flex items-center justify-between border-b border-copper/30 px-6 py-4 lg:px-16 bg-background/80 backdrop-blur-md">
      <a
        href="/"
        className="flex items-center gap-3 text-primary no-underline"
      >
        <div className="size-8 flex items-center justify-center border-2 border-primary rounded-full">
          <VaporIcon className="size-5" />
        </div>
        <h2 className="text-primary text-xl font-bold tracking-widest uppercase">
          Vapor
        </h2>
      </a>
    </header>
  );
}
