// T11 sem segurar: um toque na resposta e a tela já segue pra T12 (nada de segurar nem de confirmar). "Quero" e "Quero, mas já me
// decepcionei" valem o compromisso (a pontuação e o payload ficam como antes: 40, 29 e 5 pontos); "Ainda não sei" não vale. Quem
// volta com o estado gravado no formato antigo (quer = sim e compromisso = false) segue sem ter de segurar nada.
// Uso: node testes/teste-quer.mjs
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, scriptTeste, estadoSalvo, respostasAte } from './_quiz.mjs';

const { ok, fim } = verificador('T11 sem segurar');
const s = await sobe();
const COLETA = s.url + '/__coleta';
const leads = () => s.coleta.corpos.filter(x => x && x.leadId);
const abertos = [];

async function naT11(respostas = respostasAte('quer', { quer: undefined, compromisso: undefined })) {
  const c = await abreChrome({ antes: scriptTeste({ config: { endpoint: COLETA }, estado: estadoSalvo(respostas, 'quer') }) });
  abertos.push(c);
  const q = quiz(c);
  await c.vai(s.url + '/#/quer');
  await q.esperaTela('quer', 15000);
  return { c, q };
}

try {
  for (const [id, compromisso, pontos] of [['sim', true, 40], ['receio', true, 29], ['nao_sei', false, 5]]) {
    s.coleta.corpos.length = 0;
    const { c, q } = await naT11();
    const t0 = Date.now();
    await q.toca(`.t-quer .opcao[data-id="${id}"]`);
    await q.esperaTela('chance', 6000);
    const seg = (Date.now() - t0) / 1000;
    const limite = id === 'receio' ? 3.5 : 2.5;
    ok(seg < limite, `${id}: um toque e a T12 abre em ${seg.toFixed(1)} s (limite ${limite} s, com a frase de uma linha no meio)`);
    ok(!(await c.avalia(`!!document.querySelector('.segurar, .segurar-botao')`)), `${id}: nenhum "segurar" aparece em momento nenhum`);
    await q.chance('familia'); await q.contato({ nome: 'Teste', zap: '11955554444' }); await q.resultado();
    for (let i = 0; i < 40 && !leads().length; i++) await espera(100);
    const p = leads()[leads().length - 1];
    ok(p && p.quiz.quer === id && p.quiz.compromisso === compromisso, `${id}: o payload leva quer "${id}" e compromisso ${compromisso}`);
    ok(p && p.pontuacao.porRegra.quer + p.pontuacao.porRegra.compromisso === pontos, `${id}: ${pontos} pontos entre quer e compromisso, como antes (${p && p.pontuacao.porRegra.quer + p.pontuacao.porRegra.compromisso})`);
    const eventos = (await q.eventos()).map(e => e.e);
    ok(!eventos.includes('compromisso'), `${id}: sem o antigo evento "compromisso" (o de segurar)`);
    await c.fecha();
  }

  /* o toque em qualquer lugar pula a frase e segue na hora */
  {
    const { c, q } = await naT11();
    const t0 = Date.now();
    await q.toca('.t-quer .opcao[data-id="receio"]');
    await espera(250);
    await q.toca('.t-quer h1');
    await q.esperaTela('chance', 3000);
    ok(Date.now() - t0 < 2500, 'receio: um segundo toque pula a frase e segue na hora');
    await c.fecha();
  }

  /* estado gravado no formato antigo: quer = sim sem o compromisso (parou antes de segurar) */
  {
    s.coleta.corpos.length = 0;
    const { c, q } = await naT11(respostasAte('quer', { quer: 'sim', compromisso: false }));
    await c.ate(`!!document.querySelector('#barra .btn')`, 4000);
    ok(!(await c.avalia(`!!document.querySelector('.segurar-botao')`)), 'estado antigo: a T11 já mostra o Continuar, sem segurar');
    await q.continua(); await q.chance('familia'); await q.contato({ nome: 'Teste', zap: '11955554444' }); await q.resultado();
    for (let i = 0; i < 40 && !leads().length; i++) await espera(100);
    const p = leads()[leads().length - 1];
    ok(p && p.quiz.compromisso === true && p.pontuacao.porRegra.compromisso === 12, 'estado antigo: o compromisso vale 12 pontos, como valeria depois do segurar');
    await c.fecha();
  }
} finally {
  for (const c of abertos) { try { await c.fecha(); } catch { /* já fechado */ } }
  await s.fecha();
}
fim();
