// Um conjunto só de ícones SVG inline (traço de 1,75 px, 24 x 24). Nenhum emoji, nenhum pacote de terceiros.
const T = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${d}</svg>`;

export const icone = {
  voltar: T('<path d="M15 5l-7 7 7 7"/>'),
  seta: T('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  desce: T('<path d="M6.5 6.5L12 12l5.5-5.5"/><path d="M6.5 12.5L12 18l5.5-5.5"/>'),
  check: T('<path d="M5 12.5l4.2 4.2L19 7"/>'),
  arrasta: T('<path d="M4 5h16M6.6 2.6L4 5l2.6 2.4M17.4 2.6L20 5l-2.6 2.4"/><path d="M10 18.4v-8a1.5 1.5 0 0 1 3 0v4.8"/><path d="M13 13.4a1.5 1.5 0 0 1 3 0v1.8"/><path d="M16 14.4a1.5 1.5 0 0 1 3 0v2.4a5 5 0 0 1-5 5h-1.4a4.6 4.6 0 0 1-3.7-1.9l-2.2-3a1.4 1.4 0 0 1 2.2-1.8l1.1 1.3"/>'),
  fechar: T('<path d="M6 6l12 12M18 6L6 18"/>'),
  externo: T('<path d="M7 17L17 7M9 7h8v8"/>'),
  cadeado: T('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>',
  repetir: T('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>'),
  mic: T('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>'),
  pessoa: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="9" r="4.2" fill="currentColor"/><path d="M4 20.5c1.2-4 4.4-6 8-6s6.8 2 8 6" fill="currentColor"/></svg>',
  alerta: T('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>'),
  estrela: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.5l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.8l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" fill="currentColor"/></svg>',
  raio: T('<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>'),
  olho: T('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  alvo: T('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>'),
  familia: T('<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M3 19.5c.7-3.3 2.9-5 5.5-5s4.8 1.7 5.5 5M14.2 14.6c.7-.3 1.5-.5 2.3-.5 2.1 0 3.9 1.4 4.5 4.4"/>'),
  digital: T('<path d="M7.5 18.5c.9-1.6 1.4-3.5 1.4-5.5a3.1 3.1 0 0 1 6.2 0c0 1.1-.1 2.2-.3 3.2"/><path d="M5 15.5c.4-.8.6-1.6.6-2.5a6.4 6.4 0 0 1 12.8 0c0 2.4-.4 4.6-1.2 6.6"/><path d="M12 13c0 3-.8 5.8-2.3 8"/><path d="M14.2 19.8c-.3.6-.6 1.1-.9 1.7"/><path d="M4.4 9.5A8.6 8.6 0 0 1 12 4.5c2.4 0 4.6 1 6.2 2.6"/>'),
  arroba: T('<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>'),
  conversa: T('<path d="M4 18.5V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H8z"/><path d="M8.5 9.5h7M8.5 13h4.5"/>'),
  campo: T('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2.5"/>'),
  grafico: T('<path d="M4 20V4M4 20h16"/><path d="M8 15l3.5-4 3 2.5L19 8"/>'),
  play2: T('<circle cx="12" cy="12" r="9"/><path d="M10 8.8v6.4l5.2-3.2z" fill="currentColor" stroke="none"/>')
};

// o Z da marca (o mesmo desenho do aizyron.com)
export const marcaZ = '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M18 16 L46 16 L46 25.5 L30.5 38.5 L46 38.5 L46 48 L18 48 L18 38.5 L33.5 25.5 L18 25.5 Z" fill="#0a0a0a"/></svg>';
