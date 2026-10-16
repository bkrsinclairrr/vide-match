import "./partners.css"

/**
 * Parceiros comerciais (marcas e empresas, não clubes de destino). A equipe
 * confirmou acordo comercial com cada um antes de entrarem aqui. Usada na
 * home (/), na /avaliacao e na /institucional, com estilo próprio (pt-*)
 * para funcionar dentro de qualquer uma das três páginas.
 */
const PARTNERS = [
  { name: "Adidas", logo: "/site/parceiros/adidas.svg" },
  { name: "Nike", logo: "/site/parceiros/nike.svg" },
  { name: "Cloudflare", logo: "/site/parceiros/cloudflare.svg" },
  { name: "AWS Amazon", logo: "/site/parceiros/aws.svg" },
  { name: "A.E.K. London", logo: "/clubs/aeklondon.webp" },
] as const

export default function PartnersSection({ className = "" }: { className?: string }) {
  return (
    <section className={`pt-section ${className}`} aria-labelledby="pt-title">
      <div className="pt-container">
        <p className="pt-kicker">Parceiros comerciais</p>
        <h2 id="pt-title" className="pt-title">Quem caminha com a gente</h2>
        <ul className="pt-grid">
          {PARTNERS.map((p) => (
            <li key={p.name} className="pt-card">
              <span className="pt-logo">
                <img src={p.logo} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="pt-name">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
