/**
 * Grava o que a pessoa preencheu no formulário do perfil da área do atleta: a linha de `Atletas` (a RLS só
 * deixa cada um mexer na sua) e, se ela escolheu uma foto nova, a foto do perfil. A conta e o relatório
 * passam a enxergar o perfil completo na próxima leitura; as regras estão em profileForm.ts.
 */
import { supabase } from "@/integrations/supabase/client"
import type { PlayerData } from "@/lib/funnel"
import { atletaRow } from "./profileForm"
import { isPhotoData, saveOwnPhoto } from "./photo"

/**
 * Lança com a mensagem em português se os dados não puderem ser gravados. A foto é opcional: se só ela
 * falhar, o perfil já está salvo e o erro volta em `photoError`, para a pessoa seguir sem ficar presa.
 */
export async function saveProfile(userId: string, data: PlayerData, currentPhoto: string | null): Promise<{ photoError?: string }> {
  const parsed = atletaRow(userId, data)
  if (parsed.ok === false) throw new Error(parsed.message)

  const { data: rows, error: fetchError } = await supabase
    .from("Atletas").select("id").eq("user_id", userId).order("created_at", { ascending: false }).limit(1)
  if (fetchError) throw new Error(fetchError.message)

  const existing = rows?.[0]
  const { error } = existing
    ? await supabase.from("Atletas").update(parsed.row).eq("id", existing.id)
    : await supabase.from("Atletas").insert([parsed.row])
  if (error) throw new Error(error.message)

  if (data.photo && data.photo !== currentPhoto && isPhotoData(data.photo)) {
    try {
      await saveOwnPhoto(userId, data.photo)
    } catch (err) {
      return { photoError: err instanceof Error ? err.message : "Tente enviar a foto de novo pelo seu perfil." }
    }
  }
  return {}
}
