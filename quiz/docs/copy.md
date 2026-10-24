# Copy

Todo texto de tela mora em `config/copy.pt-BR.json`, por id de tela. Nenhuma frase está escrita no JavaScript. Todo número e toda afirmação de fato mora em `config/provas.json`, com fonte.

## Como editar

- **Ênfase:** `*palavra*` vira o itálico dourado (Playfair). Use uma por título, no máximo.
- **Variáveis:** `{quem}` (um lateral direito, um zagueiro...), `{posicao}`, `{faixa}`, `{peneirasTexto}`, `{dispensasTexto}`, `{gastoTexto}`, `{sonho}`, `{sonhoCurto}`, `{nome}`, `{nomeAtleta}`. Entram escapadas (o que o atleta digita nunca vira HTML).
- **Espaços que não quebram:** os valores em reais ("R$ 500", "R$ 2.000") têm espaço duro entre "R$" e o número, e "Voxen | Zyron" tem espaço duro e um word joiner depois do "|". Ao editar esses trechos num editor comum, copie e cole o trecho inteiro de outro lugar do arquivo, ou o texto volta a quebrar no meio do valor. No payload, esses caracteres saem como espaço comum.
- **Opções:** cada uma tem `id` (o que vai pro payload; não mude depois de publicado) e `texto` (o que aparece; pode mudar).
- Depois de editar, rode `node quiz/testes/teste-regras-da-casa.mjs`: ele acusa travessão, palavra proibida, ressalva legal, preço e título narrativo com mais de 9 palavras.

## As regras da casa que valem pra copy

- "Assessoria", nunca "mentoria", "programa" ou "pacote". "O Zyron" (masculino), "a Voxen". "Encaminhamos", "conectamos", "o seu perfil encontra o clube". Os 326 são "enviados". A pessoa da equipe é "o estrategista de carreiras" ou "a gente", nunca "scout".
- Nunca: "overall", "SEAL", "Scouting PRO", "ilustrativo", "fictício", "Nº", "aprovado", "escolhido", "pré-qualificado". Sem travessão.
- Sem nota legal, sem "sem garantia", sem rodapé de ressalva: a frase já diz de quem é o número ("atletas nossos, acompanhados por nós").
- Título de tela narrativa: até 9 palavras (o da T06 foi conferido com as 11 posições). Frase de tela: até 18 palavras. Sem preço.
- Emoção: alívio, esperança e vontade. Sem medo e sem urgência fabricada.

## O que o dono pediu e onde está

| Pedido | Onde |
| --- | --- |
| "Ele não reprovou por ser ruim, mas porque enganaram ele" | T05, variante A: "Você não foi reprovado por ser ruim. Foi *enganado*." E no resultado: "Pelo que você contou, você não foi reprovado por ser ruim. Foi avaliado a olho, sem nenhum dado." |
| "Em algum lugar do mundo, com as informações dele, um clube precisa exatamente de um jogador como ele" | T06: "Um clube procura exatamente {um lateral direito} como você." e "Em algum lugar do mundo, um clube precisa do seu perfil. O difícil nunca foi jogar bem. É ser encontrado por ele." No resultado: "Em algum lugar do mundo, um clube procura {um lateral direito} com o seu perfil." |
| Autoridade da IA no futebol, como as manchetes | T07: os recortes (ESPN Brasil, Cambridge United e mais quatro), "Clubes já usam *IA* pra encontrar jogadores." e "Não é promessa de internet. Está nos jornais." |
| Viés de confirmação | T04: "E nessas vezes, você sentiu que jogou bem?"; os espelhos depois de cada resposta; a linha pessoal da T05 com os números dele |
| Sem "fictício", "ilustrativo" e parecidos | Nenhum, em lugar nenhum (o teste de regras da casa procura) |
| Curto, pra levar à VSL | 14 telas no caminho mais longo, tudo de um toque até o contato |

## Variantes

- T05: A (foi dispensado; com "jogou bem: sim", a frase usa "Você jogou bem e mesmo assim..."), B (fez peneira e não foi dispensado), C (nunca fez peneira).
- T11: quem escolhe "quero, mas já me decepcionei" vê a linha da mãe do áudio (com o áudio desligado, uma versão sem o áudio).
- T13: adulto (o próprio WhatsApp) e menor (o nome e o WhatsApp do responsável, e o aceite no nome dele).
- T14: A e B (selo, resumo, três linhas e o botão da VSL; o B ganha "Assista com a sua família"), C (sai pro Instagram com respeito).

## Legendas do áudio

Ficam em `audio.legendas`, desligadas (`legendas.ativo: false`). O texto veio da transcrição automática; o dono ouve e aprova antes de ligar.
