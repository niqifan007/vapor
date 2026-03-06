import { useCallback, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/home";
import { deriveKeyProof, encrypt } from "~/lib/crypto";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  Zap,
  Lock,
  Hourglass,
  ShieldCheck,
  KeyRound,
  Loader2,
  Plus,
  Info,
  EyeOff,
  Cog,
  Flame,
  QrCode,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { VditorEditor } from "~/components/vditor-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { VaporBackground } from "~/components/vapor-bg";
import { VaporIcon } from "~/components/vapor-icon";
import {
  SteampunkCard,
  ControlPanel,
  SpecBadge,
} from "~/components/steampunk-card";

export function meta() {
  return [
    { title: "Vapor — 阅后即焚加密分享" },
    { name: "description", content: "端到端加密的阅后即焚秘密分享工具。使用 AES-256-GCM 加密，零知识架构，您的消息在阅读后自动销毁。" },
    { name: "keywords", content: "阅后即焚,加密分享,端到端加密,零知识,AES-256-GCM,安全传输,burn after reading,self-destructing messages" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: "Vapor — 阅后即焚加密分享" },
    { property: "og:description", content: "端到端加密的阅后即焚秘密分享工具。使用 AES-256-GCM 加密，零知识架构，您的消息在阅读后自动销毁。" },
    { property: "og:site_name", content: "Vapor" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "Vapor — 阅后即焚加密分享" },
    { name: "twitter:description", content: "端到端加密的阅后即焚秘密分享工具。使用 AES-256-GCM 加密，零知识架构。" },
  ];
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  formData.set("intent", "create");

  const res = await fetch("/api/notes", { method: "POST", body: formData });
  const json = await res.json();

  if (!res.ok) {
    return { error: json.error ?? "Failed to create note" };
  }
  return json as { noteId: string };
}

export default function Home() {
  const fetcher = useFetcher<typeof clientAction>();
  const [copied, setCopied] = useState(false);
  const [ttl, setTtl] = useState("60");
  const [burnAfterRead, setBurnAfterRead] = useState(true);
  const [encrypting, setEncrypting] = useState(false);
  const [pasteKey, setPasteKey] = useState<string | null>(null);
  const contentRef = useRef("");

  const actionData = fetcher.data;
  const isSubmitting = fetcher.state === "submitting" || encrypting;

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const content = contentRef.current;
      const password = formData.get("password") as string;

      if (!content?.trim()) return;

      setEncrypting(true);
      try {
        const result = await encrypt(content.trim(), password || undefined);
        const keyProof = await deriveKeyProof(result.pasteKey);

        const submitData = new FormData();
        submitData.set("ciphertext", result.ciphertext);
        submitData.set("salt", result.salt);
        submitData.set("iv", result.iv);
        submitData.set("keyProof", keyProof);
        submitData.set("kdfIterations", String(result.kdfIterations));
        submitData.set("hasPassword", password ? "1" : "0");
        submitData.set("burnAfterRead", burnAfterRead ? "1" : "0");
        submitData.set("ttl", formData.get("ttl") as string);

        setPasteKey(result.pasteKey);
        fetcher.submit(submitData, { method: "post" });
      } finally {
        setEncrypting(false);
      }
    },
    [fetcher, burnAfterRead]
  );

  const computedShareUrl =
    actionData && "noteId" in actionData && pasteKey
      ? `${window.location.origin}/view?id=${actionData.noteId}#${pasteKey}`
      : null;

  // ── Success: share link ───────────────────────
  if (computedShareUrl) {
    return (
      <div className="min-h-svh flex flex-col">
        <VaporBackground />
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-start py-12 px-4">
          <div className="max-w-[720px] w-full space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary tracking-tight text-wrap-balance">
                Transmission Secured
              </h1>
              <p className="text-copper/80 italic">
                "Your message has been sealed within gears of iron."
              </p>
            </div>

            <SteampunkCard>
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                  <KeyRound className="size-4" aria-hidden="true" />
                  Encrypted Link
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    readOnly
                    value={computedShareUrl}
                    className="font-mono text-xs bg-background border-copper/30 text-primary"
                    spellCheck={false}
                    aria-label="Share link"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopy(computedShareUrl)}
                    className="shrink-0 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                    aria-label={copied ? "Copied" : "Copy link"}
                  >
                    {copied ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      <Copy className="size-4" aria-hidden="true" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                    <QrCode className="size-4" aria-hidden="true" />
                    Scan to Decode
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-copper/20">
                    <QRCodeSVG
                      value={computedShareUrl}
                      size={180}
                      level="M"
                    />
                  </div>
                </div>

                <div className="bg-iron/30 border border-copper/20 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs text-copper flex items-start gap-1.5">
                    <KeyRound
                      className="size-3.5 text-primary shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>
                      The part after <code className="text-primary font-mono">#</code>{" "}
                      in the link is the decryption key and is never sent to the server
                    </span>
                  </p>
                  <p className="text-xs text-copper/70 flex items-start gap-1.5">
                    <Info
                      className="size-3.5 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>Copy the link now — it cannot be recovered once you leave this page</span>
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full cursor-pointer border-copper/30 text-copper hover:text-primary hover:border-primary/50"
                  onClick={() => {
                    setPasteKey(null);
                    fetcher.submit(null, { method: "get", action: "/" });
                  }}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  New Transmission
                </Button>
              </div>
            </SteampunkCard>
          </div>
        </main>
      </div>
    );
  }

  // ── Create form ───────────────────────────────
  return (
    <div className="min-h-svh flex flex-col">
      <VaporBackground />
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-start py-12 px-4">
        <div className="max-w-[720px] w-full space-y-8">
          {/* Hero */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-primary tracking-tight text-wrap-balance amber-text-glow">
              Mechanical Encryption Console
            </h1>
            <p className="text-copper/80 italic text-lg">
              "Secure your transmissions behind gears of cold iron and burning
              amber."
            </p>
          </div>

          {/* Console */}
          <SteampunkCard>
            <form onSubmit={handleSubmit} className="space-y-8">
              <input type="hidden" name="ttl" value={ttl} />

              {/* Textarea */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    className="text-primary font-bold uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <Cog className="size-4" aria-hidden="true" />
                    Secret Transmission
                  </label>
                </div>
                <VditorEditor
                  id="vditor-content"
                  placeholder="Type your classified message here for mechanical encoding…"
                  minHeight={200}
                  onChange={(value) => {
                    contentRef.current = value;
                  }}
                />
              </div>

              {/* Controls row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expiration */}
                <ControlPanel
                  icon={
                    <Hourglass className="size-4" aria-hidden="true" />
                  }
                  label="Temporal Settings"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] text-copper uppercase tracking-wider">
                        Deconstruct after
                      </p>
                      <Select value={ttl} onValueChange={setTtl}>
                        <SelectTrigger className="w-full bg-background border-copper/30 text-primary font-mono text-sm cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 min (Flash)</SelectItem>
                          <SelectItem value="10">10 min (Quick)</SelectItem>
                          <SelectItem value="30">30 min (Swift)</SelectItem>
                          <SelectItem value="60">1 hr (Standard)</SelectItem>
                          <SelectItem value="180">3 hr (Extended)</SelectItem>
                          <SelectItem value="360">6 hr (Enduring)</SelectItem>
                          <SelectItem value="720">12 hr (Persistent)</SelectItem>
                          <SelectItem value="1440">1 day (Archive)</SelectItem>
                          <SelectItem value="4320">3 days (Vault)</SelectItem>
                          <SelectItem value="10080">1 week (Deep Vault)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Mini gauge */}
                    <div className="size-10 rounded-full border-2 border-primary/40 flex items-center justify-center gauge-bg shrink-0">
                      <div
                        className="w-0.5 h-3 bg-primary origin-bottom rotate-45 rounded-full"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-copper/20">
                    <Checkbox
                      id="burn-after-read"
                      checked={burnAfterRead}
                      onCheckedChange={(checked) =>
                        setBurnAfterRead(checked === true)
                      }
                      className="border-copper/40 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                    />
                    <Label
                      htmlFor="burn-after-read"
                      className="text-xs text-copper cursor-pointer flex items-center gap-1.5"
                    >
                      <Flame className="size-3.5 text-destructive" aria-hidden="true" />
                      Burn After Reading
                    </Label>
                  </div>
                </ControlPanel>

                {/* Password */}
                <ControlPanel
                  icon={<Lock className="size-4" aria-hidden="true" />}
                  label="Locking Mechanism"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] text-copper uppercase tracking-wider">
                        Access Code (Optional)
                      </p>
                      <Input
                        type="password"
                        name="password"
                        placeholder=""
                        autoComplete="off"
                        spellCheck={false}
                        className="bg-background border-copper/30 text-primary font-mono text-sm"
                        aria-label="Access password"
                      />
                    </div>
                    <KeyRound
                      className="size-7 text-copper shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                </ControlPanel>
              </div>

              {/* Error */}
              {actionData && "error" in actionData && (
                <p className="text-sm text-destructive" role="alert">
                  {actionData.error}
                </p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-black py-6 text-base uppercase tracking-[0.15em] amber-glow transition-shadow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="size-5 animate-spin"
                      aria-hidden="true"
                    />
                    {encrypting ? "Encrypting…" : "Transmitting…"}
                  </>
                ) : (
                  <>
                    <Zap className="size-5" aria-hidden="true" />
                    Encrypt &amp; Generate Link
                    <Zap className="size-5" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>
          </SteampunkCard>

          {/* Spec badges */}
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
            <SpecBadge
              icon={
                <EyeOff className="size-4 text-primary" aria-hidden="true" />
              }
              label="Zero Knowledge"
            />
          </div>

          {/* FAQ */}
          <SteampunkCard>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                <Info className="size-4" aria-hidden="true" />
                Frequently Asked Questions
              </div>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="what" className="border-copper/20">
                  <AccordionTrigger className="text-copper hover:text-primary hover:no-underline">
                    What is Vapor?
                  </AccordionTrigger>
                  <AccordionContent className="text-copper/70">
                    Vapor is a self-destructing, end-to-end encrypted secret sharing tool. It lets you
                    send passwords, API keys, private notes, or any sensitive text through a one-time
                    link that automatically expires after being read or after a set time period.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="encryption" className="border-copper/20">
                  <AccordionTrigger className="text-copper hover:text-primary hover:no-underline">
                    How does the encryption work?
                  </AccordionTrigger>
                  <AccordionContent className="text-copper/70">
                    Your message is encrypted in the browser using <strong className="text-copper">AES-256-GCM</strong> before
                    it ever leaves your device. The encryption key is derived via PBKDF2 and is placed
                    in the URL fragment (the part after <code className="text-primary font-mono">#</code>), which is never
                    sent to the server. Only someone with the full link can decrypt your message.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="zero-knowledge" className="border-copper/20">
                  <AccordionTrigger className="text-copper hover:text-primary hover:no-underline">
                    Can Vapor&apos;s server read my messages?
                  </AccordionTrigger>
                  <AccordionContent className="text-copper/70">
                    No. Vapor operates on a <strong className="text-copper">zero-knowledge</strong> architecture. The server
                    only stores the encrypted ciphertext and never receives the decryption key.
                    Even if the server were compromised, your data would remain unreadable without the key.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="burn" className="border-copper/20">
                  <AccordionTrigger className="text-copper hover:text-primary hover:no-underline">
                    What does &ldquo;Burn After Reading&rdquo; mean?
                  </AccordionTrigger>
                  <AccordionContent className="text-copper/70">
                    When enabled, the encrypted note is permanently deleted from the server the moment
                    it is viewed for the first time. This ensures your secret can only ever be read once —
                    after that, the data is gone forever.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="password" className="border-copper/20">
                  <AccordionTrigger className="text-copper hover:text-primary hover:no-underline">
                    Why would I add an extra password?
                  </AccordionTrigger>
                  <AccordionContent className="text-copper/70">
                    The link alone is enough to decrypt the message, but adding a password provides a
                    second layer of protection. Even if the link is intercepted, the attacker would also
                    need the password to unlock the content. Share the password through a different channel
                    (e.g., a phone call) for maximum security.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="expiry" className="border-copper/20">
                  <AccordionTrigger className="text-copper hover:text-primary hover:no-underline">
                    What happens when a note expires?
                  </AccordionTrigger>
                  <AccordionContent className="text-copper/70">
                    Once the chosen time-to-live (TTL) is reached, the encrypted data is automatically
                    and permanently purged from the server. Expired notes cannot be recovered by anyone —
                    not even Vapor&apos;s administrators.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="open-source" className="border-copper/20">
                  <AccordionTrigger className="text-copper hover:text-primary hover:no-underline">
                    Is Vapor open source?
                  </AccordionTrigger>
                  <AccordionContent className="text-copper/70">
                    Yes! Vapor is fully open source. You can audit the code, verify the encryption
                    implementation, or self-host your own instance. Transparency is a core part of our
                    security model — don&apos;t trust, verify.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </SteampunkCard>
        </div>
      </main>
    </div>
  );
}

// ── Header ──────────────────────────────────────
function SiteHeader() {
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
