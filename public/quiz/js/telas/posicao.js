// T01 · capa e primeira pergunta: o atleta toca na posição dele antes de ler qualquer outra coisa.
import { h } from '../motor/util.js';
import { campoEscolha } from '../componentes/campo.js';

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-posicao' });
  const topo = h('div', { class: 'entra' },
    h('span', { class: 'cap-chip', style: '--i:0' }, h('i'), c.chip),
    h('h1', { class: 'titulo', style: '--i:1', html: ctx.t(c.titulo) }),
    h('p', { class: 'apoio', style: '--i:2', text: c.apoio }));
  el.append(topo);

  // quem volta (com a idade já respondida) pode seguir de onde parou
  const volta = ctx.estado.temRetomada() && !ctx.estado.s.enviado;
  if (volta) {
    const card = h('div', { class: 'retomada' },
      h('p', { text: c.retomadaTitulo }),
      h('button', { type: 'button', class: 'btn', onclick: () => ctx.vaiPara(ctx.estado.retomada || 'idade') }, c.retomadaBotao),
      h('button', { type: 'button', class: 'link-btn', onclick: () => ctx.reinicia() }, c.recomecar));
    el.append(card);
  }

  const pergunta = h('p', { class: 'pergunta', id: 'pergunta-posicao', text: c.pergunta });
  const selecione = h('p', { class: 'selecione' }, c.selecione, h('span', { class: 'selecione-dedo', 'aria-hidden': 'true', text: '👇' }));
  const campo = campoEscolha({
    valor: ctx.r.posicao || null,
    abreviacoes: c.abreviacoes,
    rotulo: c.campoAria,
    nome: id => c.nomes?.[id] || ctx.mapa.nome(id),
    aoEscolher: id => {
      const primeira = !ctx.r.posicao && !ctx.estado.s.criadoEm;
      ctx.responde('posicao', id);
      if (primeira) ctx.evento('quiz_start', {});
      ctx.vibra(12);
      ctx.avancaCom({ atraso: 420 });
    }
  });
  ctx.aoSair(() => campo.destroi());
  // o que cada sigla quer dizer, junto do campo
  const siglas = h('div', { class: 'siglas' },
    h('p', { class: 'mini-rotulo' }, h('span', { text: c.legendaRotulo })),
    h('dl', null, ...c.legenda.map(([sigla, nomeSigla]) => h('div', null, h('dt', { text: sigla }), h('dd', { text: nomeSigla })))));
  const selos = h('p', { class: 'selos', text: c.selos });
  const prova = h('div', { class: 'prova-faixa' }, ...c.prova.map(({ prova: id }) => {
    const p = ctx.provas[id];
    if (!p || p.ativo === false) return null;
    return h('div', { 'data-prova': id }, h('strong', { text: p.numero }), h('span', { text: p.textoCurto || p.texto }));
  }));
  const rodape = h('footer', { class: 'rodape' },
    h('a', { href: ctx.cfg.politicaUrl, target: '_blank', rel: 'noopener noreferrer', text: c.politicaLinha }),
    h('span', { text: ctx.geral.rodapeCasa }));
  el.append(pergunta, selecione, campo.el, siglas, selos, prova, rodape);
  // com o cartão de retomada, a barra não oferece um segundo "Continuar" (tocar outra posição continua valendo)
  if (ctx.r.posicao && !volta) ctx.continuarSeCompleto();
  return el;
}
