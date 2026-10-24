// A folha "Ver fontes": cada afirmação com veículo, data, link e o dia da consulta. O link abre em outra aba (o quiz fica onde está).
import { h, dataBr, tx } from '../motor/util.js';
import { abreFolha } from './folha.js';
import { icone } from './icones.js';

export function itemFonte(p, geral, alvo) {
  const f = p.fonte || {};
  const quem = [p.clube, f.veiculo].filter(Boolean).join(' · ');
  const corpo = p.manchete ? `“${p.manchete}”` : p.texto;
  return h('div', { class: 'fonte-item' + (alvo ? ' alvo' : ''), id: 'fonte-' + p.id },
    h('p', { class: 'fonte-quem' }, h('span', { text: quem }), f.data ? h('time', { text: dataBr(f.data) }) : null),
    h('p', { class: 'fonte-texto', text: corpo }),
    f.titulo && !p.manchete ? h('p', { class: 'fonte-titulo', text: f.titulo }) : null,
    p.observacao ? h('p', { class: 'fonte-titulo', text: p.observacao }) : null,
    f.url ? h('a', { class: 'fonte-link', href: f.url, target: '_blank', rel: 'noopener noreferrer', html: `${icone.externo}<span>${geral.abrirFonte}</span><span class="sr-only"> (${geral.novaAba})</span>` }) : null,
    h('p', { class: 'fonte-consulta', text: tx(geral.consultadoEm, { data: dataBr(p.conferidoEm) }) })
  );
}

export function abreFontes({ ids, alvo, provas, geral }) {
  const lista = ids.map(id => provas[id]).filter(p => p && p.ativo !== false);
  const conteudo = h('div', null, ...lista.map(p => itemFonte(p, geral, p.id === alvo)));
  const folha = abreFolha({ titulo: geral.fontesTitulo, apoio: geral.fontesApoio, conteudo });
  if (alvo) requestAnimationFrame(() => { const el = folha.painel.querySelector('#fonte-' + CSS.escape(alvo)); el?.scrollIntoView({ block: 'center' }); });
  return folha;
}
