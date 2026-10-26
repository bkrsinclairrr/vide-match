// Trilho de cartões que rolam de lado (recortes de jornal, depoimentos): rolagem nativa com encaixe, um cartão por vez. Enquanto
// está na tela, vai passando sozinho de cartão em cartão, em volta contínua, e o ponto ativo enche no tempo do próximo. O toque, a
// rolagem com o dedo ou o teclado pausam; depois de alguns segundos sem mexer, volta a rolar. Com "reduzir movimento", nunca anda
// sozinho. Rolagem nativa: funciona igual no navegador do Instagram. Com `dica`, uma mão animada por cima do cartão seguinte mostra que
// dá pra arrastar: pisca por `dicaMs` contados só com o trilho na tela (se ele sai da tela, a conta para e a mão se apaga; volta quando
// ele reaparece) e sai antes só se o atleta arrastar o trilho de lado (tocar ou rolar a página não conta). Enquanto a mão está lá, o
// avanço sozinho e o enchimento dos pontos esperam: a contagem só passa a valer depois que ele viu a dica.
import { h, reduzMovimento } from '../motor/util.js';
import { icone } from './icones.js';

export function trilho({ itens, rotulo, auto = 0, retoma = 6000, aoVer, dica, dicaMs = 10000 }) {
  const pista = h('div', { class: 'trilho', role: 'region', 'aria-label': rotulo, tabindex: '0' }, ...itens);
  const maozinha = dica ? h('div', { class: 'trilho-dica espera', 'aria-hidden': 'true' }, h('span', { class: 'trilho-mao', html: icone.arrasta }), h('span', { class: 'trilho-dica-t', text: dica })) : null;
  const caixa = h('div', { class: 'trilho-caixa' }, pista, maozinha);
  let tmDica = 0, dicaFalta = dicaMs, dicaDesde = 0, dicaFeita = !maozinha;
  // a dica acaba (o tempo de tela se esgotou ou ele arrastou): a mão sai e o avanço sozinho passa a valer
  const fechaDica = () => {
    if (dicaFeita) return;
    dicaFeita = true; clearTimeout(tmDica); tmDica = 0;
    maozinha.classList.remove('espera'); maozinha.classList.add('some');
    agenda();
  };
  // com o trilho na tela: a mão acende e a conta do tempo corre
  const rodaDica = () => {
    if (dicaFeita || tmDica || !visivel || document.hidden) return;
    maozinha.classList.remove('espera');
    dicaDesde = Date.now();
    tmDica = setTimeout(fechaDica, dicaFalta);
  };
  // o trilho saiu da tela (ou a aba foi pro fundo): guarda o que faltava e apaga a mão até ele voltar
  const seguraDica = () => {
    if (dicaFeita || !tmDica) return;
    clearTimeout(tmDica); tmDica = 0;
    dicaFalta = Math.max(1500, dicaFalta - (Date.now() - dicaDesde));
    maozinha.classList.add('espera');
  };
  const pontos = h('div', { class: 'pontos parado', 'aria-hidden': 'true', style: { '--dur': auto + 'ms' } }, ...itens.map(() => h('i')));
  const reduz = reduzMovimento();
  let atual = -1, timer = 0, ligado = false, visivel = false, foco = false, pausaAte = 0, ignoraAte = 0;
  const visto = new Set();

  const pode = () => ligado && dicaFeita && !reduz && visivel && !foco && !document.hidden && Date.now() >= pausaAte && itens.length > 1;
  function agenda() {
    clearTimeout(timer); timer = 0;
    const ok = pode();
    pontos.classList.toggle('parado', !ok);
    if (ok) timer = setTimeout(proximo, auto);
    else if (ligado && !reduz && visivel && !foco && Date.now() < pausaAte) timer = setTimeout(agenda, pausaAte - Date.now());
  }
  function proximo() { timer = 0; if (pode()) vai((atual + 1) % itens.length); else agenda(); }

  function marca(i) {
    if (i === atual) return;
    atual = i;
    [...pontos.children].forEach((p, k) => p.classList.toggle('ativo', k === i));
    if (!visto.has(i)) { visto.add(i); aoVer?.(i); }
    agenda();
  }
  const indice = () => {
    const x = pista.scrollLeft, larg = itens[0]?.offsetWidth || 1;
    return Math.max(0, Math.min(itens.length - 1, Math.round(x / (larg + 12))));
  };
  function vai(i) {
    const alvo = itens[i];
    if (!alvo) return;
    ignoraAte = Date.now() + 900;
    pista.scrollTo({ left: alvo.offsetLeft - itens[0].offsetLeft, behavior: reduz ? 'auto' : 'smooth' });
    marca(i);
  }

  // quem mexe pausa; a rolagem do próprio trilho (o avanço sozinho) não conta como mexer
  const pausa = () => { pausaAte = Date.now() + retoma; agenda(); };
  let pendente = 0;
  pista.addEventListener('scroll', () => {
    if (Date.now() < ignoraAte) return;
    cancelAnimationFrame(pendente);
    pendente = requestAnimationFrame(() => { if (pista.scrollLeft > 12) fechaDica(); pausaAte = Math.max(pausaAte, Date.now() + retoma); marca(indice()); agenda(); });
  }, { passive: true });
  ['pointerdown', 'touchstart', 'wheel'].forEach(e => pista.addEventListener(e, pausa, { passive: true }));
  pista.addEventListener('focusin', () => { foco = true; agenda(); });
  pista.addEventListener('focusout', () => { foco = false; pausa(); });
  pista.addEventListener('keydown', ev => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    ev.preventDefault();
    fechaDica();
    vai(Math.max(0, Math.min(itens.length - 1, atual + (ev.key === 'ArrowRight' ? 1 : -1))));
  });
  const aoTrocarAba = () => { if (document.hidden) seguraDica(); else rodaDica(); agenda(); };
  document.addEventListener('visibilitychange', aoTrocarAba);
  // só roda com o trilho na tela
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) rodaDica(); else seguraDica(); agenda(); }, { threshold: 0.6 }) : null;
  if (io) io.observe(pista); else { visivel = true; rodaDica(); }

  marca(0);
  return {
    el: caixa, pista, pontos,
    liga() { ligado = true; agenda(); },
    para() { ligado = false; agenda(); },
    vai,
    get atual() { return atual; },
    destroi() { clearTimeout(timer); clearTimeout(tmDica); io?.disconnect(); document.removeEventListener('visibilitychange', aoTrocarAba); }
  };
}
