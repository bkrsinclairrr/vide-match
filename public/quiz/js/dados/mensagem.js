// A mensagem do botão final (T14) pra equipe comercial no WhatsApp: quem escreve (o atleta ou o responsável), o que respondeu no quiz
// e o código do diagnóstico, que junta o id do lead e a pontuação pra quem atende. Vai no link wa.me e a própria pessoa envia do WhatsApp
// dela: nada sai do aparelho sem ela apertar "enviar". Sem React e sem DOM, pra ser testada à parte (testes/teste-mensagem.mjs).

// os espaços especiais da copy (o duro do "R$ 500" e o word joiner do "Voxen | Zyron") são só pra tela: na mensagem, espaço comum
const ESPACO_DURO = new RegExp(String.fromCharCode(0xa0), 'g'), JUNTOR = new RegExp(String.fromCharCode(0x2060), 'g');
const limpa = s => String(s ?? '').replace(ESPACO_DURO, ' ').replace(JUNTOR, '').replace(/\*([^*]+)\*/g, '$1');
const preenche = (modelo, vars) => limpa(String(modelo ?? '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] ? String(vars[k]) : m)));
const textoDe = (opcoes, id) => (opcoes || []).find(o => o.id === id)?.texto || '';

/**
 * `copy` é a copy inteira; `textos` são os textos derivados das respostas (posição, faixa de idade, peneiras...); `r` são as respostas;
 * `menor` diz quem escreve. Linha sem resposta fica de fora, então a mensagem nunca leva um "{campo}" vazio.
 */
export function mensagemEquipe({ copy, textos, r, menor, leadId, pont }) {
  const m = copy.resultado.mensagem;
  const vars = Object.assign({}, textos, {
    nome: String(r.nome || textos.nome || '').trim(),
    responsavel: String(r.responsavelNome || '').trim(),
    quer: textoDe(copy.quer?.opcoes, r.quer),
    chance: textoDe(copy.chance?.opcoes, r.chance),
    codigo: [String(leadId || '').replace(/-/g, '').slice(0, 8).toUpperCase(), pont ? `${pont.tier}${pont.total}` : ''].filter(Boolean).join(' · ')
  });
  const abertura = !vars.nome ? m.aberturaSemNome : menor && vars.responsavel ? m.aberturaMenor : m.aberturaAdulto;
  const linha = (modelo, ...chaves) => (chaves.every(k => vars[k]) ? preenche(modelo, vars) : null);
  const fezPeneira = r.peneiras && r.peneiras !== '0';
  const respostas = [
    linha(m.posicao, 'posicao'),
    linha(m.idade, 'faixa'),
    fezPeneira ? linha(m.peneiras, 'peneirasTexto') : (r.peneiras === '0' ? limpa(m.semPeneira) : null),
    fezPeneira && r.dispensas && r.dispensas !== '0' ? linha(m.dispensas, 'dispensasTexto') : null,
    fezPeneira ? linha(m.gasto, 'gastoTexto') : null,
    linha(m.sonho, 'sonho'),
    linha(m.video, 'videoTexto'),
    linha(m.quer, 'quer'),
    linha(m.chance, 'chance')
  ].filter(Boolean);
  return [
    preenche(abertura, vars),
    respostas.length ? [limpa(m.respostas), ...respostas.map(x => '• ' + x)].join('\n') : null,
    linha(m.codigo, 'codigo')
  ].filter(Boolean).join('\n\n');
}

/** O link que abre a conversa com o número da equipe e a mensagem pronta. */
export function linkWhatsapp(numero, texto) {
  return `https://wa.me/${String(numero || '').replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
}
