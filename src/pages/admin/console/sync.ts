import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"

/*
 * Sincronização automática de membros (migração 20261012000000_membros_automaticos.sql).
 * O banco cria sozinho um membro para cada cadastro com nome e sobrenome de verdade e o
 * mantém em dia; aqui só lemos o estado e permitimos "Sincronizar agora".
 */

const db = supabase as unknown as SupabaseClient

export type SyncStatus = {
  leads: number
  contas: number
  membros: number
  automaticos: number
  da_equipe: number
  excluidos: number
  /** Cadastros reais que ainda não viraram membro (por exemplo, criados enquanto a automação estava desligada). */
  pendentes: number
}

export type SyncRow = { fonte: string; resultado: string; qtd: number }

/** A migração ainda não rodou no banco. */
export class SyncMissingError extends Error {
  constructor() {
    super("A sincronização automática ainda não foi ativada no banco de dados.")
    this.name = "SyncMissingError"
  }
}

export const SYNC_MIGRATION = "supabase/migrations/20261012000000_membros_automaticos.sql"

const isMissing = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === "PGRST202" || e.code === "42883" || /could not find the function|does not exist/i.test(e.message ?? "")))

export async function getSyncStatus(demo: boolean): Promise<SyncStatus> {
  // Dados locais do `npm run dev` (/admin?demo): o build de produção resolve a condição como falsa.
  if (import.meta.env.DEV && demo) {
    return { leads: 168, contas: 8, membros: 6, automaticos: 3, da_equipe: 3, excluidos: 1, pendentes: 0 }
  }
  const { data, error } = await db.rpc("zyron_sync_status")
  if (error) throw isMissing(error) ? new SyncMissingError() : new Error(error.message)
  return data as SyncStatus
}

export async function runSync(demo: boolean, includeExcluded = false): Promise<SyncRow[]> {
  if (import.meta.env.DEV && demo) return [{ fonte: "lead", resultado: "ja_existe:em_dia", qtd: 160 }, { fonte: "lead", resultado: "ignorado:sem_nome_completo", qtd: 8 }]
  const { data, error } = await db.rpc("zyron_sync_all", { p_include_excluded: includeExcluded })
  if (error) throw isMissing(error) ? new SyncMissingError() : new Error(error.message)
  return ((data ?? []) as { fonte: string; resultado: string; qtd: number | string }[]).map((r) => ({ fonte: r.fonte, resultado: r.resultado, qtd: Number(r.qtd) }))
}

const LABEL: Record<string, string> = {
  criado: "criados",
  atualizado: "atualizados",
  "ja_existe:em_dia": "já em dia",
  "ja_existe:mesmo_email": "já eram membros (mesmo e-mail)",
  "ja_existe:editado_pela_equipe": "editados pela equipe (não mexo)",
  "ignorado:sem_nome_completo": "sem nome e sobrenome",
  "ignorado:sem_email": "sem e-mail",
  "ignorado:email_invalido": "e-mail inválido",
  "ignorado:email_de_teste": "e-mail de teste",
  "ignorado:excluido_pela_equipe": "excluídos pela equipe",
}

/** Resumo para mostrar à pessoa: o que mudou e o que ficou de fora. */
export function summarizeSync(rows: SyncRow[]) {
  const sum = (match: (r: string) => boolean) => rows.filter((x) => match(x.resultado)).reduce((a, x) => a + x.qtd, 0)
  return {
    criados: sum((r) => r === "criado"),
    atualizados: sum((r) => r === "atualizado"),
    detalhes: rows
      .filter((x) => x.resultado !== "criado" && x.resultado !== "atualizado")
      .map((x) => ({ texto: `${x.fonte === "lead" ? "Funil" : "Contas"}: ${LABEL[x.resultado] ?? x.resultado}`, qtd: x.qtd })),
  }
}
