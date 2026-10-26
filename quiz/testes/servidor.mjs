// Servidor estático de teste do quiz (127.0.0.1), servindo public/quiz/, com Range (o áudio), os tipos certos e um coletor de leads em /__coleta
// que imita o destino do webhook: guarda cada corpo recebido e pode falhar ou atrasar de propósito (s.coleta.falhar, s.coleta.atraso).
// Com h2: true, fala HTTP/2 com TLS (como a Vercel serve), num certificado descartável gerado na hora pelo openssl, válido por um dia,
// só pra 127.0.0.1; o Chrome do teste abre com --ignore-certificate-errors. Sem openssl, cai pro HTTP/1.1 e avisa.
// Uso em teste:  const s = await sobe(); ... s.url ... await s.fecha();
// Linha de comando:  node testes/servidor.mjs [--porta 4400]
import http from 'node:http';
import http2 from 'node:http2';
import zlib from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
// DEV: a pasta quiz/ (docs, testes, ferramentas e capturas, nada disso vai ao ar). REPO: a raiz do vide-match.
// RAIZ: o que vai ao ar, public/quiz/ (index.html, css, js, config e assets): é o que o servidor serve e o que os testes conferem.
export const DEV = path.resolve(AQUI, '..');
export const REPO = path.resolve(DEV, '..');
export const RAIZ = path.join(REPO, 'public', 'quiz');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon'
};

// um certificado descartável pra 127.0.0.1 (só pro teste de HTTP/2): devolve { key, cert, pasta } ou null sem openssl
function certificado() {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'qz-tls-'));
  const chave = path.join(pasta, 'chave.pem'), cert = path.join(pasta, 'cert.pem');
  const bins = [process.env.OPENSSL, 'openssl', 'C:/Program Files/Git/mingw64/bin/openssl.exe', 'C:/Program Files/Git/usr/bin/openssl.exe'].filter(Boolean);
  for (const b of bins) {
    try {
      execFileSync(b, ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes', '-keyout', chave, '-out', cert, '-days', '1',
        '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' });
      return { key: fs.readFileSync(chave), cert: fs.readFileSync(cert), pasta };
    } catch { /* tenta o próximo */ }
  }
  fs.rmSync(pasta, { recursive: true, force: true });
  return null;
}

export async function sobe({ porta = 0, raiz = RAIZ, h2 = false } = {}) {
  const coleta = { corpos: [], falhar: false, atraso: 0, tipos: [] };
  const tls = h2 ? certificado() : null;
  if (h2 && !tls) console.log('AVISO sem openssl: o servidor de teste fica em HTTP/1.1');
  const atende = async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/__coleta') {
      const pedacos = [];
      for await (const p of req) pedacos.push(p);
      const texto = Buffer.concat(pedacos).toString('utf8');
      if (coleta.atraso) await new Promise(r => setTimeout(r, coleta.atraso));
      if (req.method === 'POST') {
        coleta.tipos.push(req.headers['content-type'] || '');
        if (coleta.falhar) { req.socket.destroy(); return; }
        try { coleta.corpos.push(JSON.parse(texto)); } catch { coleta.corpos.push({ invalido: texto }); }
      }
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      return res.end('ok');
    }
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const arq = path.join(raiz, p);
    if (!arq.startsWith(raiz)) { res.writeHead(403); return res.end(); }
    let st;
    try { st = fs.statSync(arq); } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
    if (st.isDirectory()) { res.writeHead(404); return res.end(); }
    const tipo = MIME[path.extname(arq).toLowerCase()] || 'application/octet-stream';
    res.setHeader('Content-Type', tipo);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let ini = m && m[1] ? parseInt(m[1], 10) : 0;
      let fim = m && m[2] ? parseInt(m[2], 10) : st.size - 1;
      if (ini >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      fim = Math.min(fim, st.size - 1);
      res.writeHead(206, { 'Content-Range': `bytes ${ini}-${fim}/${st.size}`, 'Content-Length': fim - ini + 1 });
      return fs.createReadStream(arq, { start: ini, end: fim }).pipe(res);
    }
    // texto vai com gzip quando o navegador aceita (como na Vercel); áudio, imagem e fonte já vêm comprimidos
    if (/^(text\/|application\/json|image\/svg)/.test(tipo) && /(^|[ ,])gzip([ ,;]|$)/.test(req.headers['accept-encoding'] || '')) {
      const corpo = zlib.gzipSync(fs.readFileSync(arq), { level: 6 });
      res.writeHead(200, { 'Content-Encoding': 'gzip', 'Content-Length': corpo.length, Vary: 'Accept-Encoding' });
      return res.end(req.method === 'HEAD' ? undefined : corpo);
    }
    res.writeHead(200, { 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(arq).pipe(res);
  };
  const srv = tls ? http2.createSecureServer({ key: tls.key, cert: tls.cert, allowHTTP1: true }, atende) : http.createServer(atende);
  await new Promise((ok, erro) => { srv.once('error', erro); srv.listen(porta, '127.0.0.1', ok); });
  const url = `${tls ? 'https' : 'http'}://127.0.0.1:${srv.address().port}`;
  const fecha = () => new Promise(r => { srv.close(() => { if (tls) fs.rmSync(tls.pasta, { recursive: true, force: true }); r(); }); if (srv.closeAllConnections) srv.closeAllConnections(); });
  return { url, coleta, h2: !!tls, fecha };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const i = process.argv.indexOf('--porta');
  const s = await sobe({ porta: i > 0 ? parseInt(process.argv[i + 1], 10) : 4400 });
  console.log('quiz em ' + s.url + '  (coletor em ' + s.url + '/__coleta)');
}
