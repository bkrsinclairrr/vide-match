// Envio do lead ao destino configurável (config/geral.json, endpoint): fetch com keepalive, texto puro (sem preflight de CORS) e
// tempo limite de 8 s. Falhou: fila no aparelho com recuo de 1, 3, 10 e 30 s, até 5 tentativas por visita; o resto fica pra próxima.
// O sendBeacon só entra quando a página está fechando com envio pendente: ele diz que o navegador aceitou, nunca que chegou, então o
// item continua na fila e a próxima visita confere. O leadId é a chave: o destino faz upsert e reenviar não duplica.
// Sem endpoint: MODO DE ENSAIO (o payload fica só nesta aba, pra conferência; nada sai do aparelho).
import { guarda, sessao } from '../motor/util.js';

const FILA = 'qz:fila';
const RECUO = [1000, 3000, 10000, 30000];
const MAX_TENTATIVAS = 5;
const TEMPO_LIMITE = 8000;

export function criaEnvio({ cfg, eventos }) {
  const destino = cfg.endpoint || '';
  const tentativasNaVisita = new Map();
  let fila = (guarda.ler(FILA) || []).filter(i => i && i.payload && i.payload.leadId);
  let timer = 0;
  const salva = () => { if (fila.length) guarda.gravar(FILA, fila); else guarda.apagar(FILA); };

  async function tenta(item) {
    const corpo = JSON.stringify(item.payload);
    const n = (tentativasNaVisita.get(item.id) || 0) + 1;
    tentativasNaVisita.set(item.id, n);
    item.tentativas = (item.tentativas || 0) + 1;
    let ok = false;
    const ctl = 'AbortController' in window ? new AbortController() : null;
    const tm = setTimeout(() => ctl?.abort(), TEMPO_LIMITE);
    try {
      // no-cors: a resposta é opaca; o que se sabe é que chegou ao servidor (falha de rede e tempo limite caem no catch)
      await fetch(destino, { method: 'POST', mode: 'no-cors', keepalive: corpo.length < 60000, headers: { 'Content-Type': 'text/plain' }, body: corpo, signal: ctl?.signal });
      ok = true;
    } catch { ok = false; }
    clearTimeout(tm);
    if (ok) {
      fila = fila.filter(i => i.id !== item.id);
      salva();
      eventos.registra('lead_enviado', { tentativa: n });
      return true;
    }
    eventos.registra('lead_fila', { tentativa: n });
    item.proximaEm = Date.now() + RECUO[Math.min(n - 1, RECUO.length - 1)];
    salva();
    return false;
  }

  async function processa() {
    clearTimeout(timer);
    if (!destino || !fila.length) return;
    if (navigator.onLine === false) return;
    const agora = Date.now();
    for (const item of [...fila]) {
      if ((tentativasNaVisita.get(item.id) || 0) >= MAX_TENTATIVAS) continue;
      if ((item.proximaEm || 0) > agora) continue;
      await tenta(item);
    }
    const pendentes = fila.filter(i => (tentativasNaVisita.get(i.id) || 0) < MAX_TENTATIVAS);
    if (pendentes.length) {
      const prox = Math.max(250, Math.min(...pendentes.map(i => (i.proximaEm || 0) - Date.now())));
      timer = setTimeout(processa, prox);
    }
  }

  // a página está fechando com envio pendente: o sendBeacon é o que sobrevive ao fechamento (o item fica na fila assim mesmo)
  let despedido = false;
  const despede = () => {
    if (despedido || !destino || !fila.length || !navigator.sendBeacon) return;
    despedido = true;
    fila.forEach(item => { try { navigator.sendBeacon(destino, new Blob([JSON.stringify(item.payload)], { type: 'text/plain' })); } catch { /* fica pra próxima visita */ } });
  };
  window.addEventListener('pagehide', despede);
  window.addEventListener('online', processa);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { despedido = false; processa(); } else despede(); });
  setTimeout(processa, 1500);

  return {
    modoEnsaio: !destino,
    envia(payload) {
      if (!destino) {
        const lista = sessao.ler('qz:ensaio') || [];
        lista.push(payload);
        sessao.gravar('qz:ensaio', lista.slice(-5));
        window.__qzEnsaio = lista.slice(-5);
        return Promise.resolve({ modo: 'ensaio' });
      }
      const item = { tipo: 'lead', id: payload.leadId, payload, tentativas: 0, proximaEm: 0 };
      fila = fila.filter(i => i.id !== item.id).concat(item);
      salva();
      return processa().then(() => ({ modo: 'envio' }));
    },
    get fila() { return fila.slice(); },
    processa
  };
}
