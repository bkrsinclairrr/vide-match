/**
 * Caminhos da área do atleta. Ela é a casa de quem entra com a conta do Zyron
 * (login em /login) e fica fora da VOXEN, que é só da equipe (/voxen).
 */
export const CLIENT_BASE = "/minha-area"

/**
 * Onde se completa o perfil: o passo a passo do /avaliacao/perfil (foto, dados, posição e cidade) dentro da
 * área do atleta. Fica aqui, e não em /avaliacao, para a Utmify não contar quem já tem conta e para nenhum
 * lead novo nascer de quem já é do Zyron. Termina salvando e voltando ao Início, sem vídeos nem relatório.
 */
export const PROFILE_FORM_PATH = `${CLIENT_BASE}/completar-perfil`

const AS_MEMBER_KEY = "zyron:cliente:como"

/**
 * Id de quem a equipe está vendo ("ver como"). Vem de ?como= e fica na sessão
 * da aba para sobreviver à navegação interna.
 */
export function readAsMember(search: string): string | null {
  const como = new URLSearchParams(search).get("como")
  try {
    if (como) sessionStorage.setItem(AS_MEMBER_KEY, como)
    return sessionStorage.getItem(AS_MEMBER_KEY)
  } catch {
    return como
  }
}

export function clearAsMember() {
  try {
    sessionStorage.removeItem(AS_MEMBER_KEY)
  } catch {
    /* sem storage */
  }
}
