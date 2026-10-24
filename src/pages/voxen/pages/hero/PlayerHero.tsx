import "./hero.css"

import { lazy, Suspense, useRef, useState, type CSSProperties, type PointerEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Copy, DownloadCloud, Eye, GitCompareArrows, KeyRound, Mail, Pencil, Printer, Trash2 } from "lucide-react"
import { ClubCrest } from "@/pages/membros/components/ClubCrest"
import { CLIENT_BASE } from "@/pages/membros/paths"
import { useToast } from "@/hooks/use-toast"
import { prefersReducedMotion } from "@/lib/reducedMotion"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { useVoxen } from "../../store"
import { STAGES, formatDateTime, formatPhone, placeOf, scoreTone, timeAgo, whatsappLink, type Player, type Profile } from "../../data"
import { CountUp } from "../../charts"
import { Est } from "../../estimated"
import { keysOf } from "../../people"
import { PROSPECT_EDIT_HINT, crmLeadIdOf, isProspect } from "../../prospects"
import { PosBadge, comparePath } from "../../ui"
import { deleteSummary } from "../PlayerDialogs"
import { noLook, type Look, type MediaApi, useMediaApi } from "../media/api"
import type { PhotoMode } from "../media/model"
import { errMsg, useLoad } from "../scout/api"
import { HeroVisual } from "./HeroVisual"
import { MemberButton } from "./MemberButton"
import { accentOf, heroFacts, lookFromControls, rgbOf, splitName, visualOf } from "./model"

// O editor da foto (recorte, clubes, prévia) só baixa quando alguém abre a janela.
const PhotoDialog = lazy(() => import("./PhotoDialog").then((m) => ({ default: m.PhotoDialog })))

/**
 * O cabeçalho da ficha do jogador, no estilo das páginas de jogador dos sites de futebol: o retrato de corpo inteiro
 * (ou a foto redonda) de um lado, e do outro o nome em destaque, os dados em quadradinhos, as ações e a etapa. A cor do
 * clube do uniforme tinge o fundo; quem mantém jogador troca a foto aqui mesmo, sem sair da ficha.
 */
export function PlayerHero({ p, editing, onEdit }: { p: Player; editing: boolean; onEdit: () => void }) {
  const { demo, updateMeta, canScout, canAdmin, removePlayer } = useVoxen()
  const { toast } = useToast()
  const navigate = useNavigate()
  const root = useRef<HTMLElement>(null)
  const frame = useRef(0)
  const [calm] = useState(prefersReducedMotion)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  // `loaded`: depois da primeira vez a janela continua montada, para fechar com a animação de saída.
  const [photo, setPhoto] = useState<{ open: boolean; file: File | null; loaded: boolean }>({ open: false, file: null, loaded: false })

  const mediaApi = useMediaApi(demo)
  const q = useLoad<Look, MediaApi>(mediaApi, (a) => a.look(p.memberId, p.userId ?? null), [p.memberId, p.userId])
  const look = q.data ?? (q.error ? noLook(p.memberId) : null)
  const visual = visualOf({ look, canScout, isMember: Boolean(p.memberId) })

  const wa = whatsappLink(p)
  const { first, last } = splitName(p.name)
  const accent = accentOf(look?.body?.kit?.color)
  const tone = scoreTone(p.overall)
  const facts = heroFacts(p)
  const accountKey = keysOf(p).find((k) => k.startsWith("atleta:"))
  const erase = deleteSummary(p)

  const chips = ([
    [placeOf(p), "city"],
    [p.profile.team ? `Time: ${p.profile.team}` : null, "team"],
  ] as [string | null, keyof Profile][]).filter(([label]) => Boolean(label)) as [string, keyof Profile][]

  const choose = async (mode: PhotoMode) => {
    if (!mediaApi || !p.memberId || !look || look.mode === mode) return
    setBusy(true)
    try {
      const choice = await mediaApi.setPhotoMode(p.memberId, mode)
      q.set((l) => (l ? { ...l, ...choice } : l))
      toast({
        title: mode === "corpo" ? `${first} aparece de corpo inteiro` : `${first} aparece com a foto de perfil`,
        description: "Na ficha e no Início da área dele. Ele também pode trocar por lá.",
      })
    } catch (e) {
      toast({ title: "Não foi possível trocar a foto", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await removePlayer(p.key)
      toast({ title: "Cadastro excluído", description: p.name })
      navigate("/voxen/jogadores")
    } catch (err) {
      setDeleting(false)
      setConfirmDelete(false)
      toast({ title: "Não foi possível excluir", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    }
  }

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(formatPhone(p.phone))
      toast({ title: "Telefone copiado", description: formatPhone(p.phone) })
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" })
    }
  }

  // Profundidade: o nome gigante e o holofote andam um pouco ao contrário do ponteiro (só com mouse e sem "reduzir movimento").
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (calm || e.pointerType !== "mouse") return
    const el = root.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * 2 - 1
    const y = ((e.clientY - box.top) / box.height) * 2 - 1
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--ph-px", x.toFixed(3))
      el.style.setProperty("--ph-py", y.toFixed(3))
    })
  }
  const onLeave = () => {
    cancelAnimationFrame(frame.current)
    root.current?.style.setProperty("--ph-px", "0")
    root.current?.style.setProperty("--ph-py", "0")
  }

  const style = {
    "--ph-accent": accent,
    "--ph-accent-rgb": rgbOf(accent),
    "--ph-ghost-k": Math.min(0.3, 1.35 / Math.max(first.length, 3)).toFixed(3),
  } as CSSProperties

  return (
    <section ref={root} className={`ph ${calm ? "is-calm" : ""}`} style={style} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="ph-bg" aria-hidden="true">
        <span className="ph-spot" />
        <span className="ph-stripes" />
        <span className="ph-ghost">{first}</span>
        <span className="ph-grain" />
      </div>

      <div className="ph-grid">
        <div className="ph-main">
          <div className="ph-top">
            <Link to="/voxen/jogadores" className="vx-icon-btn vx-no-print vx-back-btn" aria-label="Voltar para jogadores"><ArrowLeft /></Link>
            <PosBadge player={p} />
            <span className="ph-eyebrow"><Est p={p} k="position">{p.profile.position ?? "Posição não informada"}</Est></span>
            {look?.body?.kit && (
              <span className="ph-kit" title={`Uniforme: ${look.body.kit.name}`}>
                <ClubCrest club={look.body.kit} size={24} pop />
                <span className="sr-only">Uniforme: {look.body.kit.name}</span>
              </span>
            )}
          </div>

          <h2 className="ph-name" aria-label={p.name}>
            <span className="ph-line"><span className="ph-first">{first}</span></span>
            {last && <span className="ph-line"><span className="ph-last">{last}</span></span>}
          </h2>

          <ul className="ph-facts">
            {facts.map((f, i) => (
              <li key={f.key} className="ph-fact" style={{ "--i": i } as CSSProperties}>
                <span className="ph-fact-label">{f.label}</span>
                <b className={`ph-fact-value ${typeof f.value === "number" ? "" : "is-text"}`}>
                  <Est p={p} k={f.est ?? "category"}>
                    {typeof f.value === "number" ? <CountUp value={f.value} /> : f.value}
                  </Est>
                  {f.unit && <small>{f.unit}</small>}
                </b>
              </li>
            ))}
            <li className="ph-fact is-score" style={{ "--i": facts.length, "--tone": tone.color } as CSSProperties} title="Nota geral do relatório, na escala de iniciante do painel">
              <span className="ph-fact-label">Nota geral</span>
              <b className="ph-fact-value"><CountUp value={p.overall} /><small>{tone.label}</small></b>
            </li>
          </ul>

          <div className="ph-chips">
            {chips.map(([label, k]) => <span key={label} className="vx-chip h-7 cursor-default"><Est p={p} k={k}>{label}</Est></span>)}
            <span className="vx-chip h-7 cursor-default">Origem: {p.origin}</span>
            {isProspect(p) && <span className="vx-chip h-7 cursor-default" title="Aprovado em Importados. Ainda não se cadastrou na plataforma: ninguém foi contatado e nenhum cadastro foi criado.">Pré-cadastro do CRM</span>}
            {accountKey && <span className="vx-chip h-7 cursor-default" title="Esta pessoa tem o cadastro do funil e a conta de atleta juntos num registro só">Com conta de atleta</span>}
          </div>

          <div className="ph-actions vx-no-print">
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="vx-btn vx-btn--wpp"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>}
            {p.phone && <button type="button" className="vx-btn" onClick={() => void copyPhone()}><Copy /> {formatPhone(p.phone)}</button>}
            {isProspect(p)
              ? <Link to={`/voxen/importados?item=${encodeURIComponent(`pre:${crmLeadIdOf(p)}`)}`} className="vx-btn" title="O que veio da wsltda.com: respostas do formulário, responsável e notas"><DownloadCloud /> Contexto do CRM</Link>
              : <MemberButton p={p} />}
            {accountKey && (
              <Link to={`${CLIENT_BASE}?como=${encodeURIComponent(accountKey)}`} className="vx-btn" title="Abre a área do cliente exatamente como o atleta a vê" target="_blank" rel="noopener noreferrer">
                <Eye /> Ver como atleta
              </Link>
            )}
            {accountKey && p.userId && canAdmin && (
              <Link to={`/voxen/contas?conta=${encodeURIComponent(p.userId)}`} className="vx-btn" title="Mudar o acesso, desativar ou excluir a conta de login">
                <KeyRound /> Gerenciar acesso
              </Link>
            )}
            {canScout && (
              <button type="button" className={`vx-btn ${editing ? "is-on" : ""}`} onClick={onEdit} disabled={isProspect(p)} title={isProspect(p) ? PROSPECT_EDIT_HINT : undefined}>
                <Pencil /> {editing ? "Fechar edição" : "Editar"}
              </button>
            )}
            {canAdmin && (
              <button type="button" className="vx-icon-btn pp-danger" title="Excluir este cadastro" aria-label="Excluir este cadastro" onClick={() => setConfirmDelete(true)}><Trash2 /></button>
            )}
            {p.email && <a href={`mailto:${p.email}`} className="vx-icon-btn" aria-label={`E-mail para ${p.email}`} title={p.email}><Mail /></a>}
            <button type="button" className="vx-icon-btn" aria-label="Comparar com outros" title="Comparar" onClick={() => navigate(comparePath([p.key]))}><GitCompareArrows /></button>
            <button type="button" className="vx-icon-btn" aria-label="Imprimir ficha" title="Imprimir ficha" onClick={() => window.print()}><Printer /></button>
          </div>

          <div className="ph-stage">
            <span className="ph-stage-label">Etapa</span>
            <div className="vx-stages" role="radiogroup" aria-label="Etapa do atleta">
              {STAGES.map((s) => {
                const on = p.meta.stage === s.key
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className="vx-stage-btn"
                    disabled={!canScout}
                    style={on ? { color: s.color, borderColor: `${s.color}66`, background: `${s.color}17`, boxShadow: `0 0 18px -6px ${s.color}` } : undefined}
                    onClick={() => void updateMeta(p.key, { stage: s.key })}
                  >
                    <span className="vx-stage-dot" style={{ background: s.color }} />{s.label}
                  </button>
                )
              })}
            </div>
            <span className="ph-meta">
              Entrou {timeAgo(p.createdAt)} · {formatDateTime(p.createdAt)}
              {p.meta.updatedAt && <> · atualizado {timeAgo(p.meta.updatedAt)}</>}
            </span>
          </div>
        </div>

        <HeroVisual p={p} look={look} visual={visual} busy={busy} onMode={(m) => void choose(m)} onEdit={(file) => setPhoto({ open: true, file: file ?? null, loaded: true })} />
      </div>

      {confirmDelete && (
        <div className="pp-confirm" role="alertdialog" aria-label="Confirmar exclusão">
          <p>
            Excluir o cadastro de <strong>{p.name}</strong>? Apaga {erase.erased}.
            {erase.kept ? ` Continuam: ${erase.kept} (exclua em Contas e acessos ou na tela do membro, se quiser).` : ""} <strong>Não dá para desfazer.</strong>
          </p>
          <div>
            <button type="button" className="vx-btn" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancelar</button>
            <button type="button" className="vx-btn pp-danger-solid" onClick={() => void remove()} disabled={deleting}>{deleting ? "Excluindo..." : "Excluir de vez"}</button>
          </div>
        </div>
      )}

      {canScout && p.memberId && photo.loaded && (
        <Suspense fallback={null}>
          <PhotoDialog
            open={photo.open}
            onClose={() => setPhoto((s) => ({ ...s, open: false, file: null }))}
            p={p}
            avatarUrl={look?.avatarUrl ?? null}
            file={photo.file}
            onChanged={(controls, kit) => q.set((l) => (l ? lookFromControls(l, controls, kit) : l))}
          />
        </Suspense>
      )}
    </section>
  )
}
