// O campo em perspectiva (visão de transmissão, ataque pra cima). Dois modos:
// - escolha (T01): as 11 posições da casa, cada uma um botão de verdade; um toque escolhe.
// - jogo (T05): 22 jogadores, a bola e o foco do olhômetro, contra a IA que acompanha os 22. O atleta é o ponto dourado.
// Coordenadas normalizadas (x da esquerda pra direita, y de cima pra baixo), as mesmas chaves do mapa-calor.js do painel.
// Sem canvas: SVG com um único requestAnimationFrame, que só roda com o campo na tela e a aba visível.
import { h, reduzMovimento } from '../motor/util.js';

export const POSICOES = {
  GOL: [0.50, 0.92], LD: [0.84, 0.74], 'ZAG-d': [0.62, 0.76], 'ZAG-e': [0.38, 0.76], LE: [0.16, 0.74],
  'VOL-d': [0.64, 0.58], 'VOL-e': [0.36, 0.58], ADD: [0.82, 0.38], MC: [0.50, 0.40], ALE: [0.18, 0.38], CA: [0.50, 0.16]
};
// de trás pra frente (a ordem de tab e a onda do convite)
export const ORDEM = ['GOL', 'LE', 'ZAG-e', 'ZAG-d', 'LD', 'VOL-e', 'VOL-d', 'ALE', 'MC', 'ADD', 'CA'];

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
const r1 = v => Math.round(v * 10) / 10;
const ASPECTO = 105 / 68; // comprimento / largura do campo

// perspectiva: a largura do fundo é r da largura da frente; a altura na tela segue 1/z (é uma homografia: reta continua reta)
function projetor(L, A, { r = 0.6, base = 0.94, cima = 18, baixo = 16 } = {}) {
  const z1 = 1 / r, wBase = L * base, yT = cima, yB = A - baixo;
  return (x, y) => {
    const t = 1 - y;
    const z = 1 + t * (z1 - 1);
    const fr = (1 - 1 / z) / (1 - r);
    const w = wBase / z;
    return { x: L / 2 + (x - 0.5) * w, y: yB - fr * (yB - yT), e: 1 / z };
  };
}

function linhas(P, g) {
  const seg = (pts, fecha) => {
    const q = pts.map(([x, y]) => P(x, y));
    return 'M' + q.map(p => r1(p.x) + ' ' + r1(p.y)).join('L') + (fecha ? 'Z' : '');
  };
  const curva = (cx, cy, rx, ry, a0, a1, n = 40) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return seg(pts, false);
  };
  const ax = 20.16 / 68, ay = 16.5 / 105, gx = 9.16 / 68, gy = 5.5 / 105, cr = 9.15;
  const rx = cr / 68, ry = cr / 105, pen = 11 / 105;
  // a meia-lua é o trecho do círculo do pênalti (raio 9,15 m, a 11 m do gol) que fica fora da área de 16,5 m
  const aArco = Math.asin(5.5 / 9.15);
  // faixas da grama (cortes do gramado)
  const faixas = s('g', { fill: 'rgba(255,255,255,.028)' });
  for (let i = 0; i < 12; i += 2) faixas.append(s('path', { d: seg([[0, i / 12], [1, i / 12], [1, (i + 1) / 12], [0, (i + 1) / 12]], true) }));
  g.append(faixas);
  const d = [
    seg([[0, 0], [1, 0], [1, 1], [0, 1]], true),
    seg([[0, .5], [1, .5]]),
    curva(.5, .5, rx, ry, 0, Math.PI * 2, 56),
    seg([[.5 - ax, 0], [.5 - ax, ay], [.5 + ax, ay], [.5 + ax, 0]]),
    seg([[.5 - ax, 1], [.5 - ax, 1 - ay], [.5 + ax, 1 - ay], [.5 + ax, 1]]),
    seg([[.5 - gx, 0], [.5 - gx, gy], [.5 + gx, gy], [.5 + gx, 0]]),
    seg([[.5 - gx, 1], [.5 - gx, 1 - gy], [.5 + gx, 1 - gy], [.5 + gx, 1]]),
    // meias-luas das áreas (só a parte de fora)
    curva(.5, pen, rx, ry, aArco, Math.PI - aArco, 24),
    curva(.5, 1 - pen, rx, ry, Math.PI + aArco, Math.PI * 2 - aArco, 24),
    // gols
    seg([[.5 - 3.66 / 68, 0], [.5 - 3.66 / 68, -.018], [.5 + 3.66 / 68, -.018], [.5 + 3.66 / 68, 0]]),
    seg([[.5 - 3.66 / 68, 1], [.5 - 3.66 / 68, 1.016], [.5 + 3.66 / 68, 1.016], [.5 + 3.66 / 68, 1]])
  ].join('');
  g.append(s('path', { d, fill: 'none', stroke: 'var(--cal)', 'stroke-width': '1.3', 'stroke-linejoin': 'round' }));
  const c = P(.5, .5);
  g.append(s('ellipse', { cx: r1(c.x), cy: r1(c.y), rx: 1.8, ry: 1.3, fill: 'var(--cal)' }));
}

function fundoSvg(L, A, P) {
  const svg = s('svg', { viewBox: `0 0 ${L} ${A}`, class: 'campo-svg', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'xMidYMid meet' });
  const defs = s('defs', {});
  const brilho = s('radialGradient', { id: 'cp-brilho', cx: '50%', cy: '100%', r: '70%' });
  brilho.append(s('stop', { offset: '0', 'stop-color': 'rgba(251,191,36,.16)' }), s('stop', { offset: '1', 'stop-color': 'rgba(251,191,36,0)' }));
  const foco = s('radialGradient', { id: 'cp-foco' });
  foco.append(s('stop', { offset: '0', 'stop-color': 'rgba(253,186,116,.42)' }), s('stop', { offset: '.6', 'stop-color': 'rgba(249,115,22,.16)' }), s('stop', { offset: '1', 'stop-color': 'rgba(249,115,22,0)' }));
  defs.append(brilho, foco);
  svg.append(defs, s('rect', { x: 0, y: 0, width: L, height: A, fill: 'url(#cp-brilho)' }));
  const g = s('g', {});
  linhas(P, g);
  svg.append(g);
  return svg;
}

/* ---------------- modo escolha (T01) ---------------- */
// A luz direcionada: um feixe que desce do alto e para numa posição de cada vez, acendendo a bola e mostrando o nome dela. Para no
// primeiro toque (ou foco de teclado) e fica em cima da posição escolhida. Só anda com o campo na tela; com "reduzir movimento", não anda.
const ROTA = ['CA', 'ADD', 'MC', 'ALE', 'VOL-e', 'VOL-d', 'LD', 'ZAG-d', 'ZAG-e', 'LE', 'GOL'];
const PASSO_LUZ = 1500, VOLTAS = 3;

export function campoEscolha({ valor, abreviacoes, rotulo, nome, aoEscolher }) {
  const L = 360, A = 286;
  const P = projetor(L, A);
  const palco = h('div', { class: 'campo-palco' });
  palco.append(fundoSvg(L, A, P));
  const feixe = h('div', { class: 'luz-feixe', 'aria-hidden': 'true' }, h('i'));
  const poca = h('div', { class: 'luz-poca', 'aria-hidden': 'true' });
  const camada = h('div', { class: 'campo-pos', role: 'group', 'aria-label': rotulo });
  const raiz = h('div', { class: 'campo campo--escolha' + (valor ? ' tem-escolha' : '') }, palco);
  palco.append(feixe, poca, camada);
  let travado = false;
  const onde = {};
  // a ordem do Tab segue a tela (de cima pra baixo, da esquerda pra direita); ORDEM continua sendo a do painel
  const naTela = [...ORDEM].sort((a, b) => POSICOES[a][1] - POSICOES[b][1] || POSICOES[a][0] - POSICOES[b][0]);
  const botoes = naTela.map(id => {
    const [x, y] = POSICOES[id];
    const p = P(x, y);
    const esc = 0.88 + 0.18 * ((p.e - 0.6) / 0.4);
    onde[id] = [p.x / L, p.y / A, esc];
    const b = h('button', {
      type: 'button', class: 'pos' + (id === valor ? ' escolhida' : ''), 'aria-label': nome(id), 'aria-pressed': String(id === valor), 'data-pos': id,
      style: { left: (p.x / L * 100).toFixed(2) + '%', top: (p.y / A * 100).toFixed(2) + '%', '--s': esc.toFixed(3) }
    }, h('span', { class: 'pos-bola', text: abreviacoes[id] || id }), h('span', { class: 'pos-nome', 'aria-hidden': 'true', text: nome(id) }));
    b.addEventListener('click', () => {
      if (travado) return;
      travado = true;
      para(); acende(id);
      botoes.forEach(o => { const sim = o === b; o.classList.toggle('escolhida', sim); o.setAttribute('aria-pressed', String(sim)); });
      raiz.classList.add('tem-escolha');
      aoEscolher?.(id);
    });
    b.addEventListener('focus', () => { if (!travado) { para(); acende(id); } });
    return b;
  });
  camada.append(...botoes);

  // o feixe sai de cima do campo (fora dele) e gira até a posição; a poça de luz desliza junto
  let aceso = null;
  function acende(id) {
    const alvo = onde[id];
    const W = palco.clientWidth, H = palco.clientHeight;
    if (!alvo || !W || !H) return;
    const x = alvo[0] * W, y = alvo[1] * H, dx = x - W / 2, dy = y + 0.1 * H;
    const k = Math.hypot(dx, dy) / (1.3 * H);
    feixe.style.setProperty('--ang', (-Math.atan2(dx, dy) * 180 / Math.PI).toFixed(2) + 'deg');
    feixe.style.setProperty('--k', k.toFixed(4));
    feixe.style.setProperty('--kx', (0.45 + 0.55 * k).toFixed(4));
    poca.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${alvo[2].toFixed(3)})`;
    botoes.forEach(b => b.classList.toggle('acesa', b.dataset.pos === id));
    aceso = id;
    raiz.classList.add('com-luz');
  }
  const apaga = () => { raiz.classList.remove('com-luz'); botoes.forEach(b => b.classList.remove('acesa')); aceso = null; };

  // a volta da luz pelo campo
  const reduz = reduzMovimento();
  let tm = 0, i = 0, parado = !!valor || reduz, visivel = false;
  function passo() {
    tm = 0;
    if (parado || !visivel) return;
    if (i >= ROTA.length * VOLTAS) { parado = true; apaga(); return; }
    if (!document.hidden) { acende(ROTA[i % ROTA.length]); i++; }
    tm = setTimeout(passo, PASSO_LUZ);
  }
  function anda() { if (!tm && !parado) tm = setTimeout(passo, aceso ? PASSO_LUZ : 700); }
  function para() { parado = true; clearTimeout(tm); tm = 0; }
  // tocar fora das posições apaga a luz (ela não pode parecer uma escolha)
  palco.addEventListener('pointerdown', ev => { if (!travado && !ev.target.closest('.pos')) { para(); apaga(); } }, { passive: true });

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel && valor && !aceso) acende(valor);
    if (visivel) anda(); else { clearTimeout(tm); tm = 0; }
  }, { threshold: 0.35 }) : null;
  if (io) io.observe(palco); else { visivel = true; requestAnimationFrame(() => { if (valor) acende(valor); anda(); }); }
  // a tela mudou de tamanho (girou o celular): a luz recalcula onde está
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { if (aceso) acende(aceso); }) : null;
  ro?.observe(palco);

  return {
    el: raiz,
    destrava() { travado = false; },
    destroi() { clearTimeout(tm); io?.disconnect(); ro?.disconnect(); }
  };
}

/* ---------------- modo jogo (T05) ---------------- */
export function campoJogo({ atleta = 'LD', textos, aoTrocar, iniciaIa = false }) {
  const L = 360, A = 300;
  const P = projetor(L, A, { r: 0.58, cima: 16, baixo: 14 });
  const reduz = reduzMovimento();
  const palco = h('div', { class: 'campo-palco', role: 'img', 'aria-label': textos.aria });
  const svg = fundoSvg(L, A, P);
  palco.append(svg);
  const raiz = h('div', { class: 'campo campo--jogo' });

  // as duas formações: a casa na metade de baixo, o adversário espelhado em cima
  const base = [];
  ORDEM.forEach(id => { const [x, y] = POSICOES[id]; base.push({ id, casa: true, x, y: 0.52 + (y - 0.16) * 0.526 }); });
  ORDEM.forEach(id => { const [x, y] = POSICOES[id]; const yc = 0.52 + (y - 0.16) * 0.526; base.push({ id, casa: false, x: 1 - x, y: 1 - yc }); });
  const iAtleta = base.findIndex(b => b.casa && b.id === atleta);

  const foco = s('ellipse', { class: 'campo-foco', fill: 'url(#cp-foco)', cx: 0, cy: 0, rx: 10, ry: 6 });
  svg.append(foco);
  const gJog = s('g', {});
  svg.append(gJog);
  const nos = base.map((b, i) => {
    const g = s('g', { class: 'jog ' + (b.casa ? 'casa' : 'fora') + (i === iAtleta ? ' atleta' : '') });
    const caixa = s('rect', { class: 'jog-caixa', x: -9, y: -9, width: 18, height: 18, rx: 3 });
    const ponto = s('circle', { class: 'jog-ponto', r: 5.2 });
    g.append(caixa, ponto);
    if (i === iAtleta) {
      g.append(s('circle', { class: 'jog-anel', r: 9.5 }));
      const tv = s('text', { class: 'jog-rotulo jog-rotulo-voce', y: -14, 'text-anchor': 'middle' }); tv.textContent = textos.voce;
      const ti = s('text', { class: 'jog-rotulo jog-rotulo-ia', y: -14, 'text-anchor': 'middle' }); ti.textContent = textos.iaVoce;
      g.append(tv, ti);
    }
    gJog.append(g);
    return g;
  });
  // o atleta por cima de todos
  gJog.append(nos[iAtleta]);
  const bola = s('circle', { class: 'campo-bola', r: 2.6 });
  svg.append(bola);

  // a bola só passa por quem está longe do atleta (o olhômetro nunca chega nele)
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * ASPECTO);
  const at = base[iAtleta];
  let donos = base.map((b, i) => i).filter(i => i !== iAtleta && dist(base[i], at) >= 0.30);
  if (donos.length < 3) donos = base.map((b, i) => i).filter(i => i !== iAtleta).sort((a, b) => dist(base[b], at) - dist(base[a], at)).slice(0, 3);

  const FASE = base.map((_, i) => i * 1.7);
  const pos = (i, tt) => {
    const b = base[i], amp = (b.id === 'GOL') ? 0.006 : 0.022;
    return { x: b.x + Math.sin(tt * 0.6 + FASE[i]) * amp, y: b.y + Math.cos(tt * 0.45 + FASE[i] * 1.3) * amp * 0.8 };
  };
  const RAIO = 0.17;
  const st = { dono: donos[0], prox: donos[1 % donos.length], passe: 0, fx: base[donos[0]].x, fy: base[donos[0]].y, t0: 0, antes: 0, raf: 0, ultimo: -1, ia: !!iniciaIa };

  // "Observados agora: {n} de 22": o rótulo à esquerda, o número grande à direita. O número muda o tempo todo, então não é
  // anunciado; o que o leitor de tela ouve é a legenda, que muda junto com o modo.
  const [antesN, depoisN = ''] = textos.contadorOlho.split('{n}');
  const contador = h('strong', { class: 'num', text: '3' });
  const cont = h('p', { class: 'campo-contador', 'aria-hidden': 'true' }, h('span', { text: antesN.replace(/:\s*$/, '') }), h('span', null, contador, depoisN));
  const legenda = h('p', { class: 'campo-legenda', 'aria-live': 'polite' });
  const info = h('div', { class: 'campo-info' }, cont, legenda);

  function quadro(agora, dt) {
    const tt = (agora - st.t0) / 1000;
    st.passe += dt / 1.6;
    if (st.passe >= 1) {
      st.passe = 0; st.dono = st.prox;
      let n = st.dono, tent = 0;
      while (n === st.dono && tent++ < 8) n = donos[Math.floor(Math.random() * donos.length)];
      st.prox = n;
    }
    const a = pos(st.dono, tt), c = pos(st.prox, tt);
    const e = st.passe < 0.55 ? 0 : (st.passe - 0.55) / 0.45;
    const bx = a.x + (c.x - a.x) * e, by = a.y + (c.y - a.y) * e;
    // o olhar chega atrasado na bola
    const k = 1 - Math.pow(0.95, dt * 60);
    st.fx += (bx - st.fx) * k; st.fy += (by - st.fy) * k;
    const pb = P(bx, by);
    bola.setAttribute('cx', r1(pb.x)); bola.setAttribute('cy', r1(pb.y));
    bola.setAttribute('r', (2.9 * pb.e + 0.6).toFixed(2));
    const pf = P(st.fx, st.fy);
    const ryN = RAIO / ASPECTO;
    const pTop = P(st.fx, st.fy - ryN), pBot = P(st.fx, st.fy + ryN), pDir = P(st.fx + RAIO, st.fy);
    foco.setAttribute('cx', r1(pf.x)); foco.setAttribute('cy', r1(pf.y));
    foco.setAttribute('rx', r1(Math.abs(pDir.x - pf.x))); foco.setAttribute('ry', r1(Math.abs(pBot.y - pTop.y) / 2));
    let vistos = 0;
    nos.forEach((g, i) => {
      const p = pos(i, tt), q = P(p.x, p.y);
      const esc = 0.62 + 0.55 * ((q.e - 0.58) / 0.42);
      g.setAttribute('transform', `translate(${r1(q.x)} ${r1(q.y)}) scale(${esc.toFixed(3)})`);
      const visto = st.ia || Math.hypot(p.x - st.fx, (p.y - st.fy) * ASPECTO) < RAIO;
      if (visto) vistos++;
      g.classList.toggle('visto', visto);
    });
    const mostrado = st.ia ? 22 : Math.max(2, Math.min(5, vistos));
    if (mostrado !== st.ultimo) { st.ultimo = mostrado; contador.textContent = String(mostrado); }
  }
  function laco(agora) {
    const dt = Math.min(0.1, Math.max(0, (agora - st.antes) / 1000)); st.antes = agora;
    quadro(agora, dt);
    st.raf = requestAnimationFrame(laco);
  }
  const liga = () => { if (st.raf || reduz) return; st.antes = performance.now(); st.raf = requestAnimationFrame(laco); };
  const desliga = () => { cancelAnimationFrame(st.raf); st.raf = 0; };

  // abas
  const abas = h('div', { class: 'campo-abas', role: 'tablist', 'aria-label': textos.rotulo });
  const aba = (modo, texto) => h('button', { type: 'button', role: 'tab', class: 'campo-aba', 'data-modo': modo, 'aria-selected': 'false', tabindex: '-1', text: texto });
  const aOlho = aba('olho', textos.abas.olho), aIa = aba('ia', textos.abas.ia);
  abas.append(aOlho, aIa);
  function modo(ia, porToque) {
    st.ia = ia;
    raiz.classList.toggle('modo-ia', ia);
    info.classList.toggle('modo-ia', ia);
    aOlho.setAttribute('aria-selected', String(!ia)); aIa.setAttribute('aria-selected', String(ia));
    aOlho.tabIndex = ia ? -1 : 0; aIa.tabIndex = ia ? 0 : -1;
    contador.textContent = ia ? '22' : String(st.ultimo > 0 && st.ultimo <= 5 ? st.ultimo : 3);
    st.ultimo = -1;
    legenda.textContent = ia ? textos.legendaIa : textos.legendaOlho;
    if (reduz || !st.raf) quadro(st.t0 + 1200, 0.016);
    aoTrocar?.(ia ? 'ia' : 'olho', porToque);
  }
  aOlho.addEventListener('click', () => modo(false, true));
  aIa.addEventListener('click', () => modo(true, true));
  abas.addEventListener('keydown', ev => {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    const ia = !st.ia; modo(ia, true); (ia ? aIa : aOlho).focus();
  });

  raiz.append(abas, palco, info);
  st.t0 = performance.now();
  // quadro parado (reduzir movimento): o foco numa posição fixa, longe do atleta
  if (reduz) { st.fx = base[donos[0]].x; st.fy = base[donos[0]].y; }
  modo(st.ia, false);
  quadro(st.t0 + 1200, 0.016);

  // só anima com o campo na tela e a aba visível
  let naTela = false;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { naTela = es.some(e => e.isIntersecting); naTela && !document.hidden ? liga() : desliga(); }) : null;
  io ? io.observe(palco) : liga();
  const vis = () => { document.hidden ? desliga() : (naTela && liga()); };
  document.addEventListener('visibilitychange', vis);

  return {
    el: raiz,
    modo: ia => modo(ia, false),
    get ia() { return st.ia; },
    destroi() { desliga(); io?.disconnect(); document.removeEventListener('visibilitychange', vis); }
  };
}
