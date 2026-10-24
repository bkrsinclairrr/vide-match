// Rastreio: UTMs (campanha, não pessoa), identificadores de clique e as tags de anúncio.
// Regra de lei (ECA Digital, Lei 15.211, arts. 22 e 26), que o sistema cumpre sozinho e não aparece na tela:
// nenhuma tag de terceiro antes de a idade ser respondida; nunca pra menor de 18, sem idade ou em dúvida; adulto só depois do aceite.
// Sem ID configurado, nada externo carrega. O tier e a pontuação nunca vão pra plataforma de anúncio.
import { sessao, guarda, plataforma, noApp } from '../motor/util.js';

const UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export function criaRastreio({ cfg }) {
  const q = new URLSearchParams(location.search);
  // UTMs: o primeiro toque da sessão vale
  const salvas = sessao.ler('qz:utm') || {};
  const utm = {};
  UTMS.forEach(k => { const v = q.get(k); utm[k] = (salvas[k] ?? (v ? v.slice(0, 200) : null)) || null; });
  sessao.gravar('qz:utm', utm);
  // identificadores de clique: só na memória, e só saem pra adulto com aceite
  let cliques = { fbclid: q.get('fbclid'), gclid: q.get('gclid') };
  let referrer = '';
  try { referrer = document.referrer ? new URL(document.referrer).hostname.slice(0, 200) : ''; } catch { referrer = ''; }

  const temId = !!(cfg.pixel?.meta || cfg.pixel?.utmify);
  let situacao = 'sem_idade';   // sem_idade | menor | adulto_sem_escolha | adulto_aceitou | adulto_rejeitou
  let carregou = false;

  function carrega() {
    if (carregou || situacao !== 'adulto_aceitou') return;
    carregou = true;
    if (cfg.pixel.meta) {
      /* Meta Pixel (código base), só aqui, depois do aceite */
      const f = window, b = document;
      if (!f.fbq) {
        const n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        const t = b.createElement('script'); t.async = true; t.src = 'https://connect.facebook.net/en_US/fbevents.js';
        b.head.appendChild(t);
      }
      // sem configuração automática: o pixel não lê botões nem campos do formulário (o telefone nunca vai pra plataforma)
      window.fbq('set', 'autoConfig', false, cfg.pixel.meta);
      window.fbq('init', cfg.pixel.meta);
      window.fbq('track', 'PageView');
    }
    if (cfg.pixel.utmify) {
      /* Utmify: os mesmos dois scripts que o aizyron.com carrega */
      window.pixelId = cfg.pixel.utmify;
      const p = document.createElement('script'); p.id = 'utmify-pixel'; p.src = 'https://cdn.utmify.com.br/scripts/pixel/pixel.js'; p.async = true; p.defer = true;
      const u = document.createElement('script'); u.id = 'utmify-utms'; u.src = 'https://cdn.utmify.com.br/scripts/utms/latest.js'; u.setAttribute('data-utmify-prevent-subids', ''); u.async = true; u.defer = true;
      document.head.append(p, u);
    }
  }

  return {
    utm, plataforma: plataforma(), inApp: noApp(), referrer,
    get situacao() { return situacao; },
    get podeIdentificar() { return situacao === 'adulto_aceitou'; },
    get cliques() { return situacao === 'adulto_aceitou' ? { fbclid: cliques.fbclid || null, gclid: cliques.gclid || null } : { fbclid: null, gclid: null }; },
    // chamado na T02. Devolve true quando a folha de cookies precisa aparecer
    idade(faixa) {
      if (faixa === '18_21' || faixa === '22_mais') {
        const escolha = guarda.ler('qz:cookies');
        if (escolha === 'aceito') { situacao = 'adulto_aceitou'; carrega(); return false; }
        if (escolha === 'rejeitado') { situacao = 'adulto_rejeitou'; return false; }
        situacao = 'adulto_sem_escolha';
        return temId;
      }
      // menor, menos de 12 ou sem resposta: nada carrega, e os identificadores de clique são esquecidos
      situacao = 'menor';
      cliques = { fbclid: null, gclid: null };
      return false;
    },
    escolhe(aceite) {
      if (situacao !== 'adulto_sem_escolha') return;
      guarda.gravar('qz:cookies', aceite ? 'aceito' : 'rejeitado');
      situacao = aceite ? 'adulto_aceitou' : 'adulto_rejeitou';
      if (aceite) carrega();
    },
    // ponte com os eventos do funil: só os mapeados, sem parâmetro de identificação, só pra adulto com aceite
    dispara(nome, mapa) {
      if (situacao !== 'adulto_aceitou' || !carregou || !window.fbq || !cfg.pixel.meta) return;
      const m = mapa[nome];
      if (!m || !m.meta) return;
      try { m.metaPersonalizado ? window.fbq('trackCustom', m.meta) : window.fbq('track', m.meta); } catch { /* nada */ }
    }
  };
}
