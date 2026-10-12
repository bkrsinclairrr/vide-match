/**
 * Quem tem nome e sobrenome de verdade. Serve para separar os cadastros reais dos
 * de teste ("teste", "hdawdjj", "dwahxhwa dwahxhwa"). É uma ajuda para filtrar: a
 * decisão final é de quem seleciona e confirma, por isso erra para o lado de
 * esconder o duvidoso em vez de aceitar lixo.
 */

const CONNECTORS = new Set(["de", "da", "do", "dos", "das", "e", "di", "du", "del", "la", "le", "van", "von"])

/** Palavras que só aparecem em cadastros de teste. */
const BLOCKED = new Set([
  "teste", "testes", "test", "testando", "tester", "fulano", "beltrano", "ciclano", "asdf", "asdfg", "qwerty", "qwe", "abc", "abcd",
  "xxx", "xxxx", "admin", "null", "undefined", "nome", "sobrenome", "atleta", "user", "usuario", "exemplo", "example", "fake", "lorem", "ipsum",
])

const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

const isInitial = (t: string) => /^\p{L}\.$/u.test(t)

function tokenOk(token: string) {
  if (CONNECTORS.has(plain(token)) || isInitial(token)) return true
  // Só letras (com acento), apóstrofo, hífen e ponto: sem número nem símbolo.
  if (!/^\p{L}[\p{L}'’.-]*$/u.test(token)) return false
  const letters = plain(token).replace(/[^a-z]/g, "")
  if (letters.length < 2) return false
  if (BLOCKED.has(letters) || letters.startsWith("teste")) return false
  if (/(.)\1{2,}/.test(letters)) return false // aaa, jjj
  if (letters.length >= 4) {
    const vowels = (letters.match(/[aeiouy]/g) ?? []).length
    if (vowels / letters.length <= 0.25) return false // "hdawdjj", "dwahxhwa"
    if (/[^aeiouy]{5,}/.test(letters)) return false // "dskjhf"
  } else if (!/[aeiouy]/.test(letters)) {
    return false
  }
  return true
}

/** Nome e sobrenome que parecem de pessoa (ao menos duas palavras de verdade). */
export function looksLikeRealName(raw: string | null | undefined) {
  const name = (raw ?? "").trim().replace(/\s+/g, " ")
  if (name.length < 5 || name.length > 120) return false
  const tokens = name.split(" ")
  const significant = tokens.filter((t) => !CONNECTORS.has(plain(t)) && !isInitial(t))
  return significant.length >= 2 && tokens.every(tokenOk)
}

/** E-mails de teste (teste@, fulano@, example.com…). */
export function looksLikeTestEmail(email: string | null | undefined) {
  if (!email) return false
  return /(^|[^a-z])(teste|test|fake|fulano|example|exemplo|mailinator|asdf)([^a-z]|$)/i.test(email)
}

/** Cadastro que dá para tratar como pessoa real: nome completo e e-mail que não é de teste. */
export const looksReal = (p: { name: string; email: string | null }) => looksLikeRealName(p.name) && !looksLikeTestEmail(p.email)
