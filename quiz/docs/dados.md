# Dados

Tudo que o quiz coleta, calcula e envia. O quiz é estático: não existe servidor nosso. O lead vai, uma vez, pro endpoint que o dono configurar (`config/geral.json`, `endpoint`). Sem endpoint, modo de ensaio: nada sai do aparelho.

## O que é coletado

| Dado | Onde | Por quê |
| --- | --- | --- |
| Posição, faixa de idade, peneiras, gasto, dispensas, "jogou bem", vídeo, sonho, áudio, vontade, compromisso, a chance (T12) | Toques nas telas (nenhum texto livre) | Montar a ficha do painel e pré-qualificar |
| Primeiro nome | T13 | Falar com o atleta pelo nome |
| Nome do responsável (só menor) | T13 | O contato e o aceite são do responsável |
| WhatsApp (do atleta adulto ou do responsável) | T13 | Mandar o diagnóstico e conversar |
| Aceite (texto exato, versão, data) | T13 | Registro do consentimento |
| UTMs | URL do anúncio | Saber de qual campanha veio (parâmetro de campanha, não identifica pessoa) |
| `fbclid`, `gclid`, `sessaoId` | URL e memória da aba | Só adulto que aceitou os cookies; nulos pra menor e pra quem rejeitou |
| Plataforma (`ios`, `android`, `desktop`), navegador do app (`instagram`, `facebook`), tamanho da tela, idioma | Navegador | Saber em que aparelho o quiz roda (o User-Agent inteiro não é guardado) |

Sem e-mail, sem nome completo, sem data de nascimento exata. `idade`, `peneirasFeitas` e `gastoPeneiras` da ficha são estimativas pela faixa (13, 16, 19 ou 23 anos; 0, 2, 4 ou 8 peneiras; R$ 0, 250, 1.250 ou 3.500), marcadas como estimadas no bloco `quiz`; o SDR confirma no WhatsApp.

## O payload (v1)

Validado por `config/payload.schema.json` (JSON Schema 2020-12) nos testes. Blocos:

- `v`, `leadId` (UUID que nasce no envio do contato), `criadoEm`, `enviadoEm` (com o fuso do aparelho), `duracaoSeg`.
- `ficha`: as chaves do Painel do Closer (`nome`, `idade`, `posicao`, `mapaCalor`, `peneirasFeitas`, `gastoPeneiras`, `sonho`, `origem: "Zyron"`, `temVideo: "sim"` quando tem vídeo, `experiencia` só com a tela opcional). O teste de dados passa a ficha pela própria regra do painel (`limpaFicha`) e confere que nada é cortado.
- `quiz`: `canal: "Quiz Zyron"` e todas as respostas categóricas, inclusive `recusado`, `jogouBem`, `audio { estado, pct }` e as estimativas.
- `contato`: `whatsapp` em E.164 (`+5511912345678`) e `responsavelNome` (nulo pra adulto).
- `consentimento`: `aceite: true`, o `texto` exato que o atleta (ou o responsável) marcou, `textoVersao`, `politicaVersao`, `em`.
- `pontuacao`: `total`, `porRegra`, `tier`, `maximo`.
- `rastreio`: UTMs, `fbclid` e `gclid` (só adulto com aceite), `referrer` (só o domínio), `plataforma`, `inApp`.
- `tecnico`: `versaoQuiz`, `viewport`, `idioma`, `caminho` (as telas do caminho dele), `sessaoId` (só adulto com aceite), `suspeito` (campo-isca preenchido ou menos de 45 s do começo ao envio: o lead segue, marcado), `modoEnsaio`.

Os espaços especiais da copy (o espaço duro do "R$ 500" e o word joiner do "Voxen | Zyron") saem trocados por espaço comum: o dado fica limpo pra planilha.

## A pontuação (`config/pontuacao.json`)

Regra simples sobre as respostas. Não é IA e nenhuma tela diz que é. A idade, a condição de menor e a época de nascimento nunca entram na conta (o teste muda só a idade em 155 combinações e confere que nada muda).

| Regra | Pontos |
| --- | --- |
| Quer viver isso | sim 28, "quero, mas já me decepcionei" 17, "ainda não sei" 5 |
| Segurou pra confirmar | 12 |
| A chance (T12) | "estou pronto" 30, "quero a minha família junto" 22, "quero entender como funciona" 12, "ainda não sei" 0 |
| Vídeo | jogos inteiros 12, só lances 8, ainda não 2 |
| Dor (4 por item) | já fez peneira; já foi dispensado; a família investiu R$ 500 ou mais |
| Áudio | até o fim 6, mais da metade 3, o resto 0 |

Máximo: 100 (94 com o áudio desligado). Tier A: 70 ou mais, com "estou pronto" ou "quero a minha família junto" na T12, e sem "ainda não sei" na T11. Tier C: menos de 45, ou "hobby" (só com a tela opcional de objetivo ligada); nenhuma resposta da T12 força o C, porque ela não fala de dinheiro. O resto é B.

## Eventos

Catálogo em `config/eventos.json` (lista em `contrato.md`). Cada evento leva só o nome e valores categóricos; o lote leva o `sessaoId` (aleatório, só na memória da aba, nunca gravado), então a análise de funil é anônima pra qualquer idade. O lote sai no máximo a cada 3 s pro `endpointEventos` (ou pro `endpoint`, com `tipo: "evento"`), por `sendBeacon`.

Ao pixel (Meta e Utmify), só adulto que aceitou os cookies: `contact_submit` vira `Lead`, `quiz_complete` vira `QuizCompleto` e `cta_click` vira `CtaClick`, sem parâmetro nenhum (nem tier, nem pontuação, nem contato). O pixel da Meta carrega com `autoConfig` desligado (não lê botão nem campo de formulário).

## Envio e fila

1. `fetch` pro `endpoint`, `POST`, `mode: "no-cors"`, `Content-Type: text/plain` (não gera preflight de CORS; o destino lê o corpo como JSON), `keepalive`, tempo limite de 8 s.
2. Falhou (rede ou tempo): o lead fica na fila `qz:fila` e tenta de novo com recuo de 1, 3, 10 e 30 s, até 5 tentativas por visita; o que sobrar tenta na próxima visita, e também quando a rede volta (`online`) e quando a aba volta a ficar visível.
3. A página fechou com envio pendente: `sendBeacon` (sobrevive ao fechamento), e o item fica na fila pra próxima visita conferir.
4. O `leadId` é a chave: o destino deve fazer upsert por ele, e reenviar nunca duplica.

O atleta nunca vê erro de rede: a transição "Montando o seu diagnóstico" dura 1,5 s e a T14 aparece de qualquer jeito.

## Menor de idade (o que o sistema faz sozinho)

- Nenhuma tag de terceiro antes de a idade ser respondida; nunca pra 12 a 17 anos, menos de 12, sem resposta ou em dúvida. Nem `fbclid` nem `gclid` ficam guardados.
- De 12 a 17: na T13, o nome e o WhatsApp do responsável, com o aceite no nome dele ("Sou o responsável por {nome}..."). O bloco "chame um responsável" da T02 saiu a pedido do dono em 23/10/2026 ("quem acessa sempre tem o consentimento"); a T02 só pergunta a faixa e segue.
- Menos de 12: a T02 vira a saída (Instagram da casa) e nada do que foi respondido fica no aparelho.
- A pontuação nunca lê idade.

## O que o dono decide (registrar aqui quando decidir)

| Item | Situação |
| --- | --- |
| Finalidade | Enviar o diagnóstico e conversar sobre a assessoria pelo WhatsApp (é o que o aceite diz). |
| Base legal | O quiz registra o consentimento (texto, versão, data; do responsável, no menor). Confirmar com o advogado, principalmente pra 12 a 17 anos (ver `riscos-assumidos.md`). |
| Prazo de guarda | A definir pelo dono. O quiz só envia: o apagamento é no destino (a planilha ou o CRM). |
| Quem acessa | A definir: quem tem acesso à planilha ou ao CRM que recebe o webhook. |
| Pedido de exclusão | Pelo WhatsApp da equipe ("você pode pedir pra parar de receber mensagens quando quiser"); a exclusão é feita no destino. |
