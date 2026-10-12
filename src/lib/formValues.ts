/**
 * Lê os campos de um formulário direto da tela, na hora de enviar.
 *
 * Por quê: quando o navegador preenche a senha sozinho (gerenciador de senhas), o
 * Chrome só entrega esse valor ao JavaScript depois de um clique ou toque da pessoa
 * na página. Até lá o estado do React fica vazio, e uma tela que habilita o botão
 * (ou valida) pelo estado trata o campo como em branco: a pessoa precisa clicar no
 * campo de senha antes de conseguir entrar. No clique em "Entrar" o valor já foi
 * liberado, então ler do formulário (e não do estado) faz o login funcionar de
 * primeira. O `fallback` (o estado) cobre quem digitou normalmente ou testes sem DOM.
 *
 * Os campos precisam ter o atributo `name` igual às chaves do `fallback`.
 */
export function readFields<K extends string>(form: HTMLFormElement, fallback: Record<K, string>): Record<K, string> {
  const data = new FormData(form)
  const out = {} as Record<K, string>
  for (const key of Object.keys(fallback) as K[]) {
    const raw = data.get(key)
    out[key] = typeof raw === "string" && raw !== "" ? raw : fallback[key]
  }
  return out
}
