import { cn } from "~/lib/utils";

function Rivet({ className }: { className?: string }) {
  return <div className={cn("rivet", className)} aria-hidden="true" />;
}

export function SteampunkCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "steampunk-border relative rounded-xl bg-iron/40 p-1 overflow-hidden",
        className
      )}
    >
      <Rivet className="top-2 left-2" />
      <Rivet className="top-2 right-2" />
      <Rivet className="bottom-2 left-2" />
      <Rivet className="bottom-2 right-2" />
      <div className="rounded-lg border border-copper/20 bg-background/60 p-6 lg:p-8 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

export function ControlPanel({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
        {icon}
        {label}
      </div>
      <div className="bg-iron/30 p-4 rounded-lg border border-copper/20">
        {children}
      </div>
    </div>
  );
}

export function SpecBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-copper/10 border border-copper/30 px-4 py-2 rounded-full">
      {icon}
      <span className="text-xs font-mono text-copper uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
