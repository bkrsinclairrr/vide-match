// Publicação: o quiz no ar dentro do site (aizyron.com/quiz/), numa PRÉVIA da Vercel ou em produção. Recebe o endereço do SITE, sem o /quiz.
// Confere: /quiz volta pra /quiz/ (a barra final é obrigatória: os caminhos do quiz são relativos); /quiz/ responde 200 com X-Robots-Tag
// noindex; o MP3 com Content-Type audio/mpeg e Accept-Ranges bytes (pedido parcial 206); cada arquivo de public/quiz publicado idêntico ao
// local (sha256, ignorando a quebra de linha do checkout do Windows); e capturas da T01 e da T14 tiradas do endereço publicado (em modo de
// ensaio: sem endpoint, nada sai).
// Prévia com a proteção da Vercel ligada (pede login): as conferências de HTTP passam pela CLI logada (`vercel curl`, que faz o bypass
// sem ninguém ler token), e as capturas no ar ficam como aviso: com os arquivos idênticos, a tela é a das capturas locais.
// Uso: node quiz/testes/teste-publicacao.mjs https://vide-match-xxxx-ls-projects-d9965387.vercel.app
//      node quiz/testes/teste-publicacao.mjs https://aizyron.com
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, caminhoCompleto } from './_quiz.mjs';
import { arquivos, RAIZ, DEV, REPO } from './_util.mjs';

const { ok, fim } = verificador('Publicação');
const site = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https:\/\/([\w-]+\.)+[a-z]{2,}$/.test(site)) { console.log('Uso: node quiz/testes/teste-publicacao.mjs https://<endereço do site, sem /quiz>'); process.exit(2); }
const QUIZ = '/quiz';
const TEXTO = /\.(html|js|mjs|css|json|svg|txt|md)$/i;
// o checkout do Windows converte LF em CRLF; a Vercel clona do GitHub, com LF. Texto é comparado sem essa diferença.
const sha = (b, rel = '') => crypto.createHash('sha256').update(TEXTO.test(rel) ? Buffer.from(b.toString('latin1').replace(/\r\n/g, '\n'), 'latin1') : b).digest('hex');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qz-pub-'));

// pedido direto (prévia aberta) ou pela CLI (prévia protegida): { status, cab (minúsculas), corpo (Buffer) }
async function direto(caminho, { range } = {}) {
  const r = await fetch(site + caminho, { redirect: 'manual', headers: range ? { Range: range } : {} });
  const cab = {}; r.headers.forEach((v, k) => { cab[k] = v; });
  return { status: r.status, cab, corpo: Buffer.from(await r.arrayBuffer()) };
}
// a CLI roda na raiz do vide-match (onde está o .vercel do projeto)
function pelaCli(caminho, { range } = {}) {
  const corpoArq = path.join(tmp, 'corpo'), cabArq = path.join(tmp, 'cab');
  [corpoArq, cabArq].forEach(f => fs.rmSync(f, { force: true }));
  const extra = ['--silent', '--output', corpoArq, '--dump-header', cabArq].concat(range ? ['--range', range.replace(/^bytes=/, '')] : []);
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', 'vercel', 'curl', caminho || '/', '--deployment', site, '--', ...extra],
    { cwd: REPO, stdio: 'ignore', shell: process.platform === 'win32', timeout: 120000, env: Object.assign({}, process.env, { MSYS_NO_PATHCONV: '1' }) });
  const linhas = fs.existsSync(cabArq) ? fs.readFileSync(cabArq, 'utf8').split(/\r?\n/) : [];
  const ultimoStatus = linhas.map((l, i) => [l, i]).filter(([l]) => /^HTTP\//.test(l)).pop();
  const cab = {};
  let status = 0;
  if (ultimoStatus) {
    status = parseInt(ultimoStatus[0].split(' ')[1], 10);
    for (const l of linhas.slice(ultimoStatus[1] + 1)) { const m = /^([^:]+):\s*(.*)$/.exec(l); if (m) cab[m[1].toLowerCase()] = cab[m[1].toLowerCase()] ? cab[m[1].toLowerCase()] + ', ' + m[2] : m[2]; }
  }
  return { status, cab, corpo: fs.existsSync(corpoArq) ? fs.readFileSync(corpoArq) : Buffer.alloc(0) };
}

try {
  const primeiro = await direto(QUIZ + '/');
  const protegida = primeiro.status === 401 || primeiro.status === 403 || (primeiro.status >= 300 && primeiro.status < 400 && /vercel\.com\/(sso|login)/.test(primeiro.cab.location || ''));
  if (protegida) console.log('AVISO a prévia exige login da Vercel (proteção de implantação): as conferências passam pela CLI logada (vercel curl)');
  const pede = protegida ? async (c, op) => pelaCli(c, op) : direto;

  const sem = await pede(QUIZ);
  ok(sem.status >= 300 && sem.status < 400 && /\/quiz\/$/.test(sem.cab.location || ''), `/quiz sem a barra final redireciona pra /quiz/ (${sem.status}, ${sem.cab.location})`);
  const r = await pede(QUIZ + '/');
  ok(r.status === 200 && /<title>Diagn/.test(r.corpo.toString('utf8')), `/quiz/ responde ${r.status} com a página do quiz`);
  ok(/noindex/.test(r.cab['x-robots-tag'] || ''), `X-Robots-Tag: ${r.cab['x-robots-tag']}`);
  ok(/frame-ancestors 'none'/.test(r.cab['content-security-policy'] || ''), 'a política de segurança de conteúdo do site está no ar');

  const mp3 = await pede(QUIZ + '/assets/audio/depoimento-mae-64k.mp3', { range: 'bytes=0-1023' });
  ok(mp3.status === 206 && /^audio\/mpeg/.test(mp3.cab['content-type'] || '') && /bytes/.test(mp3.cab['accept-ranges'] || ''), `MP3: ${mp3.status}, ${mp3.cab['content-type']}, Accept-Ranges ${mp3.cab['accept-ranges']}`);

  // cada arquivo de public/quiz publicado igual ao local
  // em toda PRÉVIA a Vercel injeta no fim do index.html o script da barra de comentários dela (vercel.live); em produção não existe.
  // Só essa linha sai antes de comparar, e o teste avisa que ela estava lá
  const injetada = /<script[^>]*src="https:\/\/vercel\.live\/[^"]*"[^>]*><\/script>/;
  const locais = arquivos(RAIZ).map(f => path.relative(RAIZ, f).split(path.sep).join('/'));
  const diferentes = [];
  let barraDaVercel = false;
  for (const rel of locais) {
    const resp = await pede(QUIZ + '/' + (rel === 'index.html' ? '' : rel));
    let corpo = resp.corpo;
    if (rel === 'index.html' && injetada.test(corpo.toString('utf8'))) { barraDaVercel = true; corpo = Buffer.from(corpo.toString('utf8').replace(injetada, '')); }
    if (resp.status !== 200 || sha(corpo, rel) !== sha(fs.readFileSync(path.join(RAIZ, rel)), rel)) diferentes.push(`${rel} (${resp.status})`);
  }
  if (barraDaVercel) console.log('AVISO a prévia traz o script da barra de comentários da Vercel (vercel.live), que ela injeta só em prévia');
  ok(!diferentes.length, `${locais.length} arquivos publicados idênticos aos locais` + (diferentes.length ? ': diferem ' + diferentes.slice(0, 6).join(', ') : ''));

  // T01 e T14 tiradas do endereço publicado (só com o site aberto: o Chrome do teste não passa pelo login da Vercel)
  // trava: com endpoint ou pixel ligados, a captura percorreria o quiz inteiro e mandaria um lead de teste (e eventos) pro destino de verdade
  let ligado = false;
  try { const g = JSON.parse((await pede(QUIZ + '/config/geral.json')).corpo.toString('utf8')); ligado = !!(g.endpoint || g.endpointEventos || (g.pixel && (g.pixel.meta || g.pixel.utmify))); } catch { /* sem o JSON, as conferências acima já falharam */ }
  if (protegida) {
    console.log('AVISO capturas da T01 e da T14 no ar não tiradas: a prévia pede login. Com os arquivos idênticos, as telas são as de capturas/390/');
  } else if (ligado) {
    console.log('AVISO capturas no ar puladas: o quiz publicado tem endpoint ou pixel ligado, e a captura percorre o quiz inteiro (mandaria um lead de teste pro destino de verdade)');
  } else {
    const pasta = path.join(DEV, 'capturas', 'publicado');
    fs.mkdirSync(pasta, { recursive: true });
    const c = await abreChrome();
    try {
      const q = quiz(c);
      await q.abre(site + QUIZ + '/');
      await espera(1200);
      await c.foto(path.join(pasta, '01-posicao.png'));
      await caminhoCompleto(q, { contato: { nome: 'Teste', zap: '11955554444' } });
      await espera(1200);
      await c.foto(path.join(pasta, '14-resultado.png'));
      const fora = c.pedidos.filter(p => !p.url.startsWith(site) && !p.url.startsWith('data:'));
      ok(true, 'capturas da T01 e da T14 tiradas do endereço publicado (quiz/capturas/publicado/)');
      ok(!fora.length, 'no ar, sem pixel configurado: nenhum pedido a terceiro' + (fora.length ? ': ' + fora.map(p => p.url).slice(0, 3).join(', ') : ''));
      ok(!c.pedidos.some(p => p.metodo === 'POST'), 'sem endpoint configurado, o lead fica em modo de ensaio (nenhum POST)');
      ok(!c.console_.length, 'sem erro no console no ar' + (c.console_.length ? ': ' + c.console_.slice(0, 2).join(' | ') : ''));
    } finally { await c.fecha(); }
  }
} catch (e) {
  ok(false, 'erro: ' + e.message);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
  fim();
}
