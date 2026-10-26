// Acessibilidade. (1) O fluxo inteiro só no teclado (Tab, setas, Enter, Espaço, End), conferindo em cada parada que o foco aparece
// (o estilo muda com o foco) e anda de cima pra baixo, e que a cada troca de tela o foco vai pro título. (2) Espelhos anunciados
// (role="status" ou dentro de aria-live). (3) Alvos de toque de 44 px ou mais, medidos em todas as telas. (4) A 320 px e com zoom de
// 200% (1280 por 900 vira 640 por 450), nenhuma rolagem horizontal. (5) Com "reduzir movimento": animações desligadas, o campo
// parado, e o quiz inteiro funcionando. (6) Contraste de todos os pares (ferramentas/contraste.mjs, docs/contraste.md).
// Uso: node testes/teste-acessibilidade.mjs
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, scriptTeste, caminhoCompleto } from './_quiz.mjs';
import { pares } from '../ferramentas/contraste.mjs';

const { ok, fim } = verificador('Acessibilidade');
const s = await sobe();
const abertos = [];
const abre = async op => { const c = await abreChrome(op); abertos.push(c); return c; };

/* ---------- 6. contraste ---------- */
const P = pares();
const baixos = P.filter(p => p.razao < p.minimo);
ok(!baixos.length, `contraste: os ${P.length} pares passam (texto 4,5 ou mais, traço 3 ou mais)` + (baixos.length ? ': ' + baixos.map(p => `${p.onde} ${p.razao.toFixed(2)}`).join('; ') : ''));

// no navegador: o elemento com foco, onde ele está, e se o foco aparece (o estilo dele, do irmão marcado ou do filho muda sem o foco)
const FOCO = `(() => {
  const e = document.activeElement;
  if (!e || e === document.body) return null;
  const alvos = [e, e.matches('.caixa input') ? e.nextElementSibling : null, e.querySelector('.pos-bola')].filter(Boolean);
  const estilo = () => alvos.map(x => { const cs = getComputedStyle(x); return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderColor, cs.backgroundColor].join('|'); }).join('/');
  const com = estilo();
  e.blur(); const sem = estilo(); e.focus({ preventScroll: true });
  const r = e.getBoundingClientRect();
  const fixo = !!e.closest('#barra, .cabecalho, header');
  return { d: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).join('.') : '') + (e.dataset.id ? '[' + e.dataset.id + ']' : ''),
    visivel: com !== sem, y: Math.round(r.top + scrollY), x: Math.round(r.left), fixo };
})()`;

try {
  /* ---------- 1. o fluxo inteiro só no teclado, a 390 por 844 ---------- */
  {
    const c = await abre({ antes: scriptTeste({ config: { endpoint: '' } }) });
    const q = quiz(c);
    const semFoco = new Set(), foraDeOrdem = [], semTitulo = [], pequenos = new Map(), espelhosMudos = new Set();
    let paradas = 0;
    // Tab até o elemento pedido; cada parada confere o foco visível e a ordem
    async function tabAte(sel, max = 60) {
      let ultimoY = -1;
      for (let i = 0; i < max; i++) {
        await c.aperta('Tab');
        const f = await c.avalia(FOCO);
        if (!f) continue;
        paradas++;
        if (!f.visivel) semFoco.add(f.d);
        if (!f.fixo) { if (ultimoY >= 0 && f.y < ultimoY - 40) foraDeOrdem.push(`${f.d} (${f.y} depois de ${ultimoY})`); ultimoY = f.y; }
        if (await c.avalia(`document.activeElement.matches(${JSON.stringify(sel)})`)) return true;
      }
      throw new Error('o Tab não chegou em ' + sel);
    }
    // nas opções (radiogroup): as setas andam até a pedida
    async function setaAte(id) {
      for (let i = 0; i < 8; i++) {
        if ((await c.avalia('document.activeElement.dataset.id')) === id) return;
        await c.aperta('ArrowDown');
      }
      throw new Error('as setas não chegaram em ' + id);
    }
    async function chega(id) {
      await q.esperaTela(id);
      await espera(350);
      const noTitulo = await c.avalia(`(() => { const t = document.querySelector('#palco .tela:not(.saindo)'); return !!t && document.activeElement === t.querySelector('h1'); })()`);
      if (!noTitulo) semTitulo.push(id);
      // alvos de toque desta tela
      const med = await c.avalia(`[...document.querySelectorAll('button, a[href], input:not([type=hidden]), [role=radio], [role=tab], [role=slider], label.caixa')]
        .filter(e => !e.closest('.isca') && !e.matches('.caixa input') && e.checkVisibility && e.checkVisibility({ visibilityProperty: true, opacityProperty: false }) && !e.closest('[aria-hidden="true"]'))
        .map(e => { const r = e.getBoundingClientRect(); return [e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/)[0] : '') + (e.id ? '#' + e.id : ''), Math.round(r.width), Math.round(r.height)]; })
        .filter(([, w, h]) => w > 0 && h > 0 && Math.min(w, h) < 44)`);
      for (const [d, w, h] of med) pequenos.set(`${id}: ${d}`, `${w}x${h}`);
    }
    const espelhos = async () => { for (const d of await c.avalia(`[...document.querySelectorAll('.espelho, .barra-retorno, .receio')].filter(e => !(e.getAttribute('role') === 'status' || e.closest('[aria-live], [role=status]'))).map(e => e.className)`)) espelhosMudos.add(d); };

    await q.abre(s.url + '/');
    await chega('posicao');
    await tabAte('.pos[data-pos="LD"]'); await c.aperta('Enter');
    await chega('idade');
    await tabAte('.t-idade .opcao'); await setaAte('18_21'); await c.aperta('Enter');
    await chega('peneiras');
    await tabAte('.t-peneiras > .opcoes .opcao'); await setaAte('6_mais'); await c.aperta('Enter');
    await c.ate(`!!document.querySelector('.t-peneiras .bloco-segunda .opcao')`, 4000); await espera(300);
    await tabAte('.t-peneiras .bloco-segunda .opcao'); await setaAte('500_2000'); await c.aperta('Enter'); await espera(200); await espelhos();
    await chega('dispensas');
    await tabAte('.t-dispensas > .opcoes .opcao'); await setaAte('3_5'); await c.aperta('Enter'); await espera(200); await espelhos();
    await c.ate(`!!document.querySelector('.t-dispensas .bloco-segunda .opcao')`, 4000); await espera(300);
    await tabAte('.t-dispensas .bloco-segunda .opcao'); await setaAte('sim'); await c.aperta('Enter'); await espera(200); await espelhos();
    await chega('inimigo');
    // as abas do campo também andam pelas setas
    await tabAte('.t-inimigo [role=tab]');
    await c.aperta('ArrowRight'); await espera(300);
    ok(await c.avalia(`!!document.querySelector('.campo--jogo.modo-ia')`), 'T05: as setas trocam olhômetro e IA nas abas do campo');
    await tabAte('#barra .btn'); await c.aperta('Enter');
    await chega('zyron');
    await tabAte('#barra .btn', 90); await c.aperta('Enter');
    await chega('video');
    await tabAte('.t-video .opcao'); await setaAte('lances'); await c.aperta('Enter'); await espera(200); await espelhos();
    await chega('mundo');
    await tabAte('#barra .btn', 90); await c.aperta('Enter');
    await chega('historico');
    await tabAte('#barra .btn', 60); await c.aperta('Enter');
    await chega('sonho');
    await tabAte('.t-sonho .opcao'); await setaAte('europa'); await c.aperta('Enter');
    await q.esperaTela('audio');
    for (let i = 0; i < 6; i++) { if (!(await c.avalia(`!!document.querySelector('.abertura:not(.saindo)')`))) break; await c.aperta('Enter'); await espera(200); }
    await c.ate(`!!document.querySelector('.bolha-play')`, 8000); await espera(400);
    ok(await c.avalia(`document.activeElement === document.querySelector('.t-audio h1')`), 'T10: depois da abertura, o foco vai pro título');
    await tabAte('.bolha-play'); await c.aperta('Enter');
    await c.ate(`window.__qzAudio && !window.__qzAudio.paused && window.__qzAudio.duration > 0`, 8000);
    await tabAte('.onda'); await c.aperta('End');
    await c.ate(`!!document.querySelector('#barra .btn')`, 8000);
    await tabAte('#barra .btn'); await c.aperta('Enter');
    await chega('quer');
    await tabAte('.t-quer .opcao'); await setaAte('sim'); await c.aperta('Enter');
    await c.ate(`!!document.querySelector('.segurar-botao')`, 4000); await espera(500);
    await tabAte('.segurar-botao'); await c.aperta('Enter');
    await chega('chance');
    await tabAte('.t-chance .opcao'); await setaAte('familia'); await c.aperta('Enter');
    await chega('contato');
    await tabAte('#f-nome'); await c.digita('Joãozinho');
    await tabAte('#f-whatsapp'); await c.digita('11955554444');
    await tabAte('#f-aceite'); await c.aperta(' ');
    ok(await c.avalia(`document.querySelector('#f-aceite').checked`), 'T13: o Espaço marca o aceite');
    await tabAte('#barra .btn'); await c.aperta('Enter');
    await chega('resultado');
    await tabAte('#barra .btn');
    ok(true, `o quiz inteiro só no teclado, das 15 telas até o botão final (${paradas} paradas de Tab)`);
    ok(!semTitulo.length, 'a cada troca de tela, o foco vai pro título' + (semTitulo.length ? ' (não foi em: ' + semTitulo.join(', ') + ')' : ''));
    ok(!semFoco.size, `o foco aparece em toda parada (${paradas})` + (semFoco.size ? ': sem marca em ' + [...semFoco].join(', ') : ''));
    ok(!foraDeOrdem.length, 'o Tab anda de cima pra baixo' + (foraDeOrdem.length ? ': ' + foraDeOrdem.slice(0, 4).join(' | ') : ''));
    ok(!espelhosMudos.size, 'todo espelho é anunciado (role="status" ou aria-live)' + (espelhosMudos.size ? ': ' + [...espelhosMudos].join(', ') : ''));
    ok(!pequenos.size, 'todo alvo de toque com 44 px ou mais' + (pequenos.size ? ': ' + [...pequenos].map(([k, v]) => `${k} ${v}`).join(' | ') : ''));
    await c.fecha();
  }

  /* ---------- 4. 320 px e zoom de 200%: nenhuma rolagem horizontal ---------- */
  for (const [largura, altura, movel, rotulo] of [[320, 568, true, '320 px'], [640, 450, false, 'zoom de 200% (1280 por 900)']]) {
    const c = await abre({ largura, altura, movel, escala: movel ? 1 : 2, antes: scriptTeste({ config: { endpoint: '' } }) });
    const cc = movel ? c : Object.assign({}, c, { toca: (sel, op) => c.clica(sel, op) });
    const q = quiz(cc);
    const largas = [];
    const confere = async () => { const r = await c.avalia(`(() => { const t = document.querySelector('#palco .tela:not(.saindo)'); return [t && t.dataset.passo, document.documentElement.scrollWidth, innerWidth]; })()`); if (r[1] > r[2] + 1) largas.push(`${r[0]} (${r[1]} > ${r[2]})`); };
    const orig = q.esperaTela;
    q.esperaTela = async (id, ms) => { await orig(id, ms); await espera(300); await confere(); };
    await q.abre(s.url + '/');
    await caminhoCompleto(q, { contato: { nome: 'Joãozinho', zap: '11955554444' } });
    ok(!largas.length, `${rotulo}: nenhuma tela com rolagem horizontal` + (largas.length ? ': ' + largas.join(', ') : ''));
    await c.fecha();
  }

  /* ---------- 5. reduzir movimento ---------- */
  {
    const c = await abre({ reduz: true, antes: scriptTeste({ config: { endpoint: '' } }) });
    const q = quiz(c);
    await q.abre(s.url + '/');
    const dur = await c.avalia(`(() => { const e = document.querySelector('.pos-bola'); return [getComputedStyle(e).animationDuration, getComputedStyle(document.querySelector('#palco .tela')).animationDuration]; })()`);
    ok(dur.every(d => parseFloat(d) < 0.01), `reduzir movimento: animações desligadas (${dur.join(', ')})`);
    await q.posicao('LD'); await q.idade('18_21'); await q.peneiras('6_mais', '500_2000'); await q.dispensas('3_5', 'sim');
    await q.esperaTela('inimigo');
    const foco1 = await c.avalia(`document.querySelector('.campo--jogo')?.innerHTML.length`);
    const pos1 = await c.avalia(`JSON.stringify([...document.querySelectorAll('.campo--jogo .jog')].slice(0, 6).map(j => j.getAttribute('style') || j.getAttribute('transform') || ''))`);
    await espera(900);
    const pos2 = await c.avalia(`JSON.stringify([...document.querySelectorAll('.campo--jogo .jog')].slice(0, 6).map(j => j.getAttribute('style') || j.getAttribute('transform') || ''))`);
    ok(foco1 > 0 && pos1 === pos2, 'reduzir movimento: o campo da T05 fica parado');
    ok(!(await c.avalia(`!!document.querySelector('.abertura')`)), 'reduzir movimento: sem a abertura em preto que anda sozinha');
    await q.inimigo(); await q.zyron(); await q.video('lances'); await q.mundo(); await q.historico(); await q.sonho('europa');
    await q.audio('fim'); await q.quer('sim'); await q.chance('familia'); await q.contato({ nome: 'Joãozinho', zap: '11955554444' }); await q.resultado();
    ok(true, 'reduzir movimento: o quiz inteiro funciona até o resultado');
    await c.fecha();
  }
} catch (e) {
  ok(false, 'erro: ' + e.message);
} finally {
  for (const c of abertos) await c.fecha().catch(() => {});
  await s.fecha();
  fim();
}
