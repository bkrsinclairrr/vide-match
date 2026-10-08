import { RADAR_CLUBS, clubLogo } from "./siteData"

/**
 * Faixa de escudos rolando sem fim. Duas trilhas idênticas lado a lado,
 * cada uma andando 100% da própria largura: quando a primeira sai, a
 * segunda está exatamente no lugar dela, então o laço não tem emenda.
 */
export default function ClubMarquee() {
  return (
    <section className="zs-proof" aria-labelledby="zs-radar-title">
      <div className="zs-proof-ring zs-proof-ring--1" aria-hidden="true" />
      <div className="zs-proof-ring zs-proof-ring--2" aria-hidden="true" />

      <div className="zs-proof-head" data-anim="fade">
        <div className="zs-proof-line zs-proof-line--left" />
        <div className="zs-proof-diamond" />
        <h2 id="zs-radar-title" className="zs-proof-title">
          <strong>+ de 300 clubes</strong> do Brasil e do mundo no radar da nossa IA
        </h2>
        <div className="zs-proof-diamond" />
        <div className="zs-proof-line zs-proof-line--right" />
      </div>

      <div className="zs-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="zs-marquee-track" aria-hidden={copy === 1 ? "true" : undefined}>
            {RADAR_CLUBS.map((club) => (
              <img
                key={club.slug}
                src={clubLogo(club.slug)}
                alt={copy === 0 ? club.name : ""}
                title={club.name}
                width={80}
                height={80}
                decoding="async"
                className="zs-marquee-logo"
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
