/* Mapas de calor por posição (20/10/2026): o closer escolhe no painel, numa lista, o mapa da posição do atleta, e o slide do dossiê desenha
   o mesmo SVG embaixo (ou ao lado) do vídeo analisado. É o mapa típico da posição, não um dado do jogo dele: a tela diz "onde atua um
   zagueiro" (verdade) e a nota do apresentador avisa que ninguém fala dele como dado do atleta.
   Um arquivo só, igual na raiz do painel e em assets/ dos três decks do R2 (o testes/teste-igualdade.mjs confere; pra copiar, rode
   node copia-mapa-calor.mjs na pasta do painel). Sem imagem e sem pedido de rede: o SVG sai daqui, nítido em qualquer tamanho.
   Convenção do desenho: o campo deitado, 105 x 68 m (1050 x 680 no SVG); o time ataca da esquerda pra direita, e o lado direito do time
   é o de baixo. Em pé (vertical: true, pro vídeo em pé com o mapa ao lado), o mesmo campo girado: o ataque pra cima e o lado direito do
   time à direita, como o campo do deck. As manchas são fixas por posição (nada sorteado): cada uma é [x, y, raio x, raio y, força 0 a 1,
   giro em graus]. Os ids são os mesmos marcadores do campo do deck (posicaoNoCampo): GOL, LD, LE, ZAG-d, ZAG-e, VOL-d, VOL-e, MC, ALE, ADD, CA.
   Uso: MapaCalor.lista ([{ id, nome, sub }]), MapaCalor.temId(id), MapaCalor.nome(id), MapaCalor.sub(id), MapaCalor.svg(id, { vertical }). */
(function (raiz) {
  'use strict';
  const L = 1050, A = 680;
  const espelha = ms => ms.map(([x, y, rx, ry, f, g]) => [x, A - y, rx, ry, f, g ? -g : 0]);
  const LD = [[200, 568, 125, 82, .6], [360, 606, 180, 66, .9], [560, 612, 180, 60, 1], [770, 606, 155, 60, .8], [925, 585, 90, 66, .45, -20]];
  const ZAGD = [[150, 420, 110, 118, 1], [285, 430, 120, 96, .8], [415, 395, 105, 80, .45], [95, 340, 60, 90, .35]];
  const VOLD = [[255, 400, 110, 105, .7], [400, 410, 140, 118, 1], [545, 380, 120, 96, .65], [470, 250, 80, 60, .3]];
  const ALE = [[575, 96, 135, 68, .55], [760, 84, 165, 68, 1], [915, 124, 115, 82, .85], [870, 230, 110, 70, .6, -32], [975, 292, 66, 76, .4]];
  const MAPAS = {
    GOL: { nome: 'Goleiro', quem: 'um goleiro', manchas: [[55, 340, 62, 120, 1], [125, 340, 92, 175, .6], [215, 340, 70, 120, .22]] },
    LD: { nome: 'Lateral direito', quem: 'um lateral direito', manchas: LD },
    LE: { nome: 'Lateral esquerdo', quem: 'um lateral esquerdo', manchas: espelha(LD) },
    'ZAG-d': { nome: 'Zagueiro (lado direito)', quem: 'um zagueiro', manchas: ZAGD },
    'ZAG-e': { nome: 'Zagueiro (lado esquerdo)', quem: 'um zagueiro', manchas: espelha(ZAGD) },
    'VOL-d': { nome: 'Volante (lado direito)', quem: 'um volante', manchas: VOLD },
    'VOL-e': { nome: 'Volante (lado esquerdo)', quem: 'um volante', manchas: espelha(VOLD) },
    MC: { nome: 'Meia central', quem: 'um meia central', manchas: [[560, 340, 150, 120, .85], [735, 340, 120, 112, 1], [650, 205, 100, 62, .5], [650, 475, 100, 62, .5], [450, 340, 90, 80, .4]] },
    ALE: { nome: 'Ponta esquerda', quem: 'um ponta esquerda', manchas: ALE },
    ADD: { nome: 'Ponta direita', quem: 'um ponta direita', manchas: espelha(ALE) },
    CA: { nome: 'Centroavante', quem: 'um centroavante', manchas: [[945, 340, 82, 128, 1], [835, 340, 92, 100, .85], [715, 340, 110, 128, .5], [880, 205, 70, 55, .35], [880, 475, 70, 55, .35]] }
  };
  const IDS = Object.keys(MAPAS);
  const temId = id => Object.prototype.hasOwnProperty.call(MAPAS, String(id || ''));
  let n = 0;
  const r1 = v => Math.round(v * 10) / 10;

  // as linhas do campo (a mesma cor de areia do campo do deck)
  function campo() {
    const meio = A / 2, ga = 201.6, pa = 91.6, arco = Math.sqrt(91.5 * 91.5 - 55 * 55);
    const area = x0 => {
      const d = x0 === 0 ? 1 : -1, x = v => r1(x0 + d * v);
      return '<rect x="' + Math.min(x(0), x(165)) + '" y="' + r1(meio - ga) + '" width="165" height="' + r1(2 * ga) + '"/>' +
        '<rect x="' + Math.min(x(0), x(55)) + '" y="' + r1(meio - pa) + '" width="55" height="' + r1(2 * pa) + '"/>' +
        '<path d="M' + x(165) + ' ' + r1(meio - arco) + 'A91.5 91.5 0 0 ' + (d > 0 ? 1 : 0) + ' ' + x(165) + ' ' + r1(meio + arco) + '"/>' +
        '<circle cx="' + x(110) + '" cy="' + meio + '" r="4" fill="rgba(200,184,138,.5)" stroke="none"/>' +
        '<path d="M' + x(0) + ' ' + r1(meio - 36.6) + 'V' + r1(meio + 36.6) + '" stroke-width="7"/>';
    };
    let faixas = '';
    for (let i = 0; i < 10; i += 2) faixas += '<rect x="' + i * 105 + '" y="0" width="105" height="' + A + '"/>';
    return '<g fill="rgba(157,176,106,.05)">' + faixas + '</g>' +
      '<g fill="none" stroke="rgba(200,184,138,.42)" stroke-width="3">' +
      '<rect x="3" y="3" width="' + (L - 6) + '" height="' + (A - 6) + '"/>' +
      '<path d="M' + L / 2 + ' 3V' + (A - 3) + '"/><circle cx="' + L / 2 + '" cy="' + meio + '" r="91.5"/>' +
      '<circle cx="' + L / 2 + '" cy="' + meio + '" r="4" fill="rgba(200,184,138,.5)" stroke="none"/>' + area(0) + area(L) + '</g>';
  }

  // o SVG de uma posição ('' pra id que não existe). vertical: o campo em pé (ataque pra cima)
  function svg(id, op) {
    if (!temId(id)) return '';
    const vertical = !!(op && op.vertical), u = 'mc' + (++n) + '_';
    const m = MAPAS[id];
    const manchas = m.manchas.map(([x, y, rx, ry, f, g]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="url(#' + u + 'c)" opacity="' + f + '"' +
      (g ? ' transform="rotate(' + g + ' ' + x + ' ' + y + ')"' : '') + '/>').join('');
    const nucleo = m.manchas.filter(x => x[4] >= .85).map(([x, y, rx, ry, , g]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r1(rx * .42) + '" ry="' + r1(ry * .42) + '" fill="url(#' + u + 'n)"' +
      (g ? ' transform="rotate(' + g + ' ' + x + ' ' + y + ')"' : '') + '/>').join('');
    const corpo = '<rect width="' + L + '" height="' + A + '" fill="url(#' + u + 'g)"/>' + campo() +
      '<g filter="url(#' + u + 'b)">' + manchas + nucleo + '</g>';
    const vb = vertical ? '0 0 ' + A + ' ' + L : '0 0 ' + L + ' ' + A;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mapa de calor: onde atua ' + m.quem + '" class="mapa-calor">' +
      '<defs><linearGradient id="' + u + 'g" x1="0" y1="0" x2="' + (vertical ? 1 : 0) + '" y2="' + (vertical ? 0 : 1) + '"><stop offset="0" stop-color="#14261F"/><stop offset="1" stop-color="#0D1A1B"/></linearGradient>' +
      '<radialGradient id="' + u + 'c"><stop offset="0" stop-color="#FFC53D"/><stop offset=".45" stop-color="#FF7A2E" stop-opacity=".76"/>' +
      '<stop offset=".8" stop-color="#E2552B" stop-opacity=".2"/><stop offset="1" stop-color="#E2552B" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + u + 'n"><stop offset="0" stop-color="#FFF1B8" stop-opacity=".85"/><stop offset="1" stop-color="#FFC53D" stop-opacity="0"/></radialGradient>' +
      // o desfoque junta as manchas numa área só, como um mapa de calor de verdade
      '<filter id="' + u + 'b" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="20"/></filter></defs>' +
      (vertical ? '<g transform="translate(0 ' + L + ') rotate(-90)">' + corpo + '</g>' : corpo) + '</svg>';
  }

  raiz.MapaCalor = {
    ids: IDS.slice(),
    lista: IDS.map(id => ({ id, nome: MAPAS[id].nome, sub: 'onde atua ' + MAPAS[id].quem })),
    temId,
    nome: id => (temId(id) ? MAPAS[id].nome : ''),
    sub: id => (temId(id) ? 'onde atua ' + MAPAS[id].quem : ''),
    svg
  };
})(typeof window !== 'undefined' ? window : globalThis);
