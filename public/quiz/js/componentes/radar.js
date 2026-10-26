// O radar do encaixe (T06): o atleta no centro, os clubes da nossa rede em volta, a varredura verde do Zyron passa por eles e
// acende um clube sem nome ("um clube procura esse perfil"). Nunca diz qual clube: é a forma que a casa aprovou.
// Três tempos, sincronizados com os três passos da tela. Com "reduzir movimento", entra direto no quadro final.
import { h, reduzMovimento } from '../motor/util.js';
import { icone } from './icones.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };

// posições fixas (ângulo em graus a partir do topo, no sentido do relógio; raio em fração do raio do radar)
const LUGARES = [[18, .84], [52, .6], [86, .88], [150, .64], [186, .86], [218, .58], [250, .84], [286, .62], [318, .86], [345, .56]];
// o clube que acende fica no alto, à direita: em celular pequeno a metade de baixo do radar fica atrás da barra da pergunta
const ALVO = [40, .84];
const VOLTA_MS = 2200;

export function radar({ escudos, textos, aoTempo }) {
  const reduz = reduzMovimento();
  const raiz = h('div', { class: 'radar', role: 'img', 'aria-label': textos.aria });
  const svg = s('svg', { viewBox: '0 0 300 300', class: 'radar-svg', 'aria-hidden': 'true' });
  [146, 108, 70].forEach((r, i) => svg.append(s('circle', { cx: 150, cy: 150, r, fill: i === 0 ? 'rgba(52,211,153,.03)' : 'none', stroke: 'rgba(52,211,153,.22)', 'stroke-width': 1 })));
  svg.append(s('path', { d: 'M150 4V296M4 150H296', stroke: 'rgba(52,211,153,.12)', 'stroke-width': 1 }));
  const varre = h('div', { class: 'radar-varredura', 'aria-hidden': 'true' });
  // a varredura gira dentro de um círculo que recorta: girada, a caixa dela passa da tela (em 360 px, o celular afastava o zoom ao rolar)
  raiz.append(svg, h('div', { class: 'radar-recorte', 'aria-hidden': 'true' }, varre));

  const pt = (graus, fr) => { const a = (graus - 90) * Math.PI / 180; return { x: 50 + Math.cos(a) * fr * 48.5, y: 50 + Math.sin(a) * fr * 48.5 }; };
  const nos = escudos.slice(0, LUGARES.length).map((e, i) => {
    const [g, fr] = LUGARES[i];
    const p = pt(g, fr);
    const n = h('div', { class: 'radar-no', style: { left: p.x + '%', top: p.y + '%' }, 'aria-hidden': 'true' },
      h('img', { src: e.src, alt: '', width: 22, height: 22, loading: 'lazy', decoding: 'async' }));
    raiz.append(n);
    return { el: n, graus: g };
  });
  const pa = pt(ALVO[0], ALVO[1]);
  const alvo = h('div', { class: 'radar-alvo', style: { left: pa.x + '%', top: pa.y + '%' }, 'aria-hidden': 'true', text: '?' });
  const linha = s('svg', { class: 'radar-linha', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  linha.append(s('line', { x1: 50, y1: 50, x2: pa.x, y2: pa.y, 'vector-effect': 'non-scaling-stroke' }));
  const centro = h('div', { class: 'radar-centro', 'aria-hidden': 'true', text: textos.voce });
  const match = h('div', { class: 'radar-match', 'aria-hidden': 'true', text: textos.match });
  raiz.append(linha, alvo, centro, match);

  let raf = 0, t0 = 0, tempo = 0, fim = false;
  const marcaTempo = n => { if (n !== tempo) { tempo = n; aoTempo?.(n); } };
  function acha() {
    fim = true;
    raiz.classList.add('achou');
    alvo.innerHTML = icone.check;
    marcaTempo(3);
  }
  function quadro(agora) {
    const ms = agora - t0;
    const giro = (ms / VOLTA_MS) * 360;
    varre.style.transform = `rotate(${giro % 360}deg)`;
    const borda = giro % 360;
    nos.forEach(n => {
      const atras = (borda - n.graus + 360) % 360;
      n.el.classList.toggle('pisca', atras < 28);
    });
    if (ms > 700) marcaTempo(2);
    // na segunda volta, quando a borda passa pelo alvo, ele acende
    if (giro >= 360 + ALVO[0]) { acha(); nos.forEach(n => n.el.classList.remove('pisca')); varre.style.transform = `rotate(${ALVO[0]}deg)`; return; }
    raf = requestAnimationFrame(quadro);
  }
  function inicia() {
    marcaTempo(1);
    if (reduz) { acha(); return; }
    t0 = performance.now();
    raf = requestAnimationFrame(quadro);
  }
  return {
    el: raiz,
    inicia,
    pula() { if (!fim) { cancelAnimationFrame(raf); acha(); } },
    destroi() { cancelAnimationFrame(raf); }
  };
}
