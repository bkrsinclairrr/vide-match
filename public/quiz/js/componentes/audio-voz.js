// A mensagem de voz da mãe (T10): bolha recebida, onda real (waveform.json), velocidade, arrastar na onda e os caminhos de falha.
// Um <audio> só, criado uma vez: a T09 já começa o download no toque (o toque conta como gesto do atleta), a T10 toca.
// Tocar é sempre por toque (o navegador bloqueia autoplay, e não se tenta contornar). <audio> e não Web Audio: no iPhone toca no silencioso.
import { h, reduzMovimento, vibra } from '../motor/util.js';
import { icone } from './icones.js';

const ARQUIVOS = ['assets/audio/depoimento-mae-64k.mp3', 'assets/audio/depoimento-mae.mp3'];
let audio = null, arquivo = 0, falhou = false;
const ouvintesErro = new Set();

function elemento() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'none';
  audio.setAttribute('playsinline', '');
  audio.src = ARQUIVOS[0];
  // os testes por CDP precisam alcançar o elemento (ele não fica no DOM); não leva dado nenhum do atleta
  window.__qzAudio = audio;
  audio.addEventListener('error', () => {
    // o arquivo leve falhou: tenta o original; os dois falharam: avisa quem estiver ouvindo
    if (arquivo < ARQUIVOS.length - 1) { arquivo++; audio.src = ARQUIVOS[arquivo]; audio.load(); return; }
    falhou = true;
    ouvintesErro.forEach(f => f());
  });
  return audio;
}
export function precarregaAudio() {
  try { const a = elemento(); if (a.preload !== 'auto') { a.preload = 'auto'; a.load(); } } catch { /* sem áudio */ }
}
export function trocaArquivosParaTeste(lista) { ARQUIVOS.splice(0, ARQUIVOS.length, ...lista); if (audio) { audio.src = ARQUIVOS[0]; arquivo = 0; falhou = false; } }

const mmss = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

export function audioVoz({ ondas, duracao, textos, legendas, evento, aoFim, aoEstado, foto }) {
  const a = elemento();
  const reduz = reduzMovimento();
  let maxPct = 0, tocou = false, fim = false, arrastando = false, raf = 0;
  const marcos = new Set();
  const total = () => (isFinite(a.duration) && a.duration > 0 ? a.duration : duracao);

  const barras = ondas.map(v => h('i', { style: { '--h': Math.max(.08, Math.min(1, v)).toFixed(3) } }));
  const onda = h('div', { class: 'onda', role: 'slider', tabindex: '0', 'aria-label': textos.ondaAria, 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(duracao)), 'aria-valuenow': '0', 'aria-valuetext': `0:00 de ${mmss(duracao)}` }, ...barras);
  const tempo = h('span', { class: 'tempo', text: mmss(duracao) });
  const vel = h('button', { type: 'button', class: 'bolha-vel', 'aria-label': textos.velocidadeAria.replace('{v}', '1x'), text: '1x' });
  const play = h('button', { type: 'button', class: 'bolha-play', 'aria-label': textos.tocar, html: icone.play });
  // a foto de quem mandou, com o microfone por cima (como no WhatsApp); sem foto, só o microfone
  const mic = foto
    ? h('span', { class: 'bolha-foto', 'aria-hidden': 'true' }, h('img', { src: foto, alt: '', width: 38, height: 38, decoding: 'async' }), h('span', { class: 'bolha-mic', html: icone.mic }))
    : h('span', { class: 'bolha-mic', 'aria-hidden': 'true', html: icone.mic });
  const bolha = h('div', { class: 'bolha' + (foto ? ' com-foto' : ''), role: 'group', 'aria-label': textos.grupoAria }, play, h('div', null, onda, h('div', { class: 'bolha-info' }, tempo, vel)), mic);
  const aviso = h('p', { class: 'bolha-aviso', role: 'status' });
  const legendaViva = legendas ? h('p', { class: 'legenda-viva', 'aria-live': 'polite' }) : null;

  const estado = () => {
    if (falhou) return 'erro';
    if (fim || maxPct >= 95) return 'ate_o_fim';
    if (maxPct >= 50) return 'mais_da_metade';
    if (tocou) return 'menos';
    return 'nao_tocou';
  };
  const avisaEstado = () => aoEstado?.(estado(), Math.round(Math.min(100, maxPct)));

  function pinta() {
    const pct = total() ? (a.currentTime / total()) * 100 : 0;
    const n = Math.round(barras.length * pct / 100);
    barras.forEach((b, i) => b.classList.toggle('on', i < n));
    tempo.textContent = (tocou ? mmss(a.currentTime) : mmss(total()));
    onda.setAttribute('aria-valuenow', String(Math.round(a.currentTime)));
    onda.setAttribute('aria-valuetext', `${mmss(a.currentTime)} de ${mmss(total())}`);
    if (!a.paused && !arrastando) {
      if (pct > maxPct) maxPct = pct;
      [25, 50, 75, 100].forEach(m => { if (pct >= m - 0.5 && !marcos.has(m)) { marcos.add(m); evento('audio_progress', { pct: m }); } });
      if (pct >= 95 && !fim) termina();
    }
    if (legendaViva) {
      const l = legendas.find(x => a.currentTime >= x.t && a.currentTime < x.ate);
      const txt = l ? l.texto : '';
      if (legendaViva.textContent !== txt) legendaViva.textContent = txt;
    }
  }
  function laco() { pinta(); if (!a.paused) raf = requestAnimationFrame(laco); }

  function termina() {
    fim = true; maxPct = Math.max(maxPct, 95);
    bolha.classList.add('ouvida');
    evento('audio_end', {});
    avisaEstado();
    aoFim?.();
  }
  function botaoPlay() {
    if (a.paused) { play.innerHTML = fim ? icone.repetir : icone.play; play.setAttribute('aria-label', fim ? textos.ouvirDeNovo : textos.tocar); }
    else { play.innerHTML = icone.pausa; play.setAttribute('aria-label', textos.pausar); }
  }

  play.addEventListener('click', () => {
    play.classList.remove('pulsa');
    aviso.textContent = '';
    if (falhou) return;
    if (!a.paused) { a.pause(); return; }
    if (fim && a.currentTime >= total() - 0.3) a.currentTime = 0;
    let p;
    try { p = a.play(); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(() => {
      if (!tocou) { tocou = true; bolha.classList.add('ouvida'); }
      evento('audio_play', { pct: Math.round(maxPct) });
      avisaEstado();
    }).catch(err => {
      if (falhou) return;
      // o navegador recusou: o atleta toca de novo e funciona
      aviso.textContent = textos.toqueDeNovo;
      evento('audio_error', { estado: 'play_recusado' });
    });
  });
  a.addEventListener('play', aoPlay);
  a.addEventListener('pause', aoPause);
  a.addEventListener('ended', aoEnded);
  a.addEventListener('timeupdate', pinta);
  a.addEventListener('loadedmetadata', pinta);
  function aoPlay() { botaoPlay(); cancelAnimationFrame(raf); raf = requestAnimationFrame(laco); }
  function aoPause() { botaoPlay(); pinta(); if (tocou && !a.ended) evento('audio_pause', { pct: Math.round(maxPct) }); avisaEstado(); }
  function aoEnded() { maxPct = 100; if (!fim) termina(); else { avisaEstado(); } botaoPlay(); pinta(); }

  vel.addEventListener('click', () => {
    const prox = { 1: 1.5, 1.5: 2, 2: 1 }[a.playbackRate] || 1;
    a.playbackRate = prox;
    try { a.preservesPitch = true; a.webkitPreservesPitch = true; } catch { /* nada */ }
    const r = String(prox).replace('.', ',') + 'x';
    vel.textContent = r;
    vel.setAttribute('aria-label', textos.velocidadeAria.replace('{v}', r));
  });

  // arrastar ou tocar na onda
  const posDe = ev => { const r = onda.getBoundingClientRect(); return Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)); };
  const busca = fr => { if (!isFinite(total())) return; a.currentTime = fr * total(); pinta(); };
  onda.addEventListener('pointerdown', ev => { arrastando = true; try { onda.setPointerCapture(ev.pointerId); } catch { /* nada */ } busca(posDe(ev)); });
  onda.addEventListener('pointermove', ev => { if (arrastando) busca(posDe(ev)); });
  const solta = ev => { if (!arrastando) return; arrastando = false; busca(posDe(ev)); evento('audio_seek', { pct: Math.round(a.currentTime / total() * 100) }); };
  onda.addEventListener('pointerup', solta);
  onda.addEventListener('pointercancel', () => { arrastando = false; });
  onda.addEventListener('keydown', ev => {
    const passo = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[ev.key];
    if (passo) { ev.preventDefault(); a.currentTime = Math.max(0, Math.min(total(), a.currentTime + passo)); pinta(); evento('audio_seek', { pct: Math.round(a.currentTime / total() * 100) }); }
    if (ev.key === 'Home') { ev.preventDefault(); a.currentTime = 0; pinta(); }
    if (ev.key === 'End') { ev.preventDefault(); a.currentTime = Math.max(0, total() - 0.5); pinta(); }
  });

  const erro = () => {
    falhou = true;
    aviso.textContent = '';
    bolha.classList.add('com-erro');
    play.disabled = true;
    evento('audio_error', { estado: 'erro' });
    avisaEstado();
    aoErro?.();
  };
  let aoErro = null;
  ouvintesErro.add(erro);
  if (falhou) setTimeout(erro, 0);

  return {
    bolha, aviso, legendaViva,
    pulsa() { if (!tocou && !reduz) play.classList.add('pulsa'); },
    set aoErro(fn) { aoErro = fn; },
    get estado() { return estado(); },
    get pct() { return Math.round(Math.min(100, maxPct)); },
    destroi() {
      cancelAnimationFrame(raf);
      ouvintesErro.delete(erro);
      a.removeEventListener('play', aoPlay); a.removeEventListener('pause', aoPause); a.removeEventListener('ended', aoEnded);
      a.removeEventListener('timeupdate', pinta); a.removeEventListener('loadedmetadata', pinta);
      try { a.pause(); } catch { /* nada */ }
    }
  };
}

export { vibra };
