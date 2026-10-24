// T07 · a autoridade: a IA no futebol já está nos jornais. Recortes de imprensa (cada um com veículo, data e a matéria original),
// os clubes que já escolhem com dados e o fecho do inimigo: quem lucra com a peneira cheia não quer que você saiba do outro caminho.
import { h, dataBr } from '../motor/util.js';
import { trilho } from '../componentes/trilho.js';
import { icone } from '../componentes/icones.js';

const CLUBES = ['IA-00', 'IA-01', 'IA-02', 'IA-03', 'IA-04', 'IA-05', 'IA-06', 'IA-07', 'IA-08', 'IA-09', 'IA-10'];

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-mundo' });
  el.append(h('div', { class: 'entra' },
    h('p', { class: 'rotulo-cap', style: '--i:0', text: c.rotulo }),
    h('h1', { class: 'titulo', style: '--i:1', html: ctx.t(c.titulo) }),
    h('p', { class: 'apoio', style: '--i:2', text: c.apoio })));

  const recortes = Object.values(ctx.provas).filter(p => p.tipo === 'recorte_de_imprensa' && p.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const idsRecortes = recortes.map(p => p.id);
  const cartoes = recortes.map(p => {
    const ver = h('button', { type: 'button', class: 'recorte-ver', html: `<span>${c.verMateria}</span>` + icone.externo });
    ver.addEventListener('click', () => ctx.fontes(idsRecortes, p.id, 'mundo_recorte'));
    return h('article', { class: 'recorte', 'data-prova': p.id, 'aria-label': `${p.fonte.veiculo}, ${dataBr(p.fonte.data)}` },
      h('header', { class: 'recorte-cab' }, h('span', { class: 'recorte-veiculo', text: p.fonte.veiculo.replace(/\s*\(.*\)$/, '') }), h('time', { datetime: p.fonte.data, text: dataBr(p.fonte.data) })),
      h('h2', { class: 'recorte-manchete', text: p.manchete }),
      h('p', { class: 'recorte-linha', text: p.texto }),
      h('footer', { class: 'recorte-pe' }, h('span', { text: p.assinatura || '' }), ver));
  });
  const conta = h('span', { text: ctx.tx(c.contador, { i: 1, n: cartoes.length }) });
  const t = trilho({
    itens: cartoes, rotulo: c.recortesAria, auto: 4000, dica: c.arraste,
    aoVer: i => { conta.textContent = ctx.tx(c.contador, { i: i + 1, n: cartoes.length }); ctx.evento('recorte_view', { id: idsRecortes[i] }); }
  });
  t.pista.addEventListener('scroll', () => { conta.textContent = ctx.tx(c.contador, { i: t.atual + 1, n: cartoes.length }); }, { passive: true });
  ctx.aoSair(() => t.destroi());
  el.append(h('p', { class: 'mini-rotulo' }, h('span', { text: c.recortesRotulo }), conta), t.el, t.pontos);
  t.liga();

  // os clubes que já escolhem com dados (escudo da casa ou selo de texto); o toque abre a fonte daquele clube
  const modoTexto = ctx.cfg.escudos?.modo === 'texto';
  const escudos = CLUBES.map(id => ctx.provas[id]).filter(p => p && p.ativo !== false).map((p, i) => {
    const conteudo = (!modoTexto && p.escudo)
      ? h('img', { src: `assets/clubes/${p.escudo}.webp`, alt: '', width: 36, height: 36, loading: 'lazy', decoding: 'async' })
      : h('span', { class: 'escudo-selo', text: p.selo || p.clube.slice(0, 3).toUpperCase() });
    const b = h('button', { type: 'button', class: 'escudo', 'data-prova': p.id, style: `--i:${i}`, 'aria-label': p.clube, title: p.clube }, conteudo);
    b.addEventListener('click', () => ctx.fontes(CLUBES, p.id, 'mundo_clube'));
    return b;
  });
  el.append(h('p', { class: 'mini-rotulo' }, h('span', { text: c.escudosRotulo })), h('div', { class: 'escudos' }, ...escudos));

  el.append(h('p', { class: 'ponte', html: icone.raio + ctx.t(c.ponte) }));
  // o fecho: o dado da inscrição paga e, por último, quem lucra com a peneira cheia
  // (sem lookbehind no regex: o iPhone com iOS antigo não entende, e o módulo inteiro deixaria de carregar)
  const frases = (c.fecho.match(/[^.]+\.?/g) || [c.fecho]).map(f => f.trim()).filter(Boolean);
  const ultima = frases.pop();
  el.append(h('p', { class: 'fecho', html: frases.map(f => ctx.t(f)).join(' ') + ` <strong>${ctx.t(ultima)}</strong>` }));
  el.append(h('p', { class: 'destaque', html: ctx.t(c.destaque) }));
  const fontes = h('button', { type: 'button', class: 'link-btn', html: icone.externo + `<span>${ctx.geral.verFontes}</span>` });
  fontes.addEventListener('click', () => ctx.fontes([...idsRecortes, ...CLUBES, 'PEN-01', 'PEN-03'], null, 'mundo'));
  el.append(fontes);

  ctx.barra.botao({ texto: ctx.geral.continuar, aoClicar: () => { ctx.responde('viuMundo', true, { evento: false }); ctx.avanca(); } });
  return el;
}
