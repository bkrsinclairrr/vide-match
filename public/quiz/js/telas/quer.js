// T11 · a escada do sim numa tela só: "você quer viver isso de verdade?" e, pra quem quer, o compromisso de segurar pra confirmar.
import { h } from '../motor/util.js';
import { opcoes } from '../componentes/opcoes.js';
import { segurar } from '../componentes/segurar.js';

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-quer' });
  el.append(h('div', { class: 'entra' }, h('h1', { class: 'titulo', style: '--i:0', html: ctx.t(c.titulo) })));
  const area = h('div');
  const g = opcoes({ lista: c.opcoes, valor: ctx.r.quer, rotulo: c.titulo, aoEscolher: escolhe });
  el.append(g.el, area);
  let seg = null;

  function blocoSegurar(id) {
    area.replaceChildren();
    if (id === 'receio') {
      const audioOn = ctx.cfg.audio?.ativo !== false;
      area.append(h('p', { class: 'receio', text: audioOn ? c.receioComAudio : c.receioSemAudio }));
    }
    seg?.destroi();
    seg = segurar({
      textos: c,
      aoConfirmar: ({ ms }) => {
        ctx.responde('compromisso', true, { evento: false });
        ctx.evento('compromisso', { ms });
        g.el.classList.add('travada');
        ctx.depois(700, () => ctx.avanca());
      }
    });
    ctx.aoSair(() => seg?.destroi());
    area.append(seg.el);
    requestAnimationFrame(() => seg.el.scrollIntoView({ behavior: ctx.reduz ? 'auto' : 'smooth', block: 'center' }));
  }

  function escolhe(id) {
    ctx.responde('quer', id);
    if (id === 'nao_sei') {
      ctx.responde('compromisso', false, { evento: false });
      area.replaceChildren();
      ctx.avancaCom({ espelho: c.espelhoNaoSei, alvo: g.el });
      return;
    }
    // trocou de ideia depois de segurar: o compromisso é refeito
    if (ctx.r.compromisso) ctx.responde('compromisso', false, { evento: false });
    g.destrava();
    blocoSegurar(id);
  }

  if (ctx.r.quer && ctx.r.quer !== 'nao_sei') {
    if (ctx.r.compromisso) ctx.continuarSeCompleto();
    else blocoSegurar(ctx.r.quer);
  } else if (ctx.r.quer === 'nao_sei') ctx.continuarSeCompleto();
  return el;
}
