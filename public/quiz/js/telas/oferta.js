// T16 · a oferta (só na variante de venda, config/variantes/scouting-pro/): o que o produto entrega, o preço com a âncora, a garantia
// e o botão do checkout. Fala com o que o atleta respondeu (o que a família já investiu, as peneiras). Um preço só, sem parcela e sem
// relógio. O toque registra a ida ao checkout pelo canal do lead (leadId, sem contato) e abre o link com as UTMs, nunca com dado de pessoa.
import { h, esc, vibra } from '../motor/util.js';
import { icone } from '../componentes/icones.js';
import { urlCheckout, montaCheckout } from '../dados/payload.js';

export function render(ctx) {
  const c = ctx.copy;
  const app = ctx.app;
  const s = ctx.estado.s;
  const r = ctx.r;
  const res = s.resultado || app.pontua(r);
  const el = h('section', { class: 't-oferta' });
  ctx.evento('oferta_view', { tier: res.tier });

  // a linha pessoal: o que a família já investiu, as peneiras que ele fez ou o começo de tudo
  const pessoal = r.gasto && r.gasto !== 'nada' && ctx.textos.gastoTexto ? c.pessoalComGasto
    : r.peneiras && r.peneiras !== '0' ? c.pessoalComPeneira : c.pessoalSemPeneira;
  el.append(h('div', { class: 'entra' },
    h('p', { class: 'rotulo-cap', style: '--i:0', text: c.rotulo }),
    h('h1', { class: 'titulo', style: '--i:1', html: ctx.t(c.titulo) }),
    h('p', { class: 'apoio', style: '--i:2', text: ctx.tx(pessoal) })));

  // o produto: nome, o ritmo, as seis entregas e o preço (a âncora riscada e o valor)
  el.append(h('section', { class: 'oferta-cartao surge', 'aria-labelledby': 'oferta-produto' },
    h('h2', { id: 'oferta-produto', class: 'oferta-produto', html: `${esc(c.produto)} <span>· ${esc(c.marca)}</span>` }),
    h('p', { class: 'oferta-ritmo', text: c.ritmo }),
    h('h3', { class: 'oferta-itens-t', text: c.itensTitulo }),
    h('ul', { class: 'oferta-itens' }, ...c.itens.map(t => h('li', null, h('span', { class: 'oferta-check', html: icone.check }), h('span', { text: t })))),
    h('div', { class: 'oferta-preco' },
      h('p', { class: 'oferta-ancora' }, h('span', { text: c.ancoraRotulo + ' ' }), h('s', { text: c.ancora })),
      h('p', { class: 'oferta-valor' }, h('span', { class: 'oferta-por', text: c.porRotulo + ' ' }), h('strong', { text: c.preco })),
      h('p', { class: 'oferta-preco-nota', text: c.precoNota }))));

  // a garantia, com a condição na mesma tela e em letra que se lê
  el.append(h('section', { class: 'oferta-garantia surge', 'aria-labelledby': 'oferta-garantia-t' },
    h('span', { class: 'oferta-garantia-i', html: icone.escudo }),
    h('div', null,
      h('h2', { id: 'oferta-garantia-t', text: c.garantiaTitulo }),
      h('p', { class: 'oferta-garantia-texto', text: c.garantiaTexto }),
      h('p', { class: 'oferta-garantia-cond', text: c.garantiaCondicao }),
      h('a', { class: 'link-btn', href: ctx.cfg.termosUrl, target: '_blank', rel: 'noopener noreferrer', html: `<span>${esc(c.termosLink)}</span>${icone.externo}` }))));

  if (ctx.d.menor && c.menor) el.append(h('p', { class: 'oferta-nota', html: icone.familia + `<span>${esc(c.menor)}</span>` }));
  if (c.lado) el.append(h('p', { class: 'oferta-lado', text: c.lado }));

  const url = urlCheckout({ cfg: ctx.cfg, rastreio: app.rastreio });
  let indo = false;
  const b = ctx.barra.botao({
    texto: c.botao, brilha: true, seta: true,
    nota: esc(ctx.tx(c.botaoNota, { preco: c.preco })),
    aoClicar: () => {
      if (indo) return;
      indo = true;
      ctx.evento('checkout_click', { tier: res.tier, produto: ctx.cfg.checkout?.produto });
      app.eventos.descarrega(true);
      if (s.leadId) app.envio.envia(montaCheckout({ leadId: s.leadId, cfg: ctx.cfg }), { id: 'checkout:' + s.leadId }).catch(() => {});
      vibra(20);
      setTimeout(() => location.assign(url), 160);
    }
  });
  b.dataset.url = url;
  // voltou do checkout sem pagar (o voltar do celular): o botão funciona de novo
  const reativa = () => { indo = false; };
  window.addEventListener('pageshow', reativa);
  ctx.aoSair(() => window.removeEventListener('pageshow', reativa));
  return el;
}
