// Utilitários do quiz: montar DOM, formatar texto da copy (variáveis e ênfase), datas, ids e armazenamento que nunca quebra.

export const reduzMovimento = () => {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

// h('div', { class: 'x', onclick: fn, html: '<b>..</b>' }, filho1, 'texto', ...)
export function h(tag, attrs, ...filhos) {
  const el = tag === 'svg' || attrs?.svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false || k === 'svg') continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      // variável CSS (--x) só entra por setProperty; Object.assign ignora calado
      else if (k === 'style' && typeof v === 'object') for (const [p, val] of Object.entries(v)) { if (p.startsWith('--')) el.style.setProperty(p, val); else el.style[p] = val; }
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);

// Texto da copy pra HTML: o modelo (que é nosso) ganha a ênfase *palavra*; as variáveis (que podem vir do atleta) entram escapadas.
export function t(modelo, vars = {}) {
  // a pontuação colada na ênfase ("*enganado*.") vem junto, recuada: o itálico deixa um vão que lê como espaço
  let s = esc(modelo).replace(/\*([^*]+)\*([.,!?;:])?/g, (m, a, p) => `<em class="enf">${a}</em>` + (p ? `<span class="enf-p">${p}</span>` : ''));
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? esc(vars[k]) : m));
}
// O mesmo, em texto puro (aria-label, eventos de leitura de tela, título da aba)
export function tx(modelo, vars = {}) {
  return String(modelo ?? '').replace(/\*([^*]+)\*/g, '$1').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export const espera = ms => new Promise(r => setTimeout(r, ms));

export function uuid() {
  try { if (crypto.randomUUID) return crypto.randomUUID(); } catch { /* sem crypto.randomUUID */ }
  const b = new Uint8Array(16);
  try { crypto.getRandomValues(b); } catch { for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256); }
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const x = [...b].map(v => v.toString(16).padStart(2, '0')).join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

// 2026-10-23T14:02:11-03:00 (com o fuso do aparelho)
export function isoLocal(d = new Date()) {
  const p = n => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const sinal = off >= 0 ? '+' : '-';
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${sinal}${p(off / 60)}:${p(off % 60)}`;
}
// 2024-10-14 vira 14/10/2024; 2014 fica 2014
export function dataBr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || '');
}

export function vibra(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* sem vibração */ }
}

// Armazenamento que nunca derruba o quiz: o navegador do Instagram pode bloquear o localStorage. Sem ele, guarda na memória.
const memoria = new Map();
export const guarda = {
  ler(chave) {
    try { const v = localStorage.getItem(chave); if (v !== null) return JSON.parse(v); } catch { /* bloqueado ou corrompido */ }
    return memoria.has(chave) ? memoria.get(chave) : null;
  },
  gravar(chave, valor) {
    memoria.set(chave, valor);
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* fica só na memória */ }
  },
  apagar(chave) {
    memoria.delete(chave);
    try { localStorage.removeItem(chave); } catch { /* nada */ }
  }
};
export const sessao = {
  ler(chave) { try { const v = sessionStorage.getItem(chave); return v === null ? null : JSON.parse(v); } catch { return null; } },
  gravar(chave, valor) { try { sessionStorage.setItem(chave, JSON.stringify(valor)); } catch { /* nada */ } }
};

export function plataforma() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}
export function noApp() {
  const ua = navigator.userAgent || '';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return 'facebook';
  return null;
}

// carrega um JSON da pasta config (com o preload do index.html, chega junto com o JS)
export async function json(url) {
  const r = await fetch(url, { credentials: 'same-origin' });
  if (!r.ok) throw new Error('config ' + url + ' ' + r.status);
  return r.json();
}

// o elemento está (ou entra) na tela: chama fn uma vez
export function quandoVisivel(el, fn, margem = '0px') {
  if (!('IntersectionObserver' in window)) { fn(); return () => {}; }
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margem });
  io.observe(el);
  return () => io.disconnect();
}

export const limita = (v, a, b) => Math.min(b, Math.max(a, v));
