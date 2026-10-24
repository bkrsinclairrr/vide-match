// T12 · a chance. A última pergunta não vende nada: o atleta diz se está pronto pra chance, e a tela conta que a avaliação do
// perfil é gratuita. Sem preço, sem "assessoria paga", sem investimento.
import { h } from '../motor/util.js';
import { opcoes } from '../componentes/opcoes.js';

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-chance' });
  el.append(h('div', { class: 'entra' },
    h('h1', { class: 'titulo', style: '--i:0', text: c.titulo }),
    h('p', { class: 'pergunta', style: '--i:1', id: 'pergunta-chance', text: c.pergunta }),
    h('p', { class: 'apoio', style: '--i:2', html: ctx.t(c.apoio) })));
  const g = opcoes({ lista: c.opcoes, valor: ctx.r.chance, rotulo: c.pergunta, aoEscolher: id => {
    ctx.responde('chance', id);
    ctx.avancaCom({ espelho: c.espelhos[id], alvo: g.el });
  } });
  el.append(g.el);
  ctx.continuarSeCompleto();
  return el;
}
