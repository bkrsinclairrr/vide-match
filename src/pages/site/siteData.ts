/**
 * Conteúdo da home institucional (/). Texto que muda com frequência fica
 * aqui, longe do layout, para dar para editar sem caçar JSX.
 */
import { WHATSAPP_NUMBER } from "@/lib/funnel"

/**
 * Escudos da faixa "no radar da nossa IA". Todos os clubes abaixo existem
 * na base de matching (src/data/clubs.ts — 345 clubes de 39 países), então
 * o título da faixa é literal. Arquivos em public/clubs/ (WebP 160px,
 * gerados a partir das miniaturas dos artigos da Wikipédia).
 */
export const RADAR_CLUBS = [
  { slug: "brighton", name: "Brighton & Hove Albion" },
  { slug: "internacional", name: "Internacional" },
  { slug: "betis", name: "Real Betis" },
  { slug: "braga", name: "Sporting Braga" },
  { slug: "vasco", name: "Vasco da Gama" },
  { slug: "feyenoord", name: "Feyenoord" },
  { slug: "lens", name: "RC Lens" },
  { slug: "ceara", name: "Ceará SC" },
  { slug: "fiorentina", name: "ACF Fiorentina" },
  { slug: "brugge", name: "Club Brugge" },
  { slug: "sport", name: "Sport Recife" },
  { slug: "villarreal", name: "Villarreal CF" },
  { slug: "salzburg", name: "Red Bull Salzburg" },
  { slug: "coritiba", name: "Coritiba" },
  { slug: "estoril", name: "Estoril Praia" },
  { slug: "girona", name: "Girona FC" },
  { slug: "chapecoense", name: "Chapecoense" },
  { slug: "bologna", name: "Bologna FC" },
  { slug: "midtjylland", name: "FC Midtjylland" },
  { slug: "pontepreta", name: "Ponte Preta" },
  { slug: "realsociedad", name: "Real Sociedad" },
  { slug: "olympiacos", name: "Olympiacos" },
  { slug: "mirassol", name: "Mirassol" },
  { slug: "anderlecht", name: "RSC Anderlecht" },
] as const

export const clubLogo = (slug: string) => `/clubs/${slug}.webp`

/**
 * Atleta de demonstração usado no "print" do painel e no card da seção
 * Para atletas — o mesmo Gabriel Rocha (meia-atacante) que já aparece
 * nos depoimentos de atletas da /avaliacao. A média dos 10 indicadores
 * dá a nota geral exibida (87), na mesma faixa 76–95 do relatório real.
 */
export const DEMO_ATHLETE = {
  name: "Gabriel Rocha",
  fullName: "Gabriel Rocha da Silva",
  age: 19,
  height: "1,78 m",
  weight: "72 kg",
  foot: "Esquerdo",
  position: "Meia-Atacante",
  positionShort: "MEI",
  category: "Sub-20",
  city: "Brasília - DF",
  photo: "/site/atleta-zyron.webp",
  overall: 87,
  club: { slug: "estoril", name: "Estoril Praia", country: "Portugal", league: "Primeira Liga", compatibility: 96 },
  stats: [
    { label: "Ataque", score: 89 },
    { label: "Defesa", score: 80 },
    { label: "Chute", score: 84 },
    { label: "Domínio", score: 91 },
    { label: "Marcação", score: 79 },
    { label: "Finalização", score: 86 },
    { label: "Drible", score: 90 },
    { label: "Passe", score: 93 },
    { label: "Velocidade", score: 85 },
    { label: "Leitura de Jogo", score: 92 },
  ],
} as const

/**
 * Números da seção "Por que a Zyron": só fatos que o próprio produto
 * sustenta (indicadores do relatório, tamanho da base de clubes, duração
 * do formulário e o fato de ser grátis e sem cadastro).
 */
export const STATS = [
  { count: "10", suffix: "", label: "Indicadores individuais", icon: "chart" },
  { count: "345", suffix: "", label: "Clubes na base da IA", icon: "shield" },
  { count: "3", suffix: " min", label: "Para montar seu perfil", icon: "clock" },
  { count: "100", suffix: "%", label: "Grátis e sem cadastro", icon: "gift" },
] as const

/**
 * Depoimentos — NOMES EM BRANCO de propósito, para serem preenchidos com
 * relatos reais e autorizados (`name`, e `photo` com um caminho em /public
 * se houver foto). Os textos são os rascunhos que já estavam na /avaliacao,
 * sem os nomes dos atletas. Com `name` vazio, o card mostra só o avatar
 * neutro e o `role`.
 */
export const TESTIMONIALS: { name: string; role: string; photo: string; text: string }[] = [
  {
    name: "",
    role: "Atleta · Meia-atacante",
    photo: "",
    text: "Fui em mais de 10 peneiras nos últimos 3 anos e nada. Com a Zyron, em menos de 2 meses já estava em contato com um clube em Portugal. O relatório foi o que abriu a porta, não o meu contato.",
  },
  {
    name: "",
    role: "Pai de atleta · Sub-18",
    photo: "",
    text: "O que mudou foi a conversa. Deixei de chegar como pai pedindo favor e passei a chegar com um documento técnico na mão. Meu filho assinou o primeiro contrato de formação dele em março.",
  },
  {
    name: "",
    role: "Atleta · Zagueiro",
    photo: "",
    text: "A maior dificuldade era ser visto. Não tenho pai famoso nem contato com dirigente. A Zyron me deu um relatório técnico que falou por mim.",
  },
  {
    name: "",
    role: "Mãe de atleta · Sub-14",
    photo: "",
    text: "Já tinha gastado muito com peneira, transporte e inscrição, sempre no escuro. Pela primeira vez eu soube de verdade em que pé estava o meu filho.",
  },
  {
    name: "",
    role: "Mãe de atleta · Sub-17",
    photo: "",
    text: "Meu marido achava que era mais uma promessa. O relatório apontou que meu filho rende muito melhor como ala do que como ponta. O clube que o chamou procurava exatamente esse perfil.",
  },
]

const SPECIALIST_MESSAGE = "Olá! Vim pelo site da Zyron e quero falar com um especialista sobre a avaliação por IA."

/** Mesmo número de contato do time usado no fim do funil. */
export const SPECIALIST_WHATSAPP = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(SPECIALIST_MESSAGE)}`
