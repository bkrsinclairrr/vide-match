// T03 · peneiras e o que a família já investiu (duas perguntas, uma tela). "Nenhuma ainda" avança sozinho e pula a T04.
import { h } from '../motor/util.js';
import { opcoes } from '../componentes/opcoes.js';

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-peneiras' });
  const cab = h('div', { class: 'entra' },
    h('h1', { class: 'titulo', style: '--i:0', text: c.titulo }),
    h('p', { class: 'apoio', style: '--i:1', text: c.apoio }));
  const g1 = opcoes({ lista: c.opcoes, valor: ctx.r.peneiras, grade: true, rotulo: c.titulo, aoEscolher: escolhePeneiras });
  const area = h('div');
  el.append(cab, g1.el, area);
  let g2 = null;

  function segunda() {
    if (g2) return;
    g2 = opcoes({ lista: c.gastoOpcoes, valor: ctx.r.gasto, grade: true, rotulo: c.gastoTitulo, aoEscolher: escolheGasto });
    const bloco = h('div', { class: 'bloco-segunda' },
      h('p', { class: 'pergunta', style: { marginTop: '0' }, text: c.gastoTitulo }),
      h('p', { class: 'apoio', text: c.gastoApoio }),
      g2.el);
    area.replaceChildren(bloco);
    requestAnimationFrame(() => bloco.scrollIntoView({ behavior: ctx.reduz ? 'auto' : 'smooth', block: 'nearest' }));
  }

  function escolhePeneiras(id) {
    ctx.responde('peneiras', id);
    if (id === '0') {
      // sem peneira: o que dependia dela some (gasto, dispensas, "jogou bem")
      ['gasto', 'dispensas', 'jogouBem'].forEach(k => { if (ctx.r[k] !== undefined) ctx.responde(k, undefined, { evento: false }); });
      area.replaceChildren(); g2 = null;
      ctx.barra.limpa();
      ctx.avancaCom({ atraso: 260 });
      return;
    }
    // a faixa de dispensas nunca passa da de peneiras
    const ordem = ['0', '1_2', '3_5', '6_mais'];
    if (ctx.r.dispensas && ordem.indexOf(ctx.r.dispensas) > ordem.indexOf(id)) { ctx.responde('dispensas', undefined, { evento: false }); ctx.responde('jogouBem', undefined, { evento: false }); }
    g1.destrava();
    segunda();
    if (ctx.r.gasto) ctx.continuarSeCompleto();
  }

  function escolheGasto(id) {
    ctx.responde('gasto', id);
    g1.el.classList.add('travada');
    ctx.avancaCom({ espelho: c.espelhoGasto[id], alvo: g2.el });
  }

  if (ctx.r.peneiras && ctx.r.peneiras !== '0') { segunda(); }
  ctx.continuarSeCompleto();
  return el;
}
