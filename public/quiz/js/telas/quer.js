// T11 · a escada do sim numa tela só: "você quer viver isso de verdade?". Um toque responde e a tela já vai pra próxima parte (nada de
// segurar nem de confirmar). Dizer que quer ("sim" ou "receio") vale o compromisso: a pontuação e o payload ficam como antes.
import { h } from '../motor/util.js';
import { opcoes } from '../componentes/opcoes.js';

export function render(ctx) {
  const c = ctx.copy;
  const audioOn = ctx.cfg.audio?.ativo !== false;
  // a frase de uma linha que aparece embaixo da resposta antes de seguir (o toque em qualquer lugar pula); o "sim" não tem
  const espelhos = {
    sim: null, // o "sim" segue direto
    receio: { texto: audioOn ? c.receioComAudio : c.receioSemAudio, ms: 1800 },
    nao_sei: { texto: c.espelhoNaoSei, ms: 1000 }
  };
  const el = h('section', { class: 't-quer' });
  el.append(h('div', { class: 'entra' }, h('h1', { class: 'titulo', style: '--i:0', html: ctx.t(c.titulo) })));
  const g = opcoes({ lista: c.opcoes, valor: ctx.r.quer, rotulo: c.titulo, aoEscolher: escolhe });
  el.append(g.el);

  function escolhe(id) {
    ctx.responde('quer', id);
    ctx.responde('compromisso', id !== 'nao_sei', { evento: false });
    const e = espelhos[id];
    if (e) ctx.avancaCom({ espelho: e.texto, alvo: g.el, atraso: e.ms });
    else ctx.avancaCom({ atraso: 320 });
  }

  // quem volta com a resposta já dada (e a gravada no formato antigo, em que o compromisso vinha do segurar) segue com ela
  if (ctx.r.quer) {
    if (ctx.r.quer !== 'nao_sei' && !ctx.r.compromisso) ctx.responde('compromisso', true, { evento: false });
    ctx.continuarSeCompleto();
  }
  return el;
}
