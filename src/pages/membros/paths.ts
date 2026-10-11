/**
 * Caminhos da parte da VOXEN que o cliente da Zyron acessa depois de entrar.
 * O mesmo login (/voxen) serve a equipe e os clientes: quem é admin cai no
 * painel; quem é cliente cai aqui.
 */
export const CLIENT_BASE = "/voxen/cliente"

const AS_MEMBER_KEY = "zyron:cliente:como"

/**
 * Id do membro que um admin está vendo ("ver como membro"). Vem de ?como= e
 * fica na sessão da aba para sobreviver à navegação interna.
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
