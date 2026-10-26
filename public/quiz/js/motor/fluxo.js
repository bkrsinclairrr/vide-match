// O caminho do quiz, lido do config/fluxo.json: condições declarativas (sem eval), variantes e o que conta como passo respondido.

const pega = (obj, chave) => String(chave).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function avalia(cond, ctx) {
  if (!cond) return true;
  if (cond.todos) return cond.todos.every(c => avalia(c, ctx));
  if (cond.algum) return cond.algum.some(c => avalia(c, ctx));
  if (cond.nao) return !avalia(cond.nao, ctx);
  const v = pega(ctx, cond.chave);
  switch (cond.op) {
    case '=': return v === cond.valor;
    case '!=': return v !== cond.valor;
    case '>': return typeof v === 'number' && v > cond.valor;
    case '>=': return typeof v === 'number' && v >= cond.valor;
    case '<': return typeof v === 'number' && v < cond.valor;
    case 'em': return Array.isArray(cond.valor) && cond.valor.includes(v);
    case 'existe': return v !== undefined && v !== null;
    default: return false;
  }
}

// o passo está ligado: os do fluxo pelo "ativo"; os opcionais só se o config/geral.json os ligar
export function ligado(passo, cfg) {
  if (passo.opcional) return cfg.telasOpcionais?.[passo.id] === true;
  return passo.ativo !== false;
}

export function caminho(fluxo, ctx) {
  return fluxo.passos.filter(p => ligado(p, ctx.config) && avalia(p.se, ctx)).map(p => p.id);
}

export function variante(fluxo, id, ctx) {
  const p = fluxo.passos.find(x => x.id === id);
  if (!p || !p.variantes) return null;
  const v = p.variantes.find(x => avalia(x.se, ctx));
  return v ? v.id : null;
}

// o que precisa estar respondido pra o passo contar como feito (e pra liberar o seguinte)
export const COMPLETO = {
  posicao: r => !!r.posicao,
  idade: r => !!r.idade && r.idade !== 'menos12',
  experiencia: r => !!r.experiencia,
  epoca: r => !!r.epoca,
  objetivo: r => !!r.objetivo,
  peneiras: r => !!r.peneiras && (r.peneiras === '0' || !!r.gasto),
  trava: r => !!r.trava,
  dispensas: r => !!r.dispensas && (r.dispensas === '0' || !!r.jogouBem),
  inimigo: r => !!r.viuInimigo,
  zyron: r => !!r.viuZyron,
  video: r => !!r.video,
  mundo: r => !!r.viuMundo,
  historico: r => !!r.viuHistorico,
  sonho: r => !!r.sonho,
  audio: r => !!r.audio,
  quer: r => !!r.quer,
  chance: r => !!r.chance,
  contato: (r, s) => !!s.enviado,
  resultado: () => true
};

export function primeiroIncompleto(cam, r, s) {
  return cam.find(id => !(COMPLETO[id] || (() => true))(r, s)) || null;
}
