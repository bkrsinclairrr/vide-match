// T08 · o resultado da casa: os números do dono (com o universo dentro da frase) e os depoimentos do site, que se arrastam.
import { h, reduzMovimento, quandoVisivel } from '../motor/util.js';
import { trilho } from '../componentes/trilho.js';
import { icone } from '../componentes/icones.js';

// "Cerca de 3 meses" e "Inicialmente R$ 30 mil+ por mês" viram prefixo + número; o "por mês" vira a unidade
function partes(numero) {
  let s = String(numero), prefixo = '', unidade = '';
  const pm = /^(Cerca de|Entre|Inicialmente)\s+/i.exec(s); if (pm) { prefixo = pm[1]; s = s.slice(pm[0].length); }
  const um = /\s+(por mês)$/i.exec(s); if (um) { unidade = um[1]; s = s.slice(0, um.index); }
  return { prefixo, grande: s, unidade };
}

function contaAte(el, alvo, ms = 1400) {
  if (reduzMovimento()) { el.textContent = String(alvo); return; }
  const t0 = performance.now();
  const passo = agora => {
    const k = Math.min(1, (agora - t0) / ms);
    el.textContent = String(Math.round(alvo * (1 - Math.pow(1 - k, 4))));
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
  setTimeout(() => { el.textContent = String(alvo); }, ms + 150);
}

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-historico' });
  el.append(h('div', { class: 'entra' }, h('h1', { class: 'titulo', style: '--i:0', html: ctx.t(c.titulo) })));

  const faixa = ctx.cfg.provas?.renda?.modo === 'faixa';
  const contadores = [];
  const cartoes = c.numeros.map(id => ctx.provas[id]).filter(p => p && p.ativo !== false).map(p => {
    const fonte = (faixa && p.faixa) ? p.faixa : p;
    const { prefixo, grande, unidade } = partes(fonte.numero);
    // o número que conta (326, 30, 3) fica num span próprio; o resto do texto não muda
    const m = /^(\D*?)(\d+)(.*)$/.exec(grande);
    const grandeEl = h('span', { class: 'numero-grande' + (grande.length > 11 ? ' longo' : '') });
    if (m && !faixa) {
      const n = h('span', { class: 'num', text: m[2] });
      grandeEl.append(m[1], n, m[3]);
      contadores.push([n, parseInt(m[2], 10)]);
    } else grandeEl.textContent = grande;
    return h('div', { class: 'numero' + (p.id === 'casa-renda' ? ' ouro' : ''), 'data-prova': p.id },
      h('p', { class: 'numero-valor' }, prefixo ? h('span', { class: 'numero-prefixo', text: prefixo }) : null, grandeEl, unidade ? h('span', { class: 'numero-unidade', text: unidade }) : null),
      h('p', { class: 'numero-texto', text: fonte.texto }));
  });
  const bloco = h('div', { class: 'numeros' }, ...cartoes);
  el.append(bloco);
  ctx.aoSair(quandoVisivel(bloco, () => contadores.forEach(([n, alvo], i) => setTimeout(() => contaAte(n, alvo), i * 180))));

  const depos = c.depoimentos.map(id => ctx.provas[id]).filter(p => p && p.ativo !== false).map(p =>
    h('figure', { class: 'depo', 'data-prova': p.id, style: { margin: '0' } },
      h('div', { class: 'depo-quem' },
        h('img', { src: p.foto, alt: '', width: 46, height: 46, loading: 'lazy', decoding: 'async' }),
        h('div', null, h('p', { class: 'depo-nome', text: p.nome }), h('p', { class: 'depo-papel', text: p.papel }))),
      h('blockquote', { class: 'depo-texto', style: { margin: '0' }, text: p.texto }),
      h('div', { class: 'estrelas', 'aria-hidden': 'true', html: icone.estrela.repeat(5) })));
  if (depos.length) {
    const t = trilho({ itens: depos, rotulo: c.depoimentosAria, auto: 4800 });
    ctx.aoSair(() => t.destroi());
    el.append(h('p', { class: 'mini-rotulo' }, h('span', { text: c.depoimentosRotulo }), h('span', { text: '' })), t.el, t.pontos);
    t.liga();
  }

  ctx.barra.botao({ texto: ctx.geral.continuar, aoClicar: () => { ctx.responde('viuHistorico', true, { evento: false }); ctx.avanca(); } });
  return el;
}
