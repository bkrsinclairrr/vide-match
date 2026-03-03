import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
        <h2 className="text-base font-bold text-white border-l-2 border-amber-400 pl-3">{title}</h2>
        <div className="text-sm text-white/60 leading-relaxed space-y-2 pl-5">{children}</div>
    </div>
)

export default function Privacy() {
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
                        <h1 className="text-sm font-bold leading-none">Política de Privacidade</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
                <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4">
                    <p className="text-xs text-amber-400/80 leading-relaxed">
                        <strong className="text-amber-400">Última atualização:</strong> 03 de março de 2026. Ao utilizar a plataforma Zyron, você concorda com os termos desta Política de Privacidade.
                    </p>
                </div>

                <Section title="1. Quem somos">
                    <p>A <strong className="text-white">Zyron</strong> é uma plataforma digital de análise de performance esportiva e recomendação de oportunidades para atletas amadores e profissionais. Operamos exclusivamente por meio do domínio <strong className="text-white">aizyron.site</strong>.</p>
                    <p>Para dúvidas sobre privacidade, entre em contato: <strong className="text-white">contato@aizyron.site</strong></p>
                </Section>

                <Section title="2. Dados coletados">
                    <p>Coletamos as seguintes categorias de dados:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong className="text-white/80">Dados de cadastro:</strong> nome completo, endereço de e-mail e senha (criptografada).</li>
                        <li><strong className="text-white/80">Dados do perfil atlético:</strong> idade, altura, peso, posição, pé preferido, categoria, estado, cidade e nacionalidade.</li>
                        <li><strong className="text-white/80">Foto de perfil:</strong> imagem enviada voluntariamente pelo usuário.</li>
                        <li><strong className="text-white/80">Vídeo de performance:</strong> arquivo de vídeo enviado para análise.</li>
                        <li><strong className="text-white/80">Dados de autenticação Google:</strong> quando o login via Google é utilizado, coletamos nome e e-mail público conforme autorizado pelo usuário.</li>
                        <li><strong className="text-white/80">Dados de navegação:</strong> logs de acesso, endereço IP e dados de sessão, para fins de segurança e melhoria do serviço.</li>
                    </ul>
                </Section>

                <Section title="3. Finalidade do tratamento dos dados">
                    <p>Os dados são utilizados exclusivamente para:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Prestação do serviço de análise de performance atlética;</li>
                        <li>Geração de relatórios algorítmicos de desempenho;</li>
                        <li>Recomendação de clubes e oportunidades com base no perfil individual;</li>
                        <li>Comunicação com o usuário sobre sua conta e serviços;</li>
                        <li>Melhoria contínua dos algoritmos e da plataforma.</li>
                    </ul>
                    <p className="mt-2">Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins comerciais.</p>
                </Section>

                <Section title="4. Base legal (LGPD — Lei nº 13.709/2018)">
                    <p>O tratamento de dados pela Zyron está fundamentado nas seguintes bases legais previstas na Lei Geral de Proteção de Dados:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong className="text-white/80">Consentimento</strong> (art. 7º, I): fornecido no momento do cadastro;</li>
                        <li><strong className="text-white/80">Execução de contrato</strong> (art. 7º, V): necessário para prestação do serviço contratado;</li>
                        <li><strong className="text-white/80">Legítimo interesse</strong> (art. 7º, IX): para segurança e prevenção a fraudes.</li>
                    </ul>
                </Section>

                <Section title="5. Armazenamento e segurança">
                    <p>Seus dados são armazenados em servidores seguros fornecidos pela <strong className="text-white">Supabase</strong> (PostgreSQL com criptografia em trânsito via TLS e em repouso). Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou divulgação.</p>
                    <p>Nenhum sistema é 100% inviolável. Em caso de incidente de segurança que afete seus dados, notificaremos os titulares afetados dentro do prazo legal.</p>
                </Section>

                <Section title="6. Retenção de dados">
                    <p>Mantemos seus dados enquanto sua conta estiver ativa. Após solicitação de exclusão, os dados são removidos em até <strong className="text-white">30 dias</strong>, salvo obrigação legal de retenção.</p>
                </Section>

                <Section title="7. Direitos do titular (LGPD)">
                    <p>Você tem direito a:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Confirmar a existência de tratamento de seus dados;</li>
                        <li>Acessar seus dados;</li>
                        <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                        <li>Solicitar anonimização, bloqueio ou eliminação;</li>
                        <li>Revogar o consentimento a qualquer momento;</li>
                        <li>Portabilidade dos dados a outro fornecedor.</li>
                    </ul>
                    <p className="mt-2">Para exercer seus direitos, entre em contato: <strong className="text-white">contato@aizyron.site</strong></p>
                </Section>

                <Section title="8. Cookies e rastreamento">
                    <p>Utilizamos cookies de sessão estritamente necessários para o funcionamento da plataforma (autenticação). Não utilizamos cookies de rastreamento de terceiros para publicidade.</p>
                </Section>

                <Section title="9. Menores de idade">
                    <p>A plataforma aceita usuários a partir de <strong className="text-white">6 anos de idade</strong> para fins de análise atlética, desde que o cadastro seja realizado e supervisionado por um responsável legal maior de 18 anos. Ao cadastrar um menor, o responsável declara ciência e concordância com esta política.</p>
                </Section>

                <Section title="10. Alterações nesta política">
                    <p>Podemos atualizar esta Política periodicamente. Notificaremos os usuários por e-mail ou aviso na plataforma em caso de alterações relevantes. O uso continuado da plataforma após a notificação implica aceitação das mudanças.</p>
                </Section>

                <div className="rounded-2xl border border-white/5 bg-white/3 p-4 text-center">
                    <p className="text-xs text-white/30">Zyron © 2026 — Todos os direitos reservados</p>
                    <p className="text-xs text-white/20 mt-1">contato@aizyron.site</p>
                </div>
            </main>
        </div>
    )
}
