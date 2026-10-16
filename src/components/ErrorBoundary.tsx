import { Component, type ReactNode } from "react"
import { isChunkLoadError, reloadForNewVersion } from "@/lib/chunkReload"

/**
 * Sem um boundary, um erro de carregamento derruba a árvore inteira do React
 * e a tela fica em branco. Quando o erro é de uma rota que não carregou (aba
 * aberta antes de um deploy, ver lib/chunkReload.ts), a página se recarrega
 * sozinha e a pessoa só vê o indicador de carregamento. A mensagem de erro
 * fica para o caso raro de o recarregamento não resolver.
 */

interface State {
  hasError: boolean
  /** O erro é de rota que não carregou: tenta recarregar antes de mostrar qualquer mensagem. */
  chunk: boolean
  /** Já recarregou há pouco e o erro voltou: aí sim mostra a mensagem. */
  reloadBlocked: boolean
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, chunk: false, reloadBlocked: false }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { hasError: true, chunk: isChunkLoadError(messageOf(error)) }
  }

  componentDidCatch(error: unknown) {
    console.error("Erro não tratado na árvore de componentes:", error)
    if (isChunkLoadError(messageOf(error)) && !reloadForNewVersion()) {
      this.setState({ reloadBlocked: true })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const updating = this.state.chunk && !this.state.reloadBlocked

    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {!updating && (
            <>
              <p className="text-sm text-muted-foreground">
                Algo deu errado ao carregar esta página. Isso costuma acontecer logo após uma atualização do site.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Recarregar página
              </button>
            </>
          )}
        </div>
      </div>
    )
  }
}
