import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
        <h2 className="text-base font-bold text-white border-l-2 border-amber-400 pl-3">{title}</h2>
        <div className="text-sm text-white/60 leading-relaxed space-y-2 pl-5">{children}</div>
    </div>
)

export default function Terms() {
    const navigate = useNavigate()
    return (
        <div className="min-h-screen bg-black text-white font-sans antialiased">
            <header className="sticky top-0 z-40 border-b border-white/5 bg-black/80 backdrop-blur-xl">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 hover:border-white/20 bg-white/5 transition-all">
                        <ArrowLeft className="w-4 h-4 text-white/60" />
                    </button>
                    <div>
                        <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Zyron</p>
                        <h1 className="text-sm font-bold leading-none">Termos de Uso</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
                <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4">
                    <p className="text-xs text-amber-400/80 leading-relaxed">
                        <strong className="text-amber-400">Última atualização:</strong> 03 de março de 2026. Ao acessar ou usar a plataforma Zyron, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso.
                    </p>
                </div>

                <Section title="1. Definições">
                    <p><strong className="text-white/80">Plataforma:</strong> o sistema digital Zyron, acessível via aizyron.site, composto por funcionalidades de análise algorítmica de performance atlética.</p>
                    <p><strong className="text-white/80">Usuário:</strong> qualquer pessoa que realize cadastro e utilize a plataforma.</p>
                    <p><strong className="text-white/80">Análise:</strong> relatório gerado algoritmicamente com base nas informações fornecidas pelo usuário.</p>
                    <p><strong className="text-white/80">Match:</strong> recomendação algorítmica de clube ou oportunidade, gerada com base no perfil do atleta.</p>
                </Section>

                <Section title="2. Natureza do serviço — Isenção de garantias">
                    <p className="text-amber-400/90 font-semibold">LEIA COM ATENÇÃO:</p>
                    <p>A Zyron é uma plataforma de <strong className="text-white">análise algorítmica e recomendação</strong>, e <strong className="text-white">NÃO</strong>:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>É uma agência de scouting ou representação esportiva;</li>
                        <li>Garante contatos, contratos ou relações com qualquer clube;</li>
                        <li>Garante que os clubes recomendados demonstrarão interesse no usuário;</li>
                        <li>Substitui a avaliação de olheiros, preparadores ou profissionais do esporte;</li>
                        <li>Oferece serviços de assessoria jurídica ou esportiva.</li>
                    </ul>
                    <p className="mt-2">Os relatórios e as recomendações de clube gerados pela plataforma têm caráter <strong className="text-white">exclusivamente informativo e algorítmico</strong>. Não constituem avaliação técnica oficial, laudo profissional ou qualquer garantia de resultado.</p>
                    <p>A Zyron não se responsabiliza por decisões tomadas pelo usuário com base nas análises fornecidas.</p>
                </Section>

                <Section title="3. Responsabilidade do usuário">
                    <p>O usuário declara e garante que:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Possui 18 anos ou mais, ou está sob supervisão de responsável legal;</li>
                        <li>As informações fornecidas no cadastro são verdadeiras, completas e atualizadas;</li>
                        <li>O vídeo enviado para análise é de sua autoria ou possui autorização dos envolvidos;</li>
                        <li>Não utilizará a plataforma para fins ilegais ou contrários a estes Termos.</li>
                    </ul>
                    <p className="mt-2">O uso indevido da plataforma poderá resultar em suspensão ou encerramento da conta sem aviso prévio.</p>
                </Section>

                <Section title="4. Limitação de responsabilidade">
                    <p>Na extensão máxima permitida pela legislação aplicável, a Zyron e seus administradores, funcionários e parceiros <strong className="text-white">não são responsáveis</strong> por:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou da impossibilidade de uso da plataforma;</li>
                        <li>Inexatidões nos resultados algorítmicos;</li>
                        <li>Frustrações de expectativa quanto a oportunidades de carreira;</li>
                        <li>Falhas de terceiros (provedores de internet, serviços de nuvem, etc.);</li>
                        <li>Dados perdidos em razão de falhas técnicas imprevisíveis;</li>
                        <li>Condutas de clubes ou agentes que venham a contatar o usuário.</li>
                    </ul>
                </Section>

                <Section title="5. Propriedade intelectual">
                    <p>Todo o conteúdo da plataforma — incluindo algoritmos, interface, textos, logotipos e metodologia — é propriedade exclusiva da Zyron, protegido pela legislação de direitos autorais e propriedade intelectual.</p>
                    <p>É proibido reproduzir, copiar, distribuir ou criar obras derivadas sem autorização expressa e por escrito.</p>
                </Section>

                <Section title="6. Conteúdo do usuário">
                    <p>Ao enviar vídeos, fotos ou informações, o usuário concede à Zyron uma licença limitada, não exclusiva e revogável para utilizar esses conteúdos <strong className="text-white">exclusivamente para a prestação do serviço contratado</strong>.</p>
                    <p>A Zyron não utilizará seus vídeos ou imagens para publicidade, venda a terceiros ou qualquer fim além do serviço de análise.</p>
                </Section>

                <Section title="7. Disponibilidade do serviço">
                    <p>A Zyron envida seus melhores esforços para manter a plataforma disponível 24/7, mas <strong className="text-white">não garante disponibilidade ininterrupta</strong>. Manutenções programadas ou eventos de força maior podem causar interrupções temporárias sem direito a indenização.</p>
                </Section>

                <Section title="8. Menores de idade">
                    <p>Usuários menores de 18 anos devem ter o cadastro realizado e supervisionado por um responsável legal. O responsável legal assume integralmente a responsabilidade pelo uso da plataforma pelo menor e pela veracidade dos dados fornecidos.</p>
                </Section>

                <Section title="9. Alterações nos termos">
                    <p>Estes Termos podem ser modificados a qualquer momento. Alterações substanciais serão comunicadas via e-mail ou aviso na plataforma. O uso continuado após a comunicação constitui aceite das modificações.</p>
                </Section>

                <Section title="10. Lei aplicável e foro">
                    <p>Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de <strong className="text-white">São Paulo — SP</strong> para dirimir quaisquer controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
                </Section>

                <Section title="11. Contato">
                    <p>Para dúvidas, reclamações ou exercício de direitos, entre em contato: <strong className="text-white">contato@aizyron.site</strong></p>
                </Section>

                <div className="rounded-2xl border border-white/5 bg-white/3 p-4 text-center">
                    <p className="text-xs text-white/30">Zyron © 2026 — Todos os direitos reservados</p>
                    <p className="text-xs text-white/20 mt-1">contato@aizyron.site</p>
                </div>
            </main>
        </div>
    )
}
