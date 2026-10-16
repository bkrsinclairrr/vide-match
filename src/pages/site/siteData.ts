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
  { slug: "wolves", name: "Wolverhampton Wanderers" },
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
 * Atleta em destaque usado no "print" do painel e no card da seção
 * Para atletas — o mesmo Gabriel Rocha (meia-atacante) que já aparece
 * nos depoimentos de atletas da /avaliacao. A média dos 10 indicadores
 * dá a nota geral exibida (87), na mesma faixa 76–95 do relatório real.
 *
 * A oportunidade é no Wolverhampton Wanderers: está na base de clubes
 * (src/data/clubs.ts) e joga a Championship, a "Série B" inglesa, em
 * 2026/27 (caiu da Premier League em abril de 2026). A oferta segue o
 * formato da tela de match ("Oferta/mês", na moeda do clube).
 */
export const FEATURED_ATHLETE = {
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
  club: {
    slug: "wolves",
    name: "Wolverhampton Wanderers",
    short: "Wolverhampton",
    country: "Inglaterra",
    league: "Championship",
    squad: "Sub-21",
    compatibility: 96,
  },
  offer: { currency: "£", amount: "30.000", period: "mês" },
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
  /** Média dos meias-atacantes Sub-20 da base: a linha de comparação do gráfico de desempenho. */
  reference: {
    Ataque: 83, Defesa: 72, Chute: 79, Domínio: 85, Marcação: 70,
    Finalização: 80, Drible: 84, Passe: 86, Velocidade: 82, "Leitura de Jogo": 84,
  } as Record<string, number>,
  /** Nota Zyron (0–10) nos últimos 8 jogos, do mais antigo ao mais recente. A média da posição é 7,0. */
  matches: [
    { date: "16/08", rating: 7.0 },
    { date: "23/08", rating: 7.4 },
    { date: "30/08", rating: 6.9 },
    { date: "06/09", rating: 7.8 },
    { date: "13/09", rating: 8.1 },
    { date: "20/09", rating: 7.6 },
    { date: "27/09", rating: 8.3 },
    { date: "04/10", rating: 8.7 },
  ],
  positionAverage: 7.0,
  /**
   * Mapa de calor: onde ele toca na bola, em metros num campo de 105 × 68 com o
   * ataque para a direita, e o peso de cada ponto. Meia canhoto que flutua no
   * meio ofensivo e na faixa direita (para cortar para o pé bom).
   */
  heat: [
    [62, 40, 1], [68, 44, 1], [72, 38, 0.9], [76, 46, 0.85], [58, 34, 0.8], [80, 40, 0.75],
    [66, 50, 0.7], [84, 48, 0.6], [54, 44, 0.6], [70, 30, 0.6], [88, 36, 0.5], [60, 26, 0.45],
    [48, 38, 0.45], [78, 54, 0.45], [90, 44, 0.4], [44, 30, 0.35], [92, 30, 0.3], [36, 40, 0.3],
    [64, 58, 0.3], [56, 18, 0.25], [30, 34, 0.2], [96, 40, 0.25], [74, 22, 0.3], [82, 28, 0.35],
    [86, 40, 0.55], [84, 32, 0.4], [50, 50, 0.3], [40, 46, 0.25], [24, 40, 0.15], [70, 62, 0.2],
    [94, 50, 0.25], [62, 12, 0.15], [46, 22, 0.2], [58, 46, 0.5],
  ] as [number, number, number][],
  season: { actions: 412, finalThird: 46, goals: 6, assists: 9, passAccuracy: 88, dribbles: 61 },
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
 * Depoimentos de clientes reais, com nome e foto informados pela equipe
 * (fotos em public/site/depoimentos/). Com `name` vazio, o card mostra só
 * a foto e o `role`.
 */
export const TESTIMONIALS: { name: string; role: string; photo: string; text: string }[] = [
  {
    name: "Lucas Silva",
    role: "Atleta",
    photo: "/site/depoimentos/lucas-silva.webp",
    text: "Fui em mais de 10 peneiras nos últimos 3 anos e nada. Com a Zyron, em menos de 2 meses já estava em contato com um clube em Portugal. O relatório foi o que abriu a porta, não o meu contato.",
  },
  {
    name: "Cleiton",
    role: "Pai de Atleta",
    photo: "/site/depoimentos/cleiton.webp",
    text: "O que mudou foi a conversa. Deixei de chegar como pai pedindo favor e passei a chegar com um documento técnico na mão. Meu filho assinou o primeiro contrato de formação dele em março.",
  },
  {
    name: "Marcos Oliveira",
    role: "Atleta",
    photo: "/site/depoimentos/marcos-oliveira.webp",
    text: "A maior dificuldade era ser visto. Não tenho pai famoso nem contato com dirigente. A Zyron me deu um relatório técnico que falou por mim.",
  },
  {
    name: "Cátia Silva",
    role: "Mãe de Atleta",
    photo: "/site/depoimentos/catia-silva.webp",
    text: "Já tinha gastado muito com peneira, transporte e inscrição, sempre no escuro. Pela primeira vez eu soube de verdade em que pé estava o meu filho.",
  },
  {
    name: "Cecília",
    role: "Mãe de Atleta",
    photo: "/site/depoimentos/cecilia.webp",
    text: "Meu marido achava que era mais uma promessa. O relatório apontou que meu filho rende muito melhor como ala do que como ponta. O clube que o chamou procurava exatamente esse perfil.",
  },
]

const SPECIALIST_MESSAGE = "Olá! Vim pelo site da Zyron e quero falar com um especialista sobre a avaliação por IA."

/** Mesmo número de contato do time usado no fim do funil. */
export const SPECIALIST_WHATSAPP = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(SPECIALIST_MESSAGE)}`
