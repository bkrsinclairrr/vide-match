import { cn } from "@/lib/utils"

/** "Z" geométrico do favicon (public/favicon.svg), em placa dourada. */
export function ZyronMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[28%] bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-[0_0_18px_-4px_rgba(251,191,36,0.7)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size * 0.72} height={size * 0.72}>
        <path
          d="M18 16 L46 16 L46 25.5 L30.5 38.5 L46 38.5 L46 48 L18 48 L18 38.5 L33.5 25.5 L18 25.5 Z"
          fill="#0a0a0a"
        />
      </svg>
    </span>
  )
}

export function ZyronLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ZyronMark size={size} />
      <span className="font-extrabold tracking-[0.18em] text-white" style={{ fontSize: size * 0.56 }}>
        ZYRON
      </span>
    </span>
  )
}
