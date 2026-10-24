// O áudio da mãe (T10), no Chrome de teste com --autoplay-policy=no-user-gesture-required. Os cinco estados (nao_tocou, menos,
// mais_da_metade, ate_o_fim, erro) geram o evento e a pontuação certos no payload; seek pela onda (toque e setas); troca de
// velocidade; play() recusado mostra "Toque de novo"; arquivo ausente mostra "Continuar sem o áudio"; o Continuar aparece em 8 s
// sem toque; a onda vem do waveform.json (48 valores de 0 a 1) e as barras aparecem de verdade (altura medida).
// Uso: node testes/teste-audio.mjs
import { sobe } from './servidor.mjs';
import { abreChrome, espera, verificador } from './_cdp.mjs';
import { quiz, scriptTeste, estadoSalvo, respostasAte } from './_quiz.mjs';
import { lerJson, contratos } from './_util.mjs';

const { ok, fim } = verificador('Áudio');
const { copy } = contratos();
const A = copy.audio;
const onda = lerJson('assets/audio/waveform.json');
ok(Array.isArray(onda.barras) && onda.barras.length === 48 && onda.barras.every(v => typeof v === 'number' && v >= 0 && v <= 1), `waveform.json: ${onda.barras.length} valores, todos de 0 a 1 (duração ${onda.duracao} s)`);

const s = await sobe();
const COLETA = s.url + '/__coleta';
const leads = () => s.coleta.corpos.filter(x => x && x.leadId);
const abertos = [];
async function naT10({ audioArquivos = null, extra = '' } = {}) {
  const c = await abreChrome({ antes: scriptTeste({ config: { endpoint: COLETA }, audioArquivos, extra, estado: estadoSalvo(respostasAte('audio'), 'audio') }) });
  abertos.push(c);
  const q = quiz(c);
  await c.vai(s.url + '/#/audio');
  await q.esperaTela('audio', 15000);
  for (let i = 0; i < 6; i++) { if (!(await c.avalia(`!!document.querySelector('.abertura:not(.saindo)')`))) break; await q.toca('.abertura'); await espera(150); }
  await c.ate(`!!document.querySelector('.bolha')`, 8000);
  return { c, q };
}
// do Continuar da T10 até o payload
async function terminaEPega(c, q) {
  await c.ate(`!!document.querySelector('#barra .btn')`, 13000);
  await q.continua();
  await q.quer('sim'); await q.chance('familia'); await q.contato({ nome: 'Teste', zap: '11955554444' }); await q.resultado();
  for (let i = 0; i < 40 && !leads().length; i++) await espera(100);
  return leads()[leads().length - 1];
}
const nomes = async q => (await q.eventos()).map(e => e.e + (e.p && e.p.estado ? ':' + e.p.estado : '') + (e.p && e.p.pct !== undefined && e.e === 'audio_progress' ? ':' + e.p.pct : ''));

try {
  /* nao_tocou: o Continuar aparece em 8 s sem toque */
  {
    s.coleta.corpos.length = 0;
    const { c, q } = await naT10();
    const barras = await c.avalia(`[...document.querySelectorAll('.onda i')].map(i => i.getBoundingClientRect().height)`);
    ok(barras.length === 48 && barras.every(h => h >= 2), `as 48 barras da onda aparecem (altura de ${Math.min(...barras).toFixed(1)} a ${Math.max(...barras).toFixed(1)} px)`);
    const t0 = Date.now();
    await c.ate(`!!document.querySelector('#barra .btn')`, 14000, 100);
    const seg = (Date.now() - t0) / 1000;
    ok(seg > 6.5 && seg < 9.5, `sem tocar, o Continuar aparece em cerca de 8 s (${seg.toFixed(1)} s)`);
    const p = await terminaEPega(c, q);
    const ev = await nomes(q);
    ok(p && p.quiz.audio.estado === 'nao_tocou' && p.pontuacao.porRegra.audio === 0, 'nao_tocou: estado no payload e 0 ponto');
    ok(ev.includes('audio_view') && ev.includes('audio_skip:nao_tocou') && !ev.some(e => e.startsWith('audio_play')), 'nao_tocou: eventos audio_view e audio_skip, sem audio_play');
    await c.fecha();
  }

  /* menos: toca 1 s e pausa; seek pelas setas e troca de velocidade no caminho */
  {
    s.coleta.corpos.length = 0;
    const { c, q } = await naT10();
    await q.toca('.bolha-play');
    await c.ate(`window.__qzAudio && !window.__qzAudio.paused && window.__qzAudio.duration > 0`, 8000);
    ok((await c.avalia(`document.querySelector('.bolha-play').getAttribute('aria-label')`)) === A.pausar, 'tocando, o botão vira "Pausar áudio"');
    await espera(900);
    // velocidade: 1x, 1,5x, 2x e de volta a 1x
    const vel = [];
    for (let i = 0; i < 3; i++) { await q.toca('.bolha-vel'); await espera(120); vel.push(await c.avalia(`[window.__qzAudio.playbackRate, document.querySelector('.bolha-vel').textContent]`)); }
    ok(JSON.stringify(vel) === JSON.stringify([[1.5, '1,5x'], [2, '2x'], [1, '1x']]), 'velocidade: 1,5x, 2x e de volta a 1x (' + vel.map(v => v[1]).join(', ') + ')');
    await q.toca('.bolha-play');
    await espera(200);
    const antes = await c.avalia('window.__qzAudio.currentTime');
    await c.avalia(`document.querySelector('.onda').focus(); true`);
    await c.tecla('ArrowRight', 'ArrowRight', 39);
    const depois = await c.avalia('window.__qzAudio.currentTime');
    ok(depois - antes > 4 && depois - antes < 6, `seta pra direita na onda avança 5 s (${antes.toFixed(1)} s para ${depois.toFixed(1)} s)`);
    await c.tecla('ArrowLeft', 'ArrowLeft', 37);
    ok(Math.abs((await c.avalia('window.__qzAudio.currentTime')) - antes) < 0.6, 'seta pra esquerda volta 5 s');
    const p = await terminaEPega(c, q);
    const ev = await nomes(q);
    ok(p && p.quiz.audio.estado === 'menos' && p.pontuacao.porRegra.audio === 0, 'menos: estado no payload e 0 ponto');
    ok(ev.includes('audio_play') && ev.includes('audio_pause') && ev.includes('audio_seek') && ev.includes('audio_skip:menos'), 'menos: eventos audio_play, audio_pause, audio_seek e audio_skip');
    await c.fecha();
  }

  /* mais_da_metade: toque na onda leva pra 60% (seek por ponteiro), toca e pausa */
  {
    s.coleta.corpos.length = 0;
    const { c, q } = await naT10();
    await q.toca('.bolha-play');
    await c.ate(`window.__qzAudio && !window.__qzAudio.paused && window.__qzAudio.duration > 0`, 8000);
    const r = await c.avalia(`(() => { const r = document.querySelector('.onda').getBoundingClientRect(); return { x: r.left + r.width * 0.6, y: r.top + r.height / 2 }; })()`);
    await c.envia('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', buttons: 1, clickCount: 1 });
    await c.envia('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', buttons: 0, clickCount: 1 });
    const fr = await c.avalia('window.__qzAudio.currentTime / window.__qzAudio.duration');
    ok(fr > 0.55 && fr < 0.65, `tocar a onda a 60% leva o áudio pra lá (${(fr * 100).toFixed(0)}%)`);
    await espera(900);
    await q.toca('.bolha-play');
    const p = await terminaEPega(c, q);
    const ev = await nomes(q);
    ok(p && p.quiz.audio.estado === 'mais_da_metade' && p.pontuacao.porRegra.audio === 3, 'mais_da_metade: estado no payload e 3 pontos');
    ok(ev.includes('audio_progress:50') && ev.includes('audio_skip:mais_da_metade'), 'mais_da_metade: audio_progress 50 e audio_skip');
    await c.fecha();
  }

  /* ate_o_fim: a onda enche, o botão vira "ouvir de novo", a linha "Agora imagine a sua." e o Continuar */
  {
    s.coleta.corpos.length = 0;
    const { c, q } = await naT10();
    await q.toca('.bolha-play');
    await c.ate(`window.__qzAudio && !window.__qzAudio.paused && window.__qzAudio.duration > 0`, 8000);
    await c.avalia('window.__qzAudio.currentTime = window.__qzAudio.duration - 1.2; true');
    await c.ate('window.__qzAudio.ended', 6000);
    await espera(400);
    ok((await c.avalia(`document.querySelector('.bolha-play').getAttribute('aria-label')`)) === A.ouvirDeNovo, 'no fim, o botão vira "ouvir de novo"');
    ok((await c.avalia(`document.querySelector('.t-audio .depois')?.textContent || ''`)) === A.depois && (await c.avalia(`!!document.querySelector('#barra .btn')`)), `no fim: "${A.depois}" e o Continuar`);
    ok((await c.avalia(`document.querySelectorAll('.onda i.on').length`)) === 48, 'no fim, a onda inteira acesa');
    const p = await terminaEPega(c, q);
    const ev = await nomes(q);
    ok(p && p.quiz.audio.estado === 'ate_o_fim' && p.pontuacao.porRegra.audio === 6, 'ate_o_fim: estado no payload e 6 pontos');
    ok(ev.includes('audio_end') && ev.includes('audio_progress:100') && !ev.some(e => e.startsWith('audio_skip')), 'ate_o_fim: audio_end e audio_progress 100, sem audio_skip');
    await c.fecha();
  }

  /* erro: os dois arquivos ausentes, "Não foi possível carregar o áudio." e "Continuar sem o áudio" */
  {
    s.coleta.corpos.length = 0;
    const { c, q } = await naT10({ audioArquivos: ['assets/audio/nao-existe-64k.mp3', 'assets/audio/nao-existe.mp3'] });
    await q.toca('.bolha-play');
    const viu = await c.ate(`(document.querySelector('.bolha-erro')?.textContent || '') === ${JSON.stringify(A.erro)}`, 8000);
    ok(viu, `arquivo ausente: "${A.erro}"`);
    ok((await c.avalia(`document.querySelector('#barra .btn')?.textContent || ''`)).includes(A.continuarSem), `arquivo ausente: o botão "${A.continuarSem}"`);
    const p = await terminaEPega(c, q);
    const ev = await nomes(q);
    ok(p && p.quiz.audio.estado === 'erro' && p.pontuacao.porRegra.audio === 0, 'erro: estado no payload e 0 ponto');
    ok(ev.includes('audio_error:erro'), 'erro: evento audio_error');
    await c.fecha();
  }

  /* play() recusado: "Toque de novo", e o segundo toque toca */
  {
    s.coleta.corpos.length = 0;
    const extra = `(() => { const orig = HTMLMediaElement.prototype.play; let vez = 0;
      HTMLMediaElement.prototype.play = function () { if (vez++ === 0) return Promise.reject(new DOMException('recusado no teste', 'NotAllowedError')); return orig.call(this); }; })();`;
    const { c, q } = await naT10({ extra });
    await q.toca('.bolha-play');
    const viu = await c.ate(`(document.querySelector('.bolha-aviso')?.textContent || '') === ${JSON.stringify(A.toqueDeNovo)}`, 4000);
    ok(viu, `play() recusado: a bolha mostra "${A.toqueDeNovo}"`);
    await q.toca('.bolha-play');
    ok(await c.ate(`window.__qzAudio && !window.__qzAudio.paused`, 6000), 'o segundo toque toca o áudio');
    ok((await nomes(q)).includes('audio_error:play_recusado'), 'evento audio_error com "play_recusado"');
    await c.fecha();
  }
} catch (e) {
  ok(false, 'erro: ' + e.message);
} finally {
  for (const c of abertos) await c.fecha().catch(() => {});
  await s.fecha();
  fim();
}
