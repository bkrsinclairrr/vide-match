/**
 * Os gráficos editados pela equipe (voxen_player_charts): ler todos junto com os jogadores, gravar uma mudança e
 * apagá-la (voltar ao original). Só a equipe lê; quem mantém jogador escreve (o banco garante, por RLS).
 * Migração: 20261026110000_graficos_editaveis.sql. Sem ela, a lista de jogadores sai como antes, sem mudança nenhuma.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { isMissing } from "@/pages/membros/scoutLayer"
import { editFromRow, isEdited, rowFromEdit, type ChartEdit } from "./model"

const db = supabase as unknown as SupabaseClient

export const CHARTS_MIGRATION = "supabase/migrations/20261026110000_graficos_editaveis.sql"

/** Todas as mudanças por chave de jogador. Tabela ausente (ou qualquer falha de leitura): nenhuma, e a lista sai como antes. */
export async function fetchChartEdits(): Promise<Map<string, ChartEdit>> {
  const edits = new Map<string, ChartEdit>()
  try {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from("voxen_player_charts").select("*").order("player_key").range(from, from + 999)
      if (error) return new Map()
      for (const row of data ?? []) {
        const e = editFromRow(row as Record<string, unknown>)
        if (isEdited(e)) edits.set(String(row.player_key), e)
      }
      if (!data || data.length < 1000) break
    }
  } catch {
    return new Map()
  }
  return edits
}

/**
 * Grava a mudança do jogador, ou a apaga com `null` (o jogador volta ao relatório original). A mudança fica no endereço
 * principal da pessoa; se ela tinha uma mudança antiga no endereço de um registro juntado a ela (`aliases`), essa sai,
 * para não voltar sozinha depois.
 */
export async function saveChartEdit(playerKey: string, aliases: string[], edit: ChartEdit | null): Promise<void> {
  const keep = edit && isEdited(edit)
  const res = keep
    ? await db.from("voxen_player_charts").upsert({ player_key: playerKey, ...rowFromEdit(edit) }, { onConflict: "player_key" })
    : await db.from("voxen_player_charts").delete().in("player_key", [playerKey, ...aliases])
  let error = res.error
  if (!error && keep && aliases.length) error = (await db.from("voxen_player_charts").delete().in("player_key", aliases)).error
  if (!error) return
  if (isMissing(error)) throw new Error(`A edição dos gráficos ainda não foi ativada no banco de dados. Peça para aplicar a migração ${CHARTS_MIGRATION.split("/").pop()}.`)
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) throw new Error("O seu acesso não permite editar os gráficos.")
  if (error.code === "23514") throw new Error("O banco recusou algum valor. Confira as notas (1 a 100) e os pontos do campo.")
  throw new Error(error.message || "Não foi possível salvar os gráficos.")
}
