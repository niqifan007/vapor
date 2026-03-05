import { cn } from "~/lib/utils";

export function VaporIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      {/* Gear teeth outer ring */}
      <path
        d="M20 2L22.5 6H17.5L20 2ZM20 38L17.5 34H22.5L20 38ZM2 20L6 17.5V22.5L2 20ZM38 20L34 22.5V17.5L38 20ZM5.86 5.86L9.5 7.5L7.5 9.5L5.86 5.86ZM34.14 5.86L32.5 9.5L30.5 7.5L34.14 5.86ZM5.86 34.14L7.5 30.5L9.5 32.5L5.86 34.14ZM34.14 34.14L30.5 32.5L32.5 30.5L34.14 34.14Z"
        fill="currentColor"
        opacity="0.4"
      />
      {/* Outer ring */}
      <circle
        cx="20"
        cy="20"
        r="14"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.6"
      />
      {/* Inner ring */}
      <circle
        cx="20"
        cy="20"
        r="8"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      {/* Center bolt */}
      <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.8" />
      {/* Steam wisps */}
      <path
        d="M17 18C17 18 16 15 18 13C20 11 18 8 18 8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M23 18C23 18 22 14 24 12C26 10 24 7 24 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
