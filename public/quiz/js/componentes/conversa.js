// "Como funciona na prática" (T07): o cartão do atleta com o que ele já respondeu e a conversa com o Fernando (estrategista esportivo), com a
// mesma foto do painel do site. Quando a conversa entra na tela, as mensagens chegam uma a uma, com o "digitando" antes de cada uma, dos dois
// lados, até o "Você está contratado!"; no fim, aparece o fecho ("agora é a sua vez"). Com "reduzir movimento", aparece inteira de uma vez. A rolagem é só dentro da janela do chat:
// a página não pula enquanto a conversa anda.
import { h, quandoVisivel } from '../motor/util.js';
import { icone } from './icones.js';

// quanto o "digitando" dura, pelo tamanho da mensagem (entre 0,9 e 2 s), e a pausa depois de cada uma
const digita = txt => Math.min(2000, 700 + txt.length * 16);
const PAUSA = 650;

export function conversa({ titulo, abertura, perfil, estrategista, mensagens, fecho, rotuloDigitando, placeholder, reduz }) {
  const fim = h('span', { class: 'chat-fim', 'aria-hidden': 'true' });
  const corpo = h('div', { class: 'chat-corpo', role: 'log', 'aria-live': 'polite', 'aria-label': estrategista.nome }, fim);
  const digitando = (lado) => h('div', { class: 'chat-digitando ' + lado, 'aria-label': rotuloDigitando }, h('i'), h('i'), h('i'));
  const balao = (m) => m.separador
    ? h('p', { class: 'chat-dia', text: m.texto })
    : h('p', { class: 'chat-msg ' + (m.de === 'atleta' ? 'atleta' : 'equipe') }, m.texto);
  const desce = () => { corpo.scrollTop = corpo.scrollHeight; };
  const poe = (el) => { corpo.insertBefore(el, fim); desce(); };

  const el = h('section', { class: 'pratica', 'aria-label': titulo },
    h('h2', { class: 'pratica-titulo' }, h('span', { text: titulo }), h('span', { class: 'pratica-dedo', 'aria-hidden': 'true', text: '👇' })),
    h('p', { class: 'pratica-abertura', text: abertura }),
    h('div', { class: 'pratica-perfil' },
      h('div', { class: 'pratica-quem' },
        h('span', { class: 'pratica-avatar', 'aria-hidden': 'true', html: icone.pessoa }),
        h('div', null, h('p', { class: 'pratica-nome', text: perfil.rotulo }), h('p', { class: 'pratica-posicao', text: perfil.posicao }))),
      h('dl', { class: 'pratica-dados' }, ...perfil.dados.map(([rotulo, valor]) => h('div', null, h('dt', { text: rotulo }), h('dd', { text: valor }))))),
    h('div', { class: 'chat' },
      h('header', { class: 'chat-cab' },
        h('img', { src: estrategista.foto, alt: '', width: 36, height: 36, loading: 'lazy', decoding: 'async' }),
        h('div', null, h('p', { class: 'chat-nome', text: estrategista.nome }), h('p', { class: 'chat-online', text: estrategista.online }))),
      corpo,
      h('footer', { class: 'chat-pe', 'aria-hidden': 'true' }, h('span', { text: placeholder }), h('span', { class: 'chat-enviar', html: icone.seta }))),
    fecho ? h('p', { class: 'pratica-fecho', text: fecho }) : null);

  let tm = 0, parado = false;
  const fechaConversa = () => el.querySelector('.pratica-fecho')?.classList.add('mostra');
  function anda(i) {
    if (parado) return;
    if (i >= mensagens.length) { fechaConversa(); return; }
    const m = mensagens[i];
    if (m.separador) { poe(balao(m)); tm = setTimeout(() => anda(i + 1), PAUSA); return; }
    const pontos = digitando(m.de === 'atleta' ? 'atleta' : 'equipe');
    poe(pontos);
    tm = setTimeout(() => {
      pontos.remove();
      poe(balao(m));
      tm = setTimeout(() => anda(i + 1), PAUSA);
    }, digita(m.texto));
  }

  let paraDeOlhar = () => {};
  if (reduz) { mensagens.forEach(m => corpo.insertBefore(balao(m), fim)); fechaConversa(); }
  else paraDeOlhar = quandoVisivel(corpo, () => { tm = setTimeout(() => anda(0), 500); }, '0px 0px -25% 0px');

  return { el, destroi() { parado = true; clearTimeout(tm); paraDeOlhar(); } };
}
