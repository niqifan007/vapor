import { Cog } from "lucide-react";

export function VaporBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-background" />

      {/* Copper radial glow from top */}
      <div className="absolute inset-0 steampunk-radial" />

      {/* Decorative gear – bottom right */}
      <Cog
        className="absolute -bottom-16 -right-16 size-64 text-copper/4 animate-gear"
        strokeWidth={0.5}
      />

      {/* Decorative gear – top left */}
      <Cog
        className="absolute -top-10 -left-10 size-48 text-copper/4 animate-gear-reverse"
        strokeWidth={0.5}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(34,28,16,0.6) 100%)",
        }}
      />
    </div>
  );
}
