/**
 * Identidade estável para gerar o resultado do relatório (indicadores,
 * pontuação, clube sugerido). O mesmo atleta deve ver sempre o mesmo
 * resultado, mesmo preenchendo o formulário de novo — mudar o valor a cada
 * tentativa destrói a credibilidade do "veredito" da análise.
 *
 * Nas rotas autenticadas (Analysis, Match) o `user.id` já basta: é único e
 * não muda mesmo que o e-mail da conta mude. Só o funil aberto
 * (/avaliacao), que roda sem login, precisa de um reforço — ali a única
 * coisa que temos é o texto que a pessoa digitou, que pode variar entre
 * preenchimentos. Por isso combinamos o IP do visitante (mesma rede) com o
 * telefone informado (mais estável que o nome, que pode ser digitado de
 * formas diferentes).
 */
import { supabase } from "@/integrations/supabase/client"

const IP_CACHE_KEY = "zyron_client_ip"
const IP_FETCH_TIMEOUT_MS = 6000

/**
 * IP do visitante, cacheado em sessionStorage — uma chamada por sessão de
 * navegação basta, o IP não muda no meio da visita. Nunca lança: se a rede
 * falhar ou demorar demais, cai em "unknown" para não travar o funil numa
 * tela de carregamento eterna (o telefone/nome continuam segurando a
 * estabilidade da seed mesmo sem o IP).
 */
export async function getClientIp(): Promise<string> {
  const cached = sessionStorage.getItem(IP_CACHE_KEY)
  if (cached) return cached

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), IP_FETCH_TIMEOUT_MS)
    )
    const { data, error } = await Promise.race([
      supabase.functions.invoke<{ ip: string }>("client-ip"),
      timeout,
    ])
    if (error || !data?.ip) throw error ?? new Error("resposta sem IP")
    sessionStorage.setItem(IP_CACHE_KEY, data.ip)
    return data.ip
  } catch {
    return "unknown"
  }
}

/** Seed para quem já tem conta — a própria conta já garante a unicidade. */
export function buildAccountSeed(accountId: string): string {
  return `account:${accountId}`
}

/**
 * Seed para quem preenche sem login: IP da rede + a identidade mais
 * confiável disponível (telefone > nome). Duas pessoas diferentes na mesma
 * rede com nomes diferentes ainda geram seeds diferentes.
 */
export function buildAnonymousSeed(ip: string, opts: { phone?: string; name?: string }): string {
  const identity = opts.phone?.replace(/\D/g, "") || opts.name?.trim().toLowerCase() || "anonimo"
  return `ip:${ip}:pessoa:${identity}`
}
