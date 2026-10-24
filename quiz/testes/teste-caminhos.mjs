// Os 12 caminhos do aceite, ponta a ponta, por toques de verdade (CDP). Cada caminho confere a sequência exata de telas (step_view),
// o payload que chegou ao destino (o coletor do servidor de teste) e, de quebra, varre todo texto que o atleta viu (regras da casa)
// e todos os eventos (nenhum dado de pessoa). O caminho 1 anda devagar: um toque a cada 3 s e o áudio inteiro, em até 4 minutos.
// Os caminhos 13 e 14 são de quem volta pelo link do anúncio com progresso salvo: seguir de onde parou e recomeçar do zero.
// Uso: node testes/teste-caminhos.mjs            (todos)
//      node testes/teste-caminhos.mjs 2 11        (só os caminhos pedidos)
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, scriptTeste, estadoSalvo, respostasAte } from './_quiz.mjs';
import { confereTexto, confereEventos, validaSchema, contratos } from './_util.mjs';

const { ok, fim } = verificador('Caminhos');
const pedidos = process.argv.slice(2).map(Number).filter(Boolean);
const vale = n => !pedidos.length || pedidos.includes(n);
const s = await sobe();
const COLETA = s.url + '/__coleta';
const leads = () => s.coleta.corpos.filter(x => x && x.leadId);
const TODAS = ['posicao', 'idade', 'peneiras', 'dispensas', 'inimigo', 'zyron', 'mundo', 'historico', 'sonho', 'audio', 'quer', 'chance', 'contato', 'resultado'];
const SEM_DISPENSAS = TODAS.filter(x => x !== 'dispensas');
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const abertos = [];

async function caminho(n, nome, corpo, { config = {}, url = '/', estado = null } = {}) {
  if (!vale(n)) return;
  s.coleta.corpos.length = 0;
  const c = await abreChrome({ antes: scriptTeste({ config: Object.assign({ endpoint: COLETA }, config), estado }) });
  abertos.push(c);
  const q = quiz(c);
  const t0 = Date.now();
  try {
    await q.abre(s.url + url);
    await corpo({ c, q });
  } catch (e) {
    ok(false, `caminho ${n} (${nome}): ${e.message}`);
    try { console.log('      está em ' + (await q.tela()) + '; telas: ' + (await q.telas()).join(' > ')); } catch { /* nada */ }
  }
  // o payload de cada caminho valida no schema e não leva espaço especial da tela
  for (const p of leads()) {
    const erros = validaSchema(contratos().schema, p);
    ok(!erros.length, `caminho ${n}: o payload valida no schema` + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));
    ok(!new RegExp('[' + String.fromCharCode(0xa0, 0x2060) + ']').test(JSON.stringify(p)), `caminho ${n}: o payload sem espaço especial da tela`);
  }
  // regras da casa em todo texto visto, e eventos sem dado de pessoa
  const achados = [...new Set(q.textos.flatMap(t => confereTexto(t.texto).map(a => `${t.id}: ${a}`)))];
  ok(!achados.length, `caminho ${n}: ${q.textos.length} leituras de tela dentro das regras da casa` + (achados.length ? ' | ' + achados.slice(0, 3).join(' | ') : ''));
  try {
    const evs = await q.eventos();
    const pii = confereEventos(evs, { nome: 'Joãozinho', telefone: '11955554444' });
    ok(!pii.length, `caminho ${n}: ${evs.length} eventos sem dado de pessoa` + (pii.length ? ' | ' + pii.slice(0, 3).join(' | ') : ''));
  } catch { /* a aba pode ter navegado pra fora */ }
  console.log(`      caminho ${n} levou ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  await c.fecha();
}
const CONTATO = { nome: 'Joãozinho', zap: '11955554444' };
const ultimo = async () => { for (let i = 0; i < 40 && !leads().length; i++) await espera(100); return leads()[leads().length - 1]; };

try {
  /* (1) adulto, 6 ou mais peneiras, 3 a 5 dispensas, tier A; devagar: um toque a cada 3 s e o áudio inteiro */
  await caminho(1, 'adulto tier A, devagar', async ({ c, q: q0 }) => {
    const lento = Object.assign({}, c, { toca: async (sel, op) => { await espera(3000); if (!(await c.avalia(`!!document.querySelector(${JSON.stringify(sel)})`))) return null; return c.toca(sel, op); } });
    const q = quiz(lento);
    const t0 = Date.now();
    await q.posicao('LD'); await q.idade('18_21'); await q.peneiras('6_mais', '500_2000'); await q.dispensas('3_5', 'sim');
    await q.inimigo(); await q.zyron('lances'); await q.mundo(); await q.historico(); await q.sonho('europa');
    await q.audio('inteiro'); await q.quer('sim'); await q.chance('familia'); await q.contato(CONTATO); await q.resultado();
    const seg = (Date.now() - t0) / 1000;
    q0.textos.push(...q.textos);
    const telas = await q.telas();
    ok(igual(telas, TODAS) && telas.length === 14, `caminho 1: as 14 telas na ordem (${telas.length})`);
    ok(seg <= 240, `caminho 1: tocando a cada 3 s e ouvindo o áudio inteiro, fechou em ${seg.toFixed(0)} s (até 240)`);
    const p = await ultimo();
    ok(p && p.pontuacao.tier === 'A' && p.quiz.audio.estado === 'ate_o_fim' && p.pontuacao.porRegra.audio === 6, 'caminho 1: tier A, áudio até o fim (6 pontos)');
    ok(p && p.quiz.recusado === true && p.quiz.jogouBem === 'sim' && p.ficha.peneirasFeitas === 8, 'caminho 1: recusado, jogou bem, 8 peneiras estimadas');
    ok((await c.avalia(`document.querySelector('.t-resultado .selo') !== null && !!document.querySelector('#barra .btn')?.dataset.url`)), 'caminho 1: selo e botão da landing no resultado');
  });

  /* (2) adulto sem peneira: 13 telas, pula a T04, T05 variante C */
  await caminho(2, 'adulto sem peneira', async ({ c, q }) => {
    await q.posicao('CA'); await q.idade('22_mais'); await q.peneiras('0');
    await q.esperaTela('inimigo');
    ok((await c.avalia(`document.querySelector('.t-inimigo').dataset.variante`)) === 'C', 'caminho 2: T05 na variante C');
    await q.inimigo(); await q.zyron('jogos'); await q.mundo(); await q.historico(); await q.sonho('brasil');
    await q.audio('fim'); await q.quer('sim'); await q.chance('pronto'); await q.contato(CONTATO); await q.resultado();
    const telas = await q.telas();
    ok(igual(telas, SEM_DISPENSAS) && telas.length === 13, `caminho 2: 13 telas, sem a T04 (${telas.join(' > ')})`);
    const p = await ultimo();
    ok(p && p.ficha.peneirasFeitas === 0 && p.ficha.gastoPeneiras === 0 && p.quiz.dispensas === null && p.quiz.recusado === false, 'caminho 2: payload sem peneira, sem gasto e sem dispensa');
  });

  /* (3) adulto com peneiras e nenhuma dispensa: T05 variante B */
  await caminho(3, 'com peneiras, sem dispensa', async ({ c, q }) => {
    await q.posicao('ZAG-d'); await q.idade('18_21'); await q.peneiras('1_2', 'ate_500'); await q.dispensas('0');
    await q.esperaTela('inimigo');
    ok((await c.avalia(`document.querySelector('.t-inimigo').dataset.variante`)) === 'B', 'caminho 3: T05 na variante B');
    await q.inimigo(); await q.zyron('lances'); await q.mundo(); await q.historico(); await q.sonho('chance');
    await q.audio('fim'); await q.quer('sim'); await q.chance('familia'); await q.contato(CONTATO); await q.resultado();
    ok(igual(await q.telas(), TODAS), 'caminho 3: as 14 telas na ordem');
    const p = await ultimo();
    ok(p && p.quiz.dispensas === '0' && p.quiz.recusado === false && p.quiz.jogouBem === null, 'caminho 3: dispensa 0, sem "jogou bem"');
  });

  /* (4) menor de 15 a 17: segue direto da T02 e deixa o contato do responsável na T13 */
  await caminho(4, 'menor de 15 a 17', async ({ c, q }) => {
    await q.posicao('MC'); await q.idade('15_17');
    await q.peneiras('3_5', 'mais_2000'); await q.dispensas('1_2', 'as_vezes');
    await q.inimigo(); await q.zyron('nada'); await q.mundo(); await q.historico(); await q.sonho('europa');
    await q.audio('metade'); await q.quer('receio'); await q.chance('entender');
    await q.contato({ nome: 'Joãozinho', responsavel: 'Maria Souza', zap: '11955554444' }); await q.resultado();
    ok(igual(await q.telas(), TODAS), 'caminho 4: as 14 telas na ordem');
    const p = await ultimo();
    ok(p && p.contato.responsavelNome === 'Maria Souza' && !('responsavelPresente' in p.consentimento) && p.quiz.idadeFaixa === '15_17', 'caminho 4: contato e aceite do responsável no payload');
    ok(p && /^Sou o responsável por Joãozinho/.test(p.consentimento.texto), 'caminho 4: o aceite do menor sai com a frase do responsável');
    ok(p && p.quiz.audio.estado === 'mais_da_metade' && p.pontuacao.porRegra.audio === 3, 'caminho 4: áudio passou da metade (3 pontos)');
  });

  /* (5) menor de 12 a 14: um toque na T02 e segue, sem bloco nenhum; a T13 pede o contato do responsável */
  await caminho(5, 'menor de 12 a 14', async ({ c, q }) => {
    await q.posicao('GOL'); await q.idade('12_14');
    await q.esperaTela('peneiras');
    ok(igual(await q.telas(), ['posicao', 'idade', 'peneiras']) && leads().length === 0, 'caminho 5: de 12 a 14, a T02 avança sozinha pra T03, sem bloco do responsável');
    ok((await q.eventos()).some(e => e.e === 'menor_declarado' && e.p.faixa === '12_14'), 'caminho 5: o evento "menor_declarado" sai com a faixa');
  });

  /* (6) menos de 12: a saída na T02, nada guardado */
  await caminho(6, 'menos de 12', async ({ c, q }) => {
    await q.posicao('ALE'); await q.esperaTela('idade');
    await q.toca('.t-idade .opcao[data-id="menos12"]');
    await c.ate(`!!document.querySelector('.saida-menor')`, 4000);
    await q.colhe();
    const guardado = await c.avalia(`localStorage.getItem('qz:estado')`);
    ok(!guardado, 'caminho 6: nada do que foi respondido fica no aparelho');
    ok((await c.avalia(`document.querySelector('.saida-menor a.btn')?.href || ''`)).includes('instagram.com/assessoria.voxen'), 'caminho 6: a saída leva ao Instagram da casa');
    ok(igual(await q.telas(), ['posicao', 'idade']) && leads().length === 0, 'caminho 6: nenhuma tela depois da T02, nenhum lead');
    // quem tocou errado volta pra T02 sem refazer a capa
    await q.toca('.saida-menor .link-btn');
    await q.esperaTela('idade');
    ok((await c.avalia(`JSON.parse(localStorage.getItem('qz:estado') || '{}').respostas?.posicao`)) === 'ALE', 'caminho 6: "Escolhi errado" volta pra T02 com a posição');
  });

  /* (7) tier B */
  await caminho(7, 'tier B', async ({ c, q }) => {
    await q.posicao('LE'); await q.idade('18_21'); await q.peneiras('6_mais', '500_2000'); await q.dispensas('3_5', 'nao');
    await q.inimigo(); await q.zyron('lances'); await q.mundo(); await q.historico(); await q.sonho('selecao');
    await q.audio('fim'); await q.quer('receio'); await q.chance('entender'); await q.contato(CONTATO); await q.resultado();
    const p = await ultimo();
    ok(p && p.pontuacao.tier === 'B', `caminho 7: tier B (${p && p.pontuacao.total} pontos)`);
    ok((await c.avalia(`document.querySelector('#barra .barra-acima')?.textContent || ''`)).startsWith('Se puder, assista com a sua família'), 'caminho 7: o B ganha a linha "se puder, assista com a sua família"');
    ok((await c.avalia(`document.querySelector('#barra .btn')?.dataset.url || ''`)).includes('t=B'), 'caminho 7: a landing recebe t=B');
  });

  /* (8) tier C com saída */
  await caminho(8, 'tier C, saída', async ({ c, q }) => {
    await q.posicao('ADD'); await q.idade('22_mais'); await q.peneiras('1_2', 'nada'); await q.dispensas('0');
    await q.inimigo(); await q.zyron('nada'); await q.mundo(); await q.historico(); await q.sonho('chance');
    await q.audio('nada'); await q.quer('nao_sei'); await q.chance('nao_sei'); await q.contato(CONTATO); await q.resultado();
    const p = await ultimo();
    ok(p && p.pontuacao.tier === 'C', 'caminho 8: tier C');
    ok(!(await c.avalia(`!!document.querySelector('.t-resultado .selo') || !!document.querySelector('#barra .btn')?.dataset.url`)), 'caminho 8: sem selo e sem botão da landing');
    ok((await c.avalia(`document.querySelector('#barra a.btn')?.href || ''`)).includes('instagram.com/assessoria.voxen'), 'caminho 8: sai pro Instagram da casa');
  });

  /* (9) tier C com "landing": a tela do B, a landing recebe o tier real */
  await caminho(9, 'tier C, landing', async ({ c, q }) => {
    await q.posicao('VOL-e'); await q.idade('18_21'); await q.peneiras('0');
    await q.inimigo(); await q.zyron('nada'); await q.mundo(); await q.historico(); await q.sonho('brasil');
    await q.audio('nada'); await q.quer('sim'); await q.chance('nao_sei'); await q.contato(CONTATO); await q.resultado();
    const p = await ultimo();
    ok(p && p.pontuacao.tier === 'C', 'caminho 9: tier C no payload');
    const url = await c.avalia(`document.querySelector('#barra .btn')?.dataset.url || ''`);
    ok(url.includes('t=C') && (await c.avalia(`!!document.querySelector('.t-resultado .selo')`)), 'caminho 9: com "landing", a tela do B (selo e botão) e a landing recebe t=C');
  }, { config: { roteamento: { tierC: 'landing' } } });

  /* (10) "ainda não sei" na T11: sem o segurar */
  await caminho(10, 'ainda não sei', async ({ c, q }) => {
    await q.posicao('VOL-d'); await q.idade('22_mais'); await q.peneiras('3_5', 'ate_500'); await q.dispensas('1_2', 'sim');
    await q.inimigo(); await q.zyron('jogos'); await q.mundo(); await q.historico(); await q.sonho('europa');
    await q.audio('pouco');
    await q.esperaTela('quer');
    await q.toca('.t-quer .opcao[data-id="nao_sei"]');
    await espera(300);
    ok(!(await c.avalia(`!!document.querySelector('.segurar-botao')`)), 'caminho 10: "ainda não sei" não abre o segurar');
    await q.chance('familia'); await q.contato(CONTATO); await q.resultado();
    const p = await ultimo();
    ok(p && p.quiz.quer === 'nao_sei' && p.quiz.compromisso === false && p.quiz.audio.estado === 'menos', 'caminho 10: quer "nao_sei", sem compromisso, áudio "menos"');
    ok(igual(await q.telas(), TODAS), 'caminho 10: as 14 telas na ordem');
  });

  /* (11) voltar até a T01 pela seta e pelo voltar nativo, avançar de novo sem perder nada; na T14 o voltar reabre a T14 */
  await caminho(11, 'voltar e avançar', async ({ c, q }) => {
    const R = { posicao: 'LD', idade: '18_21', peneiras: '6_mais', gasto: '500_2000', dispensas: '3_5', jogouBem: 'sim', video: 'lances', sonho: 'europa', quer: 'sim', chance: 'familia' };
    await q.posicao(R.posicao); await q.idade(R.idade); await q.peneiras(R.peneiras, R.gasto); await q.dispensas(R.dispensas, R.jogouBem);
    await q.inimigo(); await q.zyron(R.video); await q.mundo(); await q.historico(); await q.sonho(R.sonho);
    await q.audio('fim'); await q.quer(R.quer); await q.chance(R.chance);
    await q.esperaTela('contato');
    const MARCA = {
      posicao: `.pos.escolhida[data-pos="${R.posicao}"]`, idade: `.t-idade .opcao[data-id="${R.idade}"][aria-checked="true"]`,
      peneiras: `.t-peneiras > .opcoes .opcao[data-id="${R.peneiras}"][aria-checked="true"]`, dispensas: `.t-dispensas > .opcoes .opcao[data-id="${R.dispensas}"][aria-checked="true"]`,
      zyron: `#barra .opcao[data-id="${R.video}"][aria-checked="true"]`, sonho: `.t-sonho .opcao[data-id="${R.sonho}"][aria-checked="true"]`,
      quer: `.t-quer .opcao[data-id="${R.quer}"][aria-checked="true"]`, chance: `.t-chance .opcao[data-id="${R.chance}"][aria-checked="true"]`
    };
    const ordem = TODAS.slice(0, TODAS.indexOf('contato'));
    async function voltaTudo(como) {
      const perdidas = [];
      for (let i = ordem.length - 1; i >= 0; i--) {
        if (como === 'seta') await q.toca('#voltar'); else await c.avalia('history.back(); true');
        await q.esperaTela(ordem[i]);
        if (MARCA[ordem[i]] && !(await c.ate(`!!document.querySelector(${JSON.stringify(MARCA[ordem[i]])})`, 2500))) perdidas.push(ordem[i]);
      }
      return perdidas;
    }
    async function avancaTudo() {
      for (const id of ordem) {
        await q.esperaTela(id);
        await espera(250);
        if (id === 'audio') await c.ate(`!!document.querySelector('#barra .btn')`, 4000);
        const temContinuar = await c.avalia(`(() => { const b = document.querySelector('#barra .btn:not([aria-disabled="true"])'); return !!b; })()`);
        if (temContinuar) { await q.toca('#barra .btn'); continue; }
        if (id === 'posicao') await q.toca(MARCA.posicao);
        else if (id === 'zyron') await q.toca(MARCA.zyron);
        else if (MARCA[id]) await q.toca(MARCA[id]);
        else throw new Error('sem como avançar em ' + id);
      }
      await q.esperaTela('contato');
    }
    const p1 = await voltaTudo('seta');
    ok(!p1.length, 'caminho 11: pela seta, da T13 até a T01, toda resposta continua marcada' + (p1.length ? ' (perdeu: ' + p1.join(', ') + ')' : ''));
    await avancaTudo();
    ok(true, 'caminho 11: avançou de novo até a T13');
    const p2 = await voltaTudo('nativo');
    ok(!p2.length, 'caminho 11: pelo voltar nativo, da T13 até a T01, toda resposta continua marcada' + (p2.length ? ' (perdeu: ' + p2.join(', ') + ')' : ''));
    await avancaTudo();
    await q.contato(CONTATO); await q.resultado();
    const p = await ultimo();
    ok(p && p.ficha.mapaCalor === 'LD' && p.quiz.peneirasFaixa === '6_mais' && p.quiz.video === 'lances' && p.quiz.quer === 'sim', 'caminho 11: o payload final tem as respostas do começo');
    await c.avalia('history.back(); true');
    await espera(1200);
    ok((await q.tela()) === 'resultado' && leads().length === 1, `caminho 11: na T14, o voltar nativo reabre a T14 sem reenviar (${leads().length} envio)`);
  });

  /* (12) recarregar no meio e retomar; recarregar depois de enviar (contato apagado do aparelho) */
  await caminho(12, 'recarregar', async ({ c, q }) => {
    await q.posicao('ADD'); await q.idade('18_21'); await q.peneiras('3_5', '500_2000'); await q.dispensas('3_5', 'sim');
    await q.inimigo(); await q.zyron('lances');
    await q.esperaTela('mundo');
    await c.envia('Page.reload', {});
    await q.esperaTela('mundo', 15000);
    ok(true, 'caminho 12: recarregou na T07 e voltou pra T07');
    await q.mundo(); await q.historico(); await q.sonho('europa'); await q.audio('fim'); await q.quer('sim'); await q.chance('pronto');
    await q.contato(CONTATO); await q.resultado();
    const p = await ultimo();
    ok(p && p.ficha.mapaCalor === 'ADD' && p.quiz.video === 'lances' && p.quiz.peneirasFaixa === '3_5', 'caminho 12: as respostas de antes da recarga chegaram no payload');
    await c.envia('Page.reload', {});
    await q.esperaTela('resultado', 15000);
    const guardado = await c.avalia(`localStorage.getItem('qz:estado') || ''`);
    ok(!/Joãozinho|55554444|"nome"|"whatsapp"|"aceite"/.test(guardado), 'caminho 12: depois de enviar e recarregar, nome, telefone e aceite não estão no aparelho');
    ok(leads().length === 1, 'caminho 12: recarregar o resultado não reenvia');
  });

  // quem volta pelo link do anúncio (sem #/passo) com progresso salvo na T06
  const parouNaT06 = estadoSalvo(respostasAte('zyron'), 'zyron');
  const passoSalvo = c => c.avalia(`JSON.parse(localStorage.getItem('qz:estado') || '{}').passo || null`);
  await caminho(13, 'voltar e seguir de onde parou', async ({ c, q }) => {
    ok(await c.ate(`!!document.querySelector('.retomada .btn')`, 5000), 'caminho 13: quem volta com progresso salvo vê na capa o "Continuar de onde parei"');
    ok((await passoSalvo(c)) === 'zyron', 'caminho 13: abrir a capa não apaga a tela onde ele parou');
    ok(!(await c.avalia(`!!document.querySelector('#barra .btn')`)), 'caminho 13: com o cartão, a barra não mostra um segundo "Continuar"');
    await q.colhe();
    await q.toca('.retomada .btn');
    await q.esperaTela('zyron');
    ok((await passoSalvo(c)) === 'zyron' && (await q.telas()).join(' > ') === 'posicao > zyron', 'caminho 13: "Continuar de onde parei" leva direto pra T06, onde ele parou');
  }, { estado: parouNaT06 });
  await caminho(14, 'voltar e recomeçar', async ({ c, q }) => {
    ok(await c.ate(`!!document.querySelector('.retomada .link-btn')`, 5000), 'caminho 14: a capa oferece "Recomeçar do zero"');
    await q.toca('.retomada .link-btn');
    ok(await c.ate(`!document.querySelector('.retomada') && document.querySelector('#palco .tela')?.dataset.passo === 'posicao' && !document.querySelector('#palco .pos.escolhida')`, 5000), 'caminho 14: "Recomeçar do zero" volta pra capa limpa, sem o cartão e sem posição marcada');
    const r = await c.avalia(`JSON.parse(localStorage.getItem('qz:estado') || '{}').respostas || {}`);
    ok(!Object.keys(r).length, 'caminho 14: as respostas de antes saíram do aparelho');
    await q.posicao('LD');
    await q.esperaTela('idade');
    ok(true, 'caminho 14: o quiz recomeça normal pela T02');
  }, { estado: parouNaT06 });
} finally {
  for (const c of abertos) await c.fecha().catch(() => {});
  await s.fecha();
  fim();
}
