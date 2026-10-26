// O motor: mostra uma tela por vez, guarda o caminho no histórico do navegador (o voltar do celular volta uma tela, nunca expulsa),
// retoma de onde parou, anda a barra de progresso e entrega a cada tela o contexto de que ela precisa.
import { h, t, tx, espera, vibra, reduzMovimento } from './util.js';
import { caminho as calculaCaminho, variante as escolheVariante, primeiroIncompleto, COMPLETO } from './fluxo.js';
import { deriva } from './estado.js';
import { abreFolha, fechaFolha } from '../componentes/folha.js';
import { espelho as linhaEspelho } from '../componentes/opcoes.js';
import { abreFontes } from '../componentes/fontes.js';
import { criaRolar } from '../componentes/rolar.js';

const PRIVADO = new Set(['nome', 'whatsapp', 'responsavelNome', 'aceite', 'isca']);

const TELAS = {
  posicao: () => import('../telas/posicao.js'),
  idade: () => import('../telas/idade.js'),
  experiencia: () => import('../telas/opcionais.js'),
  epoca: () => import('../telas/opcionais.js'),
  objetivo: () => import('../telas/opcionais.js'),
  trava: () => import('../telas/opcionais.js'),
  peneiras: () => import('../telas/peneiras.js'),
  dispensas: () => import('../telas/dispensas.js'),
  inimigo: () => import('../telas/inimigo.js'),
  zyron: () => import('../telas/zyron.js'),
  video: () => import('../telas/video.js'),
  mundo: () => import('../telas/mundo.js'),
  historico: () => import('../telas/historico.js'),
  sonho: () => import('../telas/sonho.js'),
  audio: () => import('../telas/audio.js'),
  quer: () => import('../telas/quer.js'),
  chance: () => import('../telas/chance.js'),
  contato: () => import('../telas/contato.js'),
  resultado: () => import('../telas/resultado.js')
};

// fração real (etapa / total) pra barra: 6% de saída e curva rápida no começo, lenta no fim; 1 continua 1
export const barraDeProgresso = x => x >= 1 ? 1 : 0.06 + 0.94 * (1 - Math.pow(1 - Math.max(0, x), 1.5));

export function criaMotor(app) {
  const { cfg, fluxo, copy, provas, estado, eventos, rastreio, mapa, barra } = app;
  const palco = document.getElementById('palco');
  const btVoltar = document.getElementById('voltar');
  const atoNum = document.querySelector('.ato-num');
  const atoNome = document.querySelector('.ato-nome');
  const prog = document.querySelector('.progresso');
  let atual = null;       // { id, el, limpeza }
  let token = 0;          // cada troca de tela invalida os temporizadores da anterior
  let tVista = performance.now();
  let trocando = false;
  let nivel = 0;          // quantas telas nossas existem antes desta no histórico do navegador
  const rolar = criaRolar({ desde: 'inimigo', ordem: fluxo.passos.map(p => p.id) });

  const ctxCond = () => {
    const d = deriva(estado.r, { copy, mapa, cfg });
    return { config: cfg, ficha: d.ficha, quiz: d.quiz, r: estado.r };
  };
  const caminhoAtual = () => calculaCaminho(fluxo, ctxCond());
  const passoDe = id => fluxo.passos.find(p => p.id === id);
  const hashPasso = () => { const m = /^#\/([\w-]+)/.exec(location.hash); return m ? m[1] : null; };

  function cabecalho(id, cam) {
    const p = passoDe(id);
    const cap = p?.capitulo || 'I';
    if (atoNum) atoNum.textContent = cap;
    if (atoNome) atoNome.textContent = fluxo.capitulos[cap] || '';
    const i = Math.max(0, cam.indexOf(id));
    const frac = cam.length ? (i + 1) / cam.length : 0;
    // a barra anda mais no começo e menos no fim (rápida e depois lenta reduz abandono: meta-análise de 32 experimentos, Villar,
    // Callegaro e Yang, 2013) e já sai com um pouco de avanço (efeito do progresso dado, Nunes e Drèze, 2006). O leitor de tela
    // continua ouvindo a etapa exata ("Etapa 3 de 15").
    prog.style.setProperty('--p', String(barraDeProgresso(frac)));
    prog.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
    prog.setAttribute('aria-valuetext', tx(copy.geral.passoDeTotal, { n: i + 1, total: cam.length }));
    const semVoltar = id === 'posicao' || id === 'resultado' || (id === 'contato' && estado.s.enviado);
    btVoltar.hidden = semVoltar;
    btVoltar.setAttribute('aria-hidden', semVoltar ? 'true' : 'false');
    btVoltar.tabIndex = semVoltar ? -1 : 0;
  }

  // o passo pedido pode não valer (ramo que sumiu, resposta que falta): devolve o mais perto que vale
  function resolve(id) {
    const cam = caminhoAtual();
    if (estado.s.enviado) return 'resultado';
    if (!cam.includes(id)) {
      const ordem = fluxo.passos.map(p => p.id);
      const i = ordem.indexOf(id);
      id = cam.find(x => ordem.indexOf(x) >= i) || cam[0];
    }
    const pend = primeiroIncompleto(cam, estado.r, estado.s);
    if (pend && cam.indexOf(id) > cam.indexOf(pend)) id = pend;
    return id;
  }

  function criaCtx(id, meuToken) {
    const d = deriva(estado.r, { copy, mapa, cfg });
    const limpeza = [];
    const vivo = () => meuToken === token;
    const ctx = {
      id, cfg, copy: copy[id] || {}, geral: copy.geral, todaCopy: copy, provas, mapa, estado,
      get r() { return estado.r; }, d, textos: d.textos,
      variante: escolheVariante(fluxo, id, ctxCond()),
      reduz: reduzMovimento(),
      barra,
      vivo,
      t: (modelo, vars) => t(modelo, Object.assign({}, d.textos, vars)),
      tx: (modelo, vars) => tx(modelo, Object.assign({}, d.textos, vars)),
      evento: (nome, params) => eventos.registra(nome, params),
      vibra,
      folha: abreFolha,
      fontes: (ids, alvo, tela) => { eventos.registra('prova_fontes_open', { tela: tela || id }); return abreFontes({ ids, alvo, provas, geral: copy.geral }); },
      aoSair: fn => limpeza.push(fn),
      depois: (ms, fn) => { const tm = setTimeout(() => { if (vivo()) fn(); }, ms); limpeza.push(() => clearTimeout(tm)); return tm; },
      responde(chave, valor, { evento = true } = {}) {
        estado.responde(chave, valor);
        Object.assign(ctx.d, deriva(estado.r, { copy, mapa, cfg }));
        ctx.textos = ctx.d.textos;
        // o evento leva só o valor categórico; contato e texto livre nunca
        if (evento && !PRIVADO.has(chave) && valor !== undefined && typeof valor !== 'object') eventos.registra('step_answer', { id, valor: chave + ':' + String(valor) });
        cabecalho(id, caminhoAtual());
      },
      avanca: () => avanca(meuToken),
      rastreio,
      app,
      pedeCookies: () => app.pedeCookies?.(),
      // tela de um toque já respondida (o atleta voltou): a barra oferece seguir com a mesma resposta
      continuarSeCompleto() {
        if ((COMPLETO[id] || (() => false))(estado.r, estado.s)) barra.botao({ texto: copy.geral.continuar, aoClicar: () => avanca(meuToken) });
      },
      // espelho de uma linha embaixo do alvo; avança em 1 s (ou no próximo toque). Sem espelho, avança em 260 ms
      async avancaCom({ espelho, alvo, atraso } = {}) {
        if (!vivo()) return;
        if (espelho) {
          const linha = linhaEspelho(espelho);
          alvo ? alvo.after(linha) : palco.querySelector('.tela')?.append(linha);
          await esperaOuToque(atraso ?? 1000, meuToken);
        } else {
          await espera(atraso ?? 260);
        }
        if (vivo()) avanca(meuToken);
      },
      esperaOuToque: ms => esperaOuToque(ms, meuToken),
      vaiPara: (destino, op) => mostra(destino, op),
      reinicia: () => { estado.zera(); mostra('posicao', { historico: 'replace' }); }
    };
    return { ctx, limpeza };
  }

  function esperaOuToque(ms, meuToken) {
    return new Promise(ok => {
      let feito = false;
      const fim = () => { if (feito) return; feito = true; clearTimeout(tm); document.removeEventListener('pointerdown', fim, true); document.removeEventListener('keydown', fim, true); ok(); };
      const tm = setTimeout(fim, ms);
      setTimeout(() => { if (!feito && meuToken === token) { document.addEventListener('pointerdown', fim, true); document.addEventListener('keydown', fim, true); } }, 0);
    });
  }

  function avanca(meuToken) {
    if (meuToken !== undefined && meuToken !== token) return;
    const cam = caminhoAtual();
    const i = cam.indexOf(atual?.id);
    const prox = cam[i + 1];
    if (prox) mostra(prox, { direcao: 'frente' });
  }

  async function carrega(id) {
    const f = TELAS[id];
    if (!f) throw new Error('tela desconhecida: ' + id);
    return f();
  }

  async function mostra(idPedido, { historico = 'push', direcao = 'frente' } = {}) {
    const id = resolve(idPedido);
    const meuToken = ++token;
    trocando = true;
    fechaFolha(true);
    let mod;
    try { mod = await carrega(id); }
    catch (e) {
      if (meuToken !== token) return;
      erroDeCarga(id, historico, direcao);
      eventos.registra('erro_js', { msg: 'carga ' + id, id });
      return;
    }
    if (meuToken !== token) return;

    // a tela que sai
    if (atual) {
      atual.limpeza.forEach(fn => { try { fn(); } catch { /* nada */ } });
      const velho = atual.el;
      if (!reduzMovimento() && velho.isConnected) { velho.classList.add('saindo'); await espera(150); }
      if (meuToken !== token) return;
    }

    if (historico === 'push') { nivel += 1; history.pushState({ passo: id, i: nivel }, '', '#/' + id); }
    else if (historico === 'replace') history.replaceState({ passo: id, i: nivel }, '', '#/' + id);
    estado.passo(id);

    barra.limpa();
    const { ctx, limpeza } = criaCtx(id, meuToken);
    let el;
    try { el = mod.render(ctx); }
    catch (e) {
      console.error(e);
      eventos.registra('erro_js', { msg: String(e && e.message || e).slice(0, 80), id });
      el = h('section', { class: 'tela' }, h('h1', { class: 'titulo', tabindex: '-1', text: copy.geral.erroGeral }));
    }
    el.classList.add('tela', atual ? 'entrando' : 'primeira');
    el.dataset.passo = id;
    el.dataset.direcao = direcao;
    palco.replaceChildren(el);
    window.scrollTo(0, 0);
    rolar.tela(el, id);
    atual = { id, el, limpeza };
    const cam = caminhoAtual();
    cabecalho(id, cam);
    document.title = id === 'posicao' ? copy.geral.titulo : `${tx(copy.geral.passoDeTotal, { n: cam.indexOf(id) + 1, total: cam.length })} · ${copy.geral.titulo}`;

    // foco no título (leitor de tela e teclado começam do topo da tela nova)
    requestAnimationFrame(() => {
      const tit = el.querySelector('h1');
      if (tit) { if (!tit.hasAttribute('tabindex')) tit.setAttribute('tabindex', '-1'); try { tit.focus({ preventScroll: true }); } catch { /* nada */ } }
    });
    const agora = performance.now();
    eventos.registra('step_view', { id, n: cam.indexOf(id) + 1, ms: Math.round(agora - tVista) });
    tVista = agora;
    setTimeout(() => { el.classList.remove('entrando'); trocando = false; }, 260);

    // baixa a próxima tela enquanto o atleta lê esta (cedo: no 4G, o toque seguinte não espera o download)
    const prox = cam[cam.indexOf(id) + 1];
    if (prox && TELAS[prox]) setTimeout(() => { TELAS[prox]().catch(() => {}); }, 300);
  }

  function erroDeCarga(id, historico, direcao) {
    trocando = false;
    barra.limpa();
    rolar.tela(null);
    const el = h('section', { class: 'tela' },
      h('h1', { class: 'titulo menor', tabindex: '-1', text: copy.geral.erroGeral }),
      h('button', { type: 'button', class: 'btn', style: { marginTop: '18px' }, onclick: () => mostra(id, { historico, direcao }) }, copy.geral.tentarDeNovo));
    palco.replaceChildren(el);
  }

  // o voltar do navegador (e o do celular)
  window.addEventListener('popstate', ev => {
    const pedido = (ev.state && ev.state.passo) || hashPasso();
    nivel = (ev.state && typeof ev.state.i === 'number') ? ev.state.i : 0;
    // depois do envio, o voltar reabre o resultado (sem reenviar: o leadId já existe)
    if (estado.s.enviado) { mostra('resultado', { historico: 'push', direcao: 'tras' }); return; }
    if (!pedido) return;
    eventos.registra('step_back', { id: atual?.id || '' });
    mostra(pedido, { historico: 'none', direcao: 'tras' });
  });

  btVoltar.addEventListener('click', () => {
    if (btVoltar.hidden || trocando) return;
    // existe tela nossa antes desta no histórico: o voltar do navegador faz o resto (popstate)
    if (nivel > 0) { history.back(); return; }
    // entrou direto num passo (retomada): calcula a anterior e troca no lugar
    const cam = caminhoAtual();
    const ant = cam[cam.indexOf(atual?.id) - 1];
    if (ant) { eventos.registra('step_back', { id: atual?.id || '' }); mostra(ant, { historico: 'replace', direcao: 'tras' }); }
  });

  // quem sai antes do fim: o evento de abandono leva só o id da última tela
  let ultimoAbandono = null;
  const abandono = () => {
    if (!atual || atual.id === 'resultado' || estado.s.enviado) return;
    if (ultimoAbandono === atual.id) return;
    ultimoAbandono = atual.id;
    const cam = caminhoAtual();
    eventos.registra('abandono', { id: atual.id, n: cam.indexOf(atual.id) + 1 });
    eventos.descarrega(true);
  };
  window.addEventListener('pagehide', abandono);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') abandono(); else ultimoAbandono = null; });

  return {
    mostra,
    inicia() {
      // entrou por um link com passo (#/zyron) ou recarregou no meio: tenta voltar pra lá, se as respostas permitirem
      const pedido = hashPasso();
      let id = 'posicao';
      if (estado.s.enviado) id = 'resultado';
      else if (pedido && pedido !== 'posicao' && estado.temRetomada()) id = pedido;
      nivel = (history.state && typeof history.state.i === 'number') ? history.state.i : 0;
      mostra(id, { historico: 'replace' });
    },
    get atual() { return atual?.id; },
    caminho: caminhoAtual
  };
}
