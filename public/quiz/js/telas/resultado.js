// T14 · o diagnóstico: só o que o atleta respondeu, três linhas por regra e o botão final. Com `whatsappFinal` no geral.json, o botão
// abre a conversa com a equipe comercial já com a mensagem pronta (quem é, o que respondeu e o código do diagnóstico); sem ele, vai pra
// landing (VSL). Tier C sai com respeito. Nada de "aprovado": o selo diz "Pronto para o próximo passo". Sem rodapé de ressalva.
import { h, vibra } from '../motor/util.js';
import { icone } from '../componentes/icones.js';
import { urlLanding } from '../dados/payload.js';
import { linkWhatsapp, mensagemEquipe } from '../dados/mensagem.js';

export function render(ctx) {
  const c = ctx.copy;
  const app = ctx.app;
  const s = ctx.estado.s;
  const res = s.resultado || app.pontua(ctx.r);
  // com roteamento.tierC = "landing", o C vê a tela do B; a landing recebe o tier real (t=C)
  let tier = res.tier;
  if (tier === 'C' && ctx.cfg.roteamento?.tierC === 'landing') tier = 'B';
  const nome = ctx.estado.memoria.nome || ctx.r.nome || '';
  const el = h('section', { class: 't-resultado' });
  const T = ctx.textos;

  if (!s.completoVisto) {
    s.completoVisto = true; ctx.estado.passo('resultado');
    ctx.evento('quiz_complete', { tier: res.tier, total: res.total });
    vibra(30);
  }

  const titulo = nome ? ctx.t(c.titulo, { nome }) : ctx.t(c.tituloSemNome || 'O seu diagnóstico');
  if (tier === 'C') {
    el.append(h('div', { class: 'entra' },
      h('h1', { class: 'titulo titulo-resultado', style: '--i:0', html: titulo }),
      h('p', { class: 'saida-c', style: '--i:1', text: c.tierCTexto })));
    ctx.barra.custom(h('a', {
      class: 'btn', href: ctx.cfg.instagramUrl, target: '_blank', rel: 'noopener noreferrer', html: icone.arroba + `<span>${c.tierCBotao}</span>`,
      onclick: () => ctx.evento('tierC_click', {})
    }));
    return el;
  }

  el.append(h('div', { class: 'entra' },
    h('p', { class: 'selo', style: '--i:0', html: icone.check + `<span>${c.selo}</span>` }),
    h('h1', { class: 'titulo titulo-resultado', style: '--i:1', html: titulo })));

  // o resumo: só o que ele respondeu
  const linhas = [];
  const linha = (rotulo, valor) => { if (valor) linhas.push(h('div', null, h('dt', { text: rotulo }), h('dd', { text: valor }))); };
  linha(c.resumo.perfil, [T.posicao, T.faixa].filter(Boolean).join(' · '));
  if (ctx.r.peneiras && ctx.r.peneiras !== '0') linha(c.resumo.historico, ctx.tx(ctx.r.dispensas && ctx.r.dispensas !== '0' ? c.historicoTexto : c.historicoSemDispensa));
  linha(c.resumo.objetivo, T.sonho);
  linha(c.resumo.video, T.videoTexto);
  el.append(h('section', { class: 'resumo surge', 'aria-labelledby': 'resumo-t' }, h('h2', { id: 'resumo-t', text: c.resumoTitulo }), h('dl', null, ...linhas)));

  const indica = [
    ctx.d.quiz.recusado ? c.indica1Recusado : c.indica1,
    c.indica2,
    ctx.r.video === 'nada' ? c.indica3SemVideo : c.indica3
  ];
  el.append(h('section', { class: 'indica', 'aria-labelledby': 'indica-t' },
    h('h2', { id: 'indica-t', text: c.indicaTitulo }),
    h('ol', null, ...indica.map((t, i) => h('li', null, h('span', { 'aria-hidden': 'true', text: String(i + 1) }), h('p', { html: ctx.t(t) }))))));

  // escassez só com dado real da semana (config), desligada por padrão
  const extra = [];
  if (ctx.cfg.vagas) extra.push(ctx.tx(c.vagas, { vagas: ctx.cfg.vagas }));
  if (ctx.cfg.proximaTurma) extra.push(ctx.tx(c.proximaTurma, { data: ctx.cfg.proximaTurma }));
  if (extra.length) el.append(h('p', { class: 'apoio', style: { marginTop: '18px' }, text: extra.join(' ') }));

  if (ctx.cfg.whatsappEquipe) {
    const num = String(ctx.cfg.whatsappEquipe).replace(/\D/g, '');
    el.append(h('a', { class: 'link-btn', style: { marginTop: '14px' }, href: `https://wa.me/${num}`, target: '_blank', rel: 'noopener noreferrer', html: icone.conversa + `<span>${c.whatsapp}</span>` }));
  }

  const zap = String(ctx.cfg.whatsappFinal || '').replace(/\D/g, '');
  const url = zap
    // depois do envio, nome e responsável só existem na memória da aba (o aparelho não guarda contato)
    ? linkWhatsapp(zap, mensagemEquipe({
        copy: ctx.todaCopy, textos: ctx.textos, menor: ctx.d.menor, leadId: s.leadId, pont: res,
        r: Object.assign({}, ctx.r, { nome, responsavelNome: ctx.estado.memoria.responsavelNome || ctx.r.responsavelNome || '' })
      }))
    : urlLanding({ cfg: ctx.cfg, rastreio: app.rastreio, tier: res.tier, leadId: s.leadId || 'sem-id' });
  const b = ctx.barra.botao({
    texto: zap ? c.botaoWhatsapp : c.botao, brilha: true, seta: true,
    acima: tier === 'B' ? (zap ? c.tierBWhatsapp : c.tierB) : null,
    nota: zap ? c.botaoWhatsappSub : c.botaoSub,
    aoClicar: () => {
      ctx.evento('cta_click', { tier: res.tier });
      app.eventos.descarrega(true);
      setTimeout(() => location.assign(url), 120);
    }
  });
  b.dataset.url = url;
  return el;
}
