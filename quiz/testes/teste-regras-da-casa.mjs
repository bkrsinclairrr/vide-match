// Regras da casa. (1) Nenhum travessão (U+2014 nem U+2013) em nada: tela, código, comentário, documento. (2) A copy e as provas sem
// palavra proibida, ressalva legal nem preço. (3) Percorrendo as 15 telas, com as 4 opcionais ligadas só pra este teste: todo texto
// renderizado dentro das regras; título de tela narrativa com até 9 palavras (em toda variante e com toda posição); a T08 com os três
// números do dono e o universo dentro da frase; todo cartão de fato ligado a uma prova do provas.json, com fonte quando é de terceiro.
// Os 12 caminhos (teste-caminhos.mjs) passam pela mesma varredura de texto.
// Uso: node testes/teste-regras-da-casa.mjs
import fs from 'node:fs';
import path from 'node:path';
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, scriptTeste } from './_quiz.mjs';
import { contratos, todosOsArquivos, confereTexto, textosDoJson, palavras, TRAVESSAO, RAIZ, REPO } from './_util.mjs';

const { ok, fim } = verificador('Regras da casa');
const { copy, provas, fluxo, geral } = contratos();
const PROVA = Object.fromEntries(provas.itens.map(p => [p.id, p]));

/* ---------- 1. travessão em nada ---------- */
const comTravessao = todosOsArquivos().filter(f => /\.(js|mjs|css|html|json|md|py|txt|svg)$/i.test(f)).filter(f => TRAVESSAO.test(fs.readFileSync(f, 'utf8')));
ok(!comTravessao.length, 'nenhum travessão em código, comentário, configuração ou documento' + (comTravessao.length ? ': ' + comTravessao.map(f => path.relative(REPO, f)).join(', ') : ''));

const semEnfase = t => t.replace(/\*([^*]+)\*/g, '$1');

// o topo da capa vem pronto no index.html (aparece antes do JavaScript): tem que bater com a copy, senão o atleta vê o texto velho piscar
{
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  // caractere por caractere (o espaço duro e o juntor da marca também), pra quebra de linha não mudar quando a T01 monta por cima
  const limpa = t => t.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, String.fromCharCode(0xa0)).replace(/&#8288;/g, String.fromCharCode(0x2060)).replace(/&amp;/g, '&');
  const pega = re => { const m = re.exec(html); return m ? limpa(m[1]) : null; };
  const casca = { chip: pega(/<span class="cap-chip"><i><\/i>([^<]*)<\/span>/), titulo: pega(/<h1 class="titulo">([\s\S]*?)<\/h1>/), apoio: pega(/<p class="apoio">([\s\S]*?)<\/p>/) };
  const difere = Object.entries(casca).filter(([k, v]) => v !== semEnfase(copy.posicao[k]));
  ok(!difere.length, 'o topo da capa no index.html bate com a copy (selo, título e apoio)' + (difere.length ? ': difere ' + difere.map(([k, v]) => `${k} ("${v}")`).join(', ') : ''));
}

/* ---------- 2. a copy e as provas ---------- */
const INTERNO = /(^|\.)(id|tipo|notaLegal|observacao|confianca|conferidoEm|confirmadoPeloDono|reserva|escudo|foto|data)$/;
const doCopy = textosDoJson(copy).flatMap(([onde, t]) => confereTexto(semEnfase(t)).map(a => `copy.${onde}: ${a}`));
ok(!doCopy.length, 'a copy inteira dentro das regras da casa' + (doCopy.length ? ': ' + doCopy.slice(0, 4).join(' | ') : ''));
const dasProvas = textosDoJson(provas).filter(([onde]) => !INTERNO.test(onde)).flatMap(([onde, t]) => confereTexto(t).map(a => `provas.${onde}: ${a}`));
ok(!dasProvas.length, 'o texto das provas que vai pra tela dentro das regras' + (dasProvas.length ? ': ' + dasProvas.slice(0, 4).join(' | ') : ''));
const doResto = [...textosDoJson(fluxo), ...textosDoJson(geral)].flatMap(([onde, t]) => confereTexto(t).map(a => `${onde}: ${a}`));
ok(!doResto.length, 'fluxo e configuração sem texto fora das regras' + (doResto.length ? ': ' + doResto.slice(0, 3).join(' | ') : ''));

// títulos das telas narrativas, em todas as variantes da copy (a T06 é conferida com cada posição na página, abaixo)
const NARRATIVAS = fluxo.passos.filter(p => /narrativa|recortes|provas/.test(p.tipo)).map(p => p.id);
const titulos = [];
for (const id of NARRATIVAS) {
  const c = copy[id] || {};
  if (c.titulo) titulos.push([id, c.titulo]);
  for (const v of ['A', 'B', 'C']) if (c[v] && c[v].titulo) titulos.push([`${id}.${v}`, c[v].titulo]);
}
const longos = titulos.filter(([id, t]) => !/\{quem\}/.test(t) && palavras(semEnfase(t)) > 9);
ok(titulos.length >= 6 && !longos.length, `${titulos.length} títulos de tela narrativa com até 9 palavras` + (longos.length ? ': ' + longos.map(([i, t]) => `${i} (${palavras(t)})`).join(', ') : ''));

/* ---------- 3. na página: as 15 telas e as 4 opcionais ---------- */
const s = await sobe();
const c = await abreChrome({ antes: scriptTeste({ config: { endpoint: '', telasOpcionais: { objetivo: true, experiencia: true, trava: true, epoca: true } } }) });
const q = quiz(c);
const provasVistas = new Set();
const titulosVistos = [];
const colheProvas = async () => { for (const id of await c.avalia(`[...document.querySelectorAll('[data-prova]')].map(e => e.dataset.prova)`)) provasVistas.add(id); };
const colheTitulo = async () => { const t = await c.avalia(`(() => { const t = document.querySelector('#palco .tela:not(.saindo)'); const h = t && t.querySelector('h1'); return t && h ? [t.dataset.passo, h.innerText] : null; })()`); if (t) titulosVistos.push(t); };
try {
  await q.abre(s.url + '/');
  // a T06 com cada uma das 11 posições: o título com {quem} nunca passa de 9 palavras
  const comQuem = await c.avalia(`(() => { const M = window.MapaCalor; const ids = ['GOL','LD','ZAG-d','ZAG-e','LE','VOL-d','VOL-e','ADD','MC','ALE','CA'];
    return ids.map(id => [id, ${JSON.stringify(semEnfase(copy.zyron.titulo))}.replace('{quem}', M.sub(id).replace(/^onde atua /, ''))]); })()`);
  const zLongos = comQuem.filter(([, t]) => palavras(t) > 9);
  ok(comQuem.length === 11 && !zLongos.length, 'o título da T06 com as 11 posições fica em até 9 palavras' + (zLongos.length ? ': ' + zLongos.map(([i, t]) => `${i}: ${t}`).join(' | ') : ''));
  await colheProvas();

  const vistos = [];
  for (let passo = 0; passo < 30; passo++) {
    const id = await q.tela();
    if (!id) { await espera(200); continue; }
    if (vistos[vistos.length - 1] !== id) vistos.push(id);
    await espera(350);
    await q.colhe(); await colheTitulo(); await colheProvas();
    if (id === 'resultado') break;
    if (id === 'posicao') await q.posicao('ZAG-e');
    else if (id === 'idade') await q.idade('18_21');
    else if (id === 'peneiras') await q.peneiras('6_mais', 'mais_2000');
    else if (id === 'dispensas') await q.dispensas('6_mais', 'sim');
    else if (id === 'inimigo') {
      await c.ate(`!!document.querySelector('.campo--jogo.modo-ia')`, 8000); await espera(900); await q.colhe();
      // os números da peneira (a folha "Ver os números")
      const abriu = await c.avalia(`(() => { const b = [...document.querySelectorAll('.t-inimigo button')].find(b => /números/i.test(b.textContent)); if (!b) return false; b.click(); return true; })()`);
      if (abriu) { await c.ate(`!!document.querySelector('.folha [data-prova]')`, 3000); await q.colhe(); await colheProvas(); await c.tecla('Escape', 'Escape', 27); await espera(500); }
      ok(abriu, 'a T05 abre "Ver os números" com as provas da peneira');
      await q.continua();
    }
    else if (id === 'zyron') await q.zyron();
    else if (id === 'video') await q.video('jogos');
    else if (id === 'mundo') {
      // o innerText já traz os seis recortes, mesmo os que estão fora da vista no carrossel
      await q.colhe(); await colheProvas(); await q.continua();
    }
    else if (id === 'historico') {
      await espera(1600); await q.colhe(); await colheProvas();
      const t8 = (await c.avalia(`document.querySelector('.t-historico').innerText`)).replace(new RegExp(String.fromCharCode(0xa0), 'g'), ' ');
      ok(/\b326\b/.test(t8) && /Inicialmente\s+R\$ 30 mil\+/.test(t8) && /por m[eê]s/.test(t8) && /Cerca de\s+3\s+meses/i.test(t8), 'a T08 mostra os três números do dono (326, inicialmente R$ 30 mil+ por mês, cerca de 3 meses)');
      ok(/atletas nossos/i.test(t8) && /acompanhados por n[oó]s/i.test(t8), 'a T08 traz o universo dentro da frase ("atletas nossos", "acompanhados por nós")');
      await q.continua();
    }
    else if (id === 'sonho') await q.sonho('europa');
    else if (id === 'audio') await q.audio('fim');
    else if (id === 'quer') await q.quer('sim');
    else if (id === 'chance') await q.chance('pronto');
    else if (id === 'contato') await q.contato({ nome: 'Joãozinho', zap: '11955554444' });
    else {
      // tela opcional (chips de um toque): escolhe a primeira opção
      await c.ate(`!!document.querySelector('#palco .tela:not(.saindo) .opcao')`, 4000);
      await q.toca('#palco .tela:not(.saindo) .opcao');
    }
    // só segue quando a tela trocou (senão o laço responde a mesma tela duas vezes)
    if (!(await c.ate(`(() => { const t = document.querySelector('#palco .tela:not(.saindo)'); return !!t && t.dataset.passo !== ${JSON.stringify(id)} && !t.classList.contains('entrando'); })()`, 12000))) throw new Error('a tela ' + id + ' não avançou');
  }
  const esperadas = ['posicao', 'idade', 'experiencia', 'epoca', 'objetivo', 'peneiras', 'trava', 'dispensas', 'inimigo', 'zyron', 'video', 'mundo', 'historico', 'sonho', 'audio', 'quer', 'chance', 'contato', 'resultado'];
  ok(JSON.stringify(vistos) === JSON.stringify(esperadas), `com as opcionais ligadas, as 19 telas na ordem do fluxo (${vistos.length}: ${vistos.join(' > ')})`);

  const achados = [...new Set(q.textos.flatMap(t => confereTexto(t.texto).map(a => `${t.id}: ${a}`)))];
  ok(!achados.length, `${q.textos.length} leituras de tela sem travessão, palavra proibida, ressalva nem preço` + (achados.length ? ': ' + achados.slice(0, 4).join(' | ') : ''));
  const longosVistos = titulosVistos.filter(([id, t]) => NARRATIVAS.includes(id) && palavras(t) > 9);
  ok(!longosVistos.length, 'na tela, todo título narrativo com até 9 palavras' + (longosVistos.length ? ': ' + longosVistos.map(([i, t]) => `${i}: ${t}`).join(' | ') : ''));

  // todo cartão de fato está no provas.json; o de terceiro tem fonte (veículo, data e link)
  const TERCEIRO = new Set(['fato_com_fonte', 'recorte_de_imprensa', 'afirmacao_atribuida']);
  const semProva = [...provasVistas].filter(id => !PROVA[id] || PROVA[id].ativo === false);
  const semFonte = [...provasVistas].filter(id => PROVA[id] && TERCEIRO.has(PROVA[id].tipo) && !(PROVA[id].fonte && /^https:\/\//.test(PROVA[id].fonte.url || '') && PROVA[id].fonte.veiculo && PROVA[id].fonte.data));
  ok(provasVistas.size >= 25 && !semProva.length, `${provasVistas.size} cartões de fato na tela, todos ligados a uma prova ativa` + (semProva.length ? ': ' + semProva.join(', ') : ''));
  ok(!semFonte.length, 'todo fato de terceiro na tela tem veículo, data e link' + (semFonte.length ? ': ' + semFonte.join(', ') : ''));
  const recortesTela = [...provasVistas].filter(id => /^REC-/.test(id)).length, clubesTela = [...provasVistas].filter(id => /^IA-/.test(id)).length;
  ok(recortesTela === provas.itens.filter(p => p.tipo === 'recorte_de_imprensa' && p.ativo !== false).length && clubesTela >= 10, `a T07 mostra os ${recortesTela} recortes e ${clubesTela} clubes com fonte`);
} catch (e) {
  ok(false, 'erro: ' + e.message);
} finally {
  await c.fecha(); await s.fecha();
  fim();
}
