/**
 * Dica instantânea (sem rede) de que existe uma sessão do Supabase guardada neste
 * navegador. Sem ela, quem abre uma tela de entrada é visitante: dá para mostrar
 * o login na hora, em vez de esperar o `getSession()` do provedor de login.
 * Se a dica estiver errada (sessão apagada, por exemplo), o provedor corrige logo
 * em seguida, então o pior caso é uma troca rápida de tela.
 */
export function hasStoredSession(): boolean {
  if (typeof window === "undefined") return false
  try {
    // Volta do Google / link de e-mail: a sessão chega pela URL, não pelo armazenamento.
    if (/[#&?](access_token|code|error_description)=/.test(window.location.hash + window.location.search)) return true
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) return true
    }
    return false
  } catch {
    return true // armazenamento bloqueado: não dá para saber, espera o provedor
  }
}
