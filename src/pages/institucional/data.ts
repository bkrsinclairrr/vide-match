/**
 * Conteúdo da página institucional (/institucional). Fotos, destinos e
 * escudos ficam aqui, longe do layout, para trocar uma legenda ou incluir
 * um atleta sem caçar JSX.
 *
 * Regra das legendas: só o que a própria imagem mostra (nome escrito na
 * arte, escudo, camisa, placa do CT) ou o que a equipe confirmou. Nada de
 * deduzir quem é quem pelo rosto. Copy sem travessões, a pedido da equipe.
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
  /** Versões menores (480 e 960 px) geradas ao lado do arquivo original. */
  srcSet?: string
  w: number
  h: number
  alt: string
  /** Linha principal da legenda (clube, lugar). */
  title: string
  /** Complemento da legenda, em itálico. */
  note?: string
}

/**
 * Cada foto tem o original (usado no lightbox) e, quando ele é bem maior,
 * as versões `-480` e `-960`, para o celular não baixar 1.400 px para
 * mostrar 170. A regra (largura > 1,15 × variante) é a mesma do script
 * que gerou os arquivos.
 */
const VARIANTS = [480, 960]
function pic(file: string, w: number, h: number, alt: string, title: string, note?: string): Photo {
  const base = file.replace(/\.webp$/, "")
  const sizes = VARIANTS.filter((v) => w > v * 1.15)
  const srcSet = sizes.length
    ? [...sizes.map((v) => `${asset(`${base}-${v}.webp`)} ${v}w`), `${asset(file)} ${w}w`].join(", ")
    : undefined
  return { src: asset(file), srcSet, w, h, alt, title, note }
}

/* ─── Fotos ────────────────────────────────────────────────────────── */

const KAIO = pic("kaio-internacional-copa.webp", 923, 1400,
  "Arte do Internacional com o atleta Kaio assinando, anunciando as oitavas de final da Copa do Brasil Sub-17 contra o Santos",
  "Internacional", "Copa do Brasil Sub-17")
const GREMIO_SIGNING = pic("gremio-assinatura.webp", 1153, 1400,
  "Atleta de camisa do Grêmio assinando contrato, com três adultos atrás e o escudo do clube ao fundo",
  "Grêmio", "Assinatura")
const AEK = pic("aek-london.webp", 1284, 1240,
  "Arte de boas-vindas da A.E.K. London ao atleta Mauricio Pablo",
  "A.E.K. London", "Inglaterra")

export const HERO_PHOTOS: Photo[] = [KAIO, GREMIO_SIGNING, AEK]

export const HISTORY_PHOTOS: Photo[] = [
  pic("fluminense-captacao.webp", 1049, 1400,
    "Integrante da equipe com credencial do Fluminense ao lado de um atleta com uniforme do clube, em frente ao campo",
    "Fluminense", "Credencial do clube"),
  pic("aeroporto-brasilia.webp", 1237, 1400,
    "Integrante da equipe e dois atletas com malas no saguão do Aeroporto de Brasília",
    "Aeroporto de Brasília", "A caminho do clube"),
  pic("aeroporto-embarque.webp", 952, 993,
    "Integrante da equipe e três atletas com malas no saguão de um aeroporto",
    "Embarque", "Mais uma viagem rumo ao clube"),
]

export const PLATE_326 = pic("326-atletas.webp", 538, 732,
  "Arte Voxen | Zyron com o número 326 e a frase atletas enviados",
  "326 atletas enviados", "Voxen | Zyron")

export const TRACKING_VIDEO = {
  src: asset("rastreamento-ia.mp4"),
  poster: asset("rastreamento-poster.webp"),
  w: 720, h: 900,
}

export const JOAOZINHO_CARD = pic("joaozinho-gremio.webp", 477, 648,
  "Cartão do atleta Joãozinho, do Grêmio, ao lado de um integrante da equipe",
  "Joãozinho", "Grêmio")

export const MENTORING_PHOTO = pic("mentoria-online.webp", 915, 2000,
  "Chamada de vídeo do scout com atletas mentorados, cada um identificado com o escudo do seu clube: Fluminense, Athletico Paranaense e Vasco, com a legenda finalizando mais uma etapa com nossos mentorados",
  "Mentoria online", "Encerramento de etapa com atletas acompanhados")

/** Exemplo de relatório: valores ilustrativos, não de um atleta real. */
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

export const FILM = {
  src: asset("filme-zyron.mp4"),
  poster: asset("filme-poster.webp"),
  duration: "2 min 06 s",
}

/* ─── Destinos ─────────────────────────────────────────────────────── */

export type Destination = { city: string; uf: string; club: string }

/**
 * Galeria "Alguns dos nossos atletas", sem legenda (a pedido da equipe:
 * sem nome de atleta nem de clube na tela). São 11 fotos para que, com o
 * cartão "+ centenas", a grade feche certinho em 2, 3 ou 4 colunas.
 */
const uncaptioned = (file: string, w: number, h: number, alt: string) => pic(file, w, h, alt, "")

export const ATHLETE_GALLERY: Photo[] = [
  { ...KAIO, title: "", note: undefined,
    alt: "Arte do Internacional anunciando um atleta nas oitavas de final da Copa do Brasil Sub-17" },
  uncaptioned("gremio-base-sub15.webp", 1156, 1400, "Publicação oficial do Grêmio com três atletas da base Sub-15"),
  uncaptioned("goias-assinatura.webp", 1091, 1300, "Atleta com a camisa do Goiás assinando contrato"),
  uncaptioned("corinthians.webp", 924, 1400,
    "Dois atletas com uniforme do Corinthians ao lado de um integrante da equipe, sob o monumento do escudo do clube"),
  uncaptioned("nautico.webp", 848, 1231, "Atleta com o uniforme completo do Náutico, no gramado"),
  uncaptioned("mauricio-palmeiras.webp", 484, 651, "Atleta segurando uma camisa autografada do Palmeiras"),
  uncaptioned("fluminense-ct.webp", 1009, 1400, "Atleta sob o portal do CT Vale das Laranjeiras, do Fluminense"),
  uncaptioned("enzo-gama.webp", 540, 682, "Arte de contratação de um volante pelo Gama, com troféu e a assinatura do contrato"),
  uncaptioned("guilherme-gremio.webp", 484, 655, "Atleta com a camisa do Grêmio fazendo sinal de positivo"),
  uncaptioned("ceara.webp", 842, 1264, "Atleta com a camisa de treino do Ceará, em frente ao muro do clube"),
  uncaptioned("caio-internacional.webp", 523, 637, "Atleta com a camisa do Internacional"),
]

/**
 * Painel "Nossa rede": Brasil e exterior intercalados. Os clubes
 * brasileiros, a A.E.K. London e o Sport Club Montreal têm foto no
 * arquivo; Brighton, Sheffield United, RC Lens e Le Havre vêm da base de
 * matching da Zyron (src/data/clubs.ts).
 */
export const NETWORK_DESTINATIONS: Destination[] = [
  { city: "Porto Alegre", uf: "RS", club: "Grêmio" },
  { city: "Londres", uf: "ING", club: "A.E.K. London" },
  { city: "São Paulo", uf: "SP", club: "Corinthians" },
  { city: "Lens", uf: "FRA", club: "RC Lens" },
  { city: "Porto Alegre", uf: "RS", club: "Internacional" },
  { city: "Brighton", uf: "ING", club: "Brighton & Hove" },
  { city: "São Paulo", uf: "SP", club: "Palmeiras" },
  { city: "Le Havre", uf: "FRA", club: "Le Havre AC" },
  { city: "Recife", uf: "PE", club: "Náutico" },
  { city: "Sheffield", uf: "ING", club: "Sheffield United" },
  { city: "Fortaleza", uf: "CE", club: "Ceará" },
  { city: "Montreal", uf: "CAN", club: "Sport Club Montreal" },
]

/* ─── Mundo ────────────────────────────────────────────────────────── */

export const WORLD_PHOTOS: Photo[] = [
  { ...AEK, title: "A.E.K. London · Inglaterra", note: "Boas-vindas oficiais do clube" },
  pic("montreal.webp", 871, 1400,
    "Integrante da equipe e um homem com camisa polo do Sport Club Montreal segurando a camisa oficial do clube",
    "Sport Club Montreal · Canadá", "A camisa do clube em mãos"),
]

/**
 * Rede internacional: clubes europeus de porte médio da base da Zyron e um
 * dos Emirados Árabes (Al-Nasr, de Dubai), incluído a pedido da equipe.
 */
export const WORLD_NETWORK: Destination[] = [
  { city: "Estoril", uf: "POR", club: "Estoril Praia" },
  { city: "Braga", uf: "POR", club: "Sporting Braga" },
  { city: "Girona", uf: "ESP", club: "Girona FC" },
  { city: "Bruges", uf: "BEL", club: "Club Brugge" },
  { city: "Utrecht", uf: "HOL", club: "FC Utrecht" },
  { city: "Herning", uf: "DIN", club: "FC Midtjylland" },
  { city: "Bodø", uf: "NOR", club: "Bodø/Glimt" },
  { city: "Salzburgo", uf: "AUT", club: "Red Bull Salzburg" },
  { city: "Lugano", uf: "SUI", club: "FC Lugano" },
  { city: "Dubai", uf: "EAU", club: "Al-Nasr" },
]

/* ─── Reconhecimento ───────────────────────────────────────────────── */

export const RECOGNITION_PHOTOS: Photo[] = [
  pic("plenario-mesa.webp", 1087, 1400,
    "Integrante da equipe sentado à mesa de honra de um plenário, com o brasão do Distrito Federal na frente da bancada",
    "Homenagem no plenário", "Distrito Federal"),
  pic("plenario-telao.webp", 816, 1400,
    "Telão do plenário mostrando o integrante da equipe durante a homenagem",
    "No telão do plenário", "Durante a homenagem"),
  pic("entrevista-tv.webp", 910, 1400,
    "Atleta de agasalho do clube dando entrevista a uma repórter de televisão",
    "Na imprensa", "Atleta em entrevista à televisão"),
  pic("reuniao.webp", 1103, 1400,
    "Integrante da equipe com três pessoas em trajes formais em um escritório",
    "Reuniões institucionais", "Bastidores"),
]

export const MOSAIC = pic("mosaico.webp", 1122, 1402,
  "Mosaico com dezenas de fotos de atletas acompanhados pela equipe em clubes, campos, aeroportos e assinaturas",
  "Arquivo", "Um recorte das fotos da nossa trajetória")

/* ─── Conexões ─────────────────────────────────────────────────────── */

/** Foto com o dono do Botafogo (informação da equipe; a pessoa não é nomeada). */
export const BOTAFOGO_PHOTO = pic("botafogo-dono.webp", 1100, 1636,
  "Integrante da equipe Voxen em selfie com o dono do Botafogo, que usa um boné com a estrela do clube",
  "Com o dono do Botafogo", "Conexão direta com quem decide")

export const CONNECTION_PILLARS = [
  { title: "Donos de clubes", text: "Acesso direto a quem comanda o clube, como o dono do Botafogo." },
  { title: "Diretorias e captação", text: "Diretores de futebol e departamentos de base, no Brasil e no exterior." },
  { title: "Agentes e intermediários", text: "Os principais agentes do mercado, abrindo portas em cada país." },
] as const

export type Connection = { slug: string; name: string; kind?: "brand" }

/** Clubes onde nossos atletas estiveram e clubes brasileiros da base da Zyron. */
export const CONNECTIONS_BRAZIL: Connection[] = [
  { slug: "botafogo", name: "Botafogo" },
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
  { slug: "alnasr", name: "Al-Nasr (Dubai)" },
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
