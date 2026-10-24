// Aparelhos: as telas do caminho 1 em 360 por 640, 390 por 844, 412 por 915, 768 por 1024 e 1440 por 900, salvas em
// capturas/<largura>/NN-id.png (e NN-id-fim.png quando a tela rola). Em cada parada: nenhuma rolagem horizontal, nenhum texto
// cortado, nenhum alvo coberto pela barra fixa (com a tela rolada até o fim). E o caminho inteiro com o User-Agent do navegador
// do Instagram (Android e iOS): sem erro no console e com o payload marcando o navegador do aplicativo. A largura do conteúdo é
// medida pelo Chrome em cada parada: algo mais largo que a tela faz o celular afastar o zoom ao rolar (e o toque erra o alvo).
// Aparelho real é do dono: este teste não substitui iPhone e Android de verdade.
// Uso: node testes/teste-aparelhos.mjs            (todas as medidas)
//      node testes/teste-aparelhos.mjs 390        (só uma largura)
import fs from 'node:fs';
import path from 'node:path';
import { sobe, DEV } from './servidor.mjs';
import { abreChrome, espera, verificador, UA } from './_cdp.mjs';
import { quiz, scriptTeste, caminhoCompleto } from './_quiz.mjs';
import { percorre } from './_percurso.mjs';

const { ok, fim } = verificador('Aparelhos');
const so = process.argv.slice(2).map(Number).filter(Boolean);
const MEDIDAS = [[360, 640], [390, 844], [412, 915], [768, 1024], [1440, 900]].filter(([l]) => !so.length || so.includes(l));
const s = await sobe();
const abertos = [];

// no navegador: rolagem horizontal, texto cortado e alvo embaixo da barra (com a página rolada até o fim)
const LAYOUT = `(async () => {
  const desc = e => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/)[0] : '');
  const r = { larga: document.documentElement.scrollWidth > innerWidth + 1, cortados: [], fora: [], cobertos: [] };
  for (const e of document.querySelectorAll('#palco *, #barra *, .folha *')) {
    if (e.closest('.isca') || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    if (!e.checkVisibility || !e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const cs = getComputedStyle(e);
    if ((/hidden|clip/.test(cs.overflowX + cs.overflowY) || cs.textOverflow === 'ellipsis') && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2)) r.cortados.push(desc(e));
    const b = e.getBoundingClientRect();
    if (!e.closest('.trilho') && (b.right > innerWidth + 1 || b.left < -1)) r.fora.push(desc(e) + ' ' + Math.round(b.left) + '..' + Math.round(b.right));
  }
  const y0 = scrollY;
  scrollTo(0, document.documentElement.scrollHeight);
  await new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok)));
  const barra = document.querySelector('#barra');
  const topo = barra && barra.childElementCount && !barra.classList.contains('escondida') ? barra.getBoundingClientRect().top : innerHeight;
  for (const e of document.querySelectorAll('#palco button, #palco a[href], #palco input:not([type=hidden]), #palco label.caixa')) {
    if (e.closest('.isca') || e.matches('.caixa input') || !e.checkVisibility()) continue;
    const b = e.getBoundingClientRect();
    if (b.height && b.bottom > topo + 1 && b.top < innerHeight) r.cobertos.push(desc(e));
  }
  scrollTo(0, y0);
  return r;
})()`;

try {
  for (const [largura, altura] of MEDIDAS) {
    const pasta = path.join(DEV, 'capturas', String(largura));
    fs.rmSync(pasta, { recursive: true, force: true });
    fs.mkdirSync(pasta, { recursive: true });
    const movel = largura < 700;
    const c = await abreChrome({ largura, altura, movel, antes: scriptTeste({ config: { endpoint: '' } }) });
    abertos.push(c);
    const q = quiz(movel ? c : Object.assign({}, c, { toca: (sel, op) => c.clica(sel, op) }));
    const problemas = [];
    let n = 0;
    try {
      await percorre({ c, q, url: s.url + '/', aoTela: async (id, { fim: rolada, pausa }) => {
        await espera(pausa);
        const nome = String(++n).padStart(2, '0') + '-' + id;
        await c.foto(path.join(pasta, nome + '.png'));
        if (rolada) await c.fotoFim(path.join(pasta, nome + '-fim.png'));
        if (id === 'audio-abertura' || id === 'montando') return;
        // o conteúdo na largura da tela, segundo o próprio Chrome (algo mais largo faz o celular afastar o zoom ao rolar, e o toque erra)
        const m = await c.envia('Page.getLayoutMetrics');
        if (m.cssContentSize.width > largura + 1) problemas.push(`${id}: conteúdo com ${Math.round(m.cssContentSize.width)} px numa tela de ${largura}`);
        if (Math.abs(m.cssLayoutViewport.clientWidth - largura) > 1) problemas.push(`${id}: o zoom mudou depois de rolar (janela de ${m.cssLayoutViewport.clientWidth} px)`);
        const r = await c.avalia(LAYOUT);
        if (r.larga) problemas.push(`${id}: rolagem horizontal`);
        r.cortados.forEach(d => problemas.push(`${id}: texto cortado em ${d}`));
        r.fora.forEach(d => problemas.push(`${id}: texto fora da tela em ${d}`));
        r.cobertos.forEach(d => problemas.push(`${id}: ${d} embaixo da barra`));
      } });
      ok(!problemas.length, `${largura} por ${altura}: ${n} paradas sem rolagem horizontal, texto cortado ou botão coberto (capturas/${largura}/)` + (problemas.length ? ': ' + [...new Set(problemas)].slice(0, 6).join(' | ') : ''));
      ok(!c.console_.length, `${largura} por ${altura}: sem erro no console` + (c.console_.length ? ': ' + c.console_.slice(0, 2).join(' | ') : ''));
    } catch (e) {
      ok(false, `${largura} por ${altura}: ${e.message}`);
      await c.foto(path.join(pasta, 'erro.png')).catch(() => {});
    }
    await c.fecha();
  }

  /* o navegador interno do Instagram */
  if (!so.length || so.includes(390)) {
    for (const [nome, ua, plataforma] of [['Instagram no Android', UA.instagramAndroid, 'android'], ['Instagram no iPhone', UA.instagramIos, 'ios']]) {
      s.coleta.corpos.length = 0;
      const c = await abreChrome({ ua, antes: scriptTeste({ config: { endpoint: s.url + '/__coleta' } }) });
      abertos.push(c);
      const q = quiz(c);
      try {
        await q.abre(s.url + '/?utm_source=ig');
        await caminhoCompleto(q, { contato: { nome: 'Joãozinho', zap: '11955554444' } });
        for (let i = 0; i < 40 && !s.coleta.corpos.some(x => x && x.leadId); i++) await espera(100);
        const p = s.coleta.corpos.find(x => x && x.leadId);
        ok(p && p.rastreio.inApp === 'instagram' && p.rastreio.plataforma === plataforma, `${nome}: o quiz inteiro, e o payload marca o navegador do aplicativo (${p && p.rastreio.plataforma}, inApp ${p && p.rastreio.inApp})`);
        ok(!c.console_.length, `${nome}: sem erro no console`);
      } catch (e) { ok(false, `${nome}: ${e.message}`); }
      await c.fecha();
    }
  }
} finally {
  for (const c of abertos) await c.fecha().catch(() => {});
  await s.fecha();
  fim();
}
