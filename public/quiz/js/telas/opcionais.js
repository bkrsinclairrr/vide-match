// As telas opcionais (desligadas por padrão em config/geral.json, telasOpcionais): experiencia, epoca, objetivo e trava.
// Cada uma soma uma tela de um toque ao caminho. Ligar é trocar false por true; nada de código.
import { h } from '../motor/util.js';
import { opcoes } from '../componentes/opcoes.js';

export function render(ctx) {
  const id = ctx.id;
  const c = ctx.copy;
  const el = h('section', { class: 't-' + id });
  el.append(h('div', { class: 'entra' },
    h('h1', { class: 'titulo', style: '--i:0', text: c.titulo }),
    c.apoio ? h('p', { class: 'apoio', style: '--i:1', text: c.apoio }) : null));
  const g = opcoes({
    lista: c.opcoes, valor: ctx.r[id], grade: id === 'epoca', rotulo: c.titulo,
    aoEscolher: v => {
      ctx.responde(id, v);
      const esp = c.espelhos ? c.espelhos[v] : null;
      ctx.avancaCom({ espelho: esp, alvo: g.el });
    }
  });
  el.append(g.el);
  ctx.continuarSeCompleto();
  return el;
}
