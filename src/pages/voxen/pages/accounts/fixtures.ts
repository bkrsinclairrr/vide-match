/**
 * Contas locais para o `npm run dev` (/voxen?demo): as mesmas regras da função
 * admin-users (último administrador, a própria conta). Carregado por import
 * dinâmico dentro de uma condição que o build de produção resolve como falsa,
 * então não vai para o site publicado.
 */
import type { AccessLevel } from "../../access"
import type { AccountRow, AccountsApi } from "./api"

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString()

const base = (id: string, fullName: string, email: string, level: AccessLevel, created: number, seen: number | null, extra: Partial<AccountRow> = {}): AccountRow => ({
  id, email, fullName, avatarUrl: null, createdAt: daysAgo(created), lastSignInAt: seen === null ? null : daysAgo(seen),
  confirmed: true, disabled: false, provider: "email", level, ...extra,
})

let users: AccountRow[] = [
  base("u-admin", "Helena Barros", "equipe@aizyron.com", "admin", 220, 0),
  base("u-admin2", "Beatriz Nogueira", "beatriz.nogueira@gmail.com", "admin", 140, 1),
  base("u-exec1", "Ricardo Tavares", "ricardotavares.82@gmail.com", "executive", 60, 3),
  base("u-exec2", "Marina Duarte", "marina.duarte@gmail.com", "executive", 32, 9),
  base("u-scout1", "Thiago Prado", "thiago.prado.scout@gmail.com", "scout", 14, 0),
  base("u-a1", "Gabriel Rocha da Silva", "gabriel.rocha07@gmail.com", "user", 41, 0, { provider: "google" }),
  base("u-a2", "Arthur Lima", "arthurlima.09@gmail.com", "user", 38, 2),
  base("u-a3", "Davi Cardoso Alves", "davi.cardoso.alves@gmail.com", "user", 35, 5),
  base("u-a4", "Rafael Mendes Monteiro", "rafaelmendes.15@gmail.com", "user", 12, 1),
  base("u-a5", "Kauã Souza", "kaua.souza2010@gmail.com", "user", 9, 4, { provider: "google" }),
  base("u-a6", "Enzo Martins", "enzomartins_11@gmail.com", "user", 6, null, { confirmed: false }),
  base("u-a7", "Lucas Ferreira", "lucas.ferreira.sub17@gmail.com", "user", 78, 40, { disabled: true }),
  base("u-a8", "Pedro Henrique Gomes", "pedrohgomes.14@gmail.com", "user", 3, 3),
]

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))
const find = (id: string) => {
  const u = users.find((x) => x.id === id)
  if (!u) throw new Error("Conta não encontrada.")
  return u
}
const admins = () => users.filter((u) => u.level === "admin").length
const guardLast = (id: string, verb: string) => {
  if (find(id).level === "admin" && admins() <= 1) throw new Error(`Não é possível ${verb} o último administrador.`)
}
const patch = (id: string, change: Partial<AccountRow>) => { users = users.map((u) => (u.id === id ? { ...u, ...change } : u)) }

export const localAccounts: AccountsApi = {
  async list() {
    return delay({ users: [...users], me: { id: "u-admin", level: "admin" as const } })
  },
  async setLevel(id, level) {
    if (id === "u-admin" && level !== "admin") throw new Error("Você não pode tirar o seu próprio acesso de administrador.")
    if (level !== "admin") guardLast(id, "rebaixar")
    patch(id, { level })
    return delay(undefined)
  },
  async invite(email, fullName, level) {
    const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (existing) {
      patch(existing.id, { level })
      return delay({ invited: false })
    }
    users = [base(`u-${Date.now()}`, fullName, email, level, 0, null, { confirmed: false }), ...users]
    return delay({ invited: true })
  },
  async createStaff(email, fullName, level, password) {
    const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (existing) {
      patch(existing.id, { level })
      return delay({ created: false })
    }
    if (password.length < 8 || password.length > 72) throw new Error("A senha precisa ter de 8 a 72 caracteres.")
    users = [base(`u-${Date.now()}`, fullName, email, level, 0, null), ...users]
    return delay({ created: true })
  },
  async rename(id, fullName) {
    patch(id, { fullName })
    return delay(undefined)
  },
  async setDisabled(id, disabled) {
    if (disabled) {
      if (id === "u-admin") throw new Error("Você não pode desativar a sua própria conta.")
      guardLast(id, "desativar")
    }
    patch(id, { disabled })
    return delay(undefined)
  },
  async remove(id) {
    if (id === "u-admin") throw new Error("Você não pode excluir a sua própria conta.")
    guardLast(id, "excluir")
    users = users.filter((u) => u.id !== id)
    return delay(undefined)
  },
}
