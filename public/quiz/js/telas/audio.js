// T10 · o ponto alto. Abertura em preto, uma linha por vez ("Imagina."), depois a conversa: "gravando áudio…", a bolha chega,
// o botão pulsa. O áudio é real e aparece como real; a pergunta é a imaginação. Nunca trava o funil (falha, recusa ou silêncio).
import { h, json, vibra } from '../motor/util.js';
import { audioVoz } from '../componentes/audio-voz.js';
import { icone } from '../componentes/icones.js';

let onda = null;
async function carregaOnda() {
  if (!onda) onda = json('assets/audio/waveform.json').catch(() => ({ barras: Array.from({ length: 48 }, () => 0.5), duracao: 37.6 }));
  return onda;
}

export function render(ctx) {
  // a foto da mãe do áudio (provas.json, item audio-mae), no cabeçalho da conversa e na bolha
  const foto = ctx.provas['audio-mae']?.foto || null;
  const c = ctx.copy;
  const el = h('section', { class: 't-audio' });
  const conteudo = h('div', { hidden: true });
  el.append(conteudo);
  const salvaEstado = (estado, pct) => ctx.responde('audio', { estado, pct }, { evento: false });
  // quem voltou pra cá depois de ouvir não espera de novo pelo Continuar
  const jaOuviu = !!ctx.r.audio && ctx.r.audio.estado !== 'nao_tocou';
  if (!ctx.r.audio) salvaEstado('nao_tocou', 0);

  let continuarVisivel = false;
  const mostraContinuar = (texto = ctx.geral.continuar, comLinha = false) => {
    if (continuarVisivel) return;
    continuarVisivel = true;
    if (comLinha) conteudo.append(h('p', { class: 'depois', text: c.depois }));
    ctx.barra.botao({
      texto, aoClicar: () => {
        if (comp && comp.estado !== 'ate_o_fim') ctx.evento('audio_skip', { estado: comp.estado });
        ctx.avanca();
      }
    });
  };

  let comp = null, dica = null;
  async function monta() {
    const w = await carregaOnda();
    if (!ctx.vivo()) return;
    conteudo.hidden = false;
    conteudo.classList.add('entra');
    const legendas = ctx.cfg.legendas?.ativo ? c.legendas : null;
    const corpo = h('div', { class: 'conversa-corpo' });
    const gravando = h('div', { class: 'gravando', role: 'status' }, h('span', { html: icone.mic }), h('span', { text: c.gravando.replace(/…$/, '') }), h('span', { class: 'pontinhos', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')));
    corpo.append(gravando);
    const conversa = h('div', { class: 'conversa', style: '--i:2' },
      h('div', { class: 'conversa-cab' },
        foto ? h('span', { class: 'conversa-avatar' }, h('img', { src: foto, alt: '', width: 38, height: 38, decoding: 'async' })) : h('span', { class: 'conversa-avatar', html: icone.pessoa }),
        h('span', { class: 'conversa-nome', text: c.remetente })),
      corpo);
    conteudo.append(
      h('h1', { class: 'titulo menor', style: '--i:0', tabindex: '-1', text: c.titulo }),
      h('p', { class: 'apoio', style: '--i:1', text: c.apoio }),
      conversa,
      h('p', { class: 'legenda', style: '--i:3', text: c.legenda }));
    requestAnimationFrame(() => conteudo.querySelector('h1')?.focus({ preventScroll: true }));

    // "gravando áudio…" por 1,4 s, e a bolha chega (quem já ouviu vê a bolha direto)
    ctx.depois(ctx.reduz || jaOuviu ? 0 : 1400, () => {
      comp = audioVoz({
        ondas: w.barras, duracao: w.duracao || 37.6, textos: c, legendas, foto,
        evento: (n, p) => ctx.evento(n, p),
        aoEstado: (estado, pct) => { salvaEstado(estado, pct); if (estado !== 'nao_tocou') dica?.remove(); },
        aoFim: () => mostraContinuar(ctx.geral.continuar, true)
      });
      comp.aoErro = () => {
        corpo.append(h('p', { class: 'bolha-erro', role: 'alert', text: c.erro }));
        mostraContinuar(c.continuarSem);
      };
      ctx.aoSair(() => comp.destroi());
      corpo.replaceChildren(comp.bolha, comp.aviso);
      if (comp.legendaViva) corpo.append(comp.legendaViva);
      vibra(40);
      ctx.evento('audio_view', {});
      ctx.depois(ctx.reduz ? 0 : 1800, () => {
        comp.pulsa();
        if (comp.estado === 'nao_tocou') { dica = h('p', { class: 'dica-tocar', text: c.dicaTocar }); corpo.append(dica); }
      });
      // quem não tocar não fica preso: o Continuar aparece em 10 s (na hora, pra quem já tinha ouvido)
      if (jaOuviu) mostraContinuar();
      else ctx.depois(10000, () => mostraContinuar());
    });
  }

  // a abertura: preto, silêncio, uma linha a cada 1,3 s (o toque acelera)
  if (ctx.reduz || ctx.r.audio?.estado && ctx.r.audio.estado !== 'nao_tocou') { monta(); return el; }
  const linhas = c.abertura.map(t => h('p', { text: t }));
  const abertura = h('div', { class: 'abertura', role: 'dialog', 'aria-label': c.abertura.join(' ') },
    h('div', { class: 'abertura-linhas' }, ...linhas),
    h('p', { class: 'abertura-pular', text: c.pularAbertura }));
  document.body.append(abertura);
  ctx.barra.esconde(true);
  let i = 0, tm = 0, acabou = false;
  const fecha = () => {
    if (acabou) return;
    acabou = true; clearTimeout(tm);
    abertura.classList.add('saindo');
    setTimeout(() => abertura.remove(), 480);
    ctx.barra.esconde(false);
    monta();
  };
  const proxima = () => {
    if (!ctx.vivo()) return;
    if (i < linhas.length) { linhas[i].classList.add('vis'); i++; tm = setTimeout(proxima, 1300); }
    else tm = setTimeout(fecha, 900);
  };
  const acelera = () => { clearTimeout(tm); if (i < linhas.length) proxima(); else fecha(); };
  abertura.addEventListener('pointerdown', acelera);
  const tecla = ev => { if (!acabou && (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Escape')) { ev.preventDefault(); acelera(); } };
  document.addEventListener('keydown', tecla);
  abertura.tabIndex = -1;
  requestAnimationFrame(() => abertura.focus({ preventScroll: true }));
  ctx.aoSair(() => { clearTimeout(tm); document.removeEventListener('keydown', tecla); abertura.remove(); ctx.barra.esconde(false); });
  tm = setTimeout(proxima, 350);
  return el;
}
