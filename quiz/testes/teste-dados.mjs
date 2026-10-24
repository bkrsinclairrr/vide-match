// Dados: o payload valida no schema (config/payload.schema.json) e passa pela regra de ficha do próprio Painel do Closer
// (limpaFicha de apresentacoes/jogador-de-elite-closer/api/_base.js, só leitura): chave que o painel não conhece ou valor fora do
// limite some lá, e aqui vira falha. Nenhum evento leva nome, telefone, e-mail, idade exata nem leadId. A URL da landing não leva
// contato. A fila reenvia depois de falha de rede e de tempo limite (8 s), com recuo, sem duplicar (mesmo leadId). Sem endpoint,
// modo de ensaio: o payload fica só na aba e nada sai do aparelho.
// Uso: node testes/teste-dados.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, scriptTeste, estadoSalvo, respostasAte, caminhoCompleto } from './_quiz.mjs';
import { contratos, validaSchema, confereEventos } from './_util.mjs';

const { ok, fim } = verificador('Dados');
const { schema } = contratos();
const s = await sobe();
const COLETA = s.url + '/__coleta';
const leads = () => s.coleta.corpos.filter(x => x && x.leadId);
// todo Chrome aberto fecha no fim, mesmo se um bloco falhar no meio
const abertos = [];
const abre = async op => { const c = await abreChrome(op); abertos.push(c); return c; };
const lotes = () => s.coleta.corpos.filter(x => x && x.tipo === 'evento');

// a regra de ficha do painel. O painel mora no repositório mnkk (apresentacoes/jogador-de-elite-closer/api/_base.js), fora deste:
// aponte a variável de ambiente PAINEL_BASE pro arquivo, ou deixe no endereço padrão desta máquina. Sem o painel, o teste avisa e
// confere só o schema.
let painel = null;
const PAINEL_CANDIDATOS = [process.env.PAINEL_BASE, 'C:/Users/Me/Desktop/mnkk/apresentacoes/jogador-de-elite-closer/api/_base.js'].filter(Boolean);
for (const arq of PAINEL_CANDIDATOS) {
  if (!fs.existsSync(arq)) continue;
  try { painel = await import(pathToFileURL(path.resolve(arq)).href); break; } catch (e) { console.log('AVISO painel não abriu (' + e.message.slice(0, 80) + ')'); }
}
if (!painel) console.log('AVISO painel não encontrado (defina PAINEL_BASE): confiro só o schema');
function conferePainel(ficha, rotulo) {
  if (!painel) return;
  const fora = Object.keys(ficha).filter(k => !painel.CHAVES_FICHA.includes(k));
  ok(!fora.length, `${rotulo}: toda chave da ficha existe no painel` + (fora.length ? ' (fora: ' + fora.join(', ') + ')' : ''));
  const limpa = painel.limpaFicha(ficha, null, 'r2');
  const perdeu = Object.entries(ficha).filter(([k, v]) => String(limpa[k] ?? '') !== String(v));
  ok(!perdeu.length, `${rotulo}: o painel aceita a ficha inteira, sem cortar nada` + (perdeu.length ? ' (' + perdeu.map(([k, v]) => `${k}=${JSON.stringify(v)} virou ${JSON.stringify(limpa[k])}`).join('; ') + ')' : ''));
}

try {
  /* ---------- 1. adulto, tier A, com UTMs e fbclid na URL, sem pixel configurado ---------- */
  {
    const c = await abre({ antes: scriptTeste({ config: { endpoint: COLETA } }) });
    const q = quiz(c);
    await q.abre(s.url + '/?utm_source=instagram&utm_medium=paid&utm_campaign=teste&fbclid=FB123&gclid=GC456');
    await caminhoCompleto(q, { contato: { nome: 'João', zap: '11912345678' } });
    for (let i = 0; i < 40 && !leads().length; i++) await espera(100);
    const p = leads()[0];
    ok(!!p, 'o lead chegou ao destino');
    if (p) {
      const erros = validaSchema(schema, p);
      ok(!erros.length, 'payload do adulto valida no schema' + (erros.length ? ': ' + erros.slice(0, 4).join(' | ') : ''));
      conferePainel(p.ficha, 'adulto');
      ok(p.ficha.origem === 'Zyron' && p.quiz.canal === 'Quiz Zyron', 'origem "Zyron" na ficha e canal "Quiz Zyron" no bloco do quiz');
      ok(p.ficha.mapaCalor === 'LD' && p.ficha.posicao === 'Lateral direito', 'a posição vira mapaCalor (LD) e o nome da posição');
      ok(p.contato.whatsapp === '+5511912345678' && p.contato.responsavelNome === null, 'WhatsApp em E.164 e sem responsável no adulto');
      ok(p.pontuacao.tier === 'A' && p.pontuacao.maximo === 100, `tier ${p.pontuacao.tier} com ${p.pontuacao.total} de ${p.pontuacao.maximo}`);
      ok(p.rastreio.utm_source === 'instagram' && p.rastreio.utm_campaign === 'teste', 'as UTMs da campanha vão no payload');
      ok(p.rastreio.fbclid === null && p.rastreio.gclid === null && p.tecnico.sessaoId === null, 'sem aceite de cookies: nem fbclid, nem gclid, nem sessaoId');
      ok(p.tecnico.modoEnsaio === false && p.consentimento.aceite === true && /Li a Política de Privacidade\.$/.test(p.consentimento.texto), 'aceite com o texto exato e fora do modo de ensaio');
      const eventos = await q.eventos();
      const todos = eventos.concat(...lotes().map(l => l.eventos));
      const achados = confereEventos(todos, { nome: 'João', telefone: '11912345678', leadId: p.leadId });
      ok(todos.length > 20 && !achados.length, `${todos.length} eventos sem nome, telefone, e-mail, idade nem leadId` + (achados.length ? ': ' + achados.slice(0, 3).join(' | ') : ''));
      ok(lotes().length > 0 && lotes().every(l => !('leadId' in l) && l.sessaoId), 'os lotes de eventos chegam com sessaoId e sem leadId');
      const href = await c.avalia(`document.querySelector('#barra .btn')?.dataset.url || ''`);
      ok(/[?&]qz=1/.test(href) && /[?&]t=A/.test(href) && href.includes('lid=' + p.leadId) && /utm_source=instagram/.test(href), 'a landing recebe qz, tier, lid e as UTMs');
      ok(!/Jo%C3%A3o|João|912345678|whatsapp|nome=|fbclid|gclid/i.test(href), 'a landing não recebe nome, telefone nem identificador de clique');
      // depois do envio, o contato some do aparelho
      const guardado = await c.avalia(`localStorage.getItem('qz:estado') || ''`);
      ok(!/João|912345678/.test(guardado), 'depois do envio, nome e telefone não ficam no aparelho');
    }
    await c.fecha();
  }

  /* ---------- 2. menor de 15 a 17, com responsável ---------- */
  {
    s.coleta.corpos.length = 0;
    const c = await abre({ antes: scriptTeste({ config: { endpoint: COLETA } }) });
    const q = quiz(c);
    await q.abre(s.url + '/?fbclid=FB999');
    await caminhoCompleto(q, { idade: '15_17', contato: { nome: 'Pedro', responsavel: 'Maria Souza', zap: '21987654321' } });
    for (let i = 0; i < 40 && !leads().length; i++) await espera(100);
    const p = leads()[0];
    ok(!!p, 'o lead do menor chegou ao destino');
    if (p) {
      const erros = validaSchema(schema, p);
      ok(!erros.length, 'payload do menor valida no schema' + (erros.length ? ': ' + erros.slice(0, 4).join(' | ') : ''));
      conferePainel(p.ficha, 'menor');
      ok(p.contato.responsavelNome === 'Maria Souza' && !('responsavelPresente' in p.consentimento), 'contato e aceite do responsável (sem o antigo "responsável presente" da T02)');
      ok(p.consentimento.texto.startsWith('Sou o responsável por Pedro e aceito'), 'o texto do aceite do menor leva o nome do atleta');
      ok(p.rastreio.fbclid === null && p.tecnico.sessaoId === null, 'menor: sem fbclid e sem sessaoId, em momento nenhum');
      const achados = confereEventos((await q.eventos()).concat(...lotes().map(l => l.eventos)), { nome: 'Pedro', telefone: '21987654321', leadId: p.leadId });
      const achados2 = confereEventos((await q.eventos()), { nome: 'Maria' });
      ok(!achados.length && !achados2.length, 'eventos do menor sem nome dele, do responsável, telefone nem leadId');
    }
    await c.fecha();
  }

  /* ---------- 3. a fila: falha de rede, depois tempo limite, sem duplicar ---------- */
  {
    s.coleta.corpos.length = 0;
    s.coleta.falhar = true;
    const c = await abre({ antes: scriptTeste({ config: { endpoint: COLETA, endpointEventos: s.url + '/__eventos-fora' }, estado: estadoSalvo(respostasAte('contato'), 'contato') }) });
    const q = quiz(c);
    await c.vai(s.url + '/#/contato');
    await q.contato({ nome: 'Ana', zap: '31998765432' });
    await q.resultado();
    await espera(1200);
    const fila1 = await c.avalia('window.__qz.envio.fila.map(i => i.id)');
    ok(leads().length === 0 && fila1.length === 1, 'rede caiu: nada chegou e o lead está na fila do aparelho');
    const ev1 = (await q.eventos()).filter(e => e.e === 'lead_fila').length;
    ok(ev1 >= 1, 'evento lead_fila registrado (' + ev1 + ')');
    s.coleta.falhar = false;
    // as tentativas seguem o recuo (1, 3 e 10 s): a próxima pode demorar até 10 s
    for (let i = 0; i < 160 && !leads().length; i++) await espera(100);
    ok(leads().length === 1 && leads()[0].leadId === fila1[0], 'a rede voltou: o recuo reenviou o mesmo lead (leadId igual)');
    // o aparelho só tira o item da fila quando a resposta volta, alguns milissegundos depois de o destino receber o lead
    ok(await c.ate('window.__qz.envio.fila.length === 0', 3000, 50), 'a fila esvaziou depois do envio');
    await c.vai(s.url + '/');
    await espera(2500);
    ok(leads().length === 1, 'recarregar depois de enviar não reenvia');

    // tempo limite: o destino demora 9 s; o quiz desiste em 8 s e tenta de novo; o destino faz upsert pelo leadId
    s.coleta.corpos.length = 0;
    s.coleta.atraso = 9000;
    const c2 = await abre({ antes: scriptTeste({ config: { endpoint: COLETA, endpointEventos: s.url + '/__eventos-fora' }, estado: estadoSalvo(respostasAte('contato'), 'contato') }) });
    const q2 = quiz(c2);
    await c2.vai(s.url + '/#/contato');
    // o relógio começa no toque em enviar (não no resultado, que chega depois da transição e deixava a margem no limite)
    await q2.esperaTela('contato');
    await q2.toca('#f-nome'); await c2.digita('Bia');
    await q2.toca('#f-whatsapp'); await c2.digita('41998765432');
    await q2.toca('.t-contato .caixa'); await espera(150);
    const t0 = Date.now();
    await q2.toca('#barra .btn');
    await q2.resultado();
    await c2.ate(`window.__qzEventos.some(e => e.e === 'lead_fila')`, 14000, 200);
    const tFila = (Date.now() - t0) / 1000;
    ok(tFila > 7 && tFila < 10.5, `tempo limite: a tentativa caiu na fila em cerca de 8 s depois do envio (${tFila.toFixed(1)} s)`);
    s.coleta.atraso = 0;
    await c2.ate(`window.__qzEventos.some(e => e.e === 'lead_enviado')`, 15000, 200);
    await espera(1500);
    const ids = new Set(leads().map(x => x.leadId));
    ok(leads().length >= 1 && ids.size === 1, `chegaram ${leads().length} entregas do mesmo leadId (o destino faz upsert: ${ids.size} lead)`);
    await c2.fecha();
    await c.fecha();
  }

  /* ---------- 4. modo de ensaio: sem endpoint, nada sai do aparelho ---------- */
  {
    s.coleta.corpos.length = 0;
    const c = await abre({ antes: scriptTeste({ config: { endpoint: '', endpointEventos: '' }, estado: estadoSalvo(respostasAte('contato'), 'contato') }) });
    const q = quiz(c);
    await c.vai(s.url + '/#/contato');
    await q.contato({ nome: 'Caio', zap: '51998765432' });
    await q.resultado();
    await espera(800);
    const ensaio = await c.avalia(`JSON.parse(sessionStorage.getItem('qz:ensaio') || '[]')`);
    ok(ensaio.length === 1 && ensaio[0].tecnico.modoEnsaio === true, 'modo de ensaio: o payload fica só nesta aba, marcado como ensaio');
    ok(!validaSchema(schema, ensaio[0]).length, 'o payload do ensaio também valida no schema');
    const posts = c.pedidos.filter(r => r.metodo === 'POST');
    ok(posts.length === 0 && leads().length === 0, 'nenhum POST saiu do aparelho (' + posts.length + ')');
    await c.fecha();
  }
} catch (e) {
  ok(false, 'erro: ' + e.message);
} finally {
  for (const c of abertos) await c.fecha().catch(() => {});
  await s.fecha();
  fim();
}
