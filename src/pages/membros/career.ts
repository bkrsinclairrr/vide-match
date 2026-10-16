/**
 * Etapas de carreira do atleta (seleção, encaminhamento e contrato): a equipe marca no
 * Setor Atletas (`zyron_athletes`) e a área do atleta lê aqui.
 *
 * O atleta não enxerga a tabela do setor (a RLS é só da equipe): ele lê o próprio progresso
 * pela função `zyron_my_journey()` (migração 20261016000000_jornada_do_atleta.sql), que
 * devolve só datas e marcas sim/não, nunca as notas da equipe. A equipe, no "ver como", lê a
 * ficha direto. Sem a migração (ou com qualquer falha), a jornada só não avança dessas etapas:
 * nada quebra.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import type { AthleteAccount } from "./account"
import { NO_CAREER, type Career } from "./game"

const db = supabase as unknown as SupabaseClient

type Row = Record<string, unknown>
const day = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 10) : null)
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

function fromRow(r: Row | null | undefined, selectedOn: unknown): Career {
  if (!r) return NO_CAREER
  return {
    selected: true,
    selectedOn: day(selectedOn),
    forwarded: r.forwarded === true,
    forwardedOn: day(r.forwarded_on),
    contract: r.contract_signed === true,
    contractOn: day(r.contract_on),
    contractClub: text(r.contract_club),
  }
}

const rank = (c: Career) => (c.contract ? 4 : 0) + (c.forwarded ? 2 : 0) + (c.selected ? 1 : 0)

/** A ficha mais adiantada entre as que pertencem à pessoa (lead, conta, membro ou e-mail). */
async function readAsStaff(account: AthleteAccount, memberId: string | null): Promise<Career> {
  const ors = [
    account.atletaId !== null && `athlete_id.eq.${account.atletaId}`,
    memberId && `member_id.eq.${memberId}`,
    account.email && `email.eq."${account.email.trim().toLowerCase().replace(/"/g, "")}"`,
  ].filter(Boolean) as string[]
  if (!ors.length) return NO_CAREER
  const { data, error } = await db.from("zyron_athletes").select("*").or(ors.join(",")).limit(5)
  if (error || !data?.length) return NO_CAREER
  return (data as Row[]).map((r) => fromRow(r, r.created_at)).sort((a, b) => rank(b) - rank(a))[0]
}

/** A função ainda não existe no banco: não pergunta de novo nesta visita (a área busca de novo ao voltar para a aba). */
let missing = false

async function readOwn(): Promise<Career> {
  if (missing) return NO_CAREER
  const { data, error } = await db.rpc("zyron_my_journey")
  if (error) {
    if (error.code === "PGRST202" || error.code === "42883" || /could not find the function|does not exist/i.test(error.message ?? "")) missing = true
    return NO_CAREER
  }
  const row = (Array.isArray(data) ? data[0] : data) as Row | undefined
  return fromRow(row && row.selected === true ? row : null, row?.selected_on)
}

/**
 * Carreira de quem está na área. `asStaff`: a equipe vendo a área de alguém ("ver como").
 * `preview`: dados locais do `npm run dev`.
 */
export async function loadCareer(opts: { preview: boolean; asStaff: boolean; account: AthleteAccount; memberId: string | null }): Promise<Career> {
  try {
    // A condição fica por extenso para o build de produção descartar os dados de teste.
    if (import.meta.env.DEV && opts.preview) return (await import("./fixtures")).fixtureCareer(opts.memberId, opts.account)
    return opts.asStaff ? await readAsStaff(opts.account, opts.memberId) : await readOwn()
  } catch {
    return NO_CAREER
  }
}
