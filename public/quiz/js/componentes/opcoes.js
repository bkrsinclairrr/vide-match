// Escolha única (radiogroup): um toque marca, trava e entrega a escolha pra tela decidir (avançar, espelhar ou abrir a pergunta seguinte).
import { h } from '../motor/util.js';

export function opcoes({ lista, valor = null, grade = false, rotulo, aoEscolher, classe = '' }) {
  const grupo = h('div', { class: `opcoes${grade ? ' grade' : ''} ${classe}`.trim(), role: 'radiogroup', 'aria-label': rotulo || null });
  let travado = false;
  const botoes = lista.map((o, i) => {
    const b = h('button', {
      type: 'button', class: 'opcao', role: 'radio', 'aria-checked': String(o.id === valor),
      tabindex: (valor ? o.id === valor : i === 0) ? '0' : '-1', 'data-id': o.id
    }, o.texto, o.sub ? h('span', { class: 'opcao-sub', text: o.sub }) : null);
    b.addEventListener('click', () => escolhe(o.id));
    return b;
  });
  grupo.append(...botoes);

  // setas movem o foco entre as opções (rodízio de tabindex); Enter e Espaço escolhem (é um botão)
  grupo.addEventListener('keydown', ev => {
    const i = botoes.indexOf(document.activeElement);
    if (i < 0) return;
    let j = null;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') j = (i + 1) % botoes.length;
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') j = (i - 1 + botoes.length) % botoes.length;
    if (j === null) return;
    ev.preventDefault();
    botoes.forEach((b, k) => b.setAttribute('tabindex', k === j ? '0' : '-1'));
    botoes[j].focus();
  });

  function marca(id) {
    botoes.forEach(b => { const sim = b.dataset.id === id; b.setAttribute('aria-checked', String(sim)); b.setAttribute('tabindex', sim ? '0' : '-1'); });
  }
  function escolhe(id) {
    if (travado) return;
    travado = true;
    marca(id);
    grupo.classList.add('travada');
    aoEscolher?.(id);
  }
  return {
    el: grupo,
    marca,
    destrava() { travado = false; grupo.classList.remove('travada'); },
    // só deixa à vista as opções que a regra permite (ex.: dispensas nunca maiores que as peneiras)
    filtra(ids) { botoes.forEach(b => { b.hidden = !ids.includes(b.dataset.id); }); }
  };
}

// a linha que devolve o que o atleta respondeu
export function espelho(texto) {
  return h('p', { class: 'espelho', role: 'status', text: texto });
}
