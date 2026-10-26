// A posição que o lead toca no campo da T01 decide o atleta da conversa da T07 ("Como funciona na prática"), nas 11 posições do
// quiz: o toque de verdade grava o id, a T07 abre com o atleta certo ("um zagueiro como você"), o cartão mostra a posição marcada, a
// segunda mensagem diz o que o clube procura nela e o fecho chama pelo primeiro nome do atleta. Nenhuma posição fica sem conversa.
// Uso: node testes/teste-posicoes.mjs
import { sobe } from './servidor.mjs';
import { abreChrome, verificador } from './_cdp.mjs';
import { quiz, scriptTeste, estadoSalvo, respostasAte } from './_quiz.mjs';
import { contratos } from './_util.mjs';

const { ok, fim } = verificador('Posição marcada e conversa da T07');
const { copy, provas } = contratos();
const casos = provas.itens.filter(p => /^caso-/.test(p.id));
const POSICOES = Object.keys(copy.posicao.abreviacoes);
// o nome que o cartão mostra: o do campo da T01 (mapa-calor.js; a copy chama o centroavante de atacante)
const NOME = { GOL: 'Goleiro', LD: 'Lateral direito', LE: 'Lateral esquerdo', 'ZAG-d': 'Zagueiro (lado direito)', 'ZAG-e': 'Zagueiro (lado esquerdo)', 'VOL-d': 'Volante (lado direito)', 'VOL-e': 'Volante (lado esquerdo)', MC: 'Meia central', ALE: 'Ponta esquerda', ADD: 'Ponta direita', CA: 'Atacante' };
const QUEM = { GOL: 'um goleiro', LD: 'um lateral direito', LE: 'um lateral esquerdo', 'ZAG-d': 'um zagueiro', 'ZAG-e': 'um zagueiro', 'VOL-d': 'um volante', 'VOL-e': 'um volante', MC: 'um meia central', ALE: 'um ponta esquerda', ADD: 'um ponta direita', CA: 'um atacante' };

const s = await sobe();
const abertos = [];
try {
  for (const id of POSICOES) {
    const esperado = casos.find(c => c.posicoes.includes(id));
    const c = await abreChrome({ antes: scriptTeste({}) });
    abertos.push(c);
    const q = quiz(c);
    await q.abre(s.url + '/');
    await q.posicao(id);                                   // o toque de verdade no campo
    await q.esperaTela('idade');
    const gravada = await c.avalia(`JSON.parse(localStorage.getItem('qz:estado') || '{}').respostas?.posicao`);
    // o resto do caminho entra pelo estado salvo (o que o toque gravou fica; o que importa aqui é a T07 lendo a posição dele)
    const estado = estadoSalvo(respostasAte('mundo', { posicao: gravada }), 'mundo');
    await c.avalia(`localStorage.setItem('qz:estado', ${JSON.stringify(JSON.stringify(estado))}); true`);
    await c.vai(s.url + '/?t07=' + id + '#/mundo');
    await q.esperaTela('mundo', 15000);
    await c.ate(`!!document.querySelector('.pratica-abertura')`, 8000);
    const v = await c.avalia(`({
      abertura: document.querySelector('.pratica-abertura')?.textContent || '',
      cartao: document.querySelector('.pratica-posicao')?.textContent || '',
      conta: document.querySelector('.chat-nome')?.textContent || '',
      fecho: document.querySelector('.pratica-fecho')?.textContent || ''
    })`);
    ok(gravada === id, `${id}: o toque no campo grava a posição "${id}" (gravou "${gravada}")`);
    ok(!!esperado && v.abertura.includes(esperado.nome) && v.abertura.includes(`${QUEM[id]} como você`), `${id}: a conversa é do ${esperado && esperado.nome} ("${v.abertura}")`);
    ok(v.cartao === NOME[id], `${id}: o cartão do atleta mostra a posição marcada ("${v.cartao}")`);
    ok(v.conta === 'Estrategista Esportivo - Fernando', `${id}: a conta do chat é "${v.conta}"`);
    // a segunda mensagem chega depois de ~3,5 s (digitando); espera a primeira e a segunda
    await c.ate(`document.querySelectorAll('.chat-msg').length >= 2`, 12000, 200);
    const msg2 = await c.avalia(`document.querySelectorAll('.chat-msg')[1]?.textContent || ''`);
    ok(msg2.includes(copy.mundo.pratica.procura[id]) && msg2.includes(QUEM[id]), `${id}: a segunda mensagem fala do que o clube procura na posição (${copy.mundo.pratica.procura[id]})`);
    await c.fecha();
  }
} finally {
  for (const c of abertos) { try { await c.fecha(); } catch { /* já fechado */ } }
  await s.fecha();
}
fim();
