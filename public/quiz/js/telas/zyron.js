// T06 · a solução. "Um clube procura exatamente {quem} como você": ele não precisa ser o novo Neymar; todo dia clubes do mundo inteiro
// contratam (os números da FIFA), e em algum lugar alguém precisa das características dele. O radar cruza o perfil com a nossa rede e
// acende um clube (sem nome). A pergunta do vídeo mora na barra.
import { h } from '../motor/util.js';
import { opcoes } from '../componentes/opcoes.js';
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
  const fatos = (c.fatos || []).map(id => ctx.provas[id]).filter(p => p && p.ativo !== false)
    .map(p => h('div', { 'data-prova': p.id }, h('strong', { text: p.numero }), h('span', { text: p.texto })));
  if (fatos.length) {
    const fonte = h('button', { type: 'button', class: 'fonte-mini', html: icone.externo + `<span>${c.fonteFatos}</span>` });
    fonte.addEventListener('click', () => ctx.fontes(c.fatos, null, 'zyron'));
    el.append(h('div', { class: 'prova-faixa fatos-mundo' }, ...fatos), fonte);
  }
  el.append(h('p', { class: 'certeza', html: ctx.t(c.certeza) }));

  // o perfil dele: o que já sabemos (posição e idade) e o que falta (o jogo, que o Zyron lê no vídeo)
  const chipJogo = h('span', { class: 'perfil-chip pendente', html: icone.play2 + `<span>${c.perfilJogo}: ${c.perfilJogoValor}</span>` });
  const perfil = h('div', { class: 'perfil', 'aria-label': c.perfilRotulo, role: 'group' },
    h('span', { class: 'perfil-rotulo', text: c.perfilRotulo }),
    ctx.textos.posicao ? h('span', { class: 'perfil-chip', html: icone.check + `<span>${ctx.textos.posicao}</span>` }) : null,
    ctx.textos.faixa ? h('span', { class: 'perfil-chip', html: icone.check + `<span>${ctx.textos.faixa}</span>` }) : null,
    chipJogo);

  const passos = c.passos.map((p, i) => h('li', { class: 'passo' }, h('span', { class: 'passo-n', 'aria-hidden': 'true', text: String(i + 1) }), h('div', null, h('h3', { text: p.titulo }), h('p', { text: p.texto }))));
  const lista = h('ol', { class: 'passos' }, ...passos);
  const r = radar({
    escudos: REDE.map(id => ({ src: `assets/clubes/${id}.webp` })),
    textos: { aria: c.radarAria, voce: ctx.todaCopy.inimigo.voce, match: c.match },
    aoTempo: n => passos.forEach((p, i) => p.classList.toggle('ativo', i === n - 1))
  });
  ctx.aoSair(() => r.destroi());
  el.append(perfil, r.el, h('p', { class: 'rede-rotulo', text: c.redeRotulo }), lista);
  ctx.depois(400, () => r.inicia());

  // a pergunta do vídeo, sempre visível na barra
  const retorno = h('div', { 'aria-live': 'polite' });
  const g = opcoes({ lista: c.videoOpcoes, valor: ctx.r.video, rotulo: c.videoPergunta, classe: 'barra-chips', aoEscolher: id => {
    ctx.responde('video', id);
    const op = c.videoOpcoes.find(o => o.id === id);
    if (id !== 'nada') { chipJogo.classList.remove('pendente'); chipJogo.innerHTML = icone.check + `<span>${c.perfilJogo}: ${op.texto.toLowerCase()}</span>`; }
    r.pula();
    retorno.replaceChildren(h('p', { class: 'barra-retorno', text: c.videoEspelhos[id] }));
    ctx.barra.ajustaAltura();
    ctx.esperaOuToque(1100).then(() => { if (ctx.vivo()) ctx.avanca(); });
  } });
  ctx.barra.custom(retorno, h('p', { class: 'barra-pergunta', text: c.videoPergunta }), g.el);
  return el;
}
