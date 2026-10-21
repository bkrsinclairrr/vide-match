import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react"
import { Binoculars, Check, Copy, Crown, Eye, EyeOff, KeyRound, MailPlus, Sparkles, UserPlus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LEVEL_BLURB, LEVEL_LABEL, type StaffRole } from "../../access"
import type { AccountsApi } from "./api"

type Level = StaffRole

/** Do menor para o maior, na ordem em que aparecem para escolher. */
const PICKS: Level[] = ["scout", "executive", "admin"]
const PICK_ICON = { scout: Binoculars, executive: Eye, admin: Crown } as const
/** Cor de cada nível no painel do resultado (RGB). */
const LEVEL_RGB: Record<Level, string> = { admin: "251,191,36", executive: "56,189,248", scout: "167,139,250" }
type Mode = "senha" | "convite"

/** Resultado da última criação, para a pessoa que cria passar os dados adiante. */
type Result = {
  kind: "created" | "granted" | "invited"
  email: string
  name: string
  level: Level
  /** Só existe na tela, nunca é gravada: depois de fechar, não dá para ver de novo. */
  password?: string
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Número inteiro sorteado de 0 a n-1, sem viés (rejeita a sobra do módulo). */
function randomBelow(n: number) {
  const limit = Math.floor(0x100000000 / n) * n
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return buf[0] % n
}

const SETS = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*?"]

/** Senha de 14 caracteres sem letras que se confundem (0/O, 1/l/I), sempre com maiúscula, minúscula, número e símbolo. */
function generatePassword(length = 14) {
  const all = SETS.join("")
  const chars = SETS.map((s) => s[randomBelow(s.length)])
  while (chars.length < length) chars.push(all[randomBelow(all.length)])
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join("")
}

/** 0 a 4: tamanho e variedade de caracteres. É só uma dica; quem decide é o Supabase. */
function strength(p: string) {
  if (!p) return 0
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length
  if (p.length < 8) return 1
  if (p.length >= 12 && classes >= 3) return 4
  if (p.length >= 10 && classes >= 2) return 3
  return 2
}
const STRENGTH_LABEL = ["", "Curta demais", "Fraca", "Boa", "Forte"]

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const addressFor = (level: Level) => `${window.location.origin}${level === "admin" ? "/admin" : "/voxen"}`

/** Texto pronto para mandar à pessoa (WhatsApp, e-mail). */
function shareText(r: Result) {
  const lines = [
    `Acesso à VOXEN (Zyron) como ${LEVEL_LABEL[r.level].toLowerCase()}`,
    `Endereço: ${addressFor(r.level)}`,
    `E-mail: ${r.email}`,
  ]
  if (r.password) lines.push(`Senha: ${r.password}`, "Você pode trocar a senha em “Esqueci a senha”, na tela de entrada.")
  return lines.join("\n")
}

/** Criar contas da equipe: já com senha (a pessoa entra na hora) ou por convite no e-mail. */
export function StaffCreator({ api, onDone }: { api: AccountsApi; onDone: () => Promise<void> }) {
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>("senha")
  const [level, setLevel] = useState<Level>("scout")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const copiedTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(copiedTimer.current), [])

  const validEmail = EMAIL.test(email.trim())
  const score = useMemo(() => strength(password), [password])
  const valid = validEmail && (mode === "convite" || password.length >= 8)

  const flash = (key: string) => {
    setCopied(key)
    window.clearTimeout(copiedTimer.current)
    copiedTimer.current = window.setTimeout(() => setCopied(null), 1800)
  }

  const copy = async (key: string, text: string) => {
    if (await copyText(text)) flash(key)
    else toast({ title: "Não foi possível copiar", description: "Selecione o texto e copie com Ctrl C.", variant: "destructive" })
  }

  const reset = () => {
    setName("")
    setEmail("")
    setPassword("")
    setConfirming(false)
  }

  const run = async () => {
    setSaving(true)
    const mail = email.trim().toLowerCase()
    const who = name.trim()
    try {
      if (mode === "senha") {
        const r = await api.createStaff(mail, who, level, password)
        setResult({ kind: r.created ? "created" : "granted", email: mail, name: who, level, password: r.created ? password : undefined })
        toast({ title: r.created ? "Conta criada" : "Acesso concedido", description: r.created ? `${mail} já pode entrar.` : `${mail} agora é ${LEVEL_LABEL[level].toLowerCase()}.` })
      } else {
        const r = await api.invite(mail, who, level)
        setResult({ kind: r.invited ? "invited" : "granted", email: mail, name: who, level })
        toast({ title: r.invited ? "Convite enviado" : "Acesso concedido", description: r.invited ? `${mail} recebe um e-mail para criar a senha.` : `${mail} agora é ${LEVEL_LABEL[level].toLowerCase()}.` })
      }
      reset()
      await onDone()
    } catch (err) {
      setConfirming(false)
      toast({ title: "Não foi possível adicionar", description: errMsg(err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || saving) return
    // Dar acesso total pede um segundo "sim", como na tabela.
    if (level === "admin" && !confirming) {
      setConfirming(true)
      return
    }
    void run()
  }

  const pick = (l: Level) => {
    setLevel(l)
    setConfirming(false)
  }

  return (
    <section className="vx-card ac-create mb-[18px]">
      <div className="ac-create-head">
        <div>
          <h2 className="vx-card-title">Adicionar à equipe</h2>
          <p className="vx-card-sub">Crie a conta de um scout, de um executivo ou de um administrador. Quem já tem conta só ganha o acesso novo.</p>
        </div>
        <div className="vx-tabs" role="tablist" aria-label="Como criar a conta">
          <button type="button" role="tab" aria-selected={mode === "senha"} className={`vx-tab ${mode === "senha" ? "is-on" : ""}`} onClick={() => { setMode("senha"); setConfirming(false) }}>
            <KeyRound className="mr-1.5 inline h-3.5 w-3.5" />Criar com senha
          </button>
          <button type="button" role="tab" aria-selected={mode === "convite"} className={`vx-tab ${mode === "convite" ? "is-on" : ""}`} onClick={() => { setMode("convite"); setConfirming(false) }}>
            <MailPlus className="mr-1.5 inline h-3.5 w-3.5" />Convidar por e-mail
          </button>
        </div>
      </div>

      {result && <ResultPanel result={result} copied={copied} onCopy={copy} onClose={() => setResult(null)} />}

      <form onSubmit={submit} noValidate>
        <div className="ac-picks" role="radiogroup" aria-label="Nível de acesso">
          {PICKS.map((l) => {
            const Icon = PICK_ICON[l]
            return (
              <label key={l} className={`ac-pick is-${l} ${level === l ? "is-on" : ""}`}>
                <input type="radio" name="staff-level" value={l} checked={level === l} onChange={() => pick(l)} className="sr-only" />
                <span className="ac-pick-icon"><Icon /></span>
                <span className="ac-pick-text"><b>{LEVEL_LABEL[l]}</b><small>{LEVEL_BLURB[l]}</small></span>
                <span className="ac-pick-check" aria-hidden="true"><Check /></span>
              </label>
            )
          })}
        </div>

        <div className={`ac-create-fields ${mode === "senha" ? "has-pass" : ""}`}>
          <div className="ac-field">
            <label htmlFor="sc-name">Nome</label>
            <input id="sc-name" className="vx-input" placeholder="Nome e sobrenome (opcional)" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>
          <div className="ac-field">
            <label htmlFor="sc-email">E-mail</label>
            <input id="sc-email" className="vx-input" type="email" inputMode="email" placeholder="email@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
          </div>

          {mode === "senha" && (
            <div className="ac-field ac-field--pass">
              <label htmlFor="sc-pass">Senha de acesso</label>
              <div className="ac-pass">
                <input
                  id="sc-pass" className="vx-input" type={show ? "text" : "password"} placeholder="Mínimo de 8 caracteres" value={password}
                  onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" spellCheck={false} maxLength={72}
                />
                <button type="button" className="ac-pass-btn" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? "Ocultar a senha" : "Mostrar a senha"} title={show ? "Ocultar" : "Mostrar"}>
                  {show ? <EyeOff /> : <Eye />}
                </button>
                <button type="button" className="ac-pass-btn" onClick={() => setPassword(generatePassword())} aria-label="Gerar uma senha forte" title="Gerar uma senha forte">
                  <Sparkles />
                </button>
              </div>
              <div className={`ac-strength is-${score}`} aria-live="polite">
                <span className="ac-strength-bars" aria-hidden="true">{[1, 2, 3, 4].map((n) => <i key={n} className={score >= n ? "on" : ""} />)}</span>
                <span>{password ? STRENGTH_LABEL[score] : "Use o botão com a faísca para gerar uma senha forte."}</span>
              </div>
            </div>
          )}
        </div>

        {confirming && (
          <div className="ac-confirm ac-create-confirm" role="alertdialog" aria-label="Confirmar acesso de administrador">
            <p>Dar <strong>acesso total</strong> a <strong>{email.trim()}</strong>? Essa pessoa poderá editar e excluir tudo na VOXEN, inclusive contas.</p>
            <div>
              <button type="button" className="vx-btn" onClick={() => setConfirming(false)}>Cancelar</button>
              <button type="submit" className="vx-btn vx-btn--gold" disabled={saving}>{saving ? "Criando..." : "Confirmar"}</button>
            </div>
          </div>
        )}

        <div className="ac-create-foot">
          <p>
            {mode === "senha"
              ? "A conta fica pronta na hora, sem e-mail de confirmação. Passe a senha à pessoa por um canal seguro."
              : "A pessoa recebe um e-mail com um link para criar a própria senha."}
          </p>
          {!confirming && (
            <button type="submit" className="vx-btn vx-btn--gold ac-create-btn" disabled={!valid || saving}>
              {mode === "senha" ? <UserPlus /> : <MailPlus />}
              {saving ? "Criando..." : mode === "senha" ? `Criar ${LEVEL_LABEL[level].toLowerCase()}` : "Enviar convite"}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

/** Dados da última conta, com cópia de cada campo e do texto pronto para enviar. */
function ResultPanel({
  result, copied, onCopy, onClose,
}: { result: Result; copied: string | null; onCopy: (key: string, text: string) => void; onClose: () => void }) {
  const title = result.kind === "created" ? "Conta criada" : result.kind === "invited" ? "Convite enviado" : "Acesso concedido"
  const who = result.name || result.email
  const rows: { key: string; label: string; value: string }[] = [
    { key: "url", label: "Endereço", value: addressFor(result.level) },
    { key: "email", label: "E-mail", value: result.email },
  ]
  if (result.password) rows.push({ key: "pass", label: "Senha", value: result.password })

  return (
    <div className={`ac-result is-${result.kind}`} role="status" style={{ "--lvl": LEVEL_RGB[result.level] } as CSSProperties}>
      <div className="ac-result-head">
        <span className="ac-result-icon"><Check /></span>
        <div>
          <b>{title}: {who}</b>
          <p>
            {result.kind === "created" && <>Agora é {LEVEL_LABEL[result.level].toLowerCase()}. <strong>A senha só aparece aqui</strong>: copie antes de fechar.</>}
            {result.kind === "granted" && <>Essa pessoa já tinha conta e agora é {LEVEL_LABEL[result.level].toLowerCase()}. A senha dela continua a mesma.</>}
            {result.kind === "invited" && <>O convite foi para o e-mail abaixo. Quando a pessoa criar a senha, ela entra como {LEVEL_LABEL[result.level].toLowerCase()}.</>}
          </p>
        </div>
        <button type="button" className="vx-icon-btn" onClick={onClose} aria-label="Fechar"><X /></button>
      </div>
      <dl className="ac-result-rows">
        {rows.map((r) => (
          <div key={r.key}>
            <dt>{r.label}</dt>
            <dd><code>{r.value}</code></dd>
            <button type="button" className={`vx-btn ${copied === r.key ? "is-done" : ""}`} onClick={() => onCopy(r.key, r.value)}>
              {copied === r.key ? <><Check /> Copiado</> : <><Copy /> Copiar</>}
            </button>
          </div>
        ))}
      </dl>
      <button type="button" className="vx-btn vx-btn--gold ac-result-all" onClick={() => onCopy("all", shareText(result))}>
        {copied === "all" ? <><Check /> Texto copiado</> : <><Copy /> Copiar tudo para enviar à pessoa</>}
      </button>
    </div>
  )
}
