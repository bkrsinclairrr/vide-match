// A variante de venda (?v=pro, config/variantes/scouting-pro/): o quiz termina na oferta do Scouting PRO e no checkout, não no WhatsApp.
// (1) Os contratos: a variante com o link, o preço, a âncora e as seis entregas, dentro das regras da casa (só o nome e os preços dela
// liberados), e a base sem preço nem nome do produto. (2) Adulto tier A, ponta a ponta: as 16 telas, o resultado indo pra oferta, a oferta
// inteira, o checkout com as UTMs e sem dado de pessoa, o lead com a variante e o aceite novo, a ida ao checkout no coletor. (3) Menor de
// 15 a 17: a linha do responsável e o link de verdade da Sinnu; recarregar na oferta volta pra ela, o voltar leva ao resultado e o
// progresso não se mistura com o do quiz de sempre; a página de obrigado com o código do diagnóstico. (4) Tier C vendo a oferta.
// Uso: node quiz/testes/teste-variante.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, scriptTeste, estadoSalvo, respostasAte } from './_quiz.mjs';
import { contratos, lerJson, confereTextoVenda, confereEventos, validaSchema, textosDoJson, RAIZ } from './_util.mjs';

const { ok, fim } = verificador('Variante de venda');
const { copy, fluxo, schema } = contratos();
const vg = lerJson('config/variantes/scouting-pro/geral.json');
const vf = lerJson('config/variantes/scouting-pro/fluxo.json');
const vc = lerJson('config/variantes/scouting-pro/copy.pt-BR.json');
const { acrescentaPassos } = await import(pathToFileURL(path.join(RAIZ, 'js', 'motor', 'fluxo.js')).href);

const NBSP = new RegExp(String.fromCharCode(0xa0), 'g');
const n = t => String(t ?? '').replace(NBSP, ' ');
const semEnfase = t => t.replace(/\*([^*]+)\*/g, '$1');
const LIBERADO = { produto: vc.oferta.produto, precos: [vc.oferta.preco, vc.oferta.ancora] };
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const TODAS = ['posicao', 'idade', 'peneiras', 'dispensas', 'inimigo', 'zyron', 'video', 'mundo', 'historico', 'sonho', 'audio', 'quer', 'chance', 'contato', 'resultado', 'oferta'];
const CONTATO = { nome: 'Joãozinho', zap: '11955554444' };

/* ---------- 1. os contratos ---------- */
ok(vg.checkout?.url === 'https://pay.sinnu.com.br/H8ups0dI', 'o checkout é o link do Scouting PRO na Sinnu (pay.sinnu.com.br/H8ups0dI)');
ok(n(vc.oferta.preco) === 'R$ 67,90' && n(vc.oferta.ancora) === 'R$ 247,90', 'o preço é R$ 67,90 e a âncora, R$ 247,90');
ok(vc.oferta.itens.length === 6 && vc.oferta.itens.every(t => !/encaminh/i.test(t)), 'as seis entregas do Scout PRO do R2, nenhuma com encaminhamento');
ok(vg.roteamento?.tierC === 'oferta' && vg.whatsappEquipe === '' && vg.variante === 'scouting-pro' && !!vg.aceiteVersao, 'a variante: tier C na oferta, sem link de WhatsApp da equipe, com nome e versão do aceite');
const daVariante = textosDoJson(vc).flatMap(([onde, t]) => confereTextoVenda(semEnfase(t), LIBERADO).map(a => `${onde}: ${a}`));
ok(!daVariante.length, 'a copy da variante dentro das regras da casa (só o nome e os preços dela liberados)' + (daVariante.length ? ': ' + daVariante.slice(0, 3).join(' | ') : ''));
const fluxoV = acrescentaPassos(structuredClone(fluxo), vf).passos.map(p => p.id);
ok(fluxoV.indexOf('oferta') === fluxoV.indexOf('resultado') + 1 && fluxoV.length === fluxo.passos.length + 1, 'o passo da oferta entra logo depois do resultado');
// a base continua sem preço e sem nome de produto (a regra "o quiz não vende" segue valendo pro quiz de sempre)
const base = n(JSON.stringify(copy)) + n(fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8'));
ok(!/67,90|247,90|scouting\s+pro/i.test(base), 'a copy e o index.html da base sem o preço nem o nome do produto');
const obrigadoHtml = fs.readFileSync(path.join(RAIZ, 'obrigado', 'index.html'), 'utf8');
const obrigadoTexto = obrigadoHtml.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
const doObrigado = confereTextoVenda(obrigadoTexto, LIBERADO);
ok(!doObrigado.length, 'o texto da página de obrigado dentro das regras' + (doObrigado.length ? ': ' + doObrigado.join(' | ') : ''));
ok(/href="https:\/\/wa\.me\/5551982690162\?text=/.test(obrigadoHtml) && /noindex/.test(obrigadoHtml), 'a página de obrigado já vem com o WhatsApp da equipe e noindex');

/* ---------- 2 a 4. na página ---------- */
const s = await sobe();
const COLETA = s.url + '/__coleta';
const leads = () => s.coleta.corpos.filter(x => x && x.leadId && x.tipo !== 'checkout');
const checkouts = () => s.coleta.corpos.filter(x => x && x.tipo === 'checkout');
const eventosColetados = () => s.coleta.corpos.filter(x => x && x.tipo === 'evento').flatMap(x => x.eventos || []);
const ate = async (f, ms = 5000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return true; await espera(100); } return false; };
const abertos = [];
async function abre({ config = {}, estadoPro = null } = {}) {
  const extra = estadoPro ? `if (!sessionStorage.getItem('qz:teste-pro')) { sessionStorage.setItem('qz:teste-pro', '1'); localStorage.setItem('qz:estado:pro', ${JSON.stringify(JSON.stringify(estadoPro))}); }` : '';
  const c = await abreChrome({ antes: scriptTeste({ config: Object.assign({ endpoint: COLETA }, config), extra }) });
  abertos.push(c);
  return { c, q: quiz(c) };
}
const textoDe = (c, sel) => c.avalia(`(document.querySelector(${JSON.stringify(sel)})?.innerText || '').replace(/\\u00a0/g, ' ')`);
const varre = (q, nome) => {
  const achados = [...new Set(q.textos.flatMap(t => confereTextoVenda(t.texto, LIBERADO).map(a => `${t.id}: ${a}`)))];
  ok(!achados.length, `${nome}: ${q.textos.length} leituras de tela dentro das regras da casa` + (achados.length ? ' | ' + achados.slice(0, 3).join(' | ') : ''));
};

try {
  /* (2) adulto tier A, ponta a ponta, com o checkout trocado por uma página local (o teste não sai pra Sinnu) */
  {
    s.coleta.corpos.length = 0;
    const { c, q } = await abre({ config: { checkout: { url: s.url + '/robots.txt', produto: 'scouting-pro' } } });
    try {
      await q.abre(s.url + '/?v=pro&utm_source=teste&utm_campaign=variante');
      await q.posicao('LD'); await q.idade('18_21'); await q.peneiras('6_mais', '500_2000'); await q.dispensas('3_5', 'sim');
      await q.inimigo(); await q.zyron(); await q.video('lances'); await q.mundo(); await q.historico(); await q.sonho('europa');
      await q.audio('fim'); await q.quer('sim'); await q.chance('familia');
      ok((await textoDe(c, '.t-chance')).includes('diagnóstico sai em instantes'), 'adulto: a T13 da variante não promete avaliação gratuita');
      await q.contato(CONTATO); await q.resultado();
      ok((await c.avalia(`document.querySelector('#barra .btn')?.dataset.destino || ''`)) === 'oferta', 'adulto: o botão do resultado segue pra oferta');
      ok((await textoDe(c, '#barra .btn')).includes('Ver como começar'), 'adulto: o botão do resultado diz "Ver como começar"');
      ok(!(await c.avalia(`!!document.querySelector('a[href*="wa.me"]') || !!document.querySelector('#barra .btn')?.dataset.url`)), 'adulto: nada de WhatsApp nem landing no resultado');
      ok((await textoDe(c, '.t-resultado .indica')).includes('O primeiro passo é o Zyron ler o seu jogo'), 'adulto: o diagnóstico não atribui o encaminhamento ao primeiro passo');
      await q.continua(); await q.oferta();
      ok(igual(await q.telas(), TODAS), `adulto: as 16 telas na ordem (${(await q.telas()).length})`);
      const t = await textoDe(c, '.t-oferta');
      ok(t.includes('Faça o Zyron ler o seu jogo') && t.includes('A sua família já investiu entre R$ 500 e R$ 2.000 pra você ser visto'), 'adulto: título da oferta e a linha com o que a família já investiu');
      ok((await c.avalia(`document.querySelector('.oferta-ancora s')?.textContent.replace(/\\u00a0/g, ' ')`)) === 'R$ 247,90' && t.includes('por R$ 67,90'), 'adulto: "De R$ 247,90" riscado e "por R$ 67,90"');
      ok((await c.avalia(`document.querySelectorAll('.oferta-itens li').length`)) === 6 && t.includes('Scouting PRO · Voxen'), 'adulto: o cartão do Scouting PRO · Voxen com as seis entregas');
      ok(t.includes('Garantia total, sem prazo.') && t.includes('Todo o valor investido é devolvido. Sem burocracia.') && t.includes('comprovar que o método foi aplicado'), 'adulto: a garantia total, com a condição na mesma tela');
      const termos = await c.avalia(`(() => { const a = document.querySelector('.oferta-garantia a'); return a ? [a.href, a.target, Math.round(a.getBoundingClientRect().height)] : null; })()`);
      ok(termos && termos[0] === 'https://aizyron.com/termos' && termos[1] === '_blank' && termos[2] >= 44, 'adulto: o link dos Termos abre noutra aba, com alvo de toque de 44 px');
      ok(!(await c.avalia(`!!document.querySelector('.oferta-nota')`)) && t.includes('O encaminhamento a clubes faz parte dos planos de assessoria'), 'adulto: sem a linha do responsável e com a linha do que o produto não inclui');
      ok((await textoDe(c, '#barra')).includes('Quero o meu Scouting PRO') && (await textoDe(c, '#barra .barra-nota')).includes('R$ 67,90 · pagamento único e seguro'), 'adulto: o botão "Quero o meu Scouting PRO" com o preço embaixo');
      ok(!(await c.avalia(`document.getElementById('voltar').hidden`)), 'adulto: a oferta tem o voltar');
      const lead = leads()[leads().length - 1];
      const url = await c.avalia(`document.querySelector('#barra .btn')?.dataset.url || ''`);
      const u = new URL(url);
      ok(u.pathname === '/robots.txt' && u.searchParams.get('utm_source') === 'teste' && u.searchParams.get('utm_campaign') === 'variante', 'adulto: o checkout recebe as UTMs do anúncio');
      ok(!!lead && !/Jo[aã]ozinho|11955554444|lid=|qz=|t=A/i.test(decodeURIComponent(url)) && !url.includes(lead.leadId), 'adulto: o link do checkout sem nome, telefone, leadId nem tier');
      ok(!!lead && lead.tecnico.variante === 'scouting-pro' && lead.consentimento.textoVersao === vg.aceiteVersao && /também sobre o Scouting PRO/.test(lead.consentimento.texto), 'adulto: o lead leva a variante e o aceite novo, com a versão dele');
      const erros = lead ? validaSchema(schema, lead) : ['sem lead'];
      ok(!erros.length, 'adulto: o lead da variante valida no schema' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));
      ok((await q.eventos()).some(e => e.e === 'oferta_view' && e.p.tier === 'A'), 'adulto: o evento oferta_view sai com o tier');
      varre(q, 'adulto');

      await q.toca('#barra .btn');
      ok(await c.ate(`location.pathname === '/robots.txt'`, 6000), 'adulto: o botão abre o checkout');
      ok(await ate(() => checkouts().length > 0), 'adulto: a ida ao checkout chega no destino dos leads');
      const ck = checkouts()[0];
      ok(!!ck && !!lead && ck.leadId === lead.leadId && ck.variante === 'scouting-pro' && ck.produto === 'scouting-pro' && /^\d{4}-\d{2}-\d{2}T/.test(ck.em), 'adulto: a ida ao checkout tem o leadId do lead, a variante, o produto e a hora');
      ok(!!ck && igual(Object.keys(ck).sort(), ['em', 'leadId', 'produto', 'tipo', 'v', 'variante']), 'adulto: a ida ao checkout não leva contato nenhum');
      ok(leads().length === 1, `adulto: a ida ao checkout não duplica o lead (${leads().length} lead)`);
      await ate(() => eventosColetados().some(e => e.e === 'checkout_click'), 4000);
      const evs = eventosColetados();
      ok(evs.some(e => e.e === 'checkout_click' && e.p.produto === 'scouting-pro' && e.p.tier === 'A') && evs.some(e => e.e === 'quiz_view' && e.p.variante === 'scouting-pro'), 'adulto: os eventos quiz_view (com a variante) e checkout_click chegam');
      const pii = confereEventos(evs, { nome: 'Joãozinho', telefone: '11955554444' });
      ok(!pii.length, `adulto: ${evs.length} eventos sem dado de pessoa` + (pii.length ? ' | ' + pii.slice(0, 3).join(' | ') : ''));
    } catch (e) {
      ok(false, 'adulto: ' + e.message);
      try { console.log('      está em ' + (await q.tela()) + '; telas: ' + (await q.telas()).join(' > ')); } catch { /* nada */ }
    }
  }

  /* (3) menor de 15 a 17, entrando pela retomada na T14 (o resto do quiz já foi conferido acima) */
  {
    s.coleta.corpos.length = 0;
    const estadoPro = estadoSalvo(respostasAte('contato', { idade: '15_17', posicao: 'MC' }), 'contato');
    const { c, q } = await abre({ estadoPro });
    try {
      await c.vai(s.url + '/?v=pro&utm_source=teste#/contato');
      await q.contato({ nome: 'Joãozinho', responsavel: 'Maria Souza', zap: '11955554444' });
      await q.resultado();
      const lead = leads()[leads().length - 1];
      ok(!!lead && lead.contato.responsavelNome === 'Maria Souza' && /^Sou o responsável por Joãozinho\. Aceito receber/.test(lead.consentimento.texto) && /Scouting PRO/.test(lead.consentimento.texto), 'menor: o aceite do responsável com o texto da variante');
      await q.continua(); await q.oferta();
      ok((await textoDe(c, '.oferta-nota')).includes('O pagamento é feito por um responsável.'), 'menor: a oferta diz que o pagamento é feito por um responsável');
      const url = await c.avalia(`document.querySelector('#barra .btn')?.dataset.url || ''`);
      ok(url.startsWith('https://pay.sinnu.com.br/H8ups0dI') && new URL(url).searchParams.get('utm_source') === 'teste', 'menor: o botão aponta pro link de verdade da Sinnu, com a UTM');
      varre(q, 'menor');

      // recarregar na oferta volta pra oferta; o voltar leva ao resultado
      await c.vai(s.url + '/?v=pro');
      await q.esperaTela('oferta', 12000);
      ok(true, 'menor: recarregar na oferta volta pra oferta');
      await q.toca('#voltar');
      await q.esperaTela('resultado', 6000);
      ok(true, 'menor: o voltar da oferta leva ao resultado');
      const chaves = await c.avalia(`[JSON.parse(localStorage.getItem('qz:estado:pro') || 'null'), localStorage.getItem('qz:estado')]`);
      ok(chaves[0] && chaves[0].enviado === true && !chaves[0].respostas.nome && !chaves[0].respostas.whatsapp && chaves[1] === null, 'menor: o progresso fica na chave da variante, sem contato, e a do quiz de sempre continua vazia');

      // o quiz de sempre, no mesmo aparelho, começa do zero e termina no WhatsApp como sempre
      await c.vai(s.url + '/');
      await q.esperaTela('posicao', 12000);
      ok(!(await c.avalia(`!!document.querySelector('.retomada')`)), 'menor: o quiz de sempre não oferece retomar o progresso da variante');

      // a página de obrigado: a mensagem do WhatsApp fala como o responsável e leva o código do diagnóstico
      await c.vai(s.url + '/obrigado/');
      ok(await c.ate(`document.getElementById('zap')?.dataset.pronto === '1'`, 6000), 'obrigado: o botão do WhatsApp fica pronto');
      const href = await c.avalia(`document.getElementById('zap').href`);
      const texto = href.startsWith('https://wa.me/5551982690162?text=') ? decodeURIComponent(href.split('?text=')[1]) : '';
      const codigo = String(chaves[0].leadId).replace(/-/g, '').slice(0, 8).toUpperCase();
      ok(texto.startsWith('Olá! Sou responsável por um atleta') && texto.includes('Código do diagnóstico: ' + codigo), 'obrigado: a mensagem fala como o responsável e leva o código do diagnóstico');
      ok(!/Jo[aã]ozinho|Maria|11955554444/.test(texto), 'obrigado: a mensagem não leva nome nem telefone');
      const alto = await c.avalia(`Math.round(document.getElementById('zap').getBoundingClientRect().height)`);
      ok(alto >= 56 && !c.console_.some(l => l.startsWith('EXC')), `obrigado: botão de ${alto} px e nenhum erro de JavaScript`);
    } catch (e) {
      ok(false, 'menor: ' + e.message);
      try { console.log('      está em ' + (await q.tela()) + '; telas: ' + (await q.telas()).join(' > ')); } catch { /* nada */ }
    }
  }

  /* (4) tier C: a variante não manda pro Instagram; ele vê a tela do B e a oferta, e o tier real vai no evento */
  {
    s.coleta.corpos.length = 0;
    const respostas = { posicao: 'ADD', idade: '22_mais', peneiras: '1_2', gasto: 'nada', dispensas: '0', viuOlhometro: true, viuInimigo: true, viuZyron: true, video: 'nada',
      viuMundo: true, viuHistorico: true, sonho: 'chance', audio: { estado: 'nao_tocou', pct: 0 }, quer: 'nao_sei', compromisso: false, chance: 'nao_sei' };
    const { c, q } = await abre({ estadoPro: estadoSalvo(respostas, 'contato') });
    try {
      await c.vai(s.url + '/?v=pro#/contato');
      await q.contato(CONTATO); await q.resultado();
      const lead = leads()[leads().length - 1];
      ok(!!lead && lead.pontuacao.tier === 'C', `tier C: o lead é tier C (${lead && lead.pontuacao.total} pontos)`);
      ok((await c.avalia(`!!document.querySelector('.t-resultado .selo') && document.querySelector('#barra .btn')?.dataset.destino === 'oferta'`)), 'tier C: a tela do B (selo) e o botão pra oferta, sem Instagram');
      await q.continua(); await q.oferta();
      ok((await textoDe(c, '.t-oferta')).includes('Você já fez 1 ou 2 peneiras. Agora o seu jogo é medido por dados, não a olho.'), 'tier C: a linha pessoal de quem fez peneira e não gastou');
      ok((await q.eventos()).some(e => e.e === 'oferta_view' && e.p.tier === 'C'), 'tier C: o oferta_view leva o tier real');
      varre(q, 'tier C');
    } catch (e) {
      ok(false, 'tier C: ' + e.message);
      try { console.log('      está em ' + (await q.tela()) + '; telas: ' + (await q.telas()).join(' > ')); } catch { /* nada */ }
    }
  }
} finally {
  for (const c of abertos) await c.fecha();
  await s.fecha();
  fim();
}
