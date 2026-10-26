// O caminho 1 (adulto, 6 peneiras ou mais, de 3 a 5 dispensas, tier A) com uma parada em cada estado de tela que vale foto:
// aoTela(id, { fim, pausa }) é chamado em cada parada (a foto, as conferências de layout). Usado por telas.mjs e teste-aparelhos.mjs.
import { espera } from './_cdp.mjs';

export async function percorre({ c, q, url, aoTela }) {
  const para = (id, op = {}) => aoTela(id, Object.assign({ fim: true, pausa: 900 }, op));
  await q.abre(url);
  await para('posicao');
  await q.posicao('LD');
  await q.esperaTela('idade'); await para('idade');
  await q.idade('18_21');
  await q.esperaTela('peneiras');
  await q.toca('.t-peneiras > .opcoes .opcao[data-id="6_mais"]');
  await c.ate(`!!document.querySelector('.t-peneiras .bloco-segunda .opcao')`, 4000);
  await para('peneiras');
  await q.toca('.t-peneiras .bloco-segunda .opcao[data-id="500_2000"]');
  await q.esperaTela('dispensas');
  await q.toca('.t-dispensas > .opcoes .opcao[data-id="3_5"]');
  await c.ate(`!!document.querySelector('.t-dispensas .bloco-segunda .opcao')`, 4000);
  await para('dispensas');
  await q.toca('.t-dispensas .bloco-segunda .opcao[data-id="sim"]');
  await q.esperaTela('inimigo'); await para('inimigo', { pausa: 1500 });
  await c.ate(`!!document.querySelector('.campo--jogo.modo-ia')`, 8000); await espera(900);
  await para('inimigo-ia', { pausa: 300 });
  await q.continua();
  await q.esperaTela('zyron'); await para('zyron', { pausa: 2800 });
  await q.continua();
  await q.esperaTela('video'); await para('video');
  await q.toca('.t-video .opcao[data-id="lances"]');
  await q.esperaTela('mundo'); await para('mundo', { pausa: 1200 });
  await q.continua();
  await q.esperaTela('historico'); await para('historico', { pausa: 2000 });
  await q.continua();
  await q.esperaTela('sonho'); await para('sonho');
  await q.toca('.t-sonho .opcao[data-id="europa"]');
  await q.esperaTela('audio');
  await espera(1800); await para('audio-abertura', { fim: false, pausa: 300 });
  for (let i = 0; i < 6; i++) { if (!(await c.avalia(`!!document.querySelector('.abertura:not(.saindo)')`))) break; await q.toca('.abertura'); await espera(150); }
  await c.ate(`!!document.querySelector('.bolha-play')`, 8000);
  await para('audio', { pausa: 2200 });
  await q.toca('.bolha-play');
  await c.ate(`window.__qzAudio && !window.__qzAudio.paused && window.__qzAudio.duration > 0`, 8000);
  await c.avalia(`window.__qzAudio.currentTime = window.__qzAudio.duration * 0.45; true`);
  await para('audio-tocando', { fim: false, pausa: 700 });
  await c.avalia(`window.__qzAudio.currentTime = window.__qzAudio.duration * 0.96; true`);
  await c.ate(`!!document.querySelector('#barra .btn')`, 8000);
  await para('audio-fim', { pausa: 600 });
  await q.continua();
  await q.esperaTela('quer');
  await para('quer', { pausa: 500 });
  await q.toca('.t-quer .opcao[data-id="receio"]');
  await q.esperaTela('chance'); await para('chance');
  await q.toca('.t-chance .opcao[data-id="familia"]');
  await q.esperaTela('contato'); await para('contato-vazio');
  await q.toca('#f-nome'); await c.digita('João');
  await q.toca('#f-whatsapp'); await c.digita('11912345678');
  await q.toca('.t-contato .caixa');
  await para('contato', { pausa: 400 });
  await q.toca('#barra .btn');
  await espera(500); await para('montando', { fim: false, pausa: 100 });
  await q.resultado(); await para('resultado', { pausa: 1200 });
}
