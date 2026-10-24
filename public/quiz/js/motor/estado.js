// O estado do quiz: as respostas, o passo e o resultado. Fica no aparelho por alguns dias (retomada) e nunca guarda contato depois do envio.
import { guarda } from './util.js';

const CHAVE = 'qz:estado';
const VERSAO = 1;
const CONTATO = ['nome', 'whatsapp', 'responsavelNome', 'aceite'];

// estimativas pela faixa (a ficha do painel espera número; o SDR confirma no WhatsApp)
export const IDADE_ESTIMADA = { '12_14': 13, '15_17': 16, '18_21': 19, '22_mais': 23 };
export const PENEIRAS_ESTIMADAS = { '0': 0, '1_2': 2, '3_5': 4, '6_mais': 8 };
export const GASTO_ESTIMADO = { nada: 0, ate_500: 250, '500_2000': 1250, mais_2000: 3500 };
export const ADULTO = new Set(['18_21', '22_mais']);
export const MENOR = new Set(['12_14', '15_17']);

export function criaEstado({ dias = 7 } = {}) {
  const novo = () => ({ v: VERSAO, respostas: {}, passo: null, criadoEm: null, atualizadoEm: Date.now(), enviado: false, leadId: null, resultado: null });
  let s = novo();
  const lido = guarda.ler(CHAVE);
  if (lido && lido.v === VERSAO && Date.now() - (lido.atualizadoEm || 0) <= dias * 864e5) s = Object.assign(novo(), lido);
  else if (lido) guarda.apagar(CHAVE);
  // quem já respondeu a idade e parou depois da capa pode seguir de onde parou: a tela onde parou vale até ele sair da capa
  // (o motor grava o passo antes de desenhar a tela, então a capa não pode ler isso do s.passo)
  let retomada = s.respostas.idade && s.respostas.idade !== 'menos12' && s.passo && s.passo !== 'posicao' ? s.passo : null;
  // o que só vive nesta aba (o nome pra tela do resultado depois do envio)
  const memoria = {};

  function salva() {
    s.atualizadoEm = Date.now();
    const copia = JSON.parse(JSON.stringify(s));
    if (copia.enviado) CONTATO.forEach(k => delete copia.respostas[k]);
    guarda.gravar(CHAVE, copia);
  }

  return {
    get s() { return s; },
    get r() { return s.respostas; },
    memoria,
    responde(chave, valor) {
      if (!s.criadoEm) s.criadoEm = Date.now();
      if (valor === undefined) delete s.respostas[chave]; else s.respostas[chave] = valor;
      salva();
    },
    // na capa com retomada pendente, o passo salvo continua sendo a tela onde parou (fechou sem decidir, a oferta volta na próxima visita)
    passo(id) { if (id === 'posicao' && retomada) return; retomada = null; s.passo = id; salva(); },
    marcaEnviado({ leadId, resultado }) {
      memoria.nome = s.respostas.nome;
      s.enviado = true; s.leadId = leadId; s.resultado = resultado;
      CONTATO.forEach(k => delete s.respostas[k]);
      salva();
    },
    // já existe progresso que vale retomar (a idade já foi respondida) e a tela onde ele parou
    temRetomada() { return !!retomada; },
    get retomada() { return retomada; },
    zera() { guarda.apagar(CHAVE); s = novo(); retomada = null; Object.keys(memoria).forEach(k => delete memoria[k]); },
    // a saída do menor de 12: nada do que foi respondido fica guardado
    esquece() { guarda.apagar(CHAVE); s = novo(); retomada = null; }
  };
}

// As respostas viram a ficha (chaves do painel), o bloco quiz do payload e os textos que a copy usa.
export function deriva(r, { copy, mapa, cfg }) {
  const pos = r.posicao && mapa.temId(r.posicao) ? r.posicao : null;
  // o nome e o "quem" vêm do mapa do painel; a copy troca os da casa (CA é "Atacante" no quiz; o painel lê "atacante" como CA)
  const posicaoNome = pos ? (copy.posicao.nomes?.[pos] || mapa.nome(pos)) : '';
  const quem = pos ? (copy.posicao.quem?.[pos] || mapa.sub(pos).replace(/^onde atua /, '')) : 'um atleta';
  const peneiras = r.peneiras ?? null;
  const fezPeneira = peneiras !== null && peneiras !== '0';
  const gasto = fezPeneira ? (r.gasto ?? null) : null;
  const dispensas = fezPeneira ? (r.dispensas ?? null) : null;
  const recusado = !!(dispensas && dispensas !== '0');
  const op = (lista, id) => (lista || []).find(o => o.id === id);
  const gastoOp = op(copy.peneiras.gastoOpcoes, gasto);
  const sonhoOp = op(copy.sonho.opcoes, r.sonho);
  const videoOp = op(copy.zyron.videoOpcoes, r.video);

  const ficha = {
    nome: r.nome ? String(r.nome).trim() : '',
    idade: IDADE_ESTIMADA[r.idade] ?? null,
    posicao: posicaoNome,
    mapaCalor: pos,
    peneirasFeitas: PENEIRAS_ESTIMADAS[peneiras] ?? 0,
    gastoPeneiras: GASTO_ESTIMADO[gasto] ?? 0,
    sonho: sonhoOp ? sonhoOp.texto : '',
    origem: 'Zyron'
  };
  if (r.video === 'jogos' || r.video === 'lances') ficha.temVideo = 'sim';
  const expOp = op(copy.experiencia.opcoes, r.experiencia);
  if (cfg.telasOpcionais?.experiencia && expOp) ficha.experiencia = expOp.texto;

  const quiz = {
    canal: 'Quiz Zyron',
    idadeFaixa: r.idade ?? null,
    idadeEstimada: true,
    peneirasFaixa: peneiras,
    peneirasEstimado: fezPeneira,
    gastoFaixa: gastoOp ? gastoOp.texto : null,
    gastoEstimado: !!(gasto && gasto !== 'nada'),
    dispensas,
    recusado,
    jogouBem: recusado ? (r.jogouBem ?? null) : null,
    posicaoChave: pos,
    posicaoQuem: quem,
    viuOlhometro: !!r.viuOlhometro,
    video: r.video ?? null,
    sonhoChave: r.sonho ?? null,
    audio: r.audio ? { estado: r.audio.estado, pct: Math.round(r.audio.pct || 0) } : { estado: cfg.audio?.ativo === false ? 'desligado' : 'nao_tocou', pct: 0 },
    quer: r.quer ?? null,
    compromisso: !!r.compromisso,
    chance: r.chance ?? null,
    objetivo: cfg.telasOpcionais?.objetivo ? (r.objetivo ?? null) : null,
    trava: cfg.telasOpcionais?.trava ? (r.trava ?? null) : null,
    epoca: cfg.telasOpcionais?.epoca ? (r.epoca ?? null) : null
  };

  const textos = {
    quem,
    posicao: posicaoNome,
    faixa: copy.idade.faixaTexto[r.idade] || '',
    peneirasTexto: copy.peneiras.textos[peneiras] || '',
    dispensasTexto: copy.dispensas.textos[dispensas] || '',
    gastoTexto: copy.peneiras.gastoTextos[gasto] || '',
    sonho: sonhoOp ? sonhoOp.texto : '',
    sonhoCurto: sonhoOp ? sonhoOp.curto : '',
    videoTexto: videoOp ? videoOp.texto : '',
    nome: ficha.nome
  };
  return { ficha, quiz, textos, adulto: ADULTO.has(r.idade), menor: MENOR.has(r.idade) };
}
