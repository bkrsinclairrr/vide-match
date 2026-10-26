// A suíte inteira, um teste por vez (um Chrome de cada vez: em paralelo cai com "Inspected target navigated or closed").
// Uso: node testes/roda-tudo.mjs                      (os testes locais)
//      node testes/roda-tudo.mjs --fontes             (mais os links das provas; precisa de internet)
//      node testes/roda-tudo.mjs --publicacao <url>   (mais a prévia no ar)
// Termina com "Suíte: n de n verificações" e sai com código diferente de zero se algum teste falhou.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const testes = ['teste-pontuacao', 'teste-mensagem', 'teste-casos', 'teste-quer', 'teste-posicoes', 'teste-dados', 'teste-regras-da-casa', 'teste-caminhos', 'teste-acessibilidade', 'teste-audio',
  'teste-consentimento', 'teste-desempenho', 'teste-aparelhos'].map(n => [n, []]);
if (args.includes('--fontes')) testes.push(['teste-fontes', []]);
const i = args.indexOf('--publicacao');
if (i >= 0 && args[i + 1]) testes.push(['teste-publicacao', [args[i + 1]]]);

const roda = (nome, extra) => new Promise(ok => {
  const t0 = Date.now();
  const p = spawn(process.execPath, [path.join(AQUI, nome + '.mjs'), ...extra], { stdio: ['ignore', 'pipe', 'pipe'] });
  let saida = '';
  p.stdout.on('data', d => { saida += d; process.stdout.write(d); });
  p.stderr.on('data', d => { saida += d; process.stderr.write(d); });
  p.on('close', codigo => {
    const m = /(\d+) de (\d+) verificações passaram/.exec(saida);
    ok({ nome, codigo, passou: m ? +m[1] : 0, total: m ? +m[2] : 0, seg: Math.round((Date.now() - t0) / 1000), falhas: saida.split('\n').filter(l => l.startsWith('FALHA')) });
  });
});

const res = [];
for (const [nome, extra] of testes) {
  console.log(`\n=== ${nome} ===`);
  res.push(await roda(nome, extra));
}
console.log('\n=== resumo ===');
for (const r of res) console.log(`${r.codigo === 0 ? 'ok   ' : 'FALHA'} ${r.nome}: ${r.passou} de ${r.total} (${r.seg} s)` + (r.codigo !== 0 && r.falhas.length ? '\n        ' + r.falhas.slice(0, 3).join('\n        ') : ''));
const passou = res.reduce((t, r) => t + r.passou, 0), total = res.reduce((t, r) => t + r.total, 0);
console.log(`\nSuíte: ${passou} de ${total} verificações em ${res.length} testes${res.every(r => r.codigo === 0) ? '' : ' (com falha)'}.`);
process.exitCode = res.every(r => r.codigo === 0) ? 0 : 1;
