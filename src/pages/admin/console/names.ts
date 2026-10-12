/**
 * Quem tem nome e sobrenome de verdade. Serve para separar os cadastros reais dos
 * de teste ("teste", "hdawdjj", "dwahxhwa dwahxhwa"). É uma ajuda para filtrar: a
 * decisão final é de quem seleciona e confirma.
 *
 * Regra, conferida com os dados reais (364 cadastros): o nome precisa ter ao menos
 * DUAS palavras que pareçam de pessoa, e nenhuma pode ser palavra de teste nem ter
 * número ou símbolo. Uma palavra "estranha" sozinha não derruba o nome: sobrenomes
 * curtos e raros ("Cruz", "John", "Hepp", "Henz", "Veng", "Thompson") têm poucas
 * vogais e antes eram confundidos com letras sem sentido.
 */

const CONNECTORS = new Set(["de", "da", "do", "dos", "das", "e", "di", "du", "del", "la", "le", "van", "von"])

/** Palavras que só aparecem em cadastros de teste. */
const BLOCKED = new Set([
  "teste", "testes", "test", "testando", "tester", "fulano", "beltrano", "ciclano", "asdf", "asdfg", "qwerty", "qwe", "abc", "abcd",
  "xxx", "xxxx", "admin", "null", "undefined", "nome", "sobrenome", "atleta", "user", "usuario", "exemplo", "example", "fake", "lorem", "ipsum",
])

const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

const isInitial = (t: string) => /^\p{L}\.$/u.test(t)
/** "Jr" depois do nome não é sobrenome ("Junior", "Neto" e "Filho" são: aparecem como sobrenome de verdade). */
const isSuffix = (t: string) => /^jr\.?$/i.test(t)
const isFiller = (t: string) => CONNECTORS.has(plain(t)) || isInitial(t) || isSuffix(t)

/** `ok`: parece nome; `odd`: letras estranhas, mas não prova nada sozinha; `bad`: número, símbolo ou palavra de teste. */
function judge(token: string): "ok" | "odd" | "bad" {
  // Só letras (com acento), apóstrofo, hífen e ponto: sem número nem símbolo.
  if (!/^\p{L}[\p{L}'’.-]*$/u.test(token)) return "bad"
  const letters = plain(token).replace(/[^a-z]/g, "")
  if (BLOCKED.has(letters) || letters.startsWith("teste")) return "bad"
  if (letters.length < 2) return "odd"
  if (/(.)\1{2,}/.test(letters)) return "odd" // aaa, jjj
  if (letters.length >= 4) {
    const vowels = (letters.match(/[aeiouy]/g) ?? []).length
    if (vowels / letters.length <= 0.25) return "odd" // "hdawdjj", "dwahxhwa"
    if (/[^aeiouy]{5,}/.test(letters)) return "odd" // "dskjhf"
  } else if (!/[aeiouy]/.test(letters)) {
    return "odd"
  }
  return "ok"
}

/** Nome e sobrenome que parecem de pessoa (ao menos duas palavras de verdade e nada de teste). */
export function looksLikeRealName(raw: string | null | undefined) {
  const name = (raw ?? "").trim().replace(/\s+/g, " ")
  if (name.length < 5 || name.length > 120) return false
  const verdicts = name.split(" ").filter((t) => !isFiller(t)).map(judge)
  return !verdicts.includes("bad") && verdicts.filter((v) => v === "ok").length >= 2
}

/** E-mails de teste (teste@, fulano@, example.com…). */
export function looksLikeTestEmail(email: string | null | undefined) {
  if (!email) return false
  return /(^|[^a-z])(teste|test|fake|fulano|example|exemplo|mailinator|asdf)([^a-z]|$)/i.test(email)
}

/** Cadastro que dá para tratar como pessoa real: nome completo e e-mail que não é de teste. */
export const looksReal = (p: { name: string; email: string | null }) => looksLikeRealName(p.name) && !looksLikeTestEmail(p.email)
