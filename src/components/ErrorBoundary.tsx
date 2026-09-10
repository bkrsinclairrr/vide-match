import { Component, type ReactNode } from "react"

const CHUNK_RELOAD_KEY = "zyron-chunk-reload-attempted"

/**
 * Toda rota é um chunk lazy() com hash próprio (App.tsx/Home.tsx). Uma aba
 * aberta antes de um novo deploy tenta buscar um chunk que não existe mais
 * no CDN, e o import() rejeita — sem um boundary, isso derruba a árvore
 * inteira do React e a tela fica em branco, sem nenhum aviso. Um recarregamento
 * busca o index.html atual, com os hashes certos, e resolve sozinho.
 */
function isChunkLoadError(message: string): boolean {
  return /loading chunk|dynamically imported module|failed to fetch|importing a module script failed/i.test(message)
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Erro não tratado na árvore de componentes:", error)

    if (isChunkLoadError(message)) {
      try {
        if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, "1")
          window.location.reload()
        }
      } catch {
        window.location.reload()
      }
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            Algo deu errado ao carregar esta página. Isso costuma acontecer logo após uma atualização do site.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Recarregar página
          </button>
        </div>
      </div>
    )
  }
}
