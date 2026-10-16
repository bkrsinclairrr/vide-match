/**
 * Toda rota é um pedaço (chunk) lazy() com hash no nome. Uma aba aberta antes
 * de um deploy ainda conhece os nomes antigos; ao navegar, ela pede um arquivo
 * que não existe mais e o import() falha. Recarregar busca o index.html atual,
 * com os nomes novos, e a página abre normalmente.
 */

const RELOAD_KEY = "zyron-chunk-reload-at"

/** Uma nova tentativa só depois desse intervalo: evita recarregar em laço se o erro for outro. */
const RETRY_AFTER_MS = 15_000

/** Mensagens dos navegadores para JS ou CSS de uma rota que não carregou (Chrome, Safari, Firefox e o Vite). */
export function isChunkLoadError(message: string): boolean {
  return /loading (css )?chunk|chunkloaderror|dynamically imported module|importing a module script failed|unable to preload css|failed to load module script|expected a javascript module|failed to fetch/i.test(message)
}

/**
 * Recarrega a página para pegar a versão nova do site. Devolve false (sem
 * recarregar) se já tentou há pouco ou se o navegador bloqueia o
 * sessionStorage, para nunca entrar em laço.
 */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
    if (Date.now() - last < RETRY_AFTER_MS) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
