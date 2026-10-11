import type { Player } from "@/pages/voxen/data"
import { STAGES, formatDateTime } from "@/pages/voxen/data"
import type { AccountRow } from "@/pages/voxen/pages/accounts/api"
import type { Member } from "@/pages/membros/model"
import { LEVEL_LABEL } from "@/pages/voxen/access"
import { toCsv } from "@/lib/exportFile"

/** Colunas dos arquivos exportados pelo painel (CSV para planilha). */

const stageLabel = (p: Player) => STAGES.find((s) => s.key === p.meta.stage)?.label ?? p.meta.stage

export const playersCsv = (rows: Player[]) =>
  toCsv(rows, [
    { label: "Nome", value: (p) => p.name },
    { label: "E-mail", value: (p) => p.email },
    { label: "Telefone", value: (p) => p.phone },
    { label: "Tipo", value: (p) => (p.source === "funil" ? "Funil" : "Conta") },
    { label: "Etapa", value: stageLabel },
    { label: "Posição", value: (p) => p.profile.position },
    { label: "Categoria", value: (p) => p.profile.category },
    { label: "Idade", value: (p) => p.profile.age },
    { label: "Altura (cm)", value: (p) => p.profile.height },
    { label: "Peso (kg)", value: (p) => p.profile.weight },
    { label: "Melhor pé", value: (p) => p.profile.foot },
    { label: "Nacionalidade", value: (p) => p.profile.nationality },
    { label: "Estado", value: (p) => p.profile.state },
    { label: "Cidade", value: (p) => p.profile.city },
    { label: "Origem do tráfego", value: (p) => p.origin },
    { label: "Nota geral", value: (p) => p.overall },
    { label: "Notas da equipe", value: (p) => p.meta.notes },
    { label: "Entrada", value: (p) => formatDateTime(p.createdAt) },
  ])

export const accountsCsv = (rows: AccountRow[]) =>
  toCsv(rows, [
    { label: "Nome", value: (a) => a.fullName },
    { label: "E-mail", value: (a) => a.email },
    { label: "Acesso", value: (a) => LEVEL_LABEL[a.level] },
    { label: "Status", value: (a) => (a.disabled ? "Desativada" : "Ativa") },
    { label: "E-mail confirmado", value: (a) => (a.confirmed ? "Sim" : "Não") },
    { label: "Login com", value: (a) => a.provider },
    { label: "Criada em", value: (a) => formatDateTime(a.createdAt) },
    { label: "Último acesso", value: (a) => (a.lastSignInAt ? formatDateTime(a.lastSignInAt) : "") },
  ])

export const membersCsv = (rows: (Member & { matchCount?: number; publishedCount?: number })[]) =>
  toCsv(rows, [
    { label: "Nome", value: (m) => m.fullName },
    { label: "Tipo", value: (m) => (m.kind === "membro" ? "Membro" : "Referência") },
    { label: "E-mail", value: (m) => m.email },
    { label: "Conta ligada", value: (m) => (m.userId ? "Sim" : "Não") },
    { label: "Posição", value: (m) => m.position },
    { label: "Categoria", value: (m) => m.category },
    { label: "Time", value: (m) => m.team },
    { label: "Cidade", value: (m) => m.city },
    { label: "Nascimento", value: (m) => m.birthDate },
    { label: "Altura (cm)", value: (m) => m.heightCm },
    { label: "Peso (kg)", value: (m) => m.weightKg },
    { label: "Melhor pé", value: (m) => m.foot },
    { label: "Partidas", value: (m) => m.matchCount },
    { label: "Publicadas", value: (m) => m.publishedCount },
    { label: "Ativo", value: (m) => (m.active ? "Sim" : "Não") },
  ])
