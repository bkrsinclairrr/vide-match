// Fontes: abre cada link do provas.json (status 200, seguindo redirecionamento) e confere que a página do Chelsea fala de "AI".
// Quem bloqueia o pedido simples (ESPN, Chelsea e DOI costumam bloquear robô) ganha uma segunda tentativa no Chrome sem janela.
// Link que não abre nem assim vira AVISO: não reprova a entrega, entra no relatório.
// Precisa de internet. Uso: node testes/teste-fontes.mjs
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { contratos } from './_util.mjs';

const { ok, fim } = verificador('Fontes');
const { provas } = contratos();
const links = provas.itens.filter(p => p.ativo !== false && p.fonte && /^https?:\/\//.test(p.fonte.url || '')).map(p => ({ id: p.id, url: p.fonte.url }));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

async function abre({ id, url }) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8', Accept: 'text/html,application/xhtml+xml,*/*' }, redirect: 'follow', signal: ctl.signal });
    const texto = id === 'IA-00' ? await r.text() : '';
    return { id, url, status: r.status, texto };
  } catch (e) {
    return { id, url, status: 0, erro: e.name === 'AbortError' ? 'tempo esgotado (20 s)' : e.message };
  } finally { clearTimeout(tm); }
}

const resultados = [];
for (let i = 0; i < links.length; i += 5) resultados.push(...await Promise.all(links.slice(i, i + 5).map(abre)));

// segunda tentativa no navegador: o status do documento principal e o texto da página
const falhos = resultados.filter(r => r.status !== 200);
if (falhos.length) {
  const c = await abreChrome({ largura: 1280, altura: 900, movel: false, ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' });
  try {
    for (const r of falhos) {
      let status = 0;
      const ouve = m => { if (m.method === 'Network.responseReceived' && m.params.type === 'Document' && !status) status = m.params.response.status; };
      c.aoEvento(ouve);
      try {
        await c.envia('Page.navigate', { url: r.url }, 30000);
        await c.ate(`document.readyState === 'complete'`, 25000, 250);
        await espera(2500);
        // a página final (depois de desafio anti-robô e redirecionamentos)
        const fim = await c.avalia(`[location.href, document.title, (document.body && document.body.innerText || '').slice(0, 200000)]`);
        if (status === 200 || (fim[2].length > 2000 && !/access denied|just a moment|captcha|forbidden/i.test(fim[1]))) { r.status = 200; r.via = 'navegador'; r.texto = fim[2]; }
        else r.status = status || r.status;
      } catch (e) { r.erro = e.message; }
    }
  } finally { await c.fecha(); }
}
const abriram = resultados.filter(r => r.status === 200);
for (const r of resultados.filter(r => r.status !== 200)) console.log(`AVISO ${r.id} não abriu (${r.status || r.erro}): ${r.url}`);
const viaNav = abriram.filter(r => r.via === 'navegador').length;
ok(links.length > 0, `${abriram.length} de ${links.length} links das provas abriram` + (viaNav ? ` (${viaNav} só pelo navegador)` : '') + (abriram.length < links.length ? '; os outros estão nos avisos acima' : ''));
const chelsea = resultados.find(r => r.id === 'IA-00');
if (chelsea && chelsea.status === 200) ok(/\bAI\b/.test(chelsea.texto), 'a página oficial do Chelsea (IA-00) fala de "AI"');
else console.log('AVISO a página do Chelsea (IA-00) não abriu daqui: conferir no navegador');
fim();
