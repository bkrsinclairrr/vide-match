/**
 * Retratos ilustrados usados nos depoimentos de pais e mães.
 *
 * São ilustrações vetoriais desenhadas aqui mesmo — nenhuma foto de pessoa real
 * é usada, justamente para não atribuir um depoimento a alguém identificável.
 * Para trocar por fotos reais depois, basta substituir o componente por uma
 * <img src="..."> dentro do mesmo container circular em Dashboard.tsx.
 *
 * Cada avatar tem paleta própria (pele, cabelo, roupa) e ids de gradiente
 * únicos, para poderem coexistir na mesma página sem conflito.
 */

type AvatarProps = { className?: string }

const base = "block w-full h-full"

/* Traços faciais compartilhados — olhos, sobrancelhas e sorriso discreto. */
const Face = ({ ink = "#2B2018" }: { ink?: string }) => (
  <g>
    <ellipse cx="51" cy="54" rx="2" ry="2.6" fill={ink} />
    <ellipse cx="69" cy="54" rx="2" ry="2.6" fill={ink} />
    <path
      d="M46.5 47.5c2.6-1.6 5.6-1.7 8.4-.4"
      stroke={ink}
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
      opacity="0.75"
    />
    <path
      d="M65.1 47.1c2.8-1.3 5.8-1.2 8.4.4"
      stroke={ink}
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
      opacity="0.75"
    />
    <path
      d="M53 66.5c2.2 2.4 4.6 3.5 7 3.5s4.8-1.1 7-3.5"
      stroke={ink}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      opacity="0.85"
    />
  </g>
)

/* 1 — Rosângela: cabelo cacheado volumoso, brincos dourados. */
export const AvatarRosangela = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 120 120" className={className || base} role="img" aria-label="Retrato ilustrado de Rosângela">
    <defs>
      <linearGradient id="pa1bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2A2118" />
        <stop offset="100%" stopColor="#141118" />
      </linearGradient>
      <clipPath id="pa1clip">
        <circle cx="60" cy="60" r="60" />
      </clipPath>
    </defs>
    <g clipPath="url(#pa1clip)">
      <rect width="120" height="120" fill="url(#pa1bg)" />
      <circle cx="60" cy="58" r="43" fill="#F59E0B" opacity="0.07" />
      {/* ombros */}
      <ellipse cx="60" cy="122" rx="45" ry="33" fill="#9A4B34" />
      <path d="M43 96c5 6 11 9 17 9s12-3 17-9l-4-6H47z" fill="#8A422D" />
      {/* pescoço */}
      <rect x="52" y="70" width="16" height="20" rx="7" fill="#A8663C" />
      {/* cabelo — volume atrás */}
      <circle cx="60" cy="46" r="31" fill="#241712" />
      <circle cx="34" cy="52" r="13" fill="#241712" />
      <circle cx="86" cy="52" r="13" fill="#241712" />
      <circle cx="41" cy="33" r="12" fill="#2C1C15" />
      <circle cx="79" cy="33" r="12" fill="#2C1C15" />
      <circle cx="60" cy="24" r="13" fill="#2C1C15" />
      {/* rosto */}
      <ellipse cx="60" cy="54" rx="21" ry="24" fill="#B87343" />
      <ellipse cx="39" cy="57" rx="3.4" ry="4.6" fill="#B87343" />
      <ellipse cx="81" cy="57" rx="3.4" ry="4.6" fill="#B87343" />
      {/* franja cacheada */}
      <path d="M39 46c1-13 10-20 21-20s20 7 21 20c-6-6-12-8-21-8s-15 2-21 8z" fill="#241712" />
      <Face />
      {/* brincos */}
      <circle cx="38" cy="63" r="2.6" fill="#FBBF24" />
      <circle cx="82" cy="63" r="2.6" fill="#FBBF24" />
    </g>
  </svg>
)

/* 2 — Marcos: cabelo curto grisalho e barba aparada. */
export const AvatarMarcos = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 120 120" className={className || base} role="img" aria-label="Retrato ilustrado de Marcos Antônio">
    <defs>
      <linearGradient id="pa2bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1B2230" />
        <stop offset="100%" stopColor="#111319" />
      </linearGradient>
      <clipPath id="pa2clip">
        <circle cx="60" cy="60" r="60" />
      </clipPath>
    </defs>
    <g clipPath="url(#pa2clip)">
      <rect width="120" height="120" fill="url(#pa2bg)" />
      <circle cx="60" cy="58" r="43" fill="#60A5FA" opacity="0.07" />
      <ellipse cx="60" cy="122" rx="45" ry="33" fill="#3D4C63" />
      <path d="M44 97c4.5 6 10 8.6 16 8.6S71.5 103 76 97l-4-6H48z" fill="#35435A" />
      {/* gola */}
      <path d="M50 92l10 12 10-12-4-3-6 5-6-5z" fill="#2A3547" />
      <rect x="52" y="70" width="16" height="20" rx="7" fill="#C08A5E" />
      {/* cabeça */}
      <ellipse cx="60" cy="54" rx="21" ry="24" fill="#D19A6C" />
      <ellipse cx="39" cy="57" rx="3.4" ry="4.6" fill="#D19A6C" />
      <ellipse cx="81" cy="57" rx="3.4" ry="4.6" fill="#D19A6C" />
      {/* barba */}
      <path
        d="M39 54c0 16 9 26 21 26s21-10 21-26c1 12-1 22-6 27-4 4-9 6-15 6s-11-2-15-6c-5-5-7-15-6-27z"
        fill="#5B5B60"
      />
      <path d="M52 72c2.4 2.6 5 3.8 8 3.8s5.6-1.2 8-3.8c-2 5-4.8 7.4-8 7.4s-6-2.4-8-7.4z" fill="#4C4C51" />
      {/* cabelo grisalho */}
      <path d="M38 50c-1-16 9-25 22-25s23 9 22 25c-3-9-9-13-22-13s-19 4-22 13z" fill="#6E6E74" />
      <path d="M40 44c4-8 11-11 20-11s16 3 20 11c-4-11-11-16-20-16s-16 5-20 16z" fill="#83838A" />
      <Face />
    </g>
  </svg>
)

/* 3 — Cleide: cabelo preso em coque alto. */
export const AvatarCleide = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 120 120" className={className || base} role="img" aria-label="Retrato ilustrado de Cleide">
    <defs>
      <linearGradient id="pa3bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#16241E" />
        <stop offset="100%" stopColor="#101413" />
      </linearGradient>
      <clipPath id="pa3clip">
        <circle cx="60" cy="60" r="60" />
      </clipPath>
    </defs>
    <g clipPath="url(#pa3clip)">
      <rect width="120" height="120" fill="url(#pa3bg)" />
      <circle cx="60" cy="58" r="43" fill="#34D399" opacity="0.07" />
      <ellipse cx="60" cy="122" rx="45" ry="33" fill="#4A5D45" />
      <path d="M43 96c5 6 11 9 17 9s12-3 17-9l-4-6H47z" fill="#405138" />
      <rect x="52" y="70" width="16" height="20" rx="7" fill="#7A4A2A" />
      {/* coque */}
      <circle cx="60" cy="20" r="12" fill="#1C1310" />
      <ellipse cx="60" cy="50" rx="24" ry="26" fill="#1C1310" />
      {/* rosto */}
      <ellipse cx="60" cy="54" rx="21" ry="24" fill="#8B5427" />
      <ellipse cx="39" cy="57" rx="3.4" ry="4.6" fill="#8B5427" />
      <ellipse cx="81" cy="57" rx="3.4" ry="4.6" fill="#8B5427" />
      {/* linha do cabelo */}
      <path d="M39 48c0-14 9-22 21-22s21 8 21 22c-5-8-12-11-21-11s-16 3-21 11z" fill="#1C1310" />
      <Face ink="#2A1B12" />
      <circle cx="38" cy="63" r="2.4" fill="#34D399" opacity="0.9" />
      <circle cx="82" cy="63" r="2.4" fill="#34D399" opacity="0.9" />
    </g>
  </svg>
)

/* 4 — Wagner: cabelo raspado e cavanhaque. */
export const AvatarWagner = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 120 120" className={className || base} role="img" aria-label="Retrato ilustrado de Wagner">
    <defs>
      <linearGradient id="pa4bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#241C2C" />
        <stop offset="100%" stopColor="#131019" />
      </linearGradient>
      <clipPath id="pa4clip">
        <circle cx="60" cy="60" r="60" />
      </clipPath>
    </defs>
    <g clipPath="url(#pa4clip)">
      <rect width="120" height="120" fill="url(#pa4bg)" />
      <circle cx="60" cy="58" r="43" fill="#A78BFA" opacity="0.07" />
      <ellipse cx="60" cy="122" rx="45" ry="33" fill="#4B4658" />
      <path d="M44 97c4.5 6 10 8.6 16 8.6S71.5 103 76 97l-4-6H48z" fill="#403C4C" />
      <rect x="52" y="70" width="16" height="20" rx="7" fill="#D9A272" />
      <ellipse cx="60" cy="53" rx="21.5" ry="24.5" fill="#E8B183" />
      <ellipse cx="39" cy="56" rx="3.4" ry="4.6" fill="#E8B183" />
      <ellipse cx="81" cy="56" rx="3.4" ry="4.6" fill="#E8B183" />
      {/* cabelo raspado */}
      <path d="M38.6 49c0-15 9.4-23 21.4-23s21.4 8 21.4 23c-4-9-11-13-21.4-13s-17.4 4-21.4 13z" fill="#3A3129" opacity="0.85" />
      {/* cavanhaque */}
      <path d="M50 68c3 3 6.4 4.4 10 4.4S67 71 70 68c-1.4 8-5 12-10 12s-8.6-4-10-12z" fill="#3A3129" />
      <path d="M53.4 62.6c2 1 4.2 1.5 6.6 1.5s4.6-.5 6.6-1.5c-1.6 2.6-3.8 3.9-6.6 3.9s-5-1.3-6.6-3.9z" fill="#3A3129" opacity="0.8" />
      <Face />
    </g>
  </svg>
)

/* 5 — Simone: cabelo liso na altura dos ombros. */
export const AvatarSimone = ({ className }: AvatarProps) => (
  <svg viewBox="0 0 120 120" className={className || base} role="img" aria-label="Retrato ilustrado de Simone">
    <defs>
      <linearGradient id="pa5bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2A1A1E" />
        <stop offset="100%" stopColor="#151013" />
      </linearGradient>
      <clipPath id="pa5clip">
        <circle cx="60" cy="60" r="60" />
      </clipPath>
    </defs>
    <g clipPath="url(#pa5clip)">
      <rect width="120" height="120" fill="url(#pa5bg)" />
      <circle cx="60" cy="58" r="43" fill="#FB7185" opacity="0.06" />
      <ellipse cx="60" cy="122" rx="45" ry="33" fill="#6E3944" />
      <path d="M43 96c5 6 11 9 17 9s12-3 17-9l-4-6H47z" fill="#61323C" />
      <rect x="52" y="70" width="16" height="20" rx="7" fill="#D2A075" />
      {/* cabelo — massa traseira */}
      <path d="M30 60c0-22 12-35 30-35s30 13 30 35c0 14-2 24-5 32l-8 3c3-10 4-20 3-29-6 5-13 7-20 7s-14-2-20-7c-1 9 0 19 3 29l-8-3c-3-8-5-18-5-32z" fill="#4A2E1E" />
      <ellipse cx="60" cy="53" rx="21" ry="24" fill="#E0AC7E" />
      <ellipse cx="39" cy="56" rx="3.4" ry="4.6" fill="#E0AC7E" />
      <ellipse cx="81" cy="56" rx="3.4" ry="4.6" fill="#E0AC7E" />
      {/* franja lateral */}
      <path d="M38.8 48c1-14 10-22 21.2-22 7 0 12 2.4 15.6 7-6 2-10 6-12 12-5-3-14-2-24.8 3z" fill="#573723" />
      <Face />
      <circle cx="37.6" cy="62" r="2.4" fill="#FBBF24" opacity="0.9" />
      <circle cx="82.4" cy="62" r="2.4" fill="#FBBF24" opacity="0.9" />
    </g>
  </svg>
)
