// Os casos da T07 ("Como funciona na prática"): cada posição do quiz lê a conversa de um atleta da Voxen que joga nela. Os casos moram
// em config/provas.json (`caso-*`, declarados pelo dono): `posicoes` diz quais posições do quiz atende e `reserva` marca o caso de quem
// marca uma posição que ainda não tem atleta (hoje, o goleiro). Sem React e sem DOM, pra ser testado à parte (testes/teste-casos.mjs).

const ehCaso = p => p && p.ativo !== false && /^caso-/.test(p.id) && Array.isArray(p.posicoes);

/**
 * O caso de quem marcou `posicaoId` no quiz. `mesma` diz se o atleta do caso joga na posição de quem respondeu: com `true`, a abertura
 * diz "um zagueiro como você"; com `false` (o caso reserva), ela avisa que é a conversa dele, contada pra posição de quem respondeu.
 * Sem posição conhecida ou sem nenhum caso ativo, devolve `null` e a T07 simplesmente não mostra o bloco.
 */
export function casoDaPosicao(provas, posicaoId) {
  const casos = Object.values(provas || {}).filter(ehCaso);
  const proprio = posicaoId ? casos.find(c => c.posicoes.includes(posicaoId)) : null;
  if (proprio) return { caso: proprio, mesma: true };
  const reserva = casos.find(c => c.reserva);
  return reserva ? { caso: reserva, mesma: false } : null;
}

/** "Rafael Souza" vira "Rafael" (o fecho fala com o nome curto). */
export const primeiroNome = nome => String(nome || '').trim().split(/\s+/)[0] || '';
