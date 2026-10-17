/**
 * Tabela de preços dos closers (/precos). Preço, nome e link mudam com
 * frequência e ficam todos aqui, longe do layout: para trocar um valor ou um
 * link de checkout basta editar este arquivo.
 */

export type ProductTone = "gold" | "emerald"

export type ProductIcon = "crown" | "gem" | "rocket" | "radar" | "scan" | "search"

export interface Product {
  id: string
  /** Nome-base mostrado no card. */
  name: string
  /** Versão do produto, destacada ao lado do nome (ex.: "PRO"). */
  tier?: string
  /** Nome completo, usado nas mensagens copiadas. */
  label: string
  /** Preço em centavos, para não depender de ponto flutuante. */
  cents: number
  url: string
  icon: ProductIcon
  featured?: boolean
}

export interface ProductLine {
  id: string
  title: string
  tone: ProductTone
  products: Product[]
}

/** Data da última revisão dos preços — atualize junto com os valores. */
export const PRICES_UPDATED_AT = "17/10/2026"

export const PRODUCT_LINES: ProductLine[] = [
  {
    id: "assessoria",
    title: "Assessoria de Elite",
    tone: "gold",
    products: [
      {
        id: "elite-legacy",
        name: "Assessoria de Elite",
        tier: "Legacy",
        label: "Assessoria de Elite – Legacy",
        cents: 299700,
        url: "https://pay.sinnu.com.br/946p8UbU",
        icon: "crown",
        featured: true,
      },
      {
        id: "elite",
        name: "Assessoria de Elite",
        label: "Assessoria de Elite",
        cents: 149790,
        url: "https://pay.sinnu.com.br/aZvpL5Uy",
        icon: "gem",
      },
      {
        id: "elite-starter",
        name: "Assessoria de Elite",
        tier: "Starter",
        label: "Assessoria de Elite – Starter",
        cents: 50000,
        url: "https://pay.sinnu.com.br/QNE9ed9z",
        icon: "rocket",
      },
    ],
  },
  {
    id: "scouting",
    title: "Scouting",
    tone: "emerald",
    products: [
      {
        id: "scouting-pro",
        name: "Scouting",
        tier: "PRO",
        label: "Scouting PRO",
        cents: 99700,
        url: "https://pay.sinnu.com.br/jPZI1KEk",
        icon: "radar",
      },
      {
        id: "scouting-plus",
        name: "Scouting",
        tier: "Plus",
        label: "Scouting Plus",
        cents: 49790,
        url: "https://pay.sinnu.com.br/17UeQti8",
        icon: "scan",
      },
      {
        id: "scouting",
        name: "Scouting",
        label: "Scouting",
        cents: 24790,
        url: "https://pay.sinnu.com.br/TwKuQCt5",
        icon: "search",
      },
    ],
  },
]

/** Quem gera o link de cobrança PIX dos sinais na Sinnu. */
export const PIX_SIGNAL_CONTACTS = ["David", "Alex", "Cleiton"]

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

/** "R$ 2.997,00" — com espaço comum (o Intl usa espaço inseparável, que cola estranho no WhatsApp). */
export const formatPrice = (cents: number) => BRL.format(cents / 100).replace(/\s/g, " ")

/** Reais inteiros com separador de milhar: 2997 → "2.997". */
export const formatReais = (reais: number) => reais.toLocaleString("pt-BR")

/** Centavos com vírgula: 149790 → ",90". */
export const formatCents = (cents: number) => `,${String(cents % 100).padStart(2, "0")}`

/** Endereço sem protocolo, para caber no card: "pay.sinnu.com.br/946p8UbU". */
export const shortUrl = (url: string) => url.replace(/^https?:\/\//, "")

/**
 * Mensagem pronta para colar no WhatsApp do cliente: boas-vindas, produto e
 * link (sem o valor), e o pedido para avisar quando pagar. Os asteriscos são o
 * negrito do WhatsApp; o link fica sozinho na linha para gerar a prévia.
 */
export const productMessage = (p: Product) =>
  [
    "Bem-vindo ao time, jogador! Já contamos com você.",
    `*${p.label}*\nLink para pagamento:\n${p.url}`,
    "Assim que confirmar, me avisa para estarmos dando início ao trabalho. 🚀",
  ].join("\n\n")

export const whatsappShareUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`
