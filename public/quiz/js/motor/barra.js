// A barra fixa embaixo: a ação principal mora sempre no mesmo lugar. Com o teclado aberto, ela sobe junto (visualViewport).
import { h } from './util.js';
import { icone } from '../componentes/icones.js';

export function criaBarra(el, palco) {
  const ajustaAltura = () => palco.style.setProperty('--barra-h', (el.childElementCount ? el.offsetHeight : 0) + 'px');
  if ('ResizeObserver' in window) new ResizeObserver(ajustaAltura).observe(el);

  // teclado no iPhone: a barra fixa ficaria atrás dele
  const vv = window.visualViewport;
  if (vv) {
    const teclado = () => {
      const desc = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      el.style.setProperty('--teclado', desc > 80 ? `-${Math.round(desc)}px` : '0px');
    };
    vv.addEventListener('resize', teclado);
    vv.addEventListener('scroll', teclado);
  }

  return {
    el,
    limpa() { el.replaceChildren(); el.classList.remove('escondida'); ajustaAltura(); },
    esconde(sim) { el.classList.toggle('escondida', !!sim); },
    // o botão principal; devolve o elemento pra tela ligar e desligar
    botao({ texto, aoClicar, desativado = false, nota, acima, brilha = false, seta = false, id }) {
      const b = h('button', { type: 'button', class: 'btn' + (brilha ? ' brilha' : ''), id, 'aria-disabled': desativado ? 'true' : null });
      b.append(h('span', { text: texto }));
      if (seta) b.insertAdjacentHTML('beforeend', icone.seta);
      b.addEventListener('click', ev => { if (b.getAttribute('aria-disabled') === 'true') { ev.preventDefault(); b.dispatchEvent(new CustomEvent('bloqueado')); return; } aoClicar?.(ev); });
      const filhos = [];
      if (acima) filhos.push(h('p', { class: 'barra-acima', html: acima }));
      filhos.push(b);
      if (nota) filhos.push(h('p', { class: 'barra-nota', html: nota }));
      el.replaceChildren(...filhos);
      el.classList.remove('escondida');
      ajustaAltura();
      return b;
    },
    custom(...nos) { el.replaceChildren(...nos); el.classList.remove('escondida'); ajustaAltura(); },
    ajustaAltura
  };
}
