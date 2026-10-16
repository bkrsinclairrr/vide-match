/**
 * Conteúdo da página institucional (/institucional). Fotos, destinos e
 * escudos ficam aqui, longe do layout, para trocar uma legenda ou incluir
 * um atleta sem caçar JSX.
 *
 * Regra das legendas: só o que a própria imagem mostra (nome escrito na
 * arte, escudo, camisa, placa do CT) ou o que a equipe confirmou. Nada de
 * deduzir quem é quem pelo rosto.
 */
import { WHATSAPP_NUMBER } from "@/lib/funnel"

export const INSTAGRAM_HANDLE = "assessoria.voxen"
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`
export const CONTACT_EMAIL = "contato@aizyron.com"

const CONTACT_MESSAGE = "Olá! Conheci a Voxen pela página institucional e gostaria de conversar com a equipe."
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(CONTACT_MESSAGE)}`

const asset = (file: string) => `/institucional/${file}`

export type Photo = {
  src: string
  w: number
  h: number
  alt: string
  /** Linha principal da legenda (clube, lugar). */
  title: string
  /** Complemento da legenda, em itálico. */
  note?: string
}

export type Region = "Sul" | "Sudeste" | "Centro-Oeste" | "Nordeste"

/* ─── Abertura ─────────────────────────────────────────────────────── */

export const HERO_PHOTOS: Photo[] = [
  {
    src: asset("kaio-internacional-copa.webp"), w: 923, h: 1400,
    alt: "Arte do Internacional com o atleta Kaio assinando, anunciando as oitavas de final da Copa do Brasil Sub-17",
    title: "Internacional", note: "Copa do Brasil Sub-17",
  },
  {
    src: asset("gremio-assinatura.webp"), w: 1153, h: 1400,
    alt: "Atleta de camisa do Grêmio assinando contrato, com três adultos atrás e o escudo do clube ao fundo",
    title: "Grêmio", note: "Assinatura",
  },
  {
    src: asset("aek-london.webp"), w: 1284, h: 1240,
    alt: "Arte de boas-vindas da A.E.K. London ao atleta Mauricio Pablo",
    title: "A.E.K. London", note: "Inglaterra",
  },
]

/* ─── História ─────────────────────────────────────────────────────── */

export const HISTORY_PHOTOS: Photo[] = [
  {
    src: asset("fluminense-captacao.webp"), w: 1049, h: 1400,
    alt: "Integrante da equipe com credencial de captação ao lado de um atleta com uniforme do Fluminense, em frente ao campo",
    title: "Fluminense", note: "Credencial de captação",
  },
  {
    src: asset("aeroporto-brasilia.webp"), w: 1237, h: 1400,
    alt: "Integrante da equipe e dois atletas com malas no saguão do Aeroporto de Brasília",
    title: "Aeroporto de Brasília", note: "Embarque",
  },
  {
    src: asset("aeroporto-embarque.webp"), w: 952, h: 993,
    alt: "Integrante da equipe e três atletas com malas no saguão de um aeroporto",
    title: "A caminho do clube", note: "Embarque",
  },
]

export const PLATE_326: Photo = {
  src: asset("326-atletas.webp"), w: 538, h: 732,
  alt: "Arte Voxen | Zyron com o número 326 e a frase atletas enviados",
  title: "326 atletas enviados", note: "Voxen | Zyron",
}

/* ─── O novo olhar ─────────────────────────────────────────────────── */

export const TRACKING_VIDEO = {
  src: asset("rastreamento-ia.mp4"),
  poster: asset("rastreamento-poster.webp"),
  w: 720, h: 900,
}

export const JOAOZINHO_CARD: Photo = {
  src: asset("joaozinho-gremio.webp"), w: 477, h: 648,
  alt: "Cartão do atleta Joãozinho, do Grêmio, ao lado de um integrante da equipe",
  title: "Joãozinho", note: "Grêmio",
}

/* ─── O scout ──────────────────────────────────────────────────────── */

export const MENTORING_PHOTO: Photo = {
  src: asset("mentoria-online.webp"), w: 641, h: 1400,
  alt: "Chamada de vídeo do scout com atletas mentorados, com a legenda: finalizando mais uma etapa com nossos mentorados",
  title: "Mentoria online", note: "Encerramento de etapa com atletas acompanhados",
}

/** Exemplo de relatório — valores ilustrativos, não de um atleta real. */
export const REPORT_SAMPLE = [
  { label: "Leitura de jogo", score: 92 },
  { label: "Passe", score: 93 },
  { label: "Domínio", score: 91 },
  { label: "Drible", score: 90 },
  { label: "Ataque", score: 89 },
  { label: "Finalização", score: 86 },
  { label: "Velocidade", score: 85 },
  { label: "Chute", score: 84 },
  { label: "Defesa", score: 80 },
  { label: "Marcação", score: 79 },
] as const

/** Os mesmos 10 eixos, no perfil que um clube hipotético procura. */
export const CLUB_PROFILE_SAMPLE = [88, 90, 86, 84, 87, 80, 90, 78, 76, 75] as const

export const JOURNEY = [
  { step: "Análise", text: "A IA analisa cada lance e mede dez indicadores do jogo." },
  { step: "Plano", text: "O scout define metas e treinos específicos para a posição." },
  { step: "Acompanhamento", text: "Retorno a cada novo vídeo e ajustes toda semana." },
  { step: "Evolução", text: "Cada mudança nos indicadores fica registrada." },
  { step: "Vitrine", text: "Um perfil técnico completo, pronto para os clubes." },
  { step: "Clube", text: "A conexão com o clube que procura exatamente esse perfil." },
] as const

export const FILM = {
  src: asset("filme-zyron.mp4"),
  poster: asset("filme-poster.webp"),
  duration: "2 min 06 s",
}

/* ─── Brasil ───────────────────────────────────────────────────────── */

export type Destination = { city: string; uf: string; club: string; photo?: number }

export const BRAZIL_GALLERY: (Photo & { region: Region })[] = [
  {
    src: asset("kaio-internacional-copa.webp"), w: 923, h: 1400, region: "Sul",
    alt: "Arte do Internacional com o atleta Kaio assinando, anunciando as oitavas de final da Copa do Brasil Sub-17 contra o Santos",
    title: "Internacional · Porto Alegre, RS", note: "Kaio nas oitavas da Copa do Brasil Sub-17",
  },
  {
    src: asset("enzo-gama.webp"), w: 540, h: 682, region: "Centro-Oeste",
    alt: "Arte de contratação do volante Enzo Abreu pelo Gama, com medalha, troféu e a assinatura do contrato",
    title: "Gama · Distrito Federal", note: "Enzo Abreu, volante — contratado",
  },
  {
    src: asset("goias-assinatura.webp"), w: 1091, h: 1300, region: "Centro-Oeste",
    alt: "Atleta com a camisa do Goiás assinando contrato diante do painel de patrocinadores do clube",
    title: "Goiás · Goiânia, GO", note: "Assinatura",
  },
  {
    src: asset("gremio-base-sub15.webp"), w: 1156, h: 1400, region: "Sul",
    alt: "Publicação do Grêmio com três atletas da base Sub-15 após vitória sobre a Chapecoense",
    title: "Grêmio · Porto Alegre, RS", note: "Publicação oficial do clube — base Sub-15",
  },
  {
    src: asset("caio-internacional.webp"), w: 523, h: 637, region: "Sul",
    alt: "Cartão do atleta Caio com a camisa do Internacional",
    title: "Internacional · Porto Alegre, RS", note: "Caio",
  },
  {
    src: asset("guilherme-gremio.webp"), w: 484, h: 655, region: "Sul",
    alt: "Cartão do atleta Guilherme com a camisa do Grêmio, fazendo sinal de positivo",
    title: "Grêmio · Porto Alegre, RS", note: "Guilherme",
  },
  {
    src: asset("mauricio-palmeiras.webp"), w: 484, h: 651, region: "Sudeste",
    alt: "Cartão do atleta Mauricio segurando uma camisa autografada do Palmeiras",
    title: "Palmeiras · São Paulo, SP", note: "Mauricio",
  },
  {
    src: asset("corinthians.webp"), w: 924, h: 1400, region: "Sudeste",
    alt: "Dois atletas com uniforme do Corinthians, camisas 9 e 10, ao lado de um integrante da equipe, sob o monumento do escudo do clube",
    title: "Corinthians · São Paulo, SP", note: "Camisas 9 e 10",
  },
  {
    src: asset("fluminense-ct.webp"), w: 1009, h: 1400, region: "Sudeste",
    alt: "Atleta com mochila fazendo sinal de positivo sob o portal do CT Vale das Laranjeiras, do Fluminense",
    title: "Fluminense · Xerém, RJ", note: "CT Vale das Laranjeiras",
  },
  {
    src: asset("vila-nova.webp"), w: 1153, h: 1240, region: "Centro-Oeste",
    alt: "Atleta com o uniforme do Vila Nova ao lado de um integrante da equipe, no gramado",
    title: "Vila Nova · Goiânia, GO", note: "No gramado do clube",
  },
  {
    src: asset("goianesia.webp"), w: 839, h: 1069, region: "Centro-Oeste",
    alt: "Dois atletas com o uniforme do Goianésia ao lado de um integrante da equipe, no campo",
    title: "Goianésia · Goianésia, GO", note: "Atletas do elenco",
  },
  {
    src: asset("nautico.webp"), w: 848, h: 1231, region: "Nordeste",
    alt: "Atleta com o uniforme completo do Náutico, sorrindo no gramado",
    title: "Náutico · Recife, PE", note: "Uniforme oficial",
  },
  {
    src: asset("abc.webp"), w: 842, h: 1264, region: "Nordeste",
    alt: "Atleta com a camisa de treino do ABC, em frente ao muro com os escudos do clube",
    title: "ABC · Natal, RN", note: "Camisa de treino do clube",
  },
]

export const REGIONS: Region[] = ["Sul", "Sudeste", "Centro-Oeste", "Nordeste"]

/** Painel de embarques: cada linha aponta para a foto que a comprova (índice em BRAZIL_GALLERY). */
export const BRAZIL_DESTINATIONS: Destination[] = [
  { city: "Porto Alegre", uf: "RS", club: "Grêmio", photo: 3 },
  { city: "Porto Alegre", uf: "RS", club: "Internacional", photo: 0 },
  { city: "São Paulo", uf: "SP", club: "Corinthians", photo: 7 },
  { city: "São Paulo", uf: "SP", club: "Palmeiras", photo: 6 },
  { city: "Xerém", uf: "RJ", club: "Fluminense", photo: 8 },
  { city: "Goiânia", uf: "GO", club: "Goiás", photo: 2 },
  { city: "Goiânia", uf: "GO", club: "Vila Nova", photo: 9 },
  { city: "Goianésia", uf: "GO", club: "Goianésia", photo: 10 },
  { city: "Gama", uf: "DF", club: "Gama", photo: 1 },
  { city: "Recife", uf: "PE", club: "Náutico", photo: 11 },
  { city: "Natal", uf: "RN", club: "ABC", photo: 12 },
]

/* ─── Mundo ────────────────────────────────────────────────────────── */

export const WORLD_PHOTOS: Photo[] = [
  {
    src: asset("aek-london.webp"), w: 1284, h: 1240,
    alt: "Arte de boas-vindas da A.E.K. London ao atleta Mauricio Pablo",
    title: "A.E.K. London · Londres, Inglaterra", note: "“Welcome!” — Mauricio Pablo",
  },
  {
    src: asset("montreal.webp"), w: 871, h: 1400,
    alt: "Integrante da equipe e um homem com camisa polo do Sport Club Montreal segurando a camisa oficial do clube",
    title: "Sport Club Montreal · Canadá", note: "A camisa do clube em mãos",
  },
]

export const WORLD_DESTINATIONS: Destination[] = [
  { city: "Londres", uf: "ING", club: "A.E.K. London", photo: 0 },
  { city: "Montreal", uf: "CAN", club: "Sport Club Montreal", photo: 1 },
]

/* ─── Reconhecimento ───────────────────────────────────────────────── */

export const RECOGNITION_PHOTOS: Photo[] = [
  {
    src: asset("plenario-mesa.webp"), w: 1087, h: 1400,
    alt: "Integrante da equipe sentado à mesa de honra de um plenário, com o brasão do Distrito Federal na frente da bancada",
    title: "Homenagem no plenário", note: "Distrito Federal",
  },
  {
    src: asset("plenario-telao.webp"), w: 816, h: 1400,
    alt: "Telão do plenário mostrando o integrante da equipe durante a homenagem",
    title: "No telão do plenário", note: "Durante a homenagem",
  },
  {
    src: asset("entrevista-tv.webp"), w: 910, h: 1400,
    alt: "Atleta de agasalho do clube dando entrevista a uma repórter de televisão",
    title: "Na imprensa", note: "Atleta em entrevista à televisão",
  },
  {
    src: asset("reuniao.webp"), w: 1103, h: 1400,
    alt: "Integrante da equipe com três pessoas em trajes formais em um escritório",
    title: "Reuniões institucionais", note: "Bastidores",
  },
]

export const MOSAIC: Photo = {
  src: asset("mosaico.webp"), w: 1122, h: 1402,
  alt: "Mosaico com dezenas de fotos de atletas acompanhados pela equipe em clubes, campos, aeroportos e assinaturas",
  title: "Arquivo", note: "Um recorte das fotos da nossa trajetória",
}

/* ─── Conexões ─────────────────────────────────────────────────────── */

export type Connection = { slug: string; name: string; kind?: "brand" }

/** Clubes onde nossos atletas estiveram e clubes brasileiros da base da Zyron. */
export const CONNECTIONS_BRAZIL: Connection[] = [
  { slug: "gremio", name: "Grêmio" },
  { slug: "internacional", name: "Internacional" },
  { slug: "corinthians", name: "Corinthians" },
  { slug: "palmeiras", name: "Palmeiras" },
  { slug: "fluminense", name: "Fluminense" },
  { slug: "vasco", name: "Vasco da Gama" },
  { slug: "athletico", name: "Athletico Paranaense" },
  { slug: "goias", name: "Goiás" },
  { slug: "vilanova", name: "Vila Nova" },
  { slug: "gama", name: "Gama" },
  { slug: "goianesia", name: "Goianésia" },
  { slug: "nautico", name: "Náutico" },
  { slug: "abc", name: "ABC" },
  { slug: "sport", name: "Sport Recife" },
  { slug: "ceara", name: "Ceará" },
  { slug: "coritiba", name: "Coritiba" },
  { slug: "chapecoense", name: "Chapecoense" },
  { slug: "pontepreta", name: "Ponte Preta" },
  { slug: "mirassol", name: "Mirassol" },
]

/** Clubes do exterior (os dois primeiros com atletas nossos) e as marcas dos uniformes. */
export const CONNECTIONS_WORLD: Connection[] = [
  { slug: "aeklondon", name: "A.E.K. London" },
  { slug: "montreal", name: "Sport Club Montreal" },
  { slug: "adidas", name: "Adidas", kind: "brand" },
  { slug: "brighton", name: "Brighton & Hove Albion" },
  { slug: "betis", name: "Real Betis" },
  { slug: "braga", name: "Sporting Braga" },
  { slug: "feyenoord", name: "Feyenoord" },
  { slug: "nike", name: "Nike", kind: "brand" },
  { slug: "lens", name: "RC Lens" },
  { slug: "fiorentina", name: "ACF Fiorentina" },
  { slug: "brugge", name: "Club Brugge" },
  { slug: "villarreal", name: "Villarreal" },
  { slug: "salzburg", name: "Red Bull Salzburg" },
  { slug: "estoril", name: "Estoril Praia" },
  { slug: "girona", name: "Girona" },
  { slug: "bologna", name: "Bologna" },
  { slug: "midtjylland", name: "FC Midtjylland" },
  { slug: "realsociedad", name: "Real Sociedad" },
  { slug: "olympiacos", name: "Olympiacos" },
  { slug: "anderlecht", name: "Anderlecht" },
]

export const clubLogo = (slug: string) => `/clubs/${slug}.webp`

/**
 * Fonte pública para o contexto internacional do uso de IA no recrutamento
 * de base. O texto da página atribui o fato ao Chelsea, não à Zyron.
 */
export const CHELSEA_SOURCE =
  "https://www.chelseafc.com/en/news/article/introducing-the-future-blues-recruitment-programme"
