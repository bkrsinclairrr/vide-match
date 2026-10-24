// T02 · idade. De 12 a 17: avança sozinho, sem tag nenhuma (o contato do responsável vem na T13). Menos de 12: a própria tela vira
// a saída, e nada do que foi respondido fica guardado. 18 ou mais: avança sozinho (e, se houver pixel configurado, a folha de cookies
// abre na T03). O bloco "chame um responsável" saiu a pedido do dono (23/10/2026): quem acessa já tem o consentimento.
import { h } from '../motor/util.js';
import { opcoes } from '../componentes/opcoes.js';
import { icone } from '../componentes/icones.js';

const MENOR = new Set(['12_14', '15_17']);

export function render(ctx) {
  const c = ctx.copy;
  const el = h('section', { class: 't-idade' });
  const cab = h('div', { class: 'entra' },
    h('h1', { class: 'titulo', style: '--i:0', text: c.titulo }),
    h('p', { class: 'apoio', style: '--i:1', text: c.apoio }));
  const grupo = opcoes({ lista: c.opcoes, valor: ctx.r.idade, rotulo: c.titulo, aoEscolher: escolhe });
  el.append(cab, grupo.el);

  function saida() {
    ctx.evento('menor12_saida', {});
    // nada fica guardado; a posição fica só nesta tela, pra quem tocou errado poder voltar sem refazer a capa
    const posicao = ctx.r.posicao;
    ctx.estado.esquece();
    ctx.barra.limpa();
    const conteudo = h('div', { class: 'saida-menor entra' },
      h('h1', { class: 'titulo', style: '--i:0', tabindex: '-1', text: c.saidaTitulo }),
      h('p', { class: 'corpo', style: '--i:1', text: c.saidaApoio }),
      h('a', { class: 'btn', style: '--i:2', href: ctx.cfg.instagramUrl, target: '_blank', rel: 'noopener noreferrer', html: icone.arroba + `<span>${c.saidaBotao}</span>` }),
      h('button', { type: 'button', class: 'link-btn', style: '--i:3', onclick: () => { if (posicao) ctx.responde('posicao', posicao, { evento: false }); ctx.vaiPara('idade', { historico: 'replace' }); } }, c.saidaVoltar));
    el.replaceChildren(conteudo);
    requestAnimationFrame(() => conteudo.querySelector('h1').focus({ preventScroll: true }));
  }

  function escolhe(id) {
    if (id === 'menos12') { ctx.rastreio.idade(id); saida(); return; }
    ctx.responde('idade', id);
    // a regra das tags vale aqui: menor nunca carrega nada; adulto, só depois do aceite de cookies
    const pedeCookies = ctx.rastreio.idade(id);
    if (MENOR.has(id)) ctx.evento('menor_declarado', { faixa: id });
    else if (pedeCookies) ctx.pedeCookies();
    ctx.avancaCom({ atraso: 260 });
  }

  if (ctx.r.idade) ctx.continuarSeCompleto();
  return el;
}
