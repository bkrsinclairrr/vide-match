// A folha que sobe de baixo (números, fontes, cookies): foco preso dentro dela, fecha por Esc, pelo X, tocando fora ou arrastando pra baixo.
import { h } from '../motor/util.js';
import { icone } from './icones.js';

let aberta = null;

export function abreFolha({ titulo, apoio, conteudo, rotulo, semFechar = false, aoFechar }) {
  fechaFolha(true);
  const antes = document.activeElement;
  const id = 'folha-t-' + Math.random().toString(36).slice(2, 7);
  const fundo = h('div', { class: 'folha-fundo' });
  const alca = h('div', { class: 'folha-alca', 'aria-hidden': 'true' });
  const fechar = semFechar ? null : h('button', { type: 'button', class: 'folha-fechar', 'aria-label': 'Fechar', html: icone.fechar });
  const cab = h('div', { class: 'folha-cab' }, h('h2', { class: 'folha-titulo', id, text: titulo || '' }), fechar);
  const painel = h('div', { class: 'folha', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titulo ? id : null, 'aria-label': titulo ? null : (rotulo || 'Informações') },
    alca, titulo || fechar ? cab : null, apoio ? h('p', { class: 'folha-apoio', text: apoio }) : null, conteudo);
  document.body.append(fundo, painel);
  document.documentElement.style.overflow = 'hidden';

  const focaveis = () => [...painel.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')];
  const tecla = ev => {
    if (ev.key === 'Escape' && !semFechar) { ev.preventDefault(); fecha(); }
    if (ev.key === 'Tab') {
      const f = focaveis(); if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (ev.shiftKey && (i <= 0)) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); }
    }
  };
  document.addEventListener('keydown', tecla);
  if (!semFechar) fundo.addEventListener('click', () => fecha());
  fechar?.addEventListener('click', () => fecha());

  // arrastar a alça (ou o topo da folha) pra baixo fecha
  let y0 = null, dy = 0;
  const comeca = ev => { if (semFechar || painel.scrollTop > 0) return; y0 = ev.clientY; dy = 0; painel.style.transition = 'none'; };
  const move = ev => { if (y0 === null) return; dy = Math.max(0, ev.clientY - y0); painel.style.transform = `translateY(${dy}px)`; };
  const solta = () => {
    if (y0 === null) return; y0 = null; painel.style.transition = 'transform .2s';
    if (dy > 90) fecha(); else painel.style.transform = '';
  };
  alca.addEventListener('pointerdown', comeca); cab.addEventListener('pointerdown', ev => { if (ev.target === cab || ev.target.classList.contains('folha-titulo')) comeca(ev); });
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', solta); window.addEventListener('pointercancel', solta);

  function fecha(imediato = false) {
    if (aberta !== controle) return;
    aberta = null;
    document.removeEventListener('keydown', tecla);
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', solta); window.removeEventListener('pointercancel', solta);
    document.documentElement.style.overflow = '';
    const tira = () => { fundo.remove(); painel.remove(); };
    if (imediato) tira();
    else { fundo.classList.add('saindo'); painel.classList.add('saindo'); setTimeout(tira, 200); }
    try { antes?.focus?.({ preventScroll: true }); } catch { /* nada */ }
    aoFechar?.();
  }
  const controle = { painel, fecha };
  aberta = controle;
  requestAnimationFrame(() => { (fechar || focaveis()[0] || painel).focus?.({ preventScroll: true }); });
  return controle;
}

export function fechaFolha(imediato = false) { aberta?.fecha(imediato); }
