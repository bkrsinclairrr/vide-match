/**
 * Níveis de acesso da VOXEN.
 *   admin      faz tudo: editar, mudar, excluir, gerir contas e acessos.
 *   executive  vê tudo na VOXEN, mas não altera nada (somente leitura).
 *   user       atleta: só a própria área (/minha-area), com login em /login.
 * O banco é quem garante isso (RLS e a função admin-users); a interface só
 * esconde o que a pessoa não pode usar.
 */
export type StaffRole = "admin" | "executive"
export type AccessLevel = StaffRole | "user"

export const LEVEL_LABEL: Record<AccessLevel, string> = {
  admin: "Administrador",
  executive: "Executivo",
  user: "Atleta",
}

export const LEVEL_BLURB: Record<AccessLevel, string> = {
  admin: "Faz tudo: edita, muda, exclui e gerencia contas e acessos.",
  executive: "Vê tudo na VOXEN, mas só lê: não edita, não muda e não exclui.",
  user: "Só vê a própria área: perfil, conquistas, oportunidades e comparativos.",
}

/** O maior nível entre os papéis da conta (admin > executivo > atleta). */
export function levelFromRoles(roles: string[]): AccessLevel {
  return roles.includes("admin") ? "admin" : roles.includes("executive") ? "executive" : "user"
}

export const canEditAs = (role: StaffRole) => role === "admin"
