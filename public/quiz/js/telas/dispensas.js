// T04 · dispensas (só pra quem já fez peneira). Quem foi dispensado responde mais uma, de um toque, que confirma o que ele já sente:
// "você sentiu que jogou bem?". A T05 vem logo depois, de propósito.
import { h } from '../motor/util.js';
import { opcoes, espelho } from '../componentes/opcoes.js';

const ORDEM = ['0', '1_2', '3_5', '6_mais'];

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-dispensas' });
  const cab = h('div', { class: 'entra' },
    h('h1', { class: 'titulo', style: '--i:0', text: c.titulo }),
    h('p', { class: 'apoio', style: '--i:1', text: c.apoio }));
  const g1 = opcoes({ lista: c.opcoes, valor: ctx.r.dispensas, grade: true, rotulo: c.titulo, aoEscolher: escolhe });
  // não mostra faixa maior que a de peneiras
  const teto = Math.max(1, ORDEM.indexOf(ctx.r.peneiras));
  g1.filtra(ORDEM.slice(0, teto + 1));
  const area = h('div');
  el.append(cab, g1.el, area);
  let g2 = null;

  function segunda(comEspelho) {
    area.replaceChildren();
    g2 = opcoes({ lista: c.jogouOpcoes, valor: ctx.r.jogouBem, rotulo: c.jogouTitulo, aoEscolher: escolheJogou });
    const bloco = h('div', { class: 'bloco-segunda' },
      h('p', { class: 'pergunta', style: { marginTop: '0' }, text: c.jogouTitulo }),
      g2.el);
    if (comEspelho) area.append(espelho(c.espelhoAlguma));
    area.append(bloco);
    requestAnimationFrame(() => bloco.scrollIntoView({ behavior: ctx.reduz ? 'auto' : 'smooth', block: 'nearest' }));
  }

  function escolhe(id) {
    ctx.responde('dispensas', id);
    if (id === '0') {
      if (ctx.r.jogouBem !== undefined) ctx.responde('jogouBem', undefined, { evento: false });
      area.replaceChildren();
      ctx.barra.limpa();
      ctx.avancaCom({ espelho: c.espelhoNenhuma, alvo: g1.el });
      return;
    }
    g1.destrava();
    segunda(true);
    if (ctx.r.jogouBem) ctx.continuarSeCompleto();
  }

  function escolheJogou(id) {
    ctx.responde('jogouBem', id);
    g1.el.classList.add('travada');
    ctx.avancaCom({ espelho: c.jogouEspelhos[id], alvo: g2.el });
  }

  if (ctx.r.dispensas && ctx.r.dispensas !== '0') segunda(false);
  ctx.continuarSeCompleto();
  return el;
}
