/**
 * Funil aberto (/avaliacao) — lógica compartilhada.
 *
 * Diferença para o funil tradicional (/dashboard → /onboarding → /upload):
 * aqui a pessoa entra sem login, preenche o perfil, e só precisa criar
 * conta na hora de ver o resultado. Depois de criar a conta, volta para a
 * conclusão (tela de performance + contato no WhatsApp).
 *
 * Os dados ficam em sessionStorage sob a MESMA chave usada pelo onboarding
 * tradicional ('playerData'), de propósito: quem passa por um funil e
 * depois cai no outro não perde o que já preencheu.
 */

import { supabase } from "@/integrations/supabase/client"
import { emailSchema } from "@/lib/security"

export const FUNNEL_ROUTES = {
  home: "/avaliacao",
  profile: "/avaliacao/perfil",
  upload: "/avaliacao/upload",
  account: "/avaliacao/conta",
  result: "/avaliacao/resultado",
} as const

/** Número de contato do time Zyron (formato E.164, sem símbolos). */
export const WHATSAPP_NUMBER = "5561999767417"

export const PLAYER_DATA_KEY = "playerData"

export type PlayerData = {
  name: string
  age: string
  height: string
  weight: string
  preferredFoot: string
  email: string
  phone: string
  nationality: string
  position: string
  state: string
  city: string
  photo: string
  category: string
  hasDualCitizenship: string
  dualCitizenshipCountry: string
}

export const EMPTY_PLAYER: PlayerData = {
  name: "", age: "", height: "", weight: "",
  preferredFoot: "", email: "", phone: "",
  nationality: "", position: "",
  state: "", city: "", photo: "", category: "Sub 16",
  hasDualCitizenship: "", dualCitizenshipCountry: "",
}

export function loadPlayerData(): PlayerData {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PLAYER_DATA_KEY) || "null")
    return saved ? { ...EMPTY_PLAYER, ...saved } : EMPTY_PLAYER
  } catch {
    return EMPTY_PLAYER
  }
}

export function savePlayerData(data: PlayerData) {
  try {
    sessionStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(data))
  } catch {
    /* storage cheio ou bloqueado — o fluxo continua com o estado em memória */
  }
}

/** Já dá para gerar um resultado? (mesma validação das etapas do formulário) */
export function isProfileComplete(d: PlayerData) {
  return Boolean(
    d.name && d.age && d.height && d.weight && d.preferredFoot &&
    isValidEmail(d.email) && isValidPhone(d.phone) &&
    d.nationality && d.position && d.category && d.state && d.city
  )
}

/* ------------------------------------------------------------------ */
/* Contato: validação, máscara e envio imediato ao Supabase            */
/* ------------------------------------------------------------------ */

export function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "")
}

export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value || "").success
}

/** Celular ou fixo brasileiro: DDD + 8 ou 9 dígitos. */
export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value).length
  return digits === 10 || digits === 11
}

export function formatPhoneBR(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/**
 * Grava o lead assim que a pessoa informa contato — antes do vídeo e antes
 * da conta. O e-mail é a chave: refazer o funil atualiza o mesmo registro.
 * A escrita passa por uma função SECURITY DEFINER porque quem envia ainda
 * é um cliente anônimo, sem acesso direto à tabela.
 */
export async function syncFunnelLead(d: PlayerData): Promise<string> {
  const { data, error } = await supabase.rpc("capture_funnel_lead", {
    p_name: d.name.trim(),
    p_email: d.email.trim().toLowerCase(),
    p_phone: onlyDigits(d.phone),
  })
  if (error) throw new Error(error.message)
  return data
}

/* ------------------------------------------------------------------ */
/* Pontuação determinística                                            */
/* ------------------------------------------------------------------ */

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return Math.abs(hash)
}

/**
 * Mesma faixa (76–95) e mesmo método do relatório tradicional, para os
 * dois funis contarem a mesma história sobre o mesmo atleta.
 */
function seededScore(seed: number, index: number): number {
  return 76 + (hashString(`${seed}-${index}`) % 20)
}

export const STAT_KEYS = [
  { key: "ataque", label: "Ataque", desc: "Participação ofensiva, movimento e impacto no terço final" },
  { key: "defesa", label: "Defesa", desc: "Posicionamento, marcação e interceptações" },
  { key: "chute", label: "Chute", desc: "Precisão e potência nas finalizações" },
  { key: "dominio", label: "Domínio", desc: "Controle de bola, primeiro toque e proteção" },
  { key: "marcacao", label: "Marcação", desc: "Pressão, recuperação de bola e duelos" },
  { key: "finalizacao", label: "Finalização", desc: "Conversão de oportunidades criadas" },
  { key: "drible", label: "Drible", desc: "Capacidade de superação individual com a bola" },
  { key: "passe", label: "Passe", desc: "Qualidade, visão e frequência de passes certos" },
  { key: "velocidade", label: "Velocidade", desc: "Explosão em aceleração e velocidade máxima" },
  { key: "leitura", label: "Leitura de Jogo", desc: "Tomada de decisão e antecipação tática" },
] as const

export type StatResult = { key: string; label: string; desc: string; score: number }

/** Gera os indicadores a partir de uma semente estável (e-mail ou nome). */
export function buildStats(seedSource: string): StatResult[] {
  const seed = hashString(seedSource || "zyron-atleta")
  return STAT_KEYS.map((s, i) => ({ ...s, score: seededScore(seed, i) }))
}

export function overallFrom(stats: StatResult[]): number {
  return Math.round(stats.reduce((a, s) => a + s.score, 0) / stats.length)
}

/* ------------------------------------------------------------------ */
/* Mensagem de contato                                                 */
/* ------------------------------------------------------------------ */

/**
 * Monta a mensagem já preenchida do WhatsApp: quem é a pessoa, os dados
 * que ela informou e o pedido do resultado. Campos vazios simplesmente
 * não entram na frase, então a mensagem nunca fica com buraco.
 */
export function buildWhatsAppMessage(d: PlayerData, overall?: number): string {
  const nome = d.name?.trim() || "um atleta"
  const primeiroNome = nome.split(" ")[0]

  const idade = d.age ? `Tenho ${d.age} anos.` : ""

  const posicao = d.position
    ? `Jogo como ${d.position}${d.category ? ` (${d.category})` : ""}.`
    : d.category
      ? `Estou na categoria ${d.category}.`
      : ""

  const local = [d.city, d.state].filter(Boolean).join(" - ")

  const fisico = [
    d.height && `${d.height} cm`,
    d.weight && `${d.weight} kg`,
    d.preferredFoot && `pé ${d.preferredFoot}`,
  ].filter(Boolean).join(", ")

  // Cada bloco é um parágrafo; linhas vazias são descartadas dentro do bloco.
  const apresentacao = [
    `Olá! Aqui é ${nome}.`,
    idade,
    posicao,
    local ? `Moro em ${local}.` : "",
    fisico ? `Dados físicos: ${fisico}.` : "",
  ].filter(Boolean).join("\n")

  const avaliacao = overall
    ? `Acabei de concluir minha avaliação de performance no Zyron e recebi nota geral ${overall}.`
    : "Acabei de concluir minha avaliação de performance no Zyron."

  const pedido = "Gostaria de receber os resultados completos da avaliação e entender os próximos passos."

  const texto = [apresentacao, avaliacao, pedido].filter(Boolean).join("\n\n").trim()
  return texto || `Olá! Aqui é ${primeiroNome}. Gostaria de receber os resultados da minha avaliação no Zyron.`
}

export function buildWhatsAppLink(d: PlayerData, overall?: number): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(d, overall))}`
}

/* ------------------------------------------------------------------ */
/* Mensagens de erro do Supabase Auth, traduzidas                      */
/* ------------------------------------------------------------------ */

/**
 * O Supabase devolve erros em inglês, e alguns são bem técnicos pro
 * público final (ex: "email rate limit exceeded" — o limite de 2 e-mails
 * por hora do provedor embutido, que só sobe configurando SMTP próprio).
 * Traduz os casos conhecidos; deixa passar os demais como vierem, porque
 * ainda são mais úteis nítidos (ex: "User already registered") do que
 * escondidos atrás de uma mensagem genérica.
 */
export function friendlyAuthError(message: string | undefined): string {
  const m = (message || "").toLowerCase()

  if (m.includes("email rate limit exceeded") || m.includes("over_email_send_rate_limit")) {
    return "Muitos cadastros em pouco tempo. Espere alguns minutos e tente de novo."
  }
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) {
    return "Confirme seu cadastro para continuar. Toque em \"Já tenho conta\" e tente entrar novamente em instantes."
  }
  if (m.includes("already registered") || m.includes("user_already_exists")) {
    return "Este e-mail já tem uma conta. Toque em \"Já tenho conta\" para entrar."
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos."
  }
  if (m.includes("password") && m.includes("6 character")) {
    return "A senha precisa ter pelo menos 8 caracteres."
  }

  return message || "Algo deu errado. Tente novamente em instantes."
}
