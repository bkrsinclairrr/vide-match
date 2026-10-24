// Eventos do funil: só nomes e valores categóricos do catálogo (config/eventos.json). Nenhum nome, telefone, e-mail, texto livre,
// idade exata ou leadId. O sessaoId é aleatório e vive só na memória da aba. Vão em lotes, por sendBeacon, ao nosso destino.
import { uuid } from '../motor/util.js';

export function criaEventos({ cfg, catalogo }) {
  const sessaoId = uuid();
  const t0 = performance.now();
  // endpointEventos: false desliga os lotes de eventos (o lead continua indo pro endpoint)
  const destino = cfg.endpointEventos === false ? '' : (cfg.endpointEventos || cfg.endpoint || '');
  const fila = [];
  const historico = [];
  const ouvintes = [];
  let timer = 0;

  const limpa = v => (typeof v === 'number' || typeof v === 'boolean') ? v : String(v).replace(/\s+/g, ' ').slice(0, 80);

  function registra(nome, params = {}) {
    const permitidos = catalogo.eventos[nome];
    if (!permitidos) return;
    const p = {};
    for (const k of permitidos) if (params[k] !== undefined && params[k] !== null && params[k] !== '') p[k] = limpa(params[k]);
    const ev = { e: nome, t: Math.round(performance.now() - t0), p };
    historico.push(ev);
    if (historico.length > 400) historico.shift();
    // o lote sai no máximo a cada 3 s; não adia a cada evento novo (no navegador do Instagram, fechar nem sempre avisa a página)
    if (destino) { fila.push(ev); if (!timer) timer = setTimeout(() => { timer = 0; descarrega(false); }, 3000); }
    ouvintes.forEach(f => { try { f(nome, p); } catch { /* nada */ } });
    try { window.dispatchEvent(new CustomEvent('qz:evento', { detail: ev })); } catch { /* nada */ }
  }

  function descarrega(saindo) {
    if (!destino || !fila.length) return;
    const lote = fila.splice(0, fila.length);
    const corpo = JSON.stringify({ tipo: 'evento', v: 1, sessaoId, versao: cfg.versao, eventos: lote });
    let ok = false;
    try { ok = !!navigator.sendBeacon && navigator.sendBeacon(destino, new Blob([corpo], { type: 'text/plain' })); } catch { ok = false; }
    if (!ok && !saindo) {
      try { fetch(destino, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body: corpo }).catch(() => {}); } catch { /* nada */ }
    }
  }

  return { registra, descarrega, sessaoId, historico, aoEvento: f => ouvintes.push(f) };
}
