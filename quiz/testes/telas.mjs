// Capturas de todas as telas do caminho 1 numa largura (pra olhar a tela; a matriz completa de aparelhos é o teste-aparelhos.mjs).
// Uso: node testes/telas.mjs [largura] [altura] [pasta]   (padrão 390 844 capturas/390)
// Cada tela sai como o aparelho mostra (NN-id.png) e, se não couber, rolada até o fim (NN-id-fim.png).
import fs from 'node:fs';
import path from 'node:path';
import { sobe, DEV } from './servidor.mjs';
import { abreChrome, espera } from './_cdp.mjs';
import { quiz } from './_quiz.mjs';
import { percorre } from './_percurso.mjs';

const largura = parseInt(process.argv[2] || '390', 10), altura = parseInt(process.argv[3] || '844', 10);
const pasta = path.resolve(process.argv[4] || path.join(DEV, 'capturas', String(largura)));
fs.mkdirSync(pasta, { recursive: true });
const s = await sobe();
const movel = largura < 700;
const c = await abreChrome({ largura, altura, movel });
const q = quiz(movel ? c : Object.assign({}, c, { toca: (sel, op) => c.clica(sel, op) }));
let n = 0;
try {
  await percorre({ c, q, url: s.url + '/', aoTela: async (id, { fim, pausa }) => {
    await espera(pausa);
    const nome = String(++n).padStart(2, '0') + '-' + id;
    await c.foto(path.join(pasta, nome + '.png'));
    const rolou = fim && await c.fotoFim(path.join(pasta, nome + '-fim.png'));
    console.log('foto', nome + (rolou ? ' (e rolada)' : ''));
  } });
  console.log(c.console_.length ? c.console_.join('\n') : 'sem erros no console');
} catch (e) {
  console.error('FALHA', e.message);
  await c.foto(path.join(pasta, 'erro.png')).catch(() => {});
  console.log(c.console_.join('\n'));
  process.exitCode = 1;
} finally { await c.fecha(); await s.fecha(); }
