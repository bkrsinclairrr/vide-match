// Pontuação e tier: regra simples e transparente (config/pontuacao.json). Nunca lê idade, condição de menor nem época de nascimento.

export function pontua(r, regras, cfg) {
  const R = regras.regras;
  const p = {
    quer: R.quer[r.quer] ?? 0,
    compromisso: r.compromisso === true ? R.compromisso.sim : R.compromisso.nao,
    chance: R.chance[r.chance] ?? 0,
    video: R.video[r.video] ?? 0,
    dor: 0,
    audio: 0
  };
  const fez = !!r.peneiras && r.peneiras !== '0';
  const itens = {
    jaFezPeneira: fez,
    jaFoiDispensado: fez && !!r.dispensas && r.dispensas !== '0',
    familiaInvestiu500: fez && (r.gasto === '500_2000' || r.gasto === 'mais_2000')
  };
  R.dor.itens.forEach(k => { if (itens[k]) p.dor += R.dor.porItem; });
  const audioLigado = cfg.audio?.ativo !== false;
  if (audioLigado && r.audio && r.audio.estado) p.audio = R.audio[r.audio.estado] ?? 0;

  const total = p.quer + p.compromisso + p.chance + p.video + p.dor + p.audio;
  const T = regras.tiers;
  let tier;
  // C: pouca intenção (ou "hobby", com a tela opcional ligada). Nenhuma resposta da T12 força o C: ela não fala de dinheiro
  if ((cfg.telasOpcionais?.objetivo && T.C.objetivo.includes(r.objetivo)) || total < T.C.abaixoDe) tier = 'C';
  else if (total >= T.A.minimo && T.A.chance.includes(r.chance) && r.quer !== T.A.querDiferenteDe) tier = 'A';
  else tier = 'B';
  return { total, porRegra: p, tier, maximo: audioLigado ? regras.maximo : regras.maximoSemAudio };
}
