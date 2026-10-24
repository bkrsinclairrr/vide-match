# Contraste das cores do quiz

Gerado por `node quiz/ferramentas/contraste.mjs` a partir de `public/quiz/css/tokens.css` (fórmula da WCAG 2.2). Texto pede 4,5 ou mais; traço de
interface (borda de controle, anel de foco, barras da onda) pede 3 ou mais. Cor com transparência entra já pintada sobre o fundo
onde aparece. O teste `testes/teste-acessibilidade.mjs` reprova qualquer par abaixo do mínimo.

| Onde aparece | Cor | Fundo | Razão | Mínimo | Resultado |
| --- | --- | --- | --- | --- | --- |
| Texto principal no fundo | `#F2F2F2` | `#0A0A0A` | 17,68 | 4,5 | passa |
| Texto principal no cartão | `#F2F2F2` | `#121212` | 16,73 | 4,5 | passa |
| Texto principal no cartão marcado | `#F2F2F2` | `#171717` | 16,01 | 4,5 | passa |
| Texto de apoio no fundo | `#C9C9C9` | `#0A0A0A` | 11,96 | 4,5 | passa |
| Texto de apoio no cartão | `#C9C9C9` | `#121212` | 11,31 | 4,5 | passa |
| Nota pequena (muted) no fundo | `#8C8C8C` | `#0A0A0A` | 5,89 | 4,5 | passa |
| Nota pequena (muted) no cartão | `#8C8C8C` | `#121212` | 5,57 | 4,5 | passa |
| Nota pequena (muted) no cartão marcado | `#8C8C8C` | `#171717` | 5,33 | 4,5 | passa |
| Dourado (ênfase, rótulos) no fundo | `#FBBF24` | `#0A0A0A` | 11,86 | 4,5 | passa |
| Dourado no cartão | `#FBBF24` | `#121212` | 11,22 | 4,5 | passa |
| Dourado claro (links, chips) no fundo | `#FDE68A` | `#0A0A0A` | 15,90 | 4,5 | passa |
| Dourado claro no cartão | `#FDE68A` | `#121212` | 15,04 | 4,5 | passa |
| Texto do botão dourado (início do degradê) | `#1A1203` | `#F59E0B` | 8,64 | 4,5 | passa |
| Texto do botão dourado (fim do degradê) | `#1A1203` | `#FBBF24` | 11,12 | 4,5 | passa |
| Verde do Zyron no fundo | `#34D399` | `#0A0A0A` | 10,30 | 4,5 | passa |
| Verde do Zyron no cartão | `#34D399` | `#121212` | 9,74 | 4,5 | passa |
| Laranja do olhômetro no fundo | `#F97316` | `#0A0A0A` | 7,06 | 4,5 | passa |
| Laranja claro no fundo | `#FDBA74` | `#0A0A0A` | 11,74 | 4,5 | passa |
| Erro de formulário no fundo | `#F87171` | `#0A0A0A` | 7,16 | 4,5 | passa |
| Erro de formulário no cartão | `#F87171` | `#121212` | 6,77 | 4,5 | passa |
| Texto da bolha de voz | `#E9EDEF` | `#1F2A30` | 12,45 | 4,5 | passa |
| Tempo e rótulos da bolha de voz | `#8FA3AD` | `#1F2A30` | 5,59 | 4,5 | passa |
| Nome do remetente na conversa | `#F2F2F2` | `#0B1014` | 17,08 | 4,5 | passa |
| Recorte: texto no papel | `#141414` | `#F4F1EA` | 16,33 | 4,5 | passa |
| Recorte: veículo, data e assinatura no papel | `#5E5A52` | `#F4F1EA` | 6,08 | 4,5 | passa |
| Espelho (texto de apoio sobre o dourado a 6%) | `#C9C9C9` | `#18150C` | 11,01 | 4,5 | passa |
| Chip do capítulo (dourado claro sobre dourado a 7%) | `#FDE68A` | `#1B170C` | 14,36 | 4,5 | passa |
| Opção marcada (texto sobre dourado a 8%) | `#FFFFFF` | `#252013` | 16,22 | 4,5 | passa |
| Borda da opção marcada | `#FBBF24` | `#121212` | 11,22 | 3 | passa |
| Anel de foco (dourado claro) no fundo | `#FDE68A` | `#0A0A0A` | 15,90 | 3 | passa |
| Anel de foco no cartão | `#FDE68A` | `#121212` | 15,04 | 3 | passa |
| Barra da onda ainda não tocada | `#66777F` | `#1F2A30` | 3,15 | 3 | passa |
| Barra da onda já tocada | `#FBBF24` | `#1F2A30` | 8,78 | 3 | passa |
| Caixa de marcar (borda) no cartão | `#666666` | `#121212` | 3,26 | 3 | passa |
| Círculo vazio da opção no cartão | `#666666` | `#121212` | 3,26 | 3 | passa |

Os 35 pares passam.
