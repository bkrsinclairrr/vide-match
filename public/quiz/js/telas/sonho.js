// T09 · o sonho. O toque numa opção já começa o download do áudio da T10 (o toque conta como gesto do atleta).
import { h } from '../motor/util.js';
import { opcoes } from '../componentes/opcoes.js';
import { precarregaAudio } from '../componentes/audio-voz.js';

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-sonho' });
  el.append(h('div', { class: 'entra' }, h('h1', { class: 'titulo menor', style: '--i:0', text: c.titulo })));
  const g = opcoes({ lista: c.opcoes, valor: ctx.r.sonho, rotulo: c.titulo, aoEscolher: id => {
    ctx.responde('sonho', id);
    if (ctx.cfg.audio?.ativo !== false) precarregaAudio();
    const op = c.opcoes.find(o => o.id === id);
    ctx.avancaCom({ espelho: ctx.tx(c.espelho, { sonhoCurto: op ? op.curto : '' }), alvo: g.el });
  } });
  el.append(g.el);
  ctx.continuarSeCompleto();
  return el;
}
