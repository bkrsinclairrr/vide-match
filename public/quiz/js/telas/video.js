// T06b · o vídeo. Uma pergunta de um toque, logo depois da solução: o Zyron trabalha com vídeo. A resposta entra no diagnóstico e
// na ficha do painel (temVideo).
import { h } from '../motor/util.js';
import { opcoes } from '../componentes/opcoes.js';

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-video' });
  el.append(h('div', { class: 'entra' },
    h('h1', { class: 'titulo', style: '--i:0', text: c.titulo }),
    h('p', { class: 'apoio', style: '--i:1', text: c.apoio })));
  const g = opcoes({ lista: c.opcoes, valor: ctx.r.video, rotulo: c.titulo, aoEscolher: id => {
    ctx.responde('video', id);
    ctx.avancaCom({ espelho: c.espelhos[id], alvo: g.el });
  } });
  el.append(g.el);
  ctx.continuarSeCompleto();
  return el;
}
