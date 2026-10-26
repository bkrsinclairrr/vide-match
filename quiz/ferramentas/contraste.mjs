// Contraste de todos os pares de cor do quiz, lidos do css/tokens.css (fonte única), pela fórmula da WCAG 2.2.
// Texto pede 4,5 ou mais; elemento gráfico de interface (borda de controle, anel de foco, barras da onda) pede 3 ou mais.
// Uso: node ferramentas/contraste.mjs   (reescreve docs/contraste.md)
// O teste de acessibilidade importa calcula() e reprova qualquer par abaixo do mínimo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// DEV: a pasta quiz/ (onde fica o docs/contraste.md). RAIZ: public/quiz/ (onde fica o css/tokens.css).
const DEV = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.join(DEV, '..', 'public', 'quiz');

export function tokens() {
  const css = fs.readFileSync(path.join(RAIZ, 'css', 'tokens.css'), 'utf8');
  const t = {};
  for (const m of css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) t[m[1]] = m[2].toUpperCase();
  return t;
}

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
// cor com transparência pintada sobre um fundo: o resultado que o olho vê
const sobre = (hex, alfa, fundo) => '#' + rgb(hex).map((c, i) => Math.round(c * alfa + rgb(fundo)[i] * (1 - alfa)).toString(16).padStart(2, '0')).join('').toUpperCase();
const lum = hex => {
  const [r, g, b] = rgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// os pares que existem na tela: [onde aparece, cor do texto ou do traço, fundo, tipo]
export function pares() {
  const T = tokens();
  const P = [
    ['Texto principal no fundo', T.text, T.bg, 'texto'],
    ['Texto principal no cartão', T.text, T.card, 'texto'],
    ['Texto principal no cartão marcado', T.text, T['card-2'], 'texto'],
    ['Texto de apoio no fundo', T['text-2'], T.bg, 'texto'],
    ['Texto de apoio no cartão', T['text-2'], T.card, 'texto'],
    ['Nota pequena (muted) no fundo', T.muted, T.bg, 'texto'],
    ['Nota pequena (muted) no cartão', T.muted, T.card, 'texto'],
    ['Nota pequena (muted) no cartão marcado', T.muted, T['card-2'], 'texto'],
    ['Dourado (ênfase, rótulos) no fundo', T.gold, T.bg, 'texto'],
    ['Dourado no cartão', T.gold, T.card, 'texto'],
    ['Dourado claro (links, chips) no fundo', T['gold-soft'], T.bg, 'texto'],
    ['Dourado claro no cartão', T['gold-soft'], T.card, 'texto'],
    ['Texto do botão dourado (início do degradê)', T['gold-ink'], T['gold-2'], 'texto'],
    ['Texto do botão dourado (fim do degradê)', T['gold-ink'], T.gold, 'texto'],
    ['Verde do Zyron no fundo', T.ai, T.bg, 'texto'],
    ['Verde do Zyron no cartão', T.ai, T.card, 'texto'],
    ['Laranja do olhômetro no fundo', T.enemy, T.bg, 'texto'],
    ['Laranja claro no fundo', T['enemy-soft'], T.bg, 'texto'],
    ['Erro de formulário no fundo', T.danger, T.bg, 'texto'],
    ['Erro de formulário no cartão', T.danger, T.card, 'texto'],
    ['Texto da bolha de voz', '#E9EDEF', T['bolha-in'], 'texto'],
    ['Tempo e rótulos da bolha de voz', '#8FA3AD', T['bolha-in'], 'texto'],
    ['Nome do remetente na conversa', T.text, T['chat-bg'], 'texto'],
    ['Recorte: texto no papel', T['papel-tinta'], T.papel, 'texto'],
    ['Recorte: veículo, data e assinatura no papel', T['papel-2'], T.papel, 'texto'],
    ['Espelho (texto de apoio sobre o dourado a 6%)', T['text-2'], sobre(T.gold, 0.06, T.bg), 'texto'],
    ['Chip do capítulo (dourado claro sobre dourado a 7%)', T['gold-soft'], sobre(T.gold, 0.07, T.bg), 'texto'],
    ['Opção marcada (texto sobre dourado a 8%)', '#FFFFFF', sobre(T.gold, 0.08, T.card), 'texto'],
    ['Borda da opção marcada', T.gold, T.card, 'grafico'],
    ['Anel de foco (dourado claro) no fundo', T['gold-soft'], T.bg, 'grafico'],
    ['Anel de foco no cartão', T['gold-soft'], T.card, 'grafico'],
    ['Barra da onda ainda não tocada', T['onda-off'], T['bolha-in'], 'grafico'],
    ['Barra da onda já tocada', T.gold, T['bolha-in'], 'grafico'],
    ['Caixa de marcar (borda) no cartão', T.traco, T.card, 'grafico'],
    ['Círculo vazio da opção no cartão', T.traco, T.card, 'grafico']
  ];
  return P.map(([onde, cor, fundo, tipo]) => ({ onde, cor, fundo, tipo, razao: razao(cor, fundo), minimo: tipo === 'texto' ? 4.5 : 3 }));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const P = pares();
  const linhas = P.map(p => `| ${p.onde} | \`${p.cor}\` | \`${p.fundo}\` | ${p.razao.toFixed(2).replace('.', ',')} | ${String(p.minimo).replace('.', ',')} | ${p.razao >= p.minimo ? 'passa' : '**não passa**'} |`);
  const md = `# Contraste das cores do quiz

Gerado por \`node ferramentas/contraste.mjs\` a partir de \`css/tokens.css\` (fórmula da WCAG 2.2). Texto pede 4,5 ou mais; traço de
interface (borda de controle, anel de foco, barras da onda) pede 3 ou mais. Cor com transparência entra já pintada sobre o fundo
onde aparece. O teste \`testes/teste-acessibilidade.mjs\` reprova qualquer par abaixo do mínimo.

| Onde aparece | Cor | Fundo | Razão | Mínimo | Resultado |
| --- | --- | --- | --- | --- | --- |
${linhas.join('\n')}

${P.every(p => p.razao >= p.minimo) ? `Os ${P.length} pares passam.` : `Atenção: ${P.filter(p => p.razao < p.minimo).length} par(es) abaixo do mínimo.`}
`;
  fs.mkdirSync(path.join(DEV, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(DEV, 'docs', 'contraste.md'), md);
  console.log(md.split('\n').slice(-3).join('\n').trim());
  P.filter(p => p.razao < p.minimo).forEach(p => console.log('abaixo:', p.onde, p.razao.toFixed(2)));
}
