// A mensagem do botão final pra equipe comercial no WhatsApp (js/dados/mensagem.js, o mesmo módulo que a página usa): quem escreve
// (atleta adulto, responsável pelo menor, sem nome), as respostas que entram e as que ficam de fora, o código do diagnóstico, as regras
// da casa (sem travessão, sem palavra proibida, sem preço) e o link wa.me com o número do geral.json.
// Uso: node testes/teste-mensagem.mjs
import { verificador } from './_cdp.mjs';
import { contratos, confereTexto } from './_util.mjs';
import { linkWhatsapp, mensagemEquipe } from '../../public/quiz/js/dados/mensagem.js';

const { ok, fim } = verificador('Mensagem do WhatsApp');
const { copy, geral } = contratos();

// os textos que a página deriva das respostas (motor/estado.js), montados com a mesma copy
const textosDe = r => ({
  posicao: 'Zagueiro',
  faixa: copy.idade.faixaTexto[r.idade] || '',
  peneirasTexto: copy.peneiras.textos[r.peneiras] || '',
  dispensasTexto: copy.dispensas.textos[r.dispensas] || '',
  gastoTexto: copy.peneiras.gastoTextos[r.gasto] || '',
  sonho: copy.sonho.opcoes.find(o => o.id === r.sonho)?.texto || '',
  videoTexto: copy.video.opcoes.find(o => o.id === r.video)?.texto || '',
  nome: r.nome || ''
});
const msg = (r, extra = {}) => mensagemEquipe(Object.assign({
  copy, textos: textosDe(r), r, menor: false, leadId: '3f2a9c1e-7b44-4d0a-9e12-55aa01bc77de', pont: { tier: 'A', total: 82 }
}, extra));

const adulto = { nome: 'João', idade: '18_21', peneiras: '3_5', dispensas: '1_2', gasto: '500_2000', sonho: 'europa', video: 'jogos', quer: 'sim', chance: 'pronto' };
const m1 = msg(adulto);
ok(m1.startsWith('Olá! Sou João. Acabei de fazer o diagnóstico do atleta no quiz da Voxen | Zyron'), 'adulto: abre com o nome dele');
ok(['Posição: Zagueiro', 'Idade: 18 a 21 anos', 'Peneiras: 3 a 5 peneiras', 'Sem resposta ou dispensado: 1 ou 2', 'Gasto com peneiras: entre R$ 500 e R$ 2.000',
  'Onde quer jogar: Na Europa', 'Vídeo dos jogos: Jogos inteiros', 'Quer isso: Quero. É o que eu mais quero.', 'Momento: Estou pronto. Pode ser a chance da minha vida.']
  .every(l => m1.includes('• ' + l)), 'adulto: as nove respostas, uma por linha');
ok(m1.includes('Código do diagnóstico: 3F2A9C1E · A82'), 'o código junta o começo do lead e a pontuação');
ok(!/\{\w+\}/.test(m1), 'nenhum {campo} sobra na mensagem');
ok(!m1.includes(String.fromCharCode(0x2060)) && !m1.includes(String.fromCharCode(0xa0)), 'sem os espaços especiais da tela');
ok(confereTexto(m1).length === 0, 'regras da casa: sem travessão, palavra proibida nem preço' + (confereTexto(m1).length ? ` (${confereTexto(m1).join('; ')})` : ''));

const menor = { nome: 'Pedro', responsavelNome: 'Maria Souza', idade: '12_14', peneiras: '0', sonho: 'brasil', video: 'nada', quer: 'receio', chance: 'familia' };
const m2 = msg(menor, { menor: true, pont: { tier: 'B', total: 61 } });
ok(m2.startsWith('Olá! Sou Maria Souza, responsável por Pedro. Acabamos de fazer'), 'menor: quem escreve é o responsável');
ok(m2.includes('• Peneiras: nenhuma ainda') && !m2.includes('Sem resposta') && !m2.includes('Gasto com'), 'sem peneira: nem dispensa nem gasto');
ok(m2.includes('· B61'), 'menor: o código leva a pontuação dele');

const m3 = msg({ idade: '22_mais', video: 'lances' }, { leadId: null, pont: null });
ok(m3.startsWith(copy.resultado.mensagem.aberturaSemNome.replace(String.fromCharCode(0x2060), '')), 'sem nome: a abertura sem nome');
ok(!m3.includes('Código do diagnóstico') && !m3.includes('Onde quer jogar') && m3.includes('• Vídeo dos jogos: Só alguns lances'), 'sem código e sem as respostas que faltam');

const link = linkWhatsapp(geral.whatsappFinal, m1);
ok(geral.whatsappFinal === '5551982690162', 'o número do botão final é o da equipe (51 98269-0162)');
ok(link.startsWith('https://wa.me/5551982690162?text=') && decodeURIComponent(link.split('?text=')[1]) === m1, 'o link wa.me leva a mensagem inteira');

fim();
