import { Link } from "react-router-dom"
import { Camera, ClipboardList, Lock, Pencil, UserRound } from "lucide-react"
import { Meter } from "@/pages/voxen/charts"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import { profileLink } from "../game"
import { PhotoButton, UnlockCard } from "../components/Gamify"
import { LockTag } from "../components/Locks"
import ProfilePage from "./ProfilePage"

export default function AthleteProfilePage() {
  const { account, category, game, member, adminPreview, pickPhoto, photoBusy } = useAthlete()
  const c = game.completion
  const rows: [string, string][] = [
    ["Nome", account.name],
    ["E-mail", account.email ?? "—"],
    ["Idade", account.age ? `${account.age} anos` : "—"],
    ["Posição", account.position ?? "—"],
    ["Categoria", category ?? "—"],
    ["Melhor pé", account.foot ?? "—"],
    ["Altura", account.heightCm ? `${account.heightCm} cm` : "—"],
    ["Peso", account.weightKg ? `${account.weightKg} kg` : "—"],
    ["Nacionalidade", account.nationality ?? "—"],
    ["Cidade", account.city ?? "—"],
  ]
  const editLabel = account.hasProfile ? (c.done < c.total ? "Completar meus dados" : "Atualizar meus dados") : "Criar meu perfil"

  // Com a análise liberada, a equipe também mantém o perfil e a avaliação do scout.
  if (member) {
    return (
      <>
        {c.done < c.total && (
          <section className="vx-card mb-[18px] gm-nudge">
            <Pencil className="h-5 w-5 shrink-0 text-amber-300" />
            <p>Faltam <strong>{c.missing.join(", ").toLowerCase()}</strong> no seu perfil. Perfil completo vale XP e libera a próxima etapa da jornada.</p>
            {adminPreview
              ? <button type="button" className="vx-btn vx-btn--gold" disabled>Completar perfil</button>
              : <Link to={profileLink(account)} className="vx-btn vx-btn--gold">Completar perfil</Link>}
          </section>
        )}
        <ProfilePage />
      </>
    )
  }

  return (
    <div className="vx-grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="vx-card">
        <CardHead title={<span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-amber-300" /> Seus dados</span>} sub="Os mesmos que você informou ao criar o perfil." />
        <div className="mb-5 flex items-center gap-4">
          <PhotoButton size={72} />
          <div className="min-w-0">
            <p className="text-[18px] font-bold">{account.name}</p>
            <p className="text-[12.5px] text-zinc-400">{[account.position, category].filter(Boolean).join(" · ") || "Complete o perfil"}</p>
            {pickPhoto && (
              <button type="button" className="mb-photo-link" onClick={pickPhoto} disabled={photoBusy}>
                <Camera /> {account.avatarUrl ? "Trocar foto" : "Adicionar foto (+50 XP)"}
              </button>
            )}
          </div>
        </div>
        <dl className="vx-dl">
          {rows.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd title={dd}>{dd}</dd></div>)}
        </dl>
        {adminPreview
          ? <button type="button" className="vx-btn vx-btn--gold mt-5" disabled><Pencil /> {editLabel}</button>
          : <Link to={profileLink(account)} className="vx-btn vx-btn--gold mt-5"><Pencil /> {editLabel}</Link>}
      </section>

      <div className="flex flex-col gap-[18px]">
        <section className="vx-card">
          <CardHead title="Força do perfil" sub={`${c.done} de ${c.total} dados preenchidos`} />
          <Meter value={c.pct} color="#fbbf24" height={8} />
          <p className="mt-3 text-[12.5px] leading-relaxed text-zinc-400">
            {c.missing.length ? <>Falta: <strong className="text-zinc-200">{c.missing.join(", ").toLowerCase()}</strong>. </> : "Perfil completo. "}
            {c.missing.length ? "Com o perfil completo, as oportunidades e a análise dos seus jogos são liberadas." : "Quanto mais completo, mais fácil a equipe encaixa você nos clubes certos."}
          </p>
        </section>
        <section className="vx-card">
          <CardHead title={<span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-amber-300" /> Avaliação do scout</span>} sub="Notas de 1 a 5 dadas pela equipe depois de ver os seus vídeos." />
          <p className="gm-allclear"><Lock className="h-4 w-4" /> Aparece aqui quando a equipe analisar os seus jogos.</p>
        </section>
        {game.gates.analysis ? (
          <UnlockCard compact />
        ) : (
          <section className="vx-card gm-nudge lk-nudge">
            <LockTag>Análise lance a lance</LockTag>
            <p>Libera depois do seu perfil: complete os dados e mande o vídeo de um jogo para a equipe marcar cada lance seu.</p>
          </section>
        )}
      </div>
    </div>
  )
}
