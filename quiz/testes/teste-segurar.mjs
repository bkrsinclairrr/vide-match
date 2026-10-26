// Segurar pra confirmar (T11), com toque por CDP: soltar antes de 1,6 s volta o anel e não avança; completar avança em 500 ms;
// Enter e Espaço confirmam direto; "Confirmar sem segurar" funciona. Em todos, o compromisso chega ao estado.
// Uso: node testes/teste-segurar.mjs
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, scriptTeste, estadoSalvo, respostasAte } from './_quiz.mjs';

const { ok, fim } = verificador('Segurar pra confirmar');
const s = await sobe();
const abertos = [];
async function naT11() {
  const c = await abreChrome({ antes: scriptTeste({ estado: estadoSalvo(respostasAte('quer'), 'quer') }) });
  abertos.push(c);
  const q = quiz(c);
  await c.vai(s.url + '/#/quer');
  await q.esperaTela('quer', 15000);
  await q.toca('.t-quer .opcao[data-id="sim"]');
  await c.ate(`!!document.querySelector('.segurar-botao')`, 4000);
  await espera(500);
  return { c, q };
}
const anel = c => c.avalia(`parseFloat(document.querySelector('.segurar .enche').style.strokeDashoffset || '339.3')`);
const compromisso = c => c.avalia(`window.__qz.estado.r.compromisso === true`);

try {
  /* soltar antes de 1,6 s: o anel volta, nada avança; depois, segurar até o fim avança em 500 ms */
  {
    const { c, q } = await naT11();
    const ct = await c.centro('.segurar-botao');
    await c.envia('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ct.x, y: ct.y, id: 1 }] });
    await espera(800);
    const meio = await anel(c);
    await c.envia('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    ok(meio < 339.3 * 0.75 && meio > 339.3 * 0.25, `segurando 0,8 s, o anel enche até a metade (traço ${meio.toFixed(0)} de 339)`);
    await espera(600);
    ok((await anel(c)) > 330 && (await q.tela()) === 'quer' && !(await compromisso(c)), 'soltou antes de 1,6 s: o anel volta, fica na T11 e sem compromisso');

    const t0 = Date.now();
    await c.envia('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ct.x, y: ct.y, id: 1 }] });
    await c.ate(`document.querySelector('.segurar-botao').classList.contains('ok')`, 3000, 20);
    const tOk = Date.now() - t0;
    await c.envia('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    ok(tOk > 1450 && tOk < 2000, `completou em ${(tOk / 1000).toFixed(2)} s de toque (1,6 s)`);
    ok(await compromisso(c), 'completar grava o compromisso');
    await c.ate(`window.__qzTelas.includes('chance')`, 3000, 20);
    const tAvanca = Date.now() - t0 - tOk;
    ok(tAvanca > 380 && tAvanca < 950, `avançou ${tAvanca} ms depois de completar (500 ms mais a troca de tela)`);
    await c.fecha();
  }

  /* Enter e Espaço confirmam */
  for (const [tecla, code, vk] of [['Enter', 'Enter', 13], [' ', 'Space', 32]]) {
    const { c, q } = await naT11();
    await c.avalia(`document.querySelector('.segurar-botao').focus(); true`);
    await c.tecla(tecla, code, vk);
    await espera(200);
    ok(await compromisso(c), `${tecla === ' ' ? 'Espaço' : 'Enter'} no botão confirma direto`);
    await q.esperaTela('chance');
    await c.fecha();
  }

  /* "Confirmar sem segurar" */
  {
    const { c, q } = await naT11();
    await q.toca('.segurar .link-btn');
    await espera(200);
    ok(await compromisso(c), '"Confirmar sem segurar" confirma');
    await q.esperaTela('chance');
    const ev = (await q.eventos()).filter(e => e.e === 'compromisso');
    ok(ev.length === 1, 'um evento "compromisso" por confirmação');
    await c.fecha();
  }
} catch (e) {
  ok(false, 'erro: ' + e.message);
} finally {
  for (const c of abertos) await c.fecha().catch(() => {});
  await s.fecha();
  fim();
}
