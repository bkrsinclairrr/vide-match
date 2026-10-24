// Um atleta de mentira que responde o quiz por toques de verdade (CDP). Cada função responde uma tela e espera a próxima.
// Uso: const q = quiz(c); await q.abre(url); await q.posicao('LD'); await q.idade('18_21'); ...
// Enquanto anda, guarda todo texto que o atleta viu (q.textos: [{ id, texto }]) pra varredura das regras da casa.
import { espera } from './_cdp.mjs';

// o script que roda antes da página: a configuração de teste (só vale em localhost) e o registro das telas e dos eventos
export const scriptTeste = ({ config = {}, audioArquivos = null, estado = null, extra = '' } = {}) => `
  window.QZ_TESTE = ${JSON.stringify({ config, audioArquivos })};
  window.__qzTelas = []; window.__qzEventos = [];
  addEventListener('qz:evento', e => { window.__qzEventos.push(e.detail); if (e.detail.e === 'step_view') window.__qzTelas.push(e.detail.p.id); });
  ${estado ? `if (!sessionStorage.getItem('qz:teste-injetado')) { sessionStorage.setItem('qz:teste-injetado', '1'); localStorage.setItem('qz:estado', ${JSON.stringify(JSON.stringify(estado))}); }` : ''}
  ${extra}`;

// um estado salvo pra entrar direto num passo (retomada): respostas até ali, criado há 2 minutos
export const estadoSalvo = (respostas, passo) => ({ v: 1, respostas, passo, criadoEm: Date.now() - 120000, atualizadoEm: Date.now(), enviado: false, leadId: null, resultado: null });
// respostas completas de um adulto até a tela pedida (o resto fica de fora)
export const ATE = ['posicao', 'idade', 'peneiras', 'dispensas', 'inimigo', 'zyron', 'video', 'mundo', 'historico', 'sonho', 'audio', 'quer', 'chance', 'contato'];
export function respostasAte(passo, mais = {}) {
  const todas = {
    posicao: { posicao: 'LD' }, idade: { idade: '18_21' }, peneiras: { peneiras: '3_5', gasto: '500_2000' }, dispensas: { dispensas: '1_2', jogouBem: 'sim' },
    inimigo: { viuOlhometro: true, viuInimigo: true }, zyron: { viuZyron: true }, video: { video: 'lances' }, mundo: { viuMundo: true }, historico: { viuHistorico: true },
    sonho: { sonho: 'europa' }, audio: { audio: { estado: 'ate_o_fim', pct: 100 } }, quer: { quer: 'sim', compromisso: true }, chance: { chance: 'familia' }
  };
  const r = {};
  for (const id of ATE) { if (id === passo) break; Object.assign(r, todas[id] || {}); }
  return Object.assign(r, mais);
}

export function quiz(c) {
  const textos = [];
  const tela = () => c.avalia(`(() => { const t = document.querySelector('#palco .tela:not(.saindo)'); return t ? t.dataset.passo || null : null; })()`);
  // todo texto visível agora: palco, barra, folha aberta e camadas por cima (abertura, montando), mais rótulos de leitor de tela
  const colhe = async () => {
    try {
      const r = await c.avalia(`(() => {
        const t = document.querySelector('#palco .tela:not(.saindo)');
        const partes = [document.title];
        for (const sel of ['#palco', '#barra', '.folha', '.abertura', '.montando', '.cookies', '.retomada']) document.querySelectorAll(sel).forEach(e => partes.push(e.innerText));
        document.querySelectorAll('[aria-label], [title], img[alt]').forEach(e => partes.push(e.getAttribute('aria-label') || '', e.getAttribute('title') || '', e.getAttribute('alt') || ''));
        return { id: t ? t.dataset.passo : null, texto: partes.filter(Boolean).join('\\n') };
      })()`);
      if (r && r.texto) textos.push(r);
    } catch { /* trocando de tela */ }
  };
  const esperaTela = async (id, ms = 9000) => {
    const ok = await c.ate(`(() => { const t = document.querySelector('#palco .tela:not(.saindo)'); return !!t && t.dataset.passo === ${JSON.stringify(id)} && !t.classList.contains('entrando'); })()`, ms);
    if (!ok) throw new Error('não chegou na tela ' + id + ' (está em ' + (await tela()) + ')');
    await espera(80);
    await colhe();
  };
  const toca = (sel, op) => c.toca(sel, op);
  // toca uma opção e colhe o espelho que aparece
  const responde = async (sel) => { await toca(sel); await espera(220); await colhe(); };
  const continua = async () => { await c.ate(`!!document.querySelector('#barra .btn:not([aria-disabled="true"])')`, 12000); await colhe(); await toca('#barra .btn'); };

  return {
    tela, esperaTela, toca, continua, colhe, textos,
    telas: () => c.avalia('window.__qzTelas.slice()'),
    eventos: () => c.avalia('window.__qzEventos.slice()'),
    async abre(url) { await c.vai(url); await esperaTela('posicao', 15000); },
    async posicao(id) { await responde(`.pos[data-pos="${id}"]`); },
    async idade(faixa) {
      await esperaTela('idade');
      await responde(`.t-idade .opcao[data-id="${faixa}"]`);
    },
    async peneiras(p, gasto) {
      await esperaTela('peneiras');
      await responde(`.t-peneiras > .opcoes .opcao[data-id="${p}"]`);
      if (p !== '0') {
        await c.ate(`!!document.querySelector('.t-peneiras .bloco-segunda .opcao')`, 4000);
        await espera(220);
        await responde(`.t-peneiras .bloco-segunda .opcao[data-id="${gasto}"]`);
      }
    },
    async dispensas(d, jogou) {
      await esperaTela('dispensas');
      await responde(`.t-dispensas > .opcoes .opcao[data-id="${d}"]`);
      if (d !== '0') {
        await c.ate(`!!document.querySelector('.t-dispensas .bloco-segunda .opcao')`, 4000);
        await espera(220);
        await responde(`.t-dispensas .bloco-segunda .opcao[data-id="${jogou}"]`);
      }
    },
    // espera a virada pra IA (3,5 s sozinha), colhe o texto revelado e segue
    async inimigo({ esperaIa = false } = {}) {
      await esperaTela('inimigo');
      if (esperaIa) { await c.ate(`!!document.querySelector('.campo--jogo.modo-ia')`, 8000); await espera(900); await colhe(); }
      else await espera(300);
      await continua();
    },
    async zyron() { await esperaTela('zyron'); await espera(300); await continua(); },
    async video(v) { await esperaTela('video'); await responde(`.t-video .opcao[data-id="${v}"]`); },
    async mundo() { await esperaTela('mundo'); await continua(); },
    async historico() { await esperaTela('historico'); await continua(); },
    async sonho(s) { await esperaTela('sonho'); await responde(`.t-sonho .opcao[data-id="${s}"]`); },
    // ouvir: 'fim' (pula pra 96%), 'inteiro' (toca até o fim de verdade), 'metade' (pula pra 60% e pausa), 'pouco' (toca 1 s),
    // 'nada' (espera o Continuar dos 8 s)
    async audio(ouvir = 'fim') {
      await esperaTela('audio');
      // a abertura em preto: um toque por linha
      for (let i = 0; i < 6; i++) { if (!(await c.avalia(`!!document.querySelector('.abertura:not(.saindo)')`))) break; await colhe(); await toca('.abertura'); await espera(150); }
      await c.ate(`!!document.querySelector('.bolha-play')`, 8000);
      if (ouvir === 'nada') { await c.ate(`!!document.querySelector('#barra .btn')`, 13000); await continua(); return; }
      await toca('.bolha-play');
      await c.ate(`window.__qzAudio && !window.__qzAudio.paused`, 8000);
      if (ouvir === 'fim' || ouvir === 'metade') {
        await c.ate(`isFinite(window.__qzAudio.duration) && window.__qzAudio.duration > 0`, 8000);
        await c.avalia(`window.__qzAudio.currentTime = window.__qzAudio.duration * ${ouvir === 'fim' ? 0.96 : 0.6}; true`);
      }
      if (ouvir === 'inteiro') await c.ate(`window.__qzAudio.ended`, 60000, 250);
      else if (ouvir === 'metade') { await espera(700); await toca('.bolha-play'); }
      else if (ouvir === 'pouco') { await espera(1000); await toca('.bolha-play'); }
      await c.ate(`!!document.querySelector('#barra .btn')`, 13000);
      await continua();
    },
    async quer(q, { segura = true } = {}) {
      await esperaTela('quer');
      await responde(`.t-quer .opcao[data-id="${q}"]`);
      if (q !== 'nao_sei') {
        await c.ate(`!!document.querySelector('.segurar-botao')`, 4000);
        await espera(400);
        await colhe();
        if (segura) await toca('.segurar-botao', { segura: 1900 });
        else await toca('.segurar .link-btn');
      }
    },
    async chance(i) { await esperaTela('chance'); await responde(`.t-chance .opcao[data-id="${i}"]`); },
    async contato({ nome = 'João', zap = '11912345678', responsavel = null, aceite = true } = {}) {
      await esperaTela('contato');
      await toca('#f-nome'); await c.digita(nome);
      if (responsavel !== null) { await toca('#f-responsavelNome'); await c.digita(responsavel); }
      await toca('#f-whatsapp'); await c.digita(zap);
      if (aceite) await toca('.t-contato .caixa');
      await espera(150);
      await colhe();
      await toca('#barra .btn');
    },
    async resultado() { await esperaTela('resultado', 9000); await espera(900); await colhe(); }
  };
}

// o caminho 1 do aceite: adulto, 6 peneiras ou mais, de 3 a 5 dispensas, tier A (15 telas)
export async function caminhoCompleto(q, op = {}) {
  await q.posicao(op.posicao || 'LD');
  await q.idade(op.idade || '18_21');
  await q.peneiras(op.peneiras || '6_mais', op.gasto || '500_2000');
  if ((op.peneiras || '6_mais') !== '0') await q.dispensas(op.dispensas || '3_5', op.jogou || 'sim');
  await q.inimigo({ esperaIa: !!op.esperaIa });
  await q.zyron();
  await q.video(op.video || 'lances');
  await q.mundo();
  await q.historico();
  await q.sonho(op.sonho || 'europa');
  if (op.audio !== false) await q.audio(op.ouvir || 'fim');
  await q.quer(op.quer || 'sim', { segura: op.segura !== false });
  await q.chance(op.chance || 'familia');
  await q.contato(op.contato || {});
  await q.resultado();
}
