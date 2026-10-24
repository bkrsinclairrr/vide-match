// Utilitários da suíte do quiz: os contratos lidos do disco, o validador do schema do payload (só o que o schema usa, escrito à
// mão: sem npm) e as regras da casa sobre texto (travessão, palavras proibidas, ressalva legal, preço).
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, DEV, REPO } from './servidor.mjs';

export { RAIZ, DEV, REPO };
export const lerJson = rel => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
export const contratos = () => ({
  geral: lerJson('config/geral.json'), fluxo: lerJson('config/fluxo.json'), copy: lerJson('config/copy.pt-BR.json'),
  provas: lerJson('config/provas.json'), pontuacao: lerJson('config/pontuacao.json'), eventos: lerJson('config/eventos.json'),
  schema: lerJson('config/payload.schema.json')
});

// todos os arquivos de uma pasta (pra varreduras de texto e pra comparar com o que foi publicado)
const FORA = new Set(['.git', '.vercel', 'node_modules', 'capturas', '.saida']);
export function arquivos(dir = RAIZ) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (FORA.has(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? arquivos(p) : [p];
  });
}

// o quiz inteiro, pras varreduras de texto: o que vai ao ar (public/quiz) mais docs, testes e ferramentas (quiz/)
export const todosOsArquivos = () => [...arquivos(RAIZ), ...arquivos(DEV)];

/* ---------- o schema do payload (type, const, enum, pattern, tamanhos, faixas, itens, obrigatórias, chaves a mais) ---------- */
const tipoDe = v => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
export function validaSchema(sch, v, onde = '$') {
  const erros = [];
  if (sch.type) {
    const tipos = [].concat(sch.type), t = tipoDe(v);
    if (!tipos.some(x => x === t || (x === 'number' && t === 'integer'))) return [`${onde}: tipo ${t}, esperado ${tipos.join(' ou ')}`];
  }
  if ('const' in sch && JSON.stringify(v) !== JSON.stringify(sch.const)) erros.push(`${onde}: ${JSON.stringify(v)} diferente de ${JSON.stringify(sch.const)}`);
  if (sch.enum && !sch.enum.some(e => JSON.stringify(e) === JSON.stringify(v))) erros.push(`${onde}: ${JSON.stringify(v)} fora da lista ${JSON.stringify(sch.enum)}`);
  if (typeof v === 'string') {
    const n = [...v].length;
    if (sch.minLength != null && n < sch.minLength) erros.push(`${onde}: ${n} letras, mínimo ${sch.minLength}`);
    if (sch.maxLength != null && n > sch.maxLength) erros.push(`${onde}: ${n} letras, máximo ${sch.maxLength}`);
    if (sch.pattern && !new RegExp(sch.pattern, 'u').test(v)) erros.push(`${onde}: ${JSON.stringify(v)} não bate com ${sch.pattern}`);
  }
  if (typeof v === 'number') {
    if (sch.minimum != null && v < sch.minimum) erros.push(`${onde}: ${v} abaixo de ${sch.minimum}`);
    if (sch.maximum != null && v > sch.maximum) erros.push(`${onde}: ${v} acima de ${sch.maximum}`);
  }
  if (Array.isArray(v)) {
    if (sch.minItems != null && v.length < sch.minItems) erros.push(`${onde}: ${v.length} itens, mínimo ${sch.minItems}`);
    if (sch.items) v.forEach((x, i) => erros.push(...validaSchema(sch.items, x, `${onde}[${i}]`)));
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const k of sch.required || []) if (!(k in v)) erros.push(`${onde}: falta a chave ${k}`);
    const props = sch.properties || {};
    for (const [k, x] of Object.entries(v)) {
      if (props[k]) erros.push(...validaSchema(props[k], x, `${onde}.${k}`));
      else if (sch.additionalProperties === false) erros.push(`${onde}: chave a mais (${k})`);
      else if (sch.additionalProperties && typeof sch.additionalProperties === 'object') erros.push(...validaSchema(sch.additionalProperties, x, `${onde}.${k}`));
    }
  }
  return erros;
}

/* ---------- as regras da casa sobre qualquer texto que o atleta lê ---------- */
// o travessão longo e o curto, montados por código (escritos no arquivo, o próprio teste se acusaria)
export const TRAVESSAO = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']', 'u');
// regras 1 a 3 e 5 do briefing, mais o pedido do dono: nada de "fictício", "ilustrativo" e parecidos
export const PROIBIDAS = [
  [TRAVESSAO, 'travessão (U+2013 ou U+2014)'],
  [/\boverall\b/iu, '"overall"'], [/\bSEAL\b/u, '"SEAL"'], [/scouting\s+pro/iu, '"Scouting PRO"'], [/\bscout(?:er)?s?\b/iu, '"scout" ou "scouter"'],
  [/mentoria/iu, '"mentoria"'], [/\bprograma\b/iu, '"programa"'], [/\bpacote/iu, '"pacote"'],
  [/ilustrativ/iu, '"ilustrativo"'], [/fict[íi]ci/iu, '"fictício"'], [/meramente/iu, '"meramente"'], [/simula[çc][ãa]o/iu, '"simulação"'],
  [/\bN[º°]/u, '"Nº"'], [/pr[ée]-?qualificad/iu, '"pré-qualificado"'], [/\baprovad[oa]s?\b/iu, '"aprovado"'], [/\bescolhid[oa]s?\b/iu, '"escolhido"'],
  [/resultados? (?:podem|pode) variar|n[ãa]o garantimos|sujeito a altera/iu, 'ressalva legal'],
  [/\*/u, 'asterisco de nota de rodapé']
];
// preço do produto (o quiz não cita preço; o valor mora na VSL): os planos e formas de pagamento
export const PRECO = /\b997\b|1\.497|2\.997|parcela|à vista|\b\d+\s?x\s?de\s?R\$|R\$\s?\d+[.,]?\d*\s?\/\s?m[eê]s/iu;

export function confereTexto(texto) {
  const achados = [];
  for (const [re, nome] of PROIBIDAS) { const m = re.exec(texto); if (m) achados.push(`${nome} em "${trecho(texto, m.index)}"`); }
  const p = PRECO.exec(texto);
  if (p) achados.push(`preço em "${trecho(texto, p.index)}"`);
  return achados;
}
const trecho = (t, i) => t.slice(Math.max(0, i - 30), i + 30).replace(/\s+/g, ' ');

// todas as strings de um JSON (com o caminho), menos links e caminhos de arquivo
export function textosDoJson(o, onde = '', saida = []) {
  if (typeof o === 'string') { if (!/(^|\.)(url|link|foto|src|arquivo|href)$/i.test(onde) && !/^https?:\/\//.test(o)) saida.push([onde, o]); }
  else if (Array.isArray(o)) o.forEach((x, i) => textosDoJson(x, `${onde}[${i}]`, saida));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) textosDoJson(v, onde ? `${onde}.${k}` : k, saida);
  return saida;
}

export const palavras = t => String(t).replace(/[^\p{L}\p{N}$]+/gu, ' ').trim().split(' ').filter(Boolean).length;

/* ---------- eventos sem dado de pessoa ---------- */
// nenhum evento leva nome, telefone, e-mail, texto livre, idade exata nem leadId (o sessaoId vai no lote, nunca no evento)
const CHAVES_PROIBIDAS = /^(nome|whatsapp|telefone|fone|email|e-mail|leadId|lid|idade|idadeExata|responsavel(Nome)?|texto|mensagem)$/i;
export function confereEventos(eventos, { nome, telefone, leadId } = {}) {
  const achados = [];
  for (const ev of eventos) {
    const params = ev.p || ev.params || {};
    for (const [k, v] of Object.entries(params)) {
      if (CHAVES_PROIBIDAS.test(k)) achados.push(`${ev.e}: chave ${k}`);
      const s = String(v);
      if (nome && s.toLowerCase().includes(nome.toLowerCase())) achados.push(`${ev.e}.${k}: leva o nome`);
      if (telefone && s.replace(/\D/g, '').includes(String(telefone).replace(/\D/g, '').slice(-8))) achados.push(`${ev.e}.${k}: leva o telefone`);
      if (leadId && s.includes(leadId)) achados.push(`${ev.e}.${k}: leva o leadId`);
      if (/@/.test(s)) achados.push(`${ev.e}.${k}: parece e-mail`);
    }
  }
  return achados;
}
