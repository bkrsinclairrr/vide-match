/**
 * Níveis de acesso da VOXEN (do maior para o menor).
 *   admin      faz tudo: o que o Scout faz, mais excluir, gerir contas e acessos e a central (/admin).
 *   executive  faz tudo o que o Scout faz e vê a lista de contas; não exclui nem muda acessos.
 *   scout      mantém os jogadores: cadastro, desempenho, partidas, oportunidades e o que cada um vê.
 *   user       atleta: só a própria área (/minha-area), com login em /login.
 * O banco é quem garante isso (RLS e a função admin-users); a interface só
 * esconde o que a pessoa não pode usar.
 */
export type StaffRole = "admin" | "executive" | "scout"
export type AccessLevel = StaffRole | "user"

/** Do maior para o menor. */
export const STAFF_ROLES: StaffRole[] = ["admin", "executive", "scout"]

export const LEVEL_LABEL: Record<AccessLevel, string> = {
  admin: "Administrador",
  executive: "Executivo",
  scout: "Scout",
  user: "Atleta",
}

export const LEVEL_BLURB: Record<AccessLevel, string> = {
  admin: "Faz tudo: o que o Scout faz, mais excluir e gerenciar contas e acessos.",
  executive: "Faz tudo o que o Scout faz e vê as contas da equipe. Não exclui nem muda acessos.",
  scout: "Mantém os jogadores: cadastro, desempenho, partidas e o que cada um vê na área dele.",
  user: "Só vê a própria área: perfil, conquistas, oportunidades e comparativos.",
}

/** O maior nível entre os papéis da conta (admin > executivo > scout > atleta). */
export function levelFromRoles(roles: string[]): AccessLevel {
  return STAFF_ROLES.find((r) => roles.includes(r)) ?? "user"
}

/** Manutenção de jogador (cadastro, notas, partidas, lances, setor, sincronizar): toda a equipe. */
export const canScoutAs = (role: StaffRole) => STAFF_ROLES.includes(role)

/** Excluir cadastros, membros e partidas, mudar contas e acessos, entrar em /admin: só o administrador. */
export const canAdminAs = (role: StaffRole) => role === "admin"

/** Vê "Contas e acessos": o administrador altera, o executivo só lê, o Scout não vê. */
export const canSeeAccountsAs = (role: StaffRole) => role !== "scout"
