/**
 * Caminhos da área do atleta. Ela é a casa de quem entra com a conta do Zyron
 * (login em /login) e fica fora da VOXEN, que é só da equipe (/voxen).
 */
export const CLIENT_BASE = "/minha-area"

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
