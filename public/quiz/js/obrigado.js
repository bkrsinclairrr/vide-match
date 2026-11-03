// A página de obrigado (quiz/obrigado/, pra onde a Sinnu manda depois do pagamento do Scouting PRO): o passo do vídeo e o WhatsApp da
// equipe com a mensagem pronta. O quiz apaga o contato depois do envio, então a mensagem leva só o código do diagnóstico (se este aparelho
// fez a variante) e fala como o responsável quando o atleta é menor. Sem JavaScript, o link que vem no HTML já funciona.
import { guarda } from './motor/util.js';
import { MENOR } from './motor/estado.js';
import { linkWhatsapp, codigoDiagnostico } from './dados/mensagem.js';

async function liga() {
  const a = document.getElementById('zap');
  if (!a) return;
  const le = url => fetch(url, { credentials: 'same-origin' }).then(r => { if (!r.ok) throw new Error(url); return r.json(); });
  const [cfg, copy] = await Promise.all([le('../config/geral.json'), le('../config/variantes/scouting-pro/copy.pt-BR.json')]);
  const m = copy.obrigado.mensagem;
  const s = guarda.ler('qz:estado:pro');
  const menor = !!(s && MENOR.has(s.respostas?.idade));
  const codigo = s && s.enviado && s.leadId ? codigoDiagnostico(s.leadId, s.resultado) : '';
  const texto = [menor ? m.menor : m.adulto, codigo ? m.codigo.replace('{codigo}', codigo) : null].filter(Boolean).join('\n\n');
  const numero = String(cfg.whatsappFinal || '').replace(/\D/g, '');
  if (numero) a.href = linkWhatsapp(numero, texto);
  a.dataset.pronto = '1';
}

liga().catch(() => { /* o link que vem no HTML continua valendo */ });
