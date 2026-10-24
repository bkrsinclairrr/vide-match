// Segurar pra confirmar (T11): o anel enche em 1,6 s enquanto o dedo fica; soltou antes, volta; completou, vibra, fica verde e avança.
// Melhoria progressiva sobre um botão comum: no teclado, Enter e Espaço confirmam direto; "Confirmar sem segurar" está sempre ali.
import { h, vibra, reduzMovimento } from '../motor/util.js';
import { icone } from './icones.js';

const DURACAO = 1600;
const CIRC = 339.3; // 2 * pi * 54

export function segurar({ textos, aoConfirmar }) {
  const anel = `<svg class="segurar-anel" viewBox="0 0 120 120" aria-hidden="true"><circle class="trilho-anel" cx="60" cy="60" r="54"/><circle class="enche" cx="60" cy="60" r="54"/></svg>`;
  const botao = h('button', { type: 'button', class: 'segurar-botao', 'aria-label': textos.segurarAria, html: anel + `<span class="segurar-icone">${icone.digital}</span>` });
  const enche = () => botao.querySelector('.enche');
  const semSegurar = h('button', { type: 'button', class: 'link-btn', text: textos.confirmarSemSegurar });
  const status = h('p', { class: 'sr-only', role: 'status' });
  const raiz = h('div', { class: 'segurar' },
    h('p', { class: 'segurar-titulo', text: textos.segurarTitulo }),
    h('p', { class: 'segurar-texto', text: textos.segurarTexto }),
    botao,
    h('p', { class: 'segurar-dica', 'aria-hidden': 'true', text: textos.segurarBotao }),
    semSegurar, status);

  let t0 = 0, raf = 0, feito = false, segurando = false, prog = 0;
  const desenha = p => { prog = p; enche().style.strokeDashoffset = String(CIRC * (1 - p)); };

  function conclui(como) {
    if (feito) return;
    feito = true; segurando = false; cancelAnimationFrame(raf);
    desenha(1);
    botao.classList.remove('segurando');
    botao.classList.add('ok');
    botao.querySelector('.segurar-icone').innerHTML = icone.check;
    status.textContent = textos.confirmado;
    vibra(30);
    aoConfirmar?.({ como, ms: Math.round(performance.now() - t0) });
  }
  function laco(agora) {
    if (!segurando) return;
    const p = Math.min(1, (agora - t0) / DURACAO);
    desenha(p);
    if (p >= 1) { conclui('segurou'); return; }
    raf = requestAnimationFrame(laco);
  }
  function comeca(ev) {
    if (feito) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    ev.preventDefault();
    segurando = true; t0 = performance.now();
    botao.classList.add('segurando');
    try { botao.setPointerCapture(ev.pointerId); } catch { /* nada */ }
    enche().style.transition = 'none';
    vibra(8);
    raf = requestAnimationFrame(laco);
  }
  function solta() {
    if (!segurando || feito) return;
    segurando = false; cancelAnimationFrame(raf);
    botao.classList.remove('segurando');
    // soltou antes: o anel volta
    const e = enche();
    e.style.transition = reduzMovimento() ? 'none' : 'stroke-dashoffset .35s ease';
    desenha(0);
  }
  botao.addEventListener('pointerdown', comeca);
  botao.addEventListener('pointerup', solta);
  botao.addEventListener('pointercancel', solta);
  botao.addEventListener('pointerleave', solta);
  botao.addEventListener('contextmenu', ev => ev.preventDefault());
  // teclado e leitor de tela: confirma direto (o clique do teclado chega sem pointerdown)
  botao.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); t0 = performance.now(); conclui('teclado'); } });
  botao.addEventListener('click', ev => { if (ev.detail === 0 && !feito) { t0 = performance.now(); conclui('teclado'); } });
  semSegurar.addEventListener('click', () => { t0 = performance.now(); conclui('sem_segurar'); });

  return { el: raiz, botao, get feito() { return feito; }, get progresso() { return prog; }, destroi() { cancelAnimationFrame(raf); } };
}
