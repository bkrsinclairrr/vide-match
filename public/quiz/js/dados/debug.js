// Painel de ensaio (?debug=1): o estado, o caminho, o payload que seria enviado agora e os últimos eventos. Só em prévia e ensaio.
import { h, uuid } from '../motor/util.js';
import { deriva } from '../motor/estado.js';
import { montaPayload } from './payload.js';

export function painel(app) {
  const pre = h('pre');
  const caixa = h('div', { class: 'debug', role: 'complementary', 'aria-label': 'Painel de ensaio' },
    h('strong', { text: app.envio.modoEnsaio ? 'MODO DE ENSAIO (sem endpoint)' : 'Endpoint: ' + app.cfg.endpoint }),
    h('div', { style: { marginTop: '6px' } },
      h('button', { type: 'button', onclick: () => { app.estado.zera(); location.hash = ''; location.reload(); } }, 'Zerar'),
      h('button', { type: 'button', onclick: () => navigator.clipboard?.writeText(pre.textContent) }, 'Copiar'),
      h('button', { type: 'button', onclick: () => caixa.remove() }, 'Fechar')),
    pre);
  document.body.append(caixa);
  const pinta = () => {
    const d = deriva(app.estado.r, { copy: app.copy, mapa: app.mapa, cfg: app.cfg });
    const pont = app.pontua(app.estado.r);
    let previa = null;
    try {
      previa = app.ultimoPayload || montaPayload({ leadId: uuid(), estado: app.estado, d, pont, cfg: app.cfg, rastreio: app.rastreio, eventos: app.eventos, caminho: app.caminho(), textoAceite: '(prévia)', suspeito: false, modoEnsaio: app.envio.modoEnsaio });
    } catch (e) { previa = String(e); }
    pre.textContent = JSON.stringify({
      passo: app.motor.atual, caminho: app.caminho(), pontuacao: pont, rastreio: app.rastreio.situacao,
      respostas: app.estado.r, fila: app.envio.fila.length, eventos: app.eventos.historico.slice(-12).map(e => e.e + ' ' + JSON.stringify(e.p)), payload: previa
    }, null, 1);
  };
  pinta();
  setInterval(pinta, 1000);
}
