// T05 · o inimigo em comum (o olhômetro). Variante A (foi dispensado), B (fez peneira e não foi) e C (nunca fez).
// A fala é direta: ele não foi reprovado por ser ruim; o método de observação falhou com ele. O adversário ganha nome e cartão
// próprio logo no começo (com o fato que mostra que o olho é a regra, não a exceção), e o campo mostra isso com os olhos dele.
import { h, dataBr } from '../motor/util.js';
import { campoJogo } from '../componentes/campo.js';
import { icone } from '../componentes/icones.js';

const NUMEROS = ['PEN-01', 'PEN-02'];
const TODAS = ['PEN-01', 'PEN-02', 'PEN-03', 'PEN-04', 'PEN-05', 'PEN-06', 'PEN-07', 'PEN-08', 'PEN-09'];

export function render(ctx) {
  const c = ctx.copy;
  const v = ctx.variante || 'C';
  const r = ctx.r;
  const el = h('section', { class: 't-inimigo', 'data-variante': v });

  const p1 = v === 'A' ? (r.jogouBem === 'sim' ? c.A.p1Sim : c.A.p1) : c[v].p1;
  el.append(h('div', { class: 'entra' },
    h('h1', { class: 'titulo', style: '--i:0', html: ctx.t(c[v].titulo) }),
    h('p', { class: 'corpo', style: '--i:1', html: ctx.t(p1) })));

  // o adversário com nome: o olhômetro
  const A = c.adversario;
  const fatos = (A.fatos || []).map(id => ctx.provas[id]).filter(p => p && p.ativo !== false)
    .map(p => h('p', { class: 'adversario-fato', 'data-prova': p.id }, ...destacaNumero(p.texto)));
  el.append(h('div', { class: 'adversario surge' },
    h('p', { class: 'adversario-rotulo' }, h('i', { 'aria-hidden': 'true' }), A.rotulo),
    h('p', { class: 'adversario-nome', html: ctx.t(A.nome) }),
    h('p', { class: 'adversario-texto', text: A.texto }),
    ...fatos));

  const p3 = h('p', { class: 'corpo', hidden: true, html: ctx.t(v === 'C' ? c.p3C : c.p3) });
  const dica = h('p', { class: 'campo-dica-ia', hidden: true, text: c.dica });
  let mostrouP3 = false;
  const revela = () => {
    if (mostrouP3) return;
    mostrouP3 = true;
    p3.hidden = false; p3.classList.add('surge');
    if (!ctx.r.viuOlhometro) ctx.responde('viuOlhometro', true, { evento: false });
  };
  let tocou = false;
  const campo = campoJogo({
    atleta: r.posicao || 'MC',
    textos: {
      aria: c.campoAria, rotulo: c.campoRotulo, abas: c.abas, contadorOlho: c.contadorOlho, contadorIa: c.contadorIa,
      legendaOlho: c.legendaOlho, legendaIa: c.legendaIa, voce: c.voce, iaVoce: c.iaVoce
    },
    aoTrocar: (modo, porToque) => {
      if (porToque) { tocou = true; dica.hidden = true; ctx.evento('campo_toggle', { modo }); revela(); }
    }
  });
  ctx.aoSair(() => campo.destroi());
  el.append(h('div', { class: 'campo-bloco', style: { marginTop: '18px' } }, campo.el, dica), p3);

  // sem toque em 3,5 s, troca sozinho pra IA uma vez, com a dica pra comparar
  ctx.depois(3500, () => { if (!tocou) { campo.modo(true); dica.hidden = false; revela(); } });

  el.append(h('p', { class: 'destaque', html: ctx.t(c.destaque) }));

  if (v !== 'C' && ctx.textos.peneirasTexto) {
    const pessoal = ctx.textos.gastoTexto ? c.pessoalComGasto : c.pessoalSemGasto;
    el.append(h('p', { class: 'pessoal', html: ctx.t(pessoal) }));
  }

  // opcional (tela "trava" ligada): o cartão com o que ele disse que mais trava
  if (ctx.cfg.telasOpcionais?.trava && r.trava) {
    const op = ctx.todaCopy.trava.opcoes.find(o => o.id === r.trava);
    if (op) el.append(h('p', { class: 'pessoal', html: ctx.t(ctx.todaCopy.trava.cartaoPessoal, { travaTexto: op.texto }) }));
  }

  const ver = h('button', { type: 'button', class: 'btn-sec', html: icone.grafico + `<span>${c.verNumeros}</span>` });
  ver.addEventListener('click', () => abreNumeros(ctx));
  el.append(ver);

  ctx.barra.botao({ texto: ctx.geral.continuar, aoClicar: () => { revela(); ctx.responde('viuInimigo', true, { evento: false }); ctx.avanca(); } });
  return el;
}

// "40 de 46 técnicos..." com o número em destaque (o texto vem da prova, sem mudar nada)
function destacaNumero(t) {
  const m = /\d[\d.,]*(?:\s(?:de|em)\s\d[\d.,]*)?/.exec(t);
  return m ? [t.slice(0, m.index), h('strong', { text: m[0] }), t.slice(m.index + m[0].length)] : [t];
}

function abreNumeros(ctx) {
  const c = ctx.copy;
  ctx.evento('prova_fontes_open', { tela: 'inimigo_numeros' });
  const cartoes = NUMEROS.map(id => ctx.provas[id]).filter(p => p && p.ativo !== false).map(p =>
    h('div', { class: 'cartao-numero', 'data-prova': p.id },
      h('strong', { text: p.numero }),
      h('p', { text: p.texto }),
      h('p', { class: 'fonte-consulta', text: `${p.fonte.veiculo}${p.fonte.data ? ', ' + dataBr(p.fonte.data).replace(/^\d{2}\/\d{2}\//, '') : ''}` })));
  const extra = [h('p', { class: 'fecho', style: { marginTop: '14px' }, text: c.numerosLinha })];
  // opcional (tela "epoca" ligada): a linha pessoal do trimestre de nascimento
  const ep = ctx.r.epoca, E = ctx.todaCopy.epoca;
  if (ctx.cfg.telasOpcionais?.epoca && (ep === 'jul_set' || ep === 'out_dez')) {
    extra.push(h('p', { class: 'pessoal', html: ctx.t(E.linhaPessoal, { epocaTexto: E.textos[ep] }) + (ep === 'out_dez' ? ' ' + ctx.t(E.linhaOutDez) : '') }));
  }
  const fontes = h('button', { type: 'button', class: 'link-btn', style: { marginTop: '10px' }, html: icone.externo + `<span>${ctx.geral.verFontes}</span>` });
  const folha = ctx.folha({ titulo: c.numerosTitulo, conteudo: h('div', null, ...cartoes, ...extra, fontes) });
  fontes.addEventListener('click', () => { folha.fecha(true); ctx.fontes(TODAS, null, 'inimigo'); });
}
