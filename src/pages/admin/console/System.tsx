import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle, CheckCircle2, Database, Download, ExternalLink, FileJson, Loader2, MonitorCog, RefreshCw, ServerCog, XCircle,
} from "lucide-react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { CardHead } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { getAccountsApi } from "@/pages/voxen/pages/accounts/api"
import { useAdminSource } from "@/pages/voxen/pages/members/shared"
import { downloadFile, stamp } from "@/lib/exportFile"
import { accountsCsv, membersCsv, playersCsv } from "./exports"
import { SYNC_MIGRATION, SyncMissingError, getSyncStatus, type SyncStatus } from "./sync"

const db = supabase as unknown as SupabaseClient
const PROJECT = "mehmqibxzxfqdxqjnjad"
const DASH = `https://supabase.com/dashboard/project/${PROJECT}`

type State = "run" | "ok" | "warn" | "fail"
type Check = { key: string; label: string; state: State; detail: string; hint?: string; ms?: number }

const ICON = { ok: CheckCircle2, warn: AlertTriangle, fail: XCircle, run: Loader2 } as const

const isMissing = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === "42P01" || e.code === "PGRST205" || e.code === "PGRST202" || /does not exist|could not find the (table|function)/i.test(e.message ?? "")))

/** Corpo da resposta de erro de uma Edge Function (a mensagem útil vem no corpo, não em `error.message`). */
async function functionError(res: { error: unknown }) {
  const ctx = (res.error as { context?: Response })?.context
  if (ctx && typeof ctx.json === "function") {
    try { return String(((await ctx.json()) as { error?: string }).error ?? "") } catch { /* corpo vazio */ }
  }
  return res.error instanceof Error ? res.error.message : ""
}

const TABLES = [
  ["funnel_leads", "Leads do funil"],
  ["Atletas", "Perfis de atletas"],
  ["profiles", "Perfis de contas"],
  ["user_roles", "Níveis de acesso"],
  ["voxen_player_meta", "Etapas e notas"],
  ["zyron_members", "Membros e referências"],
  ["zyron_matches", "Partidas"],
  ["zyron_match_events", "Lances marcados"],
] as const

/** Estado do sistema: o banco, as migrações, a função de contas e a sessão. Só leitura (nada é alterado). */
export default function System() {
  const { data, players, demo } = useVoxen()
  const { user, session } = useAuth()
  const { toast } = useToast()
  const source = useAdminSource()
  const [checks, setChecks] = useState<Check[]>([])
  const [counts, setCounts] = useState<Record<string, number | null>>({})
  const [running, setRunning] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)

  const run = useCallback(async () => {
    setRunning(true)
    // Modo de teste local (só no npm run dev): não há banco real para verificar.
    if (demo) {
      setChecks([{ key: "demo", label: "Modo de teste local", state: "warn", detail: "Os dados desta tela são de teste. As verificações reais rodam no site publicado." }])
      setCounts({ funnel_leads: players.filter((p) => p.source === "funil").length, Atletas: players.filter((p) => p.source === "conta").length })
      setRunning(false)
      return
    }
    const out: Check[] = []
    const timed = async <T,>(fn: () => Promise<T>) => {
      const t0 = performance.now()
      const value = await fn()
      return { value, ms: Math.round(performance.now() - t0) }
    }
    const push = (c: Check) => { out.push(c); setChecks([...out]) }

    // Contagens de cada tabela (só o número; nenhum dado é lido). Tabela que não existe vira `null`.
    const next: Record<string, number | null> = {}
    let firstError: string | null = null
    const base = await timed(() => Promise.all(TABLES.map(async ([table]) => {
      const r = await db.from(table).select("*", { count: "exact", head: true })
      next[table] = r.error ? null : r.count ?? 0
      if (r.error && !isMissing(r.error)) firstError ??= r.error.message
    })))
    setCounts({ ...next })

    push(Object.values(next).every((v) => v === null)
      ? { key: "db", label: "Conexão com o banco", state: "fail", detail: firstError ?? "Nenhuma tabela respondeu.", ms: base.ms }
      : { key: "db", label: "Conexão com o banco", state: firstError ? "warn" : "ok", detail: firstError ?? `Respondeu em ${base.ms} ms para ${TABLES.length} tabelas.`, ms: base.ms })

    push(data && !data.profileCapture
      ? { key: "funnel", label: "Perfil dos leads do funil", state: "warn", detail: "O funil ainda grava só nome, contato e origem.", hint: "Rode a migração 20261009000000_voxen_platform.sql no editor SQL do Supabase." }
      : { key: "funnel", label: "Perfil dos leads do funil", state: "ok", detail: "Posição, categoria e cidade dos leads estão sendo gravadas." })

    push(data && !data.sharedMeta
      ? { key: "meta", label: "Etapas e notas da equipe", state: "warn", detail: "Estão salvas só no navegador de quem usa.", hint: "Rode a migração 20261009000000_voxen_platform.sql no editor SQL do Supabase." }
      : { key: "meta", label: "Etapas e notas da equipe", state: "ok", detail: "Salvas no banco e compartilhadas com a equipe." })

    const members = next.zyron_members
    const matches = next.zyron_matches
    push(members === null || matches === null || next.zyron_match_events === null
      ? { key: "members", label: "Área de membros", state: "warn", detail: "As tabelas de membros, partidas e lances ainda não existem.", hint: "Rode a migração 20261010000000_area_de_membros.sql no editor SQL do Supabase." }
      : { key: "members", label: "Área de membros", state: "ok", detail: `${members} perfis, ${matches} partidas e ${next.zyron_match_events} lances.` })

    const staff = await timed(async () => await db.rpc("is_staff"))
    push(staff.value.error
      ? { key: "staff", label: "Permissões da equipe (executivo)", state: isMissing(staff.value.error) ? "fail" : "warn", detail: isMissing(staff.value.error) ? "A função is_staff não existe no banco." : staff.value.error.message, hint: isMissing(staff.value.error) ? "Rode a migração 20261011000000_contas_e_acessos.sql no editor SQL do Supabase." : undefined, ms: staff.ms }
      : { key: "staff", label: "Permissões da equipe (executivo)", state: staff.value.data === true ? "ok" : "warn", detail: staff.value.data === true ? "A sua conta é reconhecida como equipe pelo banco." : "O banco não reconhece a sua conta como equipe.", ms: staff.ms })

    // Sincronização automática de membros: a função de estado existe e quantos cadastros reais aguardam.
    type Probe = { s: SyncStatus | null; missing: boolean; msg?: string }
    const sync = await timed<Probe>(async () => {
      try {
        return { s: await getSyncStatus(false), missing: false }
      } catch (e) {
        return { s: null, missing: e instanceof SyncMissingError, msg: e instanceof Error ? e.message : String(e) }
      }
    })
    if (sync.value.s) {
      const s = sync.value.s
      push({ key: "sync", label: "Membros automáticos", state: s.pendentes > 0 ? "warn" : "ok", detail: `${s.automaticos} automáticos, ${s.da_equipe} da equipe, ${s.pendentes} aguardando.`, hint: s.pendentes > 0 ? "Em Membros, clique em “Sincronizar agora”." : undefined, ms: sync.ms })
    } else {
      push({ key: "sync", label: "Membros automáticos", state: sync.value.missing ? "warn" : "fail", detail: sync.value.missing ? "A sincronização automática não está ativa." : (sync.value.msg ?? "Não respondeu."), hint: sync.value.missing ? `Rode a migração ${SYNC_MIGRATION} no editor SQL do Supabase.` : undefined, ms: sync.ms })
    }

    // Função de contas: listar prova que responde; criar sem dados prova a versão (sem criar nada).
    const list = await timed(() => supabase.functions.invoke("admin-users", { body: { action: "list_users" } }))
    if (list.value.error || (list.value.data as { error?: string } | null)?.error) {
      push({ key: "fn", label: "Função de contas (admin-users)", state: "fail", detail: (await functionError(list.value)) || "Não respondeu.", hint: "Publique a função em Edge Functions, no painel do Supabase.", ms: list.ms })
    } else {
      const total = ((list.value.data as { users?: unknown[] })?.users ?? []).length
      const probe = await supabase.functions.invoke("admin-users", { body: { action: "create_staff" } })
      const message = await functionError(probe)
      const current = /e-mail válido e o nível/i.test(message)
      push(current
        ? { key: "fn", label: "Função de contas (admin-users)", state: "ok", detail: `Versão atual: lista ${total} contas e cria contas com senha.`, ms: list.ms }
        : { key: "fn", label: "Função de contas (admin-users)", state: "warn", detail: `Lista ${total} contas, mas é uma versão antiga: não cria contas com senha.`, hint: "Publique a versão nova da função em Edge Functions.", ms: list.ms })
    }

    const exp = session?.expires_at ? new Date(session.expires_at * 1000) : null
    push({ key: "session", label: "Sessão", state: "ok", detail: `${user?.email ?? "—"} entrou como administrador${exp ? `; renova sozinha (vence ${exp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})` : ""}.` })

    setRunning(false)
  }, [data, session, user, demo, players])

  useEffect(() => { if (data) void run() }, [data, run])

  const exportJob = async (key: string, job: () => Promise<void>) => {
    setExporting(key)
    try {
      await job()
      toast({ title: "Arquivo gerado" })
    } catch (e) {
      toast({ title: "Não foi possível exportar", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    } finally {
      setExporting(null)
    }
  }

  const loadAccounts = async () => (await (await getAccountsApi(demo)).list()).users
  const loadMembers = async () => (source ? await source.listProfiles() : [])

  const exports = [
    { key: "players", label: "Cadastros", sub: `${players.length} registros · CSV`, icon: Download, run: () => downloadFile(`cadastros-${stamp()}.csv`, playersCsv(players)) },
    { key: "accounts", label: "Contas e acessos", sub: "Logins e níveis · CSV", icon: Download, run: async () => downloadFile(`contas-${stamp()}.csv`, accountsCsv(await loadAccounts())) },
    { key: "members", label: "Membros e referências", sub: "Perfis e partidas · CSV", icon: Download, run: async () => downloadFile(`membros-${stamp()}.csv`, membersCsv(await loadMembers())) },
    {
      key: "json", label: "Cópia de segurança", sub: "Tudo em um arquivo · JSON", icon: FileJson,
      run: async () => {
        const [accounts, members] = await Promise.all([loadAccounts(), loadMembers()])
        const body = { geradoEm: new Date().toISOString(), cadastros: players.map((p) => ({ ...p, stats: undefined })), contas: accounts, membros: members }
        downloadFile(`copia-de-seguranca-${stamp()}.json`, JSON.stringify(body, null, 2), "application/json")
      },
    },
  ]

  const worst = checks.some((c) => c.state === "fail") ? "fail" : checks.some((c) => c.state === "warn") ? "warn" : "ok"
  const summary = !checks.length || running ? "Verificando…" : worst === "ok" ? "Tudo funcionando" : worst === "warn" ? "Funciona, com pendências" : "Há algo fora do ar"

  return (
    <>
      <section className={`vx-card cn-status is-${running ? "run" : worst}`}>
        <span className="cn-status-icon">{(() => { const I = ICON[running ? "run" : worst]; return <I className={running ? "cn-spin" : ""} /> })()}</span>
        <div className="min-w-0 flex-1">
          <h2>{summary}</h2>
          <p>{checks.filter((c) => c.state === "ok").length} de {checks.length || "…"} verificações em ordem. Esta página só lê: nada é alterado.</p>
        </div>
        <button type="button" className="vx-btn" onClick={() => void run()} disabled={running}><RefreshCw className={running ? "cn-spin" : ""} /> Verificar de novo</button>
      </section>

      <div className="vx-grid mt-[18px] xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="vx-card">
          <CardHead title="Verificações" sub="Banco, migrações, função de contas e sessão" />
          <ul className="cn-checks">
            {checks.map((c) => {
              const I = ICON[c.state]
              return (
                <li key={c.key} className={`is-${c.state}`}>
                  <span className="cn-check-icon"><I /></span>
                  <div className="min-w-0 flex-1">
                    <b>{c.label}</b>
                    <p>{c.detail}</p>
                    {c.hint && <p className="cn-check-hint">{c.hint}</p>}
                  </div>
                  {c.ms !== undefined && <span className="cn-check-ms tnum">{c.ms} ms</span>}
                </li>
              )
            })}
            {running && checks.length < 8 &&<li className="is-run"><span className="cn-check-icon"><Loader2 className="cn-spin" /></span><div className="flex-1"><b>Verificando…</b></div></li>}
          </ul>
        </section>

        <section className="vx-card">
          <CardHead title="Tabelas" sub="Quantos registros cada uma guarda" actions={<Database className="h-4 w-4 text-zinc-500" />} />
          <ul className="cn-tables">
            {TABLES.map(([table, label]) => (
              <li key={table}>
                <span><b>{label}</b><code>{table}</code></span>
                {counts[table] === undefined ? <em className="tnum">…</em> : counts[table] === null ? <em className="is-off">não existe</em> : <strong className="tnum">{counts[table]}</strong>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="vx-grid mt-[18px] xl:grid-cols-2">
        <section className="vx-card">
          <CardHead title="Exportar dados" sub="Arquivos para abrir na planilha ou guardar como cópia" />
          <div className="cn-exports">
            {exports.map((x) => (
              <button key={x.key} type="button" className="cn-export" disabled={exporting !== null} onClick={() => void exportJob(x.key, async () => { await x.run() })}>
                <span className="cn-export-icon">{exporting === x.key ? <Loader2 className="cn-spin" /> : <x.icon />}</span>
                <span><b>{x.label}</b><small>{x.sub}</small></span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">Os arquivos têm dados pessoais de atletas, inclusive menores. Guarde em lugar seguro e não compartilhe por canais abertos.</p>
        </section>

        <section className="vx-card">
          <CardHead title="Links úteis" sub="Painéis para os ajustes que não ficam aqui" actions={<ServerCog className="h-4 w-4 text-zinc-500" />} />
          <div className="cn-links">
            {[
              ["Supabase · visão geral", DASH],
              ["Supabase · usuários (Auth)", `${DASH}/auth/users`],
              ["Supabase · editor SQL", `${DASH}/sql/new`],
              ["Supabase · funções (Edge Functions)", `${DASH}/functions`],
              ["Supabase · logs", `${DASH}/logs/explorer`],
              ["Repositório no GitHub", "https://github.com/bkrsinclairrr/vide-match"],
            ].map(([label, href]) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"><span>{label}</span><ExternalLink /></a>
            ))}
          </div>
          <LocalCard />
        </section>
      </div>
    </>
  )
}

/** Dados que ficam só neste navegador: o e-mail lembrado no login e o menu recolhido. */
function LocalCard() {
  const { toast } = useToast()
  const forget = () => {
    try {
      localStorage.removeItem("zyron:admin-email")
      localStorage.removeItem("admin:menu-recolhido")
      localStorage.removeItem("voxen:menu-recolhido")
    } catch { /* sem armazenamento */ }
    toast({ title: "Pronto", description: "O e-mail lembrado e a posição do menu foram esquecidos neste navegador." })
  }
  return (
    <div className="cn-local">
      <MonitorCog />
      <p>Neste navegador ficam guardados só o e-mail do último login e se o menu está recolhido.</p>
      <button type="button" className="vx-btn" onClick={forget}>Esquecer</button>
    </div>
  )
}
