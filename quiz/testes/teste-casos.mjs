// Os casos da T07 ("Como funciona na prática", js/dados/casos.js, o mesmo módulo que a página usa): nenhuma posição que um lead possa
// marcar no quiz fica sem conversa; cada posição lê o atleta que joga nela; só o caso reserva (se algum dia faltar atleta pra uma
// posição) avisa que a conversa é de outro atleta; e a copy da conversa tem o que cada posição procura, o novo nome da conta do
// Fernando e nenhuma sobra de "{campo}".
// Uso: node testes/teste-casos.mjs
import { verificador } from './_cdp.mjs';
import { contratos, confereTexto } from './_util.mjs';
import { casoDaPosicao, primeiroNome } from '../../public/quiz/js/dados/casos.js';

const { ok, fim } = verificador('Casos da T07');
const { copy, provas } = contratos();
const porId = Object.fromEntries(provas.itens.map(p => [p.id, p]));
const p = copy.mundo.pratica;

// as 11 posições que o campo do quiz oferece (mapa-calor.js): as chaves de `abreviacoes` são os mesmos ids
const POSICOES = Object.keys(copy.posicao.abreviacoes);
ok(POSICOES.length === 11, `o quiz oferece 11 posições (${POSICOES.join(', ')})`);

const ESPERADO = {
  GOL: 'Breno Kaio', LD: 'Thiago Lima', LE: 'Bruno Santos', 'ZAG-d': 'Rafael Souza', 'ZAG-e': 'Rafael Souza',
  'VOL-d': 'Matheus Costa', 'VOL-e': 'Matheus Costa', MC: 'Gustavo Silva', ALE: 'Vinícius Carvalho', ADD: 'Diego Ribeiro', CA: 'André Martins'
};
const semConversa = POSICOES.filter(id => !casoDaPosicao(porId, id));
ok(!semConversa.length, 'nenhuma posição fica sem conversa' + (semConversa.length ? ': ' + semConversa.join(', ') : ''));
const errados = POSICOES.filter(id => casoDaPosicao(porId, id)?.caso.nome !== ESPERADO[id]);
ok(!errados.length, 'cada posição lê o atleta dela (' + POSICOES.map(id => `${id}: ${ESPERADO[id].split(' ')[0]}`).join(', ') + ')' + (errados.length ? ' | trocados: ' + errados.join(', ') : ''));
ok(POSICOES.every(id => casoDaPosicao(porId, id)?.mesma === true), 'com as 11 posições cobertas, a abertura sempre diz "como você"');

// o que o quiz marca sem posição reconhecida, ou uma posição que não existe, cai no reserva (ou fica sem bloco, nunca quebra)
ok(casoDaPosicao(porId, null)?.mesma === false && casoDaPosicao(porId, 'XYZ')?.mesma === false, 'sem posição ou com posição desconhecida: o caso reserva, avisando que é a conversa dele');
ok(casoDaPosicao({}, 'LD') === null, 'sem nenhum caso ativo, a T07 não mostra o bloco');
const semReserva = Object.fromEntries(Object.entries(porId).map(([k, v]) => [k, v.reserva ? Object.assign({}, v, { ativo: false }) : v]));
ok(casoDaPosicao(semReserva, 'ZAG-d') === null || casoDaPosicao(semReserva, 'ZAG-d').mesma === false, 'caso desligado não é mais escolhido');

// cada caso tem o que a abertura usa
const casos = provas.itens.filter(x => /^caso-/.test(x.id));
ok(casos.length === 11 && casos.every(c => c.nome && c.quem && c.posicao && c.compatibilidade && c.confirmadoPeloDono === true), 'os 11 casos têm nome, posição, "um fulano" e compatibilidade, declarados pelo dono');
ok(casos.filter(c => c.reserva).length === 1, 'há exatamente um caso reserva');
ok(primeiroNome('Vinícius Carvalho') === 'Vinícius' && primeiroNome('') === '', 'o primeiro nome pro fecho');

// a copy da conversa
ok(POSICOES.every(id => p.procura[id]) && p.procura.padrao, 'cada posição tem o que o clube procura nela');
ok(p.estrategistaNome === 'Estrategista Esportivo - Fernando' && !JSON.stringify(copy).match(/scout/i), 'a conta do Fernando é "Estrategista Esportivo" e a palavra "scout" não aparece na copy');
const PERMITIDAS = new Set(['casoNome', 'casoPrimeiro', 'casoQuem', 'compatibilidade', 'procura', 'quem']);
const usadas = [p.aberturaMesmaPosicao, p.aberturaOutraPosicao, p.fecho, ...p.mensagens.map(m => m.texto)].flatMap(t => [...t.matchAll(/\{(\w+)\}/g)].map(m => m[1]));
const soltas = [...new Set(usadas)].filter(k => !PERMITIDAS.has(k));
ok(!soltas.length, 'só variáveis que a T07 sabe preencher' + (soltas.length ? ': ' + soltas.join(', ') : ''));

// monta a conversa de cada posição com o mesmo preenchimento da tela e confere as regras da casa
const quemDe = id => copy.posicao.quem?.[id] || ({ GOL: 'um goleiro', LD: 'um lateral direito', LE: 'um lateral esquerdo', 'ZAG-d': 'um zagueiro', 'ZAG-e': 'um zagueiro', 'VOL-d': 'um volante', 'VOL-e': 'um volante', MC: 'um meia central', ALE: 'um ponta esquerda', ADD: 'um ponta direita' }[id]);
const preenche = (t, v) => t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
const problemas = [];
for (const id of POSICOES) {
  const { caso } = casoDaPosicao(porId, id);
  const v = { casoNome: caso.nome, casoPrimeiro: primeiroNome(caso.nome), casoQuem: caso.quem, compatibilidade: caso.compatibilidade, procura: p.procura[id], quem: quemDe(id) };
  const textos = [p.aberturaMesmaPosicao, p.fecho, ...p.mensagens.map(m => m.texto)].map(t => preenche(t, v));
  for (const t of textos) {
    if (/\{\w+\}/.test(t)) problemas.push(`${id}: sobrou campo em "${t}"`);
    for (const a of confereTexto(t)) problemas.push(`${id}: ${a}`);
  }
  // a abertura usa a palavra que a pessoa viu ao marcar (o quiz chama o centroavante de "atacante")
  if (!textos[0].includes(caso.nome) || !textos[0].includes(`${v.quem} como você`)) problemas.push(`${id}: a abertura não diz "${v.quem} como você" com ${caso.nome}`);
}
ok(!problemas.length, 'a conversa das 11 posições sai completa e dentro das regras da casa' + (problemas.length ? ': ' + problemas.slice(0, 3).join(' | ') : ''));

fim();
