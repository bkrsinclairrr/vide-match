// Consentimento e tags (ECA Digital, Lei 15.211, arts. 22 e 26: o sistema cumpre sozinho, sem aviso na tela). Todo pedido a servidor
// de terceiro é interceptado: o do pixel da Meta e os da Utmify recebem um script de mentira que só registra as chamadas; qualquer
// outro falha. Confere: nada de terceiro antes da idade; menor (e em dúvida) nunca, em momento nenhum, e sem fbclid, gclid nem
// sessaoId; adulto antes do aceite, nada; a folha só pra adulto e só com ID configurado, com "Aceitar" e "Rejeitar" do mesmo tamanho e
// peso; rejeitar mantém o quiz inteiro funcionando; aceitar carrega as tags, que disparam só os eventos mapeados, sem tier, pontuação
// nem contato.
// Uso: node testes/teste-consentimento.mjs
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, scriptTeste, caminhoCompleto } from './_quiz.mjs';

const { ok, fim } = verificador('Consentimento e tags');
const s = await sobe();
const COLETA = s.url + '/__coleta';
const leads = () => s.coleta.corpos.filter(x => x && x.leadId);
const PIXEL = { meta: '1234567890', utmify: 'abc123teste', menores: 'nenhum' };
const abertos = [];
// o pixel de mentira guarda cada chamada também na sessionStorage: o botão da landing navega, e a lista sobrevive (mesma origem)
const STUB_FB = `(function(){ window.__fbq = window.__fbq || []; var f = window.fbq; if (!f) return;
  var guarda = function(a){ window.__fbq.push(Array.prototype.slice.call(a)); try { sessionStorage.setItem('__fbq', JSON.stringify(window.__fbq)); } catch (e) {} };
  (f.queue || []).forEach(guarda); f.queue = [];
  f.callMethod = function(){ guarda(arguments); }; })();`;
const STUB_UTMIFY = `window.__utmify = (window.__utmify || 0) + 1;`;

async function abre(config) {
  const c = await abreChrome({ antes: scriptTeste({ config: Object.assign({ endpoint: COLETA }, config) }) });
  abertos.push(c);
  const terceiros = [];
  // um ouvinte só: o que é do servidor local segue; o resto é terceiro (registrado, e respondido com o script de mentira ou bloqueado)
  c.aoEvento(async m => {
    if (m.method !== 'Fetch.requestPaused') return;
    const { requestId, request: { url } } = m.params;
    try {
      if (url.startsWith(s.url)) { await c.envia('Fetch.continueRequest', { requestId }); return; }
      terceiros.push(url);
      const corpo = /fbevents\.js/.test(url) ? STUB_FB : /utmify/.test(url) ? STUB_UTMIFY : null;
      if (corpo === null) await c.envia('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      else await c.envia('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }], body: Buffer.from(corpo).toString('base64') });
    } catch { /* a página já foi */ }
  });
  await c.envia('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  return { c, q: quiz(c), terceiros: () => terceiros.slice() };
}
const temFolha = c => c.avalia(`!!document.querySelector('[data-cookies]')`);

try {
  /* menor: nada de terceiro, em momento nenhum; sem fbclid, gclid nem sessaoId */
  {
    s.coleta.corpos.length = 0;
    const { c, q, terceiros } = await abre({ pixel: PIXEL });
    await q.abre(s.url + '/?fbclid=FB123&gclid=GC456&utm_source=ig');
    await q.posicao('LD');
    await q.esperaTela('idade');
    ok(terceiros().length === 0, 'antes da idade: nenhum pedido a terceiro');
    await caminhoCompleto({ ...q, posicao: async () => {} }, { idade: '15_17', contato: { nome: 'Pedro', responsavel: 'Ana Lima', zap: '11955554444' } });
    await espera(1500);
    ok(terceiros().length === 0, `menor de 15 a 17, do começo ao fim: nenhum pedido a terceiro (${terceiros().length})`);
    ok(!(await temFolha(c)) && !(await c.avalia('!!window.fbq || !!window.__utmify')), 'menor: nenhuma folha de cookies e nenhuma tag na página');
    const p = leads()[0];
    ok(p && p.rastreio.fbclid === null && p.rastreio.gclid === null && p.tecnico.sessaoId === null, 'menor: o payload vai sem fbclid, gclid e sessaoId');
    ok(!(await c.avalia(`JSON.stringify(Object.assign({}, localStorage, sessionStorage))`)).match(/FB123|GC456/), 'menor: fbclid e gclid não ficam guardados no aparelho');
    await c.fecha();
  }

  /* menos de 12: nada de terceiro */
  {
    const { c, q, terceiros } = await abre({ pixel: PIXEL });
    await q.abre(s.url + '/?fbclid=FB123');
    await q.posicao('CA'); await q.esperaTela('idade');
    await q.toca('.t-idade .opcao[data-id="menos12"]');
    await c.ate(`!!document.querySelector('.saida-menor')`, 4000);
    await espera(1500);
    ok(terceiros().length === 0 && !(await temFolha(c)), 'menos de 12: nenhum pedido a terceiro e nenhuma folha');
    await c.fecha();
  }

  /* adulto que rejeita: folha com botões iguais, nada de terceiro, o quiz inteiro funciona */
  {
    s.coleta.corpos.length = 0;
    const { c, q, terceiros } = await abre({ pixel: PIXEL });
    await q.abre(s.url + '/?fbclid=FB123&gclid=GC456');
    await q.posicao('LD'); await q.idade('18_21');
    await q.esperaTela('peneiras');
    ok(await c.ate(`!!document.querySelector('[data-cookies="aceitar"]')`, 4000), 'adulto com ID configurado: a folha de cookies abre depois da idade');
    ok(terceiros().length === 0, 'adulto antes de escolher: nenhum pedido a terceiro');
    const b = await c.avalia(`(() => { const m = sel => { const e = document.querySelector(sel), r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { w: Math.round(r.width), h: Math.round(r.height), peso: cs.fontWeight, tam: cs.fontSize, fundo: cs.backgroundColor, borda: cs.borderTopWidth }; };
      return { a: m('[data-cookies="aceitar"]'), r: m('[data-cookies="rejeitar"]') }; })()`);
    ok(b.a.w === b.r.w && b.a.h === b.r.h && b.a.peso === b.r.peso && b.a.tam === b.r.tam, `"Aceitar" e "Rejeitar" do mesmo tamanho e peso (${b.a.w}x${b.a.h} ${b.a.peso}; ${b.r.w}x${b.r.h} ${b.r.peso})`);
    ok(b.a.fundo === b.r.fundo && b.a.borda === b.r.borda, 'e com o mesmo fundo e a mesma borda (nenhum dos dois puxa o dedo)');
    await q.toca('[data-cookies="rejeitar"]');
    await espera(600);
    ok(!(await temFolha(c)), 'rejeitar fecha a folha');
    await q.peneiras('3_5', '500_2000'); await q.dispensas('1_2', 'sim');
    await q.inimigo(); await q.zyron('lances'); await q.mundo(); await q.historico(); await q.sonho('europa');
    await q.audio('fim'); await q.quer('sim'); await q.chance('familia'); await q.contato({ nome: 'Carlos', zap: '11955554444' }); await q.resultado();
    await espera(1500);
    ok(terceiros().length === 0, `rejeitou: nenhum pedido a terceiro até o fim (${terceiros().length})`);
    const p = leads()[0];
    ok(p && p.pontuacao.tier && p.rastreio.fbclid === null && p.tecnico.sessaoId === null, 'rejeitou: o quiz fecha inteiro, e o payload vai sem fbclid e sem sessaoId');
    await c.fecha();
  }

  /* adulto que aceita: as tags carregam e disparam só os eventos mapeados */
  {
    s.coleta.corpos.length = 0;
    const { c, q, terceiros } = await abre({ pixel: PIXEL, landingUrl: s.url + '/robots.txt' });
    await q.abre(s.url + '/?fbclid=FB123&gclid=GC456');
    await q.posicao('LD'); await q.idade('22_mais');
    await q.esperaTela('peneiras');
    await c.ate(`!!document.querySelector('[data-cookies="aceitar"]')`, 4000);
    await q.toca('[data-cookies="aceitar"]');
    await c.ate('Array.isArray(window.__fbq) && window.__utmify >= 2', 6000);
    const carregou = terceiros();
    ok(carregou.some(u => /connect\.facebook\.net\/.*fbevents\.js/.test(u)) && carregou.filter(u => /cdn\.utmify\.com\.br/.test(u)).length === 2, `aceitou: o pixel da Meta e os dois scripts da Utmify carregam (${carregou.length} pedidos)`);
    await q.peneiras('6_mais', 'mais_2000'); await q.dispensas('3_5', 'sim');
    await q.inimigo(); await q.zyron('jogos'); await q.mundo(); await q.historico(); await q.sonho('europa');
    await q.audio('fim'); await q.quer('sim'); await q.chance('pronto'); await q.contato({ nome: 'Diego', zap: '11955554444' }); await q.resultado();
    await espera(800);
    const p = leads()[0];
    await q.toca('#barra .btn');
    await c.ate(`location.pathname === '/robots.txt'`, 5000);
    const chamadas = await c.avalia(`JSON.parse(sessionStorage.getItem('__fbq') || '[]').map(a => a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)))`);
    const nomes = chamadas.map(a => a.slice(0, 2).join(' '));
    ok(nomes[0] === 'set autoConfig' && chamadas[0][2] === 'false' && nomes.includes('init 1234567890') && nomes.includes('track PageView'), 'pixel sem configuração automática (não lê botão nem campo), iniciado e com PageView');
    const eventos = nomes.filter(n => !/^(set|init) /.test(n) && n !== 'track PageView');
    ok(JSON.stringify(eventos) === JSON.stringify(['track Lead', 'trackCustom QuizCompleto', 'trackCustom CtaClick']), 'só os eventos mapeados: ' + eventos.join(', '));
    const texto = JSON.stringify(chamadas);
    const comParametro = chamadas.filter(a => /^track/.test(a[0]) && a.length > 2);
    ok(!/tier|total|pontua|Diego|55554444/.test(texto) && !comParametro.length, 'nenhum evento leva parâmetro: nem tier, nem pontuação, nem nome ou telefone' + (comParametro.length ? ' (' + JSON.stringify(comParametro) + ')' : ''));
    ok(p && p.rastreio.fbclid === 'FB123' && p.rastreio.gclid === 'GC456' && typeof p.tecnico.sessaoId === 'string', 'aceitou: fbclid, gclid e sessaoId vão no payload (adulto com aceite)');
    await c.fecha();
  }

  /* adulto sem ID configurado: nenhuma folha */
  {
    const { c, q, terceiros } = await abre({ pixel: { meta: '', utmify: '', menores: 'nenhum' } });
    await q.abre(s.url + '/');
    await q.posicao('LD'); await q.idade('18_21');
    await q.esperaTela('peneiras');
    await espera(1200);
    ok(!(await temFolha(c)) && terceiros().length === 0, 'adulto sem ID de pixel: nenhuma folha e nenhum pedido a terceiro');
    await c.fecha();
  }
} catch (e) {
  ok(false, 'erro: ' + e.message);
} finally {
  for (const c of abertos) await c.fecha().catch(() => {});
  await s.fecha();
  fim();
}
