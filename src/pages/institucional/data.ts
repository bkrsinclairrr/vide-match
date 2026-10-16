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

export type Region = "Sul" | "Sudeste" | "Centro-Oeste" | "Nordeste"

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

/* ─── Brasil ───────────────────────────────────────────────────────── */

export type Destination = { city: string; uf: string; club: string; photo?: number }

const withRegion = (photo: Photo, region: Region) => ({ ...photo, region })

export const BRAZIL_GALLERY: (Photo & { region: Region })[] = [
  withRegion({ ...KAIO, title: "Internacional · Porto Alegre, RS", note: "Kaio nas oitavas da Copa do Brasil Sub-17" }, "Sul"),
  withRegion(pic("enzo-gama.webp", 540, 682,
    "Arte de contratação do volante Enzo Abreu pelo Gama, com medalha, troféu e a assinatura do contrato",
    "Gama · Distrito Federal", "Enzo Abreu, volante, contratado"), "Centro-Oeste"),
  withRegion(pic("goias-assinatura.webp", 1091, 1300,
    "Atleta com a camisa do Goiás assinando contrato diante do painel de patrocinadores do clube",
    "Goiás · Goiânia, GO", "Assinatura"), "Centro-Oeste"),
  withRegion(pic("gremio-base-sub15.webp", 1156, 1400,
    "Publicação do Grêmio com três atletas da base Sub-15 após vitória sobre a Chapecoense",
    "Grêmio · Porto Alegre, RS", "Publicação oficial do clube, base Sub-15"), "Sul"),
  withRegion(pic("caio-internacional.webp", 523, 637,
    "Cartão do atleta Caio com a camisa do Internacional",
    "Internacional · Porto Alegre, RS", "Caio"), "Sul"),
  withRegion(pic("guilherme-gremio.webp", 484, 655,
    "Cartão do atleta Guilherme com a camisa do Grêmio, fazendo sinal de positivo",
    "Grêmio · Porto Alegre, RS", "Guilherme"), "Sul"),
  withRegion(pic("mauricio-palmeiras.webp", 484, 651,
    "Cartão do atleta Mauricio segurando uma camisa autografada do Palmeiras",
    "Palmeiras · São Paulo, SP", "Mauricio"), "Sudeste"),
  withRegion(pic("corinthians.webp", 924, 1400,
    "Dois atletas com uniforme do Corinthians, camisas 9 e 10, ao lado de um integrante da equipe, sob o monumento do escudo do clube",
    "Corinthians · São Paulo, SP", "Camisas 9 e 10"), "Sudeste"),
  withRegion(pic("fluminense-ct.webp", 1009, 1400,
    "Atleta com mochila fazendo sinal de positivo sob o portal do CT Vale das Laranjeiras, do Fluminense",
    "Fluminense · Xerém, RJ", "CT Vale das Laranjeiras"), "Sudeste"),
  withRegion(pic("vila-nova.webp", 1153, 1240,
    "Atleta com o uniforme do Vila Nova ao lado de um integrante da equipe, no gramado",
    "Vila Nova · Goiânia, GO", "No gramado do clube"), "Centro-Oeste"),
  withRegion(pic("goianesia.webp", 839, 1069,
    "Dois atletas com o uniforme do Goianésia ao lado de um integrante da equipe, no campo",
    "Goianésia · Goianésia, GO", "Atletas do elenco"), "Centro-Oeste"),
  withRegion(pic("nautico.webp", 848, 1231,
    "Atleta com o uniforme completo do Náutico, sorrindo no gramado",
    "Náutico · Recife, PE", "Uniforme oficial"), "Nordeste"),
  withRegion(pic("abc.webp", 842, 1264,
    "Atleta com a camisa de treino do ABC, em frente ao muro com os escudos do clube",
    "ABC · Natal, RN", "Camisa de treino do clube"), "Nordeste"),
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
  { ...AEK, title: "A.E.K. London · Londres, Inglaterra", note: "Mauricio Pablo: “Welcome!”" },
  pic("montreal.webp", 871, 1400,
    "Integrante da equipe e um homem com camisa polo do Sport Club Montreal segurando a camisa oficial do clube",
    "Sport Club Montreal · Canadá", "A camisa do clube em mãos"),
]

export const WORLD_DESTINATIONS: Destination[] = [
  { city: "Londres", uf: "ING", club: "A.E.K. London", photo: 0 },
  { city: "Montreal", uf: "CAN", club: "Sport Club Montreal", photo: 1 },
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
