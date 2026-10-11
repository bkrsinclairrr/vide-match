/**
 * Contas e acessos: tudo passa pela função `admin-users` do Supabase (ela usa a
 * service role e confere o papel de quem chama: o executivo só lista, o
 * administrador faz o resto). No `npm run dev` com /voxen?demo, dados locais.
 */
import { supabase } from "@/integrations/supabase/client"
import type { AccessLevel } from "../../access"

export type AccountRow = {
  id: string
  email: string | null
  fullName: string
  avatarUrl: string | null
  createdAt: string
  lastSignInAt: string | null
  confirmed: boolean
  disabled: boolean
  provider: string
  level: AccessLevel
}

export type AccountList = { users: AccountRow[]; me: { id: string; level: AccessLevel } | null }

export interface AccountsApi {
  list(): Promise<AccountList>
  setLevel(id: string, level: AccessLevel): Promise<void>
  invite(email: string, fullName: string, level: "admin" | "executive"): Promise<{ invited: boolean }>
  rename(id: string, fullName: string): Promise<void>
  setDisabled(id: string, disabled: boolean): Promise<void>
  remove(id: string): Promise<void>
}

type Raw = {
  id: string
  email: string | null
  full_name?: string
  avatar_url?: string | null
  created_at: string
  last_sign_in_at: string | null
  confirmed?: boolean
  disabled?: boolean
  provider?: string
  roles?: string[]
  level?: AccessLevel
}

const OLD_FUNCTION =
  "A função admin-users do Supabase ainda é a versão antiga. Publique a nova (supabase/functions/admin-users) para liberar esta ação."

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const res = await supabase.functions.invoke("admin-users", { body })
  if (res.error) {
    // Em respostas 4xx/5xx a mensagem útil vem no corpo, não em `error.message`.
    let message = res.error.message
    const ctx = (res.error as { context?: Response }).context
    if (ctx && typeof ctx.json === "function") {
      try {
        const payload = (await ctx.json()) as { error?: string }
        if (payload?.error) message = payload.error
      } catch {
        /* corpo vazio */
      }
    }
    throw new Error(message === "Invalid request" ? OLD_FUNCTION : message)
  }
  const data = res.data as { error?: string } | null
  if (data?.error) throw new Error(data.error === "Invalid request" ? OLD_FUNCTION : data.error)
  return data as T
}

const toRow = (u: Raw): AccountRow => ({
  id: u.id,
  email: u.email,
  fullName: u.full_name?.trim() || "",
  avatarUrl: u.avatar_url ?? null,
  createdAt: u.created_at,
  lastSignInAt: u.last_sign_in_at,
  confirmed: u.confirmed ?? true,
  disabled: u.disabled ?? false,
  provider: u.provider ?? "email",
  // Versão antiga da função só devolve `roles`.
  level: u.level ?? (u.roles?.includes("admin") ? "admin" : u.roles?.includes("executive") ? "executive" : "user"),
})

const supabaseAccounts: AccountsApi = {
  async list() {
    const data = await call<{ users: Raw[]; me?: { id: string; level: AccessLevel } }>({ action: "list_users" })
    return { users: (data.users ?? []).map(toRow), me: data.me ?? null }
  },
  async setLevel(id, level) {
    await call({ action: "set_role", targetUserId: id, level })
  },
  async invite(email, fullName, level) {
    const data = await call<{ invited: boolean }>({ action: "invite_staff", email, fullName, level })
    return { invited: Boolean(data.invited) }
  },
  async rename(id, fullName) {
    await call({ action: "update_user", targetUserId: id, fullName })
  },
  async setDisabled(id, disabled) {
    await call({ action: disabled ? "disable_user" : "enable_user", targetUserId: id })
  },
  async remove(id) {
    await call({ action: "delete_user", targetUserId: id })
  },
}

/** A condição fica por extenso: o build de produção a resolve como falsa e descarta os dados locais. */
export async function getAccountsApi(demo: boolean): Promise<AccountsApi> {
  if (import.meta.env.DEV && demo) {
    const { localAccounts } = await import("./fixtures")
    return localAccounts
  }
  return supabaseAccounts
}
