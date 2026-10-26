// A dica de rolar: da T05 em diante, quando a tela tem mais conteúdo embaixo da barra, uma seta pisca centralizada logo acima do
// botão. Ela apaga aos poucos conforme o atleta desce e, depois que ele desceu (ou chegou ao fim), não volta naquela tela.
// Um toque nela desce o conteúdo. É enfeite: o leitor de tela e o teclado já percorrem a tela inteira.
import { h } from '../motor/util.js';
import { icone } from './icones.js';

const SOBRA = 48;    // px de conteúdo escondido que valem a dica (menos que isso é margem, não conteúdo)
const APAGA = 160;   // px de rolagem até a dica sumir de vez
const ESPERA = 700;  // ms depois da tela entrar (o texto termina de surgir antes)

export function criaRolar({ desde, ordem }) {
  const el = h('div', { class: 'rolar', 'aria-hidden': 'true', hidden: true });
  el.innerHTML = icone.desce;
  document.getElementById('app').append(el);

  let tela = null, feito = true, y0 = 0, tm = 0, obs = null;
  const pos = id => ordem.indexOf(id);

  // quanto da tela fica escondido embaixo da barra
  const escondido = () => {
    const barra = document.getElementById('barra');
    const topoBarra = barra && barra.childElementCount && !barra.classList.contains('escondida') ? barra.getBoundingClientRect().top + 26 : window.innerHeight;
    return tela.getBoundingClientRect().bottom - topoBarra;
  };
  const digitando = () => document.activeElement?.matches?.('input, textarea, select');

  function atualiza() {
    if (feito || !tela?.isConnected) { el.hidden = true; return; }
    const desceu = window.scrollY - y0;
    const falta = escondido();
    if (desceu >= APAGA || falta < SOBRA / 2) { feito = true; el.classList.remove('ligada'); return; }
    if (falta < SOBRA || digitando() || document.querySelector('.folha-fundo')) { el.classList.remove('ligada'); return; }
    el.hidden = false;
    el.style.setProperty('--o', String(Math.max(0, 1 - Math.max(0, desceu) / APAGA).toFixed(3)));
    requestAnimationFrame(() => el.classList.add('ligada'));
  }

  window.addEventListener('scroll', atualiza, { passive: true });
  window.addEventListener('resize', atualiza);
  document.addEventListener('focusin', atualiza);
  document.addEventListener('focusout', () => setTimeout(atualiza, 0));
  el.addEventListener('transitionend', () => { if (!el.classList.contains('ligada')) el.hidden = true; });
  el.addEventListener('click', () => {
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollBy({ top: Math.round(window.innerHeight * 0.6), behavior: reduz ? 'auto' : 'smooth' });
  });

  return {
    // a cada tela nova: apaga a dica da anterior e, se esta vale, mede depois que ela assentar
    tela(novo, id) {
      clearTimeout(tm);
      obs?.disconnect();
      el.classList.remove('ligada');
      el.hidden = true;
      tela = novo;
      feito = !novo || pos(id) < pos(desde);
      if (feito) return;
      tm = setTimeout(() => {
        y0 = window.scrollY;
        atualiza();
        // a tela cresce depois (bloco que surge, imagem que carrega): mede de novo
        if ('ResizeObserver' in window) { obs = new ResizeObserver(atualiza); obs.observe(novo); }
      }, ESPERA);
    }
  };
}
