// Entrada do quiz: carrega os contratos (config/*.json), liga estado, eventos, rastreio, envio e o motor, e mostra a primeira tela.
import { json, h } from './motor/util.js';
import { criaEstado } from './motor/estado.js';
import { criaMotor } from './motor/navegacao.js';
import { criaBarra } from './motor/barra.js';
import { criaEventos } from './dados/eventos.js';
import { criaEnvio } from './dados/envio.js';
import { criaRastreio } from './dados/rastreio.js';
import { pontua } from './dados/pontuacao.js';
import { abreFolha } from './componentes/folha.js';
import './vendor/mapa-calor.js';

const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

function mescla(a, b) {
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object') mescla(a[k], v);
    else a[k] = v;
  }
  return a;
}

async function inicia() {
  const [cfg, fluxo, copy, provasArq, regras, catalogo] = await Promise.all([
    json('config/geral.json'), json('config/fluxo.json'), json('config/copy.pt-BR.json'),
    json('config/provas.json'), json('config/pontuacao.json'), json('config/eventos.json')
  ]);
  // só nos testes locais: troca de configuração sem mexer nos arquivos
  if (LOCAL && window.QZ_TESTE) {
    mescla(cfg, window.QZ_TESTE.config);
    if (window.QZ_TESTE.audioArquivos) (await import('./componentes/audio-voz.js')).trocaArquivosParaTeste(window.QZ_TESTE.audioArquivos);
  }
  const provas = Object.fromEntries(provasArq.itens.map(p => [p.id, p]));
  const estado = criaEstado({ dias: cfg.retomadaDias || 7 });
  const eventos = criaEventos({ cfg, catalogo });
  const rastreio = criaRastreio({ cfg });
  const envio = criaEnvio({ cfg, eventos });
  eventos.aoEvento(nome => rastreio.dispara(nome, catalogo.pixel));
  const palco = document.getElementById('palco');
  const barra = criaBarra(document.getElementById('barra'), palco);
  const app = { cfg, fluxo, copy, provas, regras, catalogo, estado, eventos, rastreio, envio, barra, mapa: window.MapaCalor };
  app.pontua = r => pontua(r, regras, cfg);

  // a folha de cookies: só adulto, só com ID de pixel configurado, e abre por cima da tela seguinte (T03)
  app.pedeCookies = () => {
    const abre = () => {
      const c = copy.cookies;
      let escolhido = false;
      const decide = aceite => { escolhido = true; rastreio.escolhe(aceite); eventos.registra('cookies_escolha', { aceite }); folha.fecha(); };
      const conteudo = h('div', null,
        h('p', { class: 'cookies-texto', text: c.texto }),
        h('div', { class: 'cookies-botoes' },
          h('button', { type: 'button', 'data-cookies': 'aceitar', onclick: () => decide(true) }, c.aceitar),
          h('button', { type: 'button', 'data-cookies': 'rejeitar', onclick: () => decide(false) }, c.rejeitar)),
        h('a', { class: 'cookies-politica', href: cfg.politicaUrl, target: '_blank', rel: 'noopener noreferrer', text: c.politica }));
      const folha = abreFolha({ rotulo: 'Cookies', conteudo, semFechar: true, aoFechar: () => { if (!escolhido) rastreio.escolhe(false); } });
    };
    const espera = ev => { if (ev.detail.e === 'step_view') { window.removeEventListener('qz:evento', espera); setTimeout(abre, 420); } };
    window.addEventListener('qz:evento', espera);
  };

  const motor = criaMotor(app);
  app.caminho = motor.caminho;
  app.motor = motor;
  // retomada: a regra das tags vale desde a primeira tela (menor continua sem nada; adulto com aceite já dado, carrega)
  if (estado.r.idade) rastreio.idade(estado.r.idade);

  window.addEventListener('error', e => eventos.registra('erro_js', { msg: String(e.message || 'erro').slice(0, 80), id: motor.atual || '' }));
  window.addEventListener('unhandledrejection', e => eventos.registra('erro_js', { msg: String((e.reason && e.reason.message) || e.reason || 'promessa').slice(0, 80), id: motor.atual || '' }));

  eventos.registra('quiz_view', Object.assign({}, rastreio.utm, { plataforma: rastreio.plataforma, inApp: rastreio.inApp, versao: cfg.versao }));
  motor.inicia();

  // painel de ensaio (?debug=1): só em prévia, local ou modo de ensaio; em produção, só com debug: true no config
  const podeDepurar = cfg.debug === true || envio.modoEnsaio || LOCAL || /\.vercel\.app$/.test(location.hostname);
  if (podeDepurar) window.__qz = app;
  if (podeDepurar && /[?&]debug=1\b/.test(location.search)) import('./dados/debug.js').then(m => m.painel(app)).catch(() => {});
}

inicia().catch(err => {
  console.error(err);
  const palco = document.getElementById('palco');
  palco.replaceChildren(h('section', { class: 'tela' },
    h('h1', { class: 'titulo menor', text: 'Algo não carregou. Toque pra tentar de novo.' }),
    h('button', { type: 'button', class: 'btn', style: { marginTop: '18px' }, onclick: () => location.reload() }, 'Tentar de novo')));
});
