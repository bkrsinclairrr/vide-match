# Guia visual

A marca pública do aizyron.com (fundo preto, dourado, verde da IA, Inter e Playfair itálico), não a navy do deck do closer. Trocar a paleta é mexer só em `css/tokens.css`. As capturas de todas as telas, em cinco tamanhos, estão em `capturas/<largura>/` (geradas por `node quiz/testes/teste-aparelhos.mjs`).

## Cor por função

| Cor | Token | Função |
| --- | --- | --- |
| Preto `#0A0A0A`, cartões `#121212` e `#171717` | `--bg`, `--card`, `--card-2` | Superfícies |
| Dourado `#FBBF24` (degradê `#F59E0B` a `#FBBF24`) | `--gold`, `--grad-gold` | Ação (o botão principal), ênfase da copy e o atleta (o ponto dourado no campo, o centro do radar) |
| Dourado claro `#FDE68A` | `--gold-soft` | Links, anel de foco, chips |
| Verde `#34D399` | `--ai` | O Zyron e a IA (a aba IA do campo, o radar, os passos), confirmação |
| Laranja `#F97316` | `--enemy` | Só o inimigo: o olhômetro e os números da peneira |
| Vermelho `#F87171` | `--danger` | Só erro de formulário |
| Papel `#F4F1EA` com tinta `#141414` | `--papel`, `--papel-tinta` | Os recortes de jornal da T07 |
| Cinza `#666666` | `--traco` | Borda da caixa de marcar e círculo vazio das opções (3:1 no cartão) |

Os 35 pares de cor estão medidos em `contraste.md` (texto 4,5 ou mais; traço 3 ou mais).

## Tipografia

- Inter (400 a 800) no texto. Títulos em 800, de 28 a 40 px conforme a tela, com `text-wrap: balance` (os menores com `pretty`).
- Playfair Display itálico 600 nas palavras de ênfase (`*palavra*` na copy vira o itálico dourado) e na abertura em preto da T10. A pontuação colada na ênfase ("*enganado*.") vem recuada, pra não ler como espaço.
- Georgia nos recortes de jornal (manchete em serifa, como impresso).
- As fontes são do próprio quiz (`assets/fonts`, 48 KB e 39 KB no subconjunto latino), com `font-display: swap`.

## Cenas

- **Campo em perspectiva (T01 e T05).** Visão de transmissão, ataque pra cima, desenhado em SVG por uma homografia (reta continua reta). Na T01, as 11 posições são botões de 50 px (a bola visual encolhe no fundo do campo, de 0,88 a 1,06); um toque escolhe e mostra o nome da posição. Na T05, os 22 jogadores se mexem num `requestAnimationFrame` só (que para fora da tela e com a aba oculta); no olhômetro, um foco laranja segue a bola e só quem está perto acende; o atleta é o ponto dourado com "Você", sempre longe do foco. Na IA, os 22 ganham caixa verde e o atleta, "O Zyron vê você". Sem toque em 5 s, vira sozinho pra IA uma vez.
- **Radar (T06).** O atleta no centro, dez clubes da rede em volta, a varredura verde (recortada no círculo) passa por eles e, na segunda volta, acende um clube sem nome, com a linha tracejada até ele. Os três passos embaixo acendem junto com a varredura.
- **Recortes (T07).** Papel levemente girado, faixa preta no topo, veículo, data, manchete em serifa, uma linha de resumo e "Ver a matéria". Arrastam de lado (rolagem nativa com encaixe) e andam sozinhos até o primeiro toque.
- **Números e depoimentos (T08).** O número da renda em cartão dourado; os números contam até o valor quando entram na tela.
- **Mensagem de voz (T10).** Abertura em preto, uma linha por vez; depois a conversa ("gravando áudio" e a bolha recebida), com a onda real do áudio (48 barras), velocidade e arrastar na onda. Sem marca de aplicativo.
- **Segurar (T11).** Anel dourado que enche em 1,6 s; completo, fica verde com o check.

## Movimento

- Troca de tela: a anterior some em 150 ms; a nova sobe 24 px em 240 ms. Texto narrativo entra escalonado (90 ms por linha, com desfoque leve).
- O retorno do toque é só de cor (sem escala no `:active`): escala com animação ao lado fazia o Chrome perder o alvo do toque.
- "Reduzir movimento" no aparelho: animações e transições desligadas, o campo parado num quadro, sem a abertura em preto, o radar direto no quadro final. Testado (`teste-acessibilidade.mjs`).

## Medidas

- Coluna única de até 480 px, margem de 20 px. No computador, a coluna fica no centro com o fundo de pontos de campo.
- A ação principal mora sempre na barra fixa de baixo (sobe junto com o teclado). Todo alvo de toque tem 44 px ou mais (medido em todas as telas).
- Sem rolagem horizontal de 320 px a 1440 px e com zoom de 200%; nenhum conteúdo passa da largura da tela (medido pelo Chrome em cada parada, em 5 tamanhos).
