// Desempenho, medido por CDP com 4G lento (150 ms de latência, 1,6 Mbps de descida, 750 kbps de subida) e CPU 4 vezes mais lenta:
// primeira carga abaixo de 350 KB (sem o áudio, que só baixa na T09), LCP abaixo de 2,5 s, CLS abaixo de 0,05, JavaScript abaixo de
// 80 KB comprimido (gzip de todos os módulos, inclusive as telas que carregam depois) e nenhum pedido a terceiro.
// O servidor de teste fala como a Vercel: HTTP/2 com TLS (tudo numa conexão só) e texto com gzip (a Vercel ainda usa brotli, menor).
// LCP e CLS são a mediana de três primeiras visitas, cada uma num Chrome novo: o "CPU 4 vezes mais lento" é relativo à máquina, e
// processo pesado em segundo plano muda uma medição isolada.
// O topo da capa vem pronto no index.html: com o JavaScript do quiz bloqueado ele aparece pra quem chega, some pra quem volta no
// meio do quiz (js/casca.js), e o título fica no mesmo lugar quando a T01 monta por cima.
// Uso: node testes/teste-desempenho.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { scriptTeste, estadoSalvo, respostasAte } from './_quiz.mjs';
import { arquivos, RAIZ } from './_util.mjs';

const { ok, fim } = verificador('Desempenho');
const s = await sobe({ h2: true });
const MEDE = `
  window.__lcp = 0; window.__cls = 0;
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}`;

// uma primeira visita: Chrome novo, sem cache, 4G lento e CPU 4 vezes mais lenta
async function visita() {
  const c = await abreChrome({ antes: scriptTeste({ config: { endpoint: '' }, extra: MEDE }), extras: ['--ignore-certificate-errors'] });
  try {
    const bytes = new Map(), urls = new Map();
    c.aoEvento(m => {
      if (m.method === 'Network.requestWillBeSent') urls.set(m.params.requestId, m.params.request.url);
      if (m.method === 'Network.loadingFinished') bytes.set(m.params.requestId, m.params.encodedDataLength);
    });
    await c.envia('Network.setCacheDisabled', { cacheDisabled: true });
    await c.envia('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await c.envia('Emulation.setCPUThrottlingRate', { rate: 4 });
    const t0 = Date.now();
    await c.vai(s.url + '/');
    await c.ate(`(() => { const t = document.querySelector('#palco .tela'); return !!t && t.dataset.passo === 'posicao'; })()`, 30000, 100);
    const tTela = (Date.now() - t0) / 1000;
    // espera a rede assentar (2 s sem pedido novo)
    let n = -1;
    for (let i = 0; i < 40 && n !== urls.size; i++) { n = urls.size; await espera(2000); }
    const total = [...bytes.values()].reduce((a, b) => a + b, 0);
    const lista = [...urls.entries()].map(([id, u]) => [u.replace(s.url, ''), bytes.get(id) || 0]).sort((a, b) => b[1] - a[1]);
    const terceiros = [...urls.values()].filter(u => !u.startsWith(s.url) && !u.startsWith('data:'));
    return { total, pedidos: urls.size, lista, terceiros, tTela, lcp: await c.avalia('window.__lcp'), cls: await c.avalia('window.__cls') };
  } finally { await c.fecha(); }
}
const mediana = v => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];

// o título da capa, sem rede lenta: com o app.js bloqueado (só o HTML e o CSS) ou com o quiz montado (a T01 de verdade)
async function capa({ estado = null, hash = '', bloqueia = true } = {}) {
  const c = await abreChrome({ antes: scriptTeste({ config: { endpoint: '' }, estado }), extras: ['--ignore-certificate-errors'] });
  try {
    if (bloqueia) await c.envia('Network.setBlockedURLs', { urls: ['*/js/app.js'] });
    await c.vai(s.url + '/' + hash);
    await c.ate(bloqueia ? `document.readyState === 'complete'` : `!!document.querySelector('#palco .tela[data-passo="posicao"]')`, 15000, 100);
    return await c.avalia(`document.fonts.ready.then(() => {
      const e = document.querySelector('#palco .tela h1');
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { visivel: getComputedStyle(e).visibility === 'visible' && r.height > 0, casca: !!e.closest('[data-casca]'), retoma: document.documentElement.classList.contains('retoma'), x: r.left, y: r.top, w: r.width, h: r.height };
    })`);
  } finally { await c.fecha(); }
}

try {
  // JavaScript: gzip de todos os módulos
  const js = arquivos(path.join(RAIZ, 'js'));
  const cru = js.reduce((t, f) => t + fs.statSync(f).size, 0);
  const gz = js.reduce((t, f) => t + zlib.gzipSync(fs.readFileSync(f), { level: 9 }).length, 0);
  ok(gz < 80 * 1024, `JavaScript: ${(gz / 1024).toFixed(1)} KB com gzip (${(cru / 1024).toFixed(1)} KB cru, ${js.length} módulos), abaixo de 80 KB`);

  const v = [];
  for (let i = 0; i < 3; i++) v.push(await visita());
  const a = v[0];
  ok(a.total < 350 * 1024, `primeira carga: ${(a.total / 1024).toFixed(0)} KB em ${a.pedidos} pedidos, abaixo de 350 KB (maiores: ${a.lista.slice(0, 4).map(([u, b]) => `${u} ${(b / 1024).toFixed(0)} KB`).join(', ')})`);
  ok(!a.lista.some(([u]) => /\.mp3/.test(u)), 'o áudio não baixa na primeira carga');
  const terceiros = v.flatMap(x => x.terceiros);
  ok(!terceiros.length, 'nenhum pedido a terceiro na carga' + (terceiros.length ? ': ' + terceiros.join(', ') : ''));
  const lcp = mediana(v.map(x => x.lcp)), cls = mediana(v.map(x => x.cls));
  ok(lcp > 0 && lcp < 2500, `LCP em ${(lcp / 1000).toFixed(2)} s (mediana de ${v.map(x => (x.lcp / 1000).toFixed(2)).join(', ')}), abaixo de 2,5 s`);
  ok(cls < 0.05, `CLS de ${cls.toFixed(3)} (mediana), abaixo de 0,05`);
  console.log(`      medido em ${s.h2 ? 'HTTP/2 com TLS' : 'HTTP/1.1'} e gzip, 4G lento e CPU 4 vezes mais lenta; a T01 apareceu em ${v.map(x => x.tTela.toFixed(1)).join(', ')} s`);

  // o topo da capa antes do JavaScript, e quem volta no meio
  const chega = await capa();
  ok(chega && chega.casca && chega.visivel && !chega.retoma, 'sem o JavaScript do quiz, quem chega já vê o topo da capa (vem no index.html)');
  const meio = estadoSalvo(respostasAte('zyron'), 'zyron');
  const volta = await capa({ estado: meio, hash: '#/zyron' });
  ok(volta && volta.retoma && !volta.visivel, 'quem recarrega no meio do quiz (#/zyron, progresso salvo) não vê a capa piscar antes da tela dele');
  const enviou = await capa({ estado: Object.assign(estadoSalvo(respostasAte('contato'), 'resultado'), { enviado: true, leadId: 'teste' }) });
  ok(enviou && enviou.retoma && !enviou.visivel, 'quem já enviou (abre no resultado) também não vê a capa');
  const semHash = await capa({ estado: meio });
  ok(semHash && !semHash.retoma && semHash.visivel, 'quem volta pelo link do anúncio (sem #/passo) vê a capa, que oferece seguir de onde parou');
  const t01 = await capa({ bloqueia: false });
  const igual = chega && t01 && !t01.casca && ['x', 'y', 'w', 'h'].every(k => Math.abs(chega[k] - t01[k]) < 0.5);
  ok(igual, 'o título da capa fica no mesmo lugar quando a T01 monta por cima' + (igual ? '' : `: ${JSON.stringify(chega)} contra ${JSON.stringify(t01)}`));
} catch (e) {
  ok(false, 'erro: ' + e.message);
} finally {
  await s.fecha();
  fim();
}
