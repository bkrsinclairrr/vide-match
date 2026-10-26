// Pontuação e tier (config/pontuacao.json com js/dados/pontuacao.js, o mesmo módulo que a página usa). Teste em tabela: os limites
// 44, 45, 69 e 70; nenhuma resposta da T12 (a chance) força o C, porque ela não fala de dinheiro; "ainda não sei" e "quero entender"
// com 70 ou mais ficam B; "hobby" com a tela opcional ligada e desligada; a soma máxima (100, e 94 com o áudio desligado); e a regra de
// lei: mudar só a idade não muda nada.
// Uso: node testes/teste-pontuacao.mjs
import { verificador } from './_cdp.mjs';
import { contratos } from './_util.mjs';
import { pontua } from '../../public/quiz/js/dados/pontuacao.js';

const { ok, fim } = verificador('Pontuação');
const { pontuacao: regras, geral } = contratos();
const cfg = Object.assign({}, geral, { audio: { ativo: true }, telasOpcionais: {} });
const P = (r, c = cfg) => pontua(r, regras, c);

// todas as combinações de resposta que o fluxo deixa existir (sem compromisso no "ainda não sei"; "quero" e "receio" valem o compromisso no toque)
const PENEIRAS = [['0', null, null], ['1_2', '0', 'nada'], ['1_2', '1_2', 'ate_500'], ['3_5', '3_5', '500_2000'], ['6_mais', '0', 'mais_2000'], ['6_mais', '6_mais', '500_2000']];
const combinacoes = [];
for (const quer of ['sim', 'receio', 'nao_sei']) for (const compromisso of [true, false]) for (const chance of ['pronto', 'familia', 'entender', 'nao_sei'])
  for (const video of ['jogos', 'lances', 'nada']) for (const [peneiras, dispensas, gasto] of PENEIRAS) for (const estado of ['ate_o_fim', 'mais_da_metade', 'menos', 'nao_tocou', 'erro']) {
    if (quer === 'nao_sei' && compromisso) continue;
    if (quer !== 'nao_sei' && !compromisso) continue; // o toque em "quero" ou "receio" já vale o compromisso
    combinacoes.push({ quer, compromisso, chance, video, peneiras, dispensas, gasto, audio: { estado, pct: 0 } });
  }
const acha = (cond) => combinacoes.find(r => cond(r, P(r)));
const regraA = r => ['pronto', 'familia'].includes(r.chance) && r.quer !== 'nao_sei';

// os limites
const c69 = acha((r, p) => p.total === 69 && regraA(r));
const c70 = acha((r, p) => p.total === 70 && regraA(r));
const c44 = acha((r, p) => p.total === 44);
const c45 = acha((r, p) => p.total === 45);
ok(c69 && P(c69).tier === 'B', '69 pontos com chance e vontade de tier A fica B (' + (c69 ? JSON.stringify(P(c69).porRegra) : 'combinação não existe') + ')');
ok(c70 && P(c70).tier === 'A', '70 pontos com "estou pronto" ou "quero a família junto" e sem "ainda não sei" vira A');
ok(c44 && P(c44).tier === 'C', '44 pontos fica C');
ok(c45 && P(c45).tier === 'B', '45 pontos fica B');

// a T12 não força o C: "ainda não sei" com pontos de sobra fica B
const naoSeiChance = combinacoes.filter(r => r.chance === 'nao_sei').sort((a, b) => P(b).total - P(a).total)[0];
ok(P(naoSeiChance).tier === 'B' && P(naoSeiChance).total >= 45, `"ainda não sei" na T12 com ${P(naoSeiChance).total} pontos fica B (a T12 não fala de dinheiro e não força o C)`);
// "quero entender" com 70 ou mais é B
const entender = acha((r, p) => r.chance === 'entender' && p.total >= 70);
ok(entender && P(entender).tier === 'B', `"quero entender como funciona" com ${entender ? P(entender).total : '?'} pontos fica B`);
// "ainda não sei" na T11 com 70 ou mais: no fluxo não chega a 70 (não vale compromisso); a regra vale assim mesmo
const naoSeiMax = Math.max(...combinacoes.filter(r => r.quer === 'nao_sei').map(r => P(r).total));
ok(naoSeiMax < 70, `"ainda não sei" na T11 chega no máximo a ${naoSeiMax} pontos no fluxo (menos de 70)`);
const naoSeiForcado = { quer: 'nao_sei', compromisso: true, chance: 'pronto', video: 'jogos', peneiras: '6_mais', dispensas: '6_mais', gasto: 'mais_2000', audio: { estado: 'ate_o_fim' } };
ok(P(naoSeiForcado).total >= 70 && P(naoSeiForcado).tier === 'B', `"ainda não sei" na T11 forçado a ${P(naoSeiForcado).total} pontos fica B, nunca A`);

// "hobby": só com a tela opcional ligada
const alto = { quer: 'sim', compromisso: true, chance: 'pronto', video: 'jogos', peneiras: '6_mais', dispensas: '6_mais', gasto: 'mais_2000', audio: { estado: 'ate_o_fim' }, objetivo: 'hobby' };
ok(P(alto, Object.assign({}, cfg, { telasOpcionais: { objetivo: true } })).tier === 'C', '"hobby" com a tela de objetivo ligada fica C');
ok(P(alto).tier === 'A', '"hobby" com a tela desligada não conta (o atleta nem viu a pergunta)');

// a soma máxima
ok(P(alto).total === 100 && P(alto).maximo === 100, `soma máxima: ${P(alto).total} de ${P(alto).maximo}`);
const semAudio = Object.assign({}, cfg, { audio: { ativo: false } });
ok(P(alto, semAudio).total === 94 && P(alto, semAudio).maximo === 94, `com o áudio desligado: ${P(alto, semAudio).total} de ${P(alto, semAudio).maximo}`);
const maxGeral = Math.max(...combinacoes.map(r => P(r).total));
ok(maxGeral === 100, `nenhuma combinação passa de 100 (a maior dá ${maxGeral})`);

// a regra de lei: a pontuação não lê idade (nem faixa, nem condição de menor)
let iguais = true;
for (const r of combinacoes.filter((_, i) => i % 7 === 0)) {
  const base = P(r);
  for (const idade of ['12_14', '15_17', '18_21', '22_mais', 'menos12', undefined]) {
    const p = P(Object.assign({}, r, { idade }));
    if (p.total !== base.total || p.tier !== base.tier) { iguais = false; break; }
  }
}
ok(iguais, 'mudar só a idade (de 12 a 14 até 22 ou mais) não muda o total nem o tier em ' + Math.ceil(combinacoes.length / 7) + ' combinações');

// as regras do arquivo batem com o briefing
ok(regras.tiers.A.minimo === 70 && regras.tiers.C.abaixoDe === 45 && regras.maximo === 100 && regras.maximoSemAudio === 94, 'limites do arquivo: A a partir de 70, C abaixo de 45, máximo 100 (94 sem áudio)');
fim();
