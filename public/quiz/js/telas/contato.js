// T13 · contato. Adulto: primeiro nome e WhatsApp. Menor: o nome dele, o nome e o WhatsApp do responsável. Sem e-mail.
// Ao enviar: monta o payload, pontua, envia (ou entra na fila) e mostra 1,5 s de transição honesta. Falha de rede nunca aparece.
import { h, uuid, espera } from '../motor/util.js';
import { icone } from '../componentes/icones.js';
import { montaPayload } from '../dados/payload.js';

const NOME_OK = /^[\p{L}][\p{L}\p{M}' .-]*$/u;
export const soDigitos = v => {
  let d = String(v || '').replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 11);
};
export const telefoneValido = d => /^[1-9][1-9]\d{8,9}$/.test(d) && (d.length === 10 || d[2] === '9');
const mascara = d => {
  if (!d) return '';
  if (d.length <= 2) return '(' + d;
  const ddd = d.slice(0, 2), resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (d.length <= 10) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
};
const limpaNome = v => String(v || '').replace(/\s+/g, ' ').trim();
const nomeValido = v => { const n = limpaNome(v); return n.length >= 2 && n.length <= 60 && NOME_OK.test(n) && (n.match(/\p{L}/gu) || []).length >= 2; };

export function render(ctx) {
  const c = ctx.copy;
  const menor = ctx.d.menor;
  const el = h('section', { class: 't-contato' });
  // no menor, o título basta (pedido do dono): os campos já dizem que é o nome e o WhatsApp de um responsável
  const apoio = menor ? '' : c.apoioAdulto;
  el.append(h('div', { class: 'entra' },
    h('h1', { class: 'titulo menor', style: '--i:0', text: c.titulo }),
    apoio ? h('p', { class: 'apoio', style: '--i:1', text: apoio }) : null));

  const erros = {};
  function campo({ id, rotulo, valor, attrs }) {
    const input = h('input', Object.assign({ id: 'f-' + id, name: id, value: valor || '', 'aria-describedby': 'e-' + id }, attrs));
    const erro = h('p', { class: 'erro-linha', id: 'e-' + id, hidden: true });
    const box = h('div', { class: 'campo-texto' }, h('label', { for: 'f-' + id, text: rotulo }), input, erro);
    erros[id] = { box, erro, input };
    return box;
  }
  const r = ctx.r;
  const fNome = campo({ id: 'nome', rotulo: c.nome, valor: r.nome, attrs: { type: 'text', autocomplete: 'given-name', autocapitalize: 'words', spellcheck: 'false', maxlength: '40', enterkeyhint: 'next' } });
  const fResp = menor ? campo({ id: 'responsavelNome', rotulo: c.responsavelNome, valor: r.responsavelNome, attrs: { type: 'text', autocomplete: 'name', autocapitalize: 'words', spellcheck: 'false', maxlength: '80', enterkeyhint: 'next' } }) : null;
  const fZap = campo({ id: 'whatsapp', rotulo: menor ? c.whatsappMenor : c.whatsapp, valor: mascara(soDigitos(r.whatsapp)), attrs: { type: 'tel', inputmode: 'tel', autocomplete: 'tel-national', placeholder: c.whatsappExemplo, maxlength: '16', enterkeyhint: 'done' } });

  // o aceite: o texto exato vai pro payload; no menor, o nome do atleta entra na frase
  const aceiteInput = h('input', { type: 'checkbox', id: 'f-aceite', 'aria-describedby': 'e-aceite' });
  aceiteInput.checked = r.aceite === true;
  const aceiteTexto = h('span', { class: 'caixa-t' });
  const textoAceite = () => {
    const nomeAtleta = limpaNome(erros.nome.input.value) || c.nomeAtletaPadrao;
    return ctx.tx(menor ? c.aceiteMenor : c.aceiteAdulto, { nomeAtleta, politica: c.politicaLink });
  };
  // o link da política NÃO mora dentro da caixa: o Chrome puxa o toque pro alvo pequeno mais perto, e o toque no meio da frase
  // abria a política noutra aba em vez de marcar (o atleta saía do quiz). A frase fica inteira aqui; o link, na linha de baixo.
  const pintaAceite = () => { aceiteTexto.textContent = textoAceite(); };
  pintaAceite();
  const caixa = h('label', { class: 'caixa', for: 'f-aceite' }, aceiteInput, h('span', { class: 'caixa-q', html: icone.check }), aceiteTexto);
  const linkPolitica = h('p', { class: 'caixa-link' }, h('a', { href: ctx.cfg.politicaUrl, target: '_blank', rel: 'noopener noreferrer', html: `<span>${c.lerPolitica}</span>${icone.externo}` }));
  const erroAceite = h('p', { class: 'erro-linha', id: 'e-aceite', hidden: true });
  const isca = h('div', { class: 'isca', 'aria-hidden': 'true' }, h('label', { for: 'f-empresa', text: 'Empresa' }), h('input', { id: 'f-empresa', name: 'empresa', type: 'text', tabindex: '-1', autocomplete: 'off' }));
  const form = h('form', { novalidate: true, autocomplete: 'on' }, fNome, fResp, fZap, caixa, erroAceite, linkPolitica, h('p', { class: 'form-nota', text: c.semSpam }), isca);
  el.append(form);

  // guarda o que foi digitado (voltar e recarregar não perdem nada); some do aparelho depois do envio
  let tmSalva = 0;
  const salva = () => { clearTimeout(tmSalva); tmSalva = setTimeout(() => {
    ctx.responde('nome', limpaNome(erros.nome.input.value), { evento: false });
    if (menor) ctx.responde('responsavelNome', limpaNome(erros.responsavelNome.input.value), { evento: false });
    ctx.responde('whatsapp', soDigitos(erros.whatsapp.input.value), { evento: false });
  }, 250); };
  ctx.aoSair(() => { clearTimeout(tmSalva); });
  erros.nome.input.addEventListener('input', () => { pintaAceite(); limpaErro('nome'); salva(); });
  if (menor) erros.responsavelNome.input.addEventListener('input', () => { limpaErro('responsavelNome'); salva(); });
  const zap = erros.whatsapp.input;
  zap.addEventListener('input', () => {
    const d = soDigitos(zap.value);
    const novo = mascara(d);
    if (zap.value !== novo) { zap.value = novo; try { zap.setSelectionRange(novo.length, novo.length); } catch { /* nada */ } }
    limpaErro('whatsapp'); salva();
  });
  aceiteInput.addEventListener('change', () => { ctx.responde('aceite', aceiteInput.checked, { evento: false }); if (aceiteInput.checked) { erroAceite.hidden = true; caixa.classList.remove('erro'); } });

  function mostraErro(id, texto) {
    const e = erros[id];
    e.box.classList.add('erro'); e.input.setAttribute('aria-invalid', 'true');
    e.erro.hidden = false; e.erro.innerHTML = icone.alerta + `<span>${texto}</span>`;
  }
  function limpaErro(id) { const e = erros[id]; if (!e) return; e.box.classList.remove('erro'); e.input.removeAttribute('aria-invalid'); e.erro.hidden = true; }

  let enviando = false;
  async function envia(ev) {
    ev?.preventDefault?.();
    if (enviando) return;
    const nome = limpaNome(erros.nome.input.value);
    const resp = menor ? limpaNome(erros.responsavelNome.input.value) : '';
    const tel = soDigitos(zap.value);
    let primeiro = null;
    if (!nomeValido(nome)) { mostraErro('nome', c.erros.nome); primeiro = primeiro || erros.nome.input; }
    if (menor && !nomeValido(resp)) { mostraErro('responsavelNome', c.erros.responsavelNome); primeiro = primeiro || erros.responsavelNome.input; }
    if (!telefoneValido(tel)) { mostraErro('whatsapp', c.erros.whatsapp); primeiro = primeiro || zap; }
    if (!aceiteInput.checked) { erroAceite.hidden = false; erroAceite.innerHTML = icone.alerta + `<span>${c.erros.aceite}</span>`; caixa.classList.add('erro'); primeiro = primeiro || aceiteInput; }
    if (primeiro) { primeiro.focus(); return; }

    enviando = true;
    clearTimeout(tmSalva);
    ctx.responde('nome', nome, { evento: false });
    if (menor) ctx.responde('responsavelNome', resp, { evento: false });
    ctx.responde('whatsapp', tel, { evento: false });
    ctx.responde('aceite', true, { evento: false });

    const app = ctx.app;
    const pont = app.pontua(ctx.r);
    const leadId = uuid();
    const suspeito = !!document.getElementById('f-empresa')?.value;
    const payload = montaPayload({
      leadId, estado: ctx.estado, d: ctx.d, pont, cfg: ctx.cfg, rastreio: app.rastreio, eventos: app.eventos,
      caminho: app.caminho(), textoAceite: textoAceite(), suspeito, modoEnsaio: app.envio.modoEnsaio
    });
    ctx.evento('contact_submit', { tier: pont.tier, total: pont.total, adulto: !menor, duracaoSeg: payload.duracaoSeg });
    app.ultimoPayload = payload;
    app.envio.envia(payload).catch(() => {});

    // transição honesta: não finge análise nenhuma
    const montando = h('div', { class: 'montando', role: 'status' }, h('div', { class: 'montando-in' }, h('span', { class: 'montando-roda', 'aria-hidden': 'true' }), h('span', { text: c.montando })));
    document.body.append(montando);
    await espera(ctx.reduz ? 600 : 1100);
    ctx.estado.marcaEnviado({ leadId, resultado: { tier: pont.tier, total: pont.total } });
    montando.remove();
    ctx.vaiPara('resultado', { historico: 'push' });
  }
  form.addEventListener('submit', envia);
  [erros.nome.input, erros.responsavelNome?.input].filter(Boolean).forEach((inp, i, arr) => inp.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') { ev.preventDefault(); (arr[i + 1] || zap).focus(); }
  }));

  ctx.barra.botao({ texto: c.botao, aoClicar: envia, nota: `<a href="${ctx.cfg.politicaUrl}" target="_blank" rel="noopener noreferrer">${icone.cadeado}<span>${c.comoUsamos}</span></a>` });
  return el;
}
