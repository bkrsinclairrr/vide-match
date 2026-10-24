// O payload v1 (config/payload.schema.json): a ficha com as chaves do painel, o bloco do quiz, o contato, o aceite, a pontuação,
// o rastreio e o técnico. Contato só aqui (nunca em evento, URL ou pixel). Menor: contato e aceite do responsável, sem sessaoId nem fbclid.
import { isoLocal } from '../motor/util.js';

export const VERSAO_TEXTO = '2026-10-23';

export function whatsappE164(digitos) {
  const d = String(digitos || '').replace(/\D/g, '');
  return '+55' + d;
}

// os espaços especiais da copy (o duro do "R$ 500" e o word joiner do "Voxen | Zyron") são só pra tela: no dado, espaço comum
const ESPACO_DURO = new RegExp(String.fromCharCode(0xa0), 'g'), JUNTOR = new RegExp(String.fromCharCode(0x2060), 'g');
const texto = v => typeof v === 'string' ? v.replace(ESPACO_DURO, ' ').replace(JUNTOR, '') : Array.isArray(v) ? v.map(texto) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, texto(x)])) : v;

export function montaPayload(op) { return texto(montaPayloadCru(op)); }

function montaPayloadCru({ leadId, estado, d, pont, cfg, rastreio, eventos, caminho, textoAceite, suspeito, modoEnsaio, agora = new Date() }) {
  const r = estado.r;
  const criado = estado.s.criadoEm ? new Date(estado.s.criadoEm) : agora;
  const duracaoSeg = Math.max(0, Math.round((agora - criado) / 1000));
  const menor = d.menor;
  const ficha = Object.assign({}, d.ficha);
  if (!ficha.temVideo) delete ficha.temVideo;
  if (!ficha.experiencia) delete ficha.experiencia;
  const cliques = rastreio.cliques;
  return {
    v: 1,
    leadId,
    criadoEm: isoLocal(criado),
    enviadoEm: isoLocal(agora),
    duracaoSeg,
    ficha,
    quiz: d.quiz,
    contato: {
      responsavelNome: menor ? String(r.responsavelNome || '').trim().slice(0, 80) : null,
      whatsapp: whatsappE164(r.whatsapp)
    },
    consentimento: {
      aceite: true,
      texto: textoAceite,
      textoVersao: VERSAO_TEXTO,
      politicaVersao: VERSAO_TEXTO,
      em: isoLocal(agora)
    },
    pontuacao: { total: pont.total, porRegra: pont.porRegra, tier: pont.tier, maximo: pont.maximo },
    rastreio: {
      utm_source: rastreio.utm.utm_source, utm_medium: rastreio.utm.utm_medium, utm_campaign: rastreio.utm.utm_campaign,
      utm_content: rastreio.utm.utm_content, utm_term: rastreio.utm.utm_term,
      fbclid: menor ? null : cliques.fbclid, gclid: menor ? null : cliques.gclid,
      referrer: rastreio.referrer || '', plataforma: rastreio.plataforma, inApp: rastreio.inApp
    },
    tecnico: {
      versaoQuiz: cfg.versao,
      viewport: `${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`,
      idioma: (navigator.language || 'pt-BR').slice(0, 20),
      caminho,
      sessaoId: !menor && rastreio.podeIdentificar ? eventos.sessaoId : null,
      suspeito: !!suspeito || duracaoSeg < 45,
      modoEnsaio: !!modoEnsaio
    }
  };
}

// A URL da landing: UTMs que vieram, qz=1, o tier e o leadId opaco. Nunca nome, telefone, e-mail nem a pontuação detalhada.
export function urlLanding({ cfg, rastreio, tier, leadId }) {
  const base = cfg.landingUrl || cfg.landingEnsaio || '/';
  let u;
  try { u = new URL(base, location.href); } catch { u = new URL('/', location.href); }
  Object.entries(rastreio.utm).forEach(([k, v]) => { if (v) u.searchParams.set(k, v); });
  u.searchParams.set('qz', '1');
  u.searchParams.set('t', tier);
  u.searchParams.set('lid', leadId);
  return u.toString();
}
