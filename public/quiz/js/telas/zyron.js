// T06 · a solução. "Um clube procura exatamente {quem} como você": ele não precisa ser o novo Neymar; em algum lugar, alguém precisa das
// características dele. A ordem segue o olho no celular: a frase, o radar (o perfil dele cruzado com a nossa rede até acender UM clube,
// sem nome), a certeza, os números da FIFA e os três passos, até "a gente conecta". A pergunta do vídeo é a tela seguinte (T06b).
import { h, quandoVisivel } from '../motor/util.js';
import { radar } from '../componentes/radar.js';
import { icone } from '../componentes/icones.js';

// clubes da nossa rede (o mesmo conjunto do slide "Clubes e parceiros" do deck), em volta do radar
const REDE = ['braga', 'gremio', 'betis', 'feyenoord', 'athletico', 'anderlecht', 'fiorentina', 'fluminense', 'lens', 'salzburg'];

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-zyron' });
  el.append(h('div', { class: 'entra' },
    h('h1', { class: 'titulo', style: '--i:0', html: ctx.t(c.titulo) }),
    h('p', { class: 'neymar', style: '--i:1', text: c.neymar }),
    h('p', { class: 'apoio', style: '--i:2', text: c.apoio })));

  // o perfil dele: o que já sabemos (posição e idade) e o que falta (o jogo, que o Zyron lê no vídeo)
  const perfil = h('div', { class: 'perfil', 'aria-label': c.perfilRotulo, role: 'group' },
    h('span', { class: 'perfil-rotulo', text: c.perfilRotulo }),
    ctx.textos.posicao ? h('span', { class: 'perfil-chip', html: icone.check + `<span>${ctx.textos.posicao}</span>` }) : null,
    ctx.textos.faixa ? h('span', { class: 'perfil-chip', html: icone.check + `<span>${ctx.textos.faixa}</span>` }) : null,
    h('span', { class: 'perfil-chip pendente', html: icone.play2 + `<span>${c.perfilJogo}: ${c.perfilJogoValor}</span>` }));

  const passos = c.passos.map((p, i) => h('li', { class: 'passo' }, h('span', { class: 'passo-n', 'aria-hidden': 'true', text: String(i + 1) }), h('div', null, h('h3', { text: p.titulo }), h('p', { text: p.texto }))));
  const lista = h('ol', { class: 'passos' }, ...passos);
  const r = radar({
    escudos: REDE.map(id => ({ src: `assets/clubes/${id}.webp` })),
    textos: { aria: c.radarAria, voce: ctx.todaCopy.inimigo.voce, match: c.match },
    aoTempo: n => passos.forEach((p, i) => p.classList.toggle('ativo', i === n - 1))
  });
  ctx.aoSair(() => r.destroi());
  // o radar gira quando aparece na tela: quem rola até ele vê o clube acender
  ctx.aoSair(quandoVisivel(r.el, () => r.inicia()));
  el.append(perfil, r.el, h('p', { class: 'rede-rotulo', text: c.redeRotulo }), h('p', { class: 'certeza', html: ctx.t(c.certeza) }));

  // todo dia clubes do mundo inteiro fecham com jogadores: os números da FIFA, com a fonte a um toque
  const fatos = (c.fatos || []).map(id => ctx.provas[id]).filter(p => p && p.ativo !== false)
    .map(p => h('div', { 'data-prova': p.id }, h('strong', { text: p.numero }), h('span', { text: p.texto })));
  if (fatos.length) {
    const fonte = h('button', { type: 'button', class: 'fonte-mini', html: icone.externo + `<span>${c.fonteFatos}</span>` });
    fonte.addEventListener('click', () => ctx.fontes(c.fatos, null, 'zyron'));
    el.append(h('div', { class: 'prova-faixa fatos-mundo' }, ...fatos), fonte);
  }
  el.append(lista);

  ctx.barra.botao({ texto: ctx.geral.continuar, aoClicar: () => { ctx.responde('viuZyron', true, { evento: false }); ctx.avanca(); } });
  return el;
}
