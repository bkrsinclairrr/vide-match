# Variante "Scouting PRO" do quiz: do diagnóstico direto pro pagamento

Plano de execução pro Opus 5.5, aberto em `C:\Users\Me\Downloads\voxen\vide-match`. Escrito em 03/11/2026 a partir de uma rodada de perguntas com o dono. Tudo o que está em "Decisões fechadas" vem da boca dele; o resto é premissa minha, marcada, e se reverte num lugar só.

Leia antes de tocar em código: `CLAUDE.md` (seção "Quiz de pré-qualificação"), `quiz/docs/decisoes.md`, `quiz/docs/mapa-persuasao.md`, `quiz/docs/integracao.md` e `quiz/docs/riscos-assumidos.md`.

## Estado (03/11/2026): construído

Executado na branch `feat/quiz-variante-scouting-pro` (a partir da `main` 15cc79a). Decisões 73 a 80 em `decisoes.md`; como ligar, em `integracao.md` ("A variante de venda").

- Feito: a variante por `?v=pro` (atalho `/quiz/pro`), a T16 (oferta), o resultado seguindo pra oferta, a T13 e o aceite da variante, a ida ao checkout pelo canal do lead, a página de obrigado (`/quiz/obrigado/`), os eventos `oferta_view` e `checkout_click`, o Apps Script com `variante` e `checkoutEm` (simulado nas duas ordens de chegada), o CSP com o Apps Script e o `teste-variante.mjs` (53 verificações) na suíte.
- Diferença do plano: o apoio do adulto na T14 continua o de sempre (decisão 77), e a página de obrigado não promete prazo do primeiro relatório.
- No ar desde 03/11/2026: PR #58 (Termos) e PR #59 (variante) mergeados; o dono configurou na Sinnu o redirecionamento pro obrigado.
- Resolvido depois, no PR das pendências: os Termos ganharam prazo (resposta em até 7 dias corridos, devolução em até 10 dias corridos depois da resposta) e o `/precos` mostra o Scouting PRO a R$ 67,90 com o link novo. A linha "O encaminhamento a clubes faz parte dos planos de assessoria, não deste." fica (seção 12). Sem pixel: o site só usa a Utmify, o botão já repassa as UTMs pro checkout e o prazo do primeiro relatório segue sem número (a página de obrigado não promete).
- Falta do dono: o webhook (pendência 2). Sem navegador conectado e sem credencial do Supabase, não dá pra criar daqui; o código do Apps Script está em `integracao.md`, e o CSP já aceita o Google. Com o `/exec`, entra em `endpoint` no `geral.json` da variante.

## 1. Objetivo

Criar uma variante do quiz que NÃO termina no WhatsApp da equipe. Depois do diagnóstico, o lead vê uma oferta do Scouting PRO por R$ 67,90 e vai pro link de pagamento. O quiz atual (`aizyron.com/quiz/`) continua exatamente como está e segue rodando em paralelo: a variante é um teste, não uma troca.

Métrica de decisão: conversão do quiz até a compra, e a receita por lead comparada com o fluxo antigo (WhatsApp, depois fechamento). Sem meta inventada: o dono decide com os números da primeira leva.

## 2. Decisões fechadas pelo dono (03/11/2026)

| Tema | Decisão |
| --- | --- |
| Produto | O mesmo Scouting PRO, agora a **R$ 67,90**. Mesmos benefícios do Scouting do R2. |
| Benefícios | Os do plano "Scout PRO" do R2 (fonte: `PLANOS[0]` em `mnkk/apresentacoes/jogador-de-elite-r2/assets/roteiro.js`): o Zyron lê cada vídeo novo e aponta pontos fortes e prioridades; analista de performance com relatório da evolução a cada 15 dias; relatório de entrada; histórico de evolução; guia da peneira; sete módulos de formação. **Sem encaminhamento a clubes.** Use essas seis, não invente nenhuma. |
| Âncora | Preço anterior **R$ 247,90** (ele disse R$ 240,00 e depois mandou usar 247,90, o valor do Scouting em `/precos`). Sem motivo da queda. |
| Garantia | "Garantia vitalícia": reembolso total sem prazo, se comprovar o método (a "Garantia total" do R2: "Todo o valor investido é devolvido. Sem burocracia."). A condição fica visível na mesma tela. **Já está nos Termos de Uso, de forma ampla (todos os produtos, planos e serviços), seção 5**, branch `feat/termos-garantia-reembolso`. |
| Contato | Mantém nome + WhatsApp na T14 e liga o webhook de leads. É o que permite recuperar quem não pagou. |
| Depois do pagamento | Página de obrigado nossa, com o passo do vídeo e o botão pro WhatsApp da equipe com mensagem pronta. |
| Gatilhos novos | Só a garantia. **Sem escassez, sem relógio, sem "últimas vagas"** (o dono não escolheu prazo ou vaga real). |
| Link de pagamento | `https://pay.sinnu.com.br/H8upsOdI` (recebido em 03/11/2026). Vai em `checkoutUrl` no `geral.json` da variante. |

## 3. Premissas minhas (reverter em um lugar)

Cada uma vira uma chave em `config/variantes/scouting-pro/geral.json`.

1. Rota separada: `aizyron.com/quiz/pro` (e `?v=pro` como alternativa). O quiz atual não muda de comportamento.
2. Todos os tiers (A, B e C) veem a oferta. A pontuação só muda o tom, não esconde o produto. Menor de 12 anos continua saindo (regra existente da T02).
3. Quem tem 12 a 17 anos compra pelo responsável. Uma linha na oferta diz isso; o aceite do responsável já existe na T14.
4. Pagamento único e vitalício (o rótulo do R2 é "Vitalício, você tem"). Se for mensal, muda a copy.
5. Sem link secundário "falar com a equipe no WhatsApp" na oferta (o dono pediu pra não mandar pro WhatsApp). `whatsappEquipe` fica vazio na variante. Só a página de obrigado usa o WhatsApp.
6. Nome na tela: **"Scouting PRO · Voxen"**, como o dono escreveu. O deck R2 chama de "Scout PRO"; ver pendência 4.
7. A copy da oferta não fala de parcelamento (o teste de regras da casa proíbe "parcela", "à vista", "12x de").

## 4. Pendências que só o dono resolve

| # | O que falta | O que bloqueia |
| --- | --- | --- |
| 1 | Configurar o link `pay.sinnu.com.br/H8upsOdI` na Sinnu: preço R$ 67,90, Pix e cartão, **URL de redirecionamento pós-pagamento = `https://aizyron.com/quiz/obrigado/`** (conferir se a Sinnu permite) e repasse dos parâmetros UTM pra Utmify. O link em si já temos. | A página de obrigado só funciona depois disso. Nunca pagar de verdade no teste. |
| 2 | Webhook de leads: criar o Apps Script de `quiz/docs/integracao.md`, implantar e passar o endereço `/exec`. Hoje `endpoint` está vazio (modo de ensaio) e **sem ele não existe recuperação**. | Recuperar quem não pagou. |
| 3 | ~~Âncora~~ Resolvida: **R$ 247,90**, por ordem do dono. A copy mostra "de R$ 247,90 por R$ 67,90", sem motivo da queda. | Nada. |
| 4 | Nome do produto na tela: ficou **"Scouting PRO"**, como o dono escreveu (o deck R2 diz "Scout PRO"). O `PROIBIDAS` continua proibindo `scouting pro` e `scout` na base; a exceção vale só na copy da variante e na página de obrigado (`confereTextoVenda`). | Nada. |
| 5 | Termos de Uso: **feito** na branch `feat/termos-garantia-reembolso` (seção 5 nova, `src/pages/Terms.tsx`). Falta o dono mergear pra ir ao ar, e a oferta só sobe depois disso, porque ela aponta pra lá. Dois pontos que ele precisa confirmar no texto: o que conta como "aplicar o método" (rascunho: usar o serviço conforme orientado, enviar os vídeos pedidos e seguir plano e relatórios, com prova pelos registros da plataforma) e que o prazo de resposta ao pedido não tem número. | Coerência da garantia. |
| 6 | Prazo do primeiro relatório. Sem número, a página de obrigado não promete prazo. | Texto do obrigado. |
| 7 | IDs de pixel (Meta e Utmify) se quiser medir início de checkout. Só adulto, depois do aceite. | Medição no navegador. |

Fora do código, uma conta do dono: um analista de performance mandando relatório a cada 15 dias pra cada comprador, vitalício, a R$ 67,90. Defina com a equipe o limite ou a fila antes de subir o tráfego.

## 5. Regras que continuam valendo

Casa (testes automáticos): sem travessão em texto nenhum; palavras proibidas (`aprovado`, `escolhido`, `pré-qualificado`, `programa`, `pacote`, `mentoria` e as demais de `PROIBIDAS`); frases com no máximo 18 palavras; uma ideia por tela; preço **um por vez**; sem ressalva legal genérica ("resultados podem variar"); sem asterisco de nota. A garantia leva a condição em linguagem normal, não em letra miúda escondida.

Dados e lei (invisíveis, valem pra qualquer peça):
- Nenhuma tag, pixel ou remarketing antes de perguntar a idade, e nenhuma pra menor (`pixel.menores: "nenhum"`). A compra é medida pela integração Sinnu e Utmify no servidor, não pelo navegador de menor.
- Contato só no payload do lead. **Nunca nome, telefone ou leadId em URL, evento ou pixel** (`CHAVES_PROIBIDAS` em `_util.mjs`). Portanto: nada de pré-preencher o checkout com nome ou WhatsApp, e o clique no checkout é registrado reenviando o payload (upsert por `leadId`), não como evento com `leadId`.
- O aceite do contato precisa cobrir mensagens sobre o Scouting PRO (recuperação). Texto novo do aceite na variante e `VERSAO_TEXTO` com data nova em `payload.js`.

## 6. O fluxo

```
T01 posição → T02 idade (menos de 12 sai) → T03 peneiras → T04 dispensas → T05 inimigo
→ T06 Zyron → T07 vídeo → T08 mundo → T09 histórico → T10 sonho → T11 áudio
→ T12 quer (segurar) → T13 chance → T14 contato (nome + WhatsApp, grava no webhook)
→ T15 diagnóstico → T16 OFERTA (nova) → checkout Sinnu → /quiz/obrigado/ (nova)
```

O que muda, tela a tela (tudo por config e copy da variante, sem fork do motor):

- **T01 a T12**: iguais.
- **T13 (chance)**: o apoio atual promete "avaliação gratuita do seu perfil". Na variante vira algo que continue verdade com uma oferta paga logo depois (o diagnóstico é grátis; o produto é o Scouting PRO). Rascunho: "Daqui a pouco você vê o seu diagnóstico e como começar hoje."
- **T14 (contato)**: mesma tela. `apoioAdulto` deixa de dizer "é por lá que a equipe fala com você" e passa a "É pra onde enviamos o seu diagnóstico e o seu acesso." Aceite novo (ver seção 5). Grava no webhook antes de seguir.
- **T15 (resultado)**: mesmas três linhas de diagnóstico e o resumo. Troca o botão do WhatsApp por **"Ver como começar"**. Tier C não sai mais pro Instagram: `roteamento.tierC = "oferta"` (a tela do B, como já faz `"landing"`).
- **T16 (oferta)**: tela nova, rolável (como T07 e T08), com a barra de baixo fixa e o botão grande (62 px, `ctx.barra.botao`, `brilha: true`).
- **Retomada**: quem sai na oferta e volta em até 7 dias (`retomadaDias`) cai na T16, não no começo.

## 7. Copy da oferta (rascunho, o Opus afina dentro das regras da casa)

Tudo em `config/variantes/scouting-pro/copy.pt-BR.json`, chave `oferta`. Os `{...}` são campos que o quiz já tem.

**Topo**
- Selo: "O SEU PRÓXIMO PASSO"
- Título: "Faça o Zyron ler o *seu jogo*."
- Linha pessoal, com gasto informado: "A sua família já investiu {gastoTexto} pra você ser visto. Agora o seu jogo é medido por dados."
- Linha pessoal, sem gasto: "Antes de qualquer peneira, tenha o seu jogo medido por dados."

**O que você recebe** (as seis entregas, na ordem; cada uma amarrada a uma dor que ele já falou)
1. "O Zyron lê cada vídeo seu e aponta os seus pontos fortes e as suas prioridades."
2. "Um analista de performance manda o relatório da sua evolução a cada 15 dias."
3. "Relatório de entrada: de onde você parte."
4. "Histórico de evolução: todos os relatórios num lugar só."
5. "Guia da peneira: o que o avaliador olha em vinte minutos."
6. "Sete módulos de formação pra aplicar no seu jogo."

**Preço** (um preço só)
- "De R$ 247,90" riscado, **"R$ 67,90"** grande.
- "Pagamento único. Vitalício." (premissa 4)
- Sem motivo da queda.

**Garantia**
- Título: "Garantia total, sem prazo."
- Corpo: "Todo o valor investido é devolvido. Sem burocracia."
- Condição, legível, logo abaixo: "Pra acionar, é preciso comprovar que o método foi aplicado, conforme os termos." com link pra seção 5 dos Termos (`https://aizyron.com/termos`).

**Menor (12 a 17), só pra ele**: "O pagamento é feito por um responsável." (premissa 3)

**Lado do produto**: "O encaminhamento a clubes faz parte dos planos de assessoria, não deste." (ver seção 12; o dono decide manter ou tirar).

**CTA fixo**: "Quero o meu Scouting PRO", nota: "R$ 67,90 · pagamento único e seguro".

## 8. Onde cada gatilho entra

| Gatilho | Onde | Origem |
| --- | --- | --- |
| Inimigo comum (o olhômetro) | T05, e na T16 só como eco numa linha | já existe |
| Prova social | T08 e T09 (não repetir na T16, decisão 55) | já existe |
| Prova emocional (áudio da mãe) | T11 | já existe |
| Compromisso e consistência | T12 "segurar" e as respostas da T15 | já existe |
| Reciprocidade | o diagnóstico grátis (T01 a T15) vem antes de qualquer preço | já existe |
| Personalização | gasto e posição ditos por ele aparecem na T16 | **novo** |
| Contraste de preço | o que a família já gastou contra R$ 67,90 | **novo**, só com dado que ele mesmo deu |
| Âncora | R$ 247,90 riscado | **novo** |
| Reversão de risco | garantia total sem prazo | **novo** |
| Escassez e urgência | **desligadas** (`vagas` e `proximaTurma` nulos) | decisão do dono |

## 9. Como construir

Mecanismo recomendado, o Opus confirma lendo o código:

- Um único `index.html` e um único conjunto de arquivos. A variante é uma **camada de config** em `public/quiz/config/variantes/scouting-pro/` (`geral.json`, `copy.pt-BR.json`, `fluxo.json`), mesclada por cima da base com `mescla()` (já existe em `app.js`). O quiz atual carrega só a base.
- Escolha da variante: rewrite `/quiz/pro` no `vercel.json` (sem barra final, assim o `config/...` relativo ainda resolve em `/quiz/`; **verificar**, senão usar `<base href="/quiz/">`) e `?v=pro` de reserva. Detectar em `app.js` antes do `Promise.all` dos JSON.
- **Estado separado**: `qz:estado:pro` em `estado.js`, pra quem abrir os dois não misturar o progresso.
- Tela nova `js/telas/oferta.js` (e registro no `fluxo.json` da variante: passo `oferta`, `n: 16`, capítulo V). `resultado.js` ganha o botão "Ver como começar" quando a variante está ativa.
- Clique no CTA: manda pelo canal do lead um aviso `{ tipo: "checkout", leadId, em, variante, produto }` (feito assim, e não reenviando o payload inteiro, porque o contato some do aparelho depois do envio e quem recarrega na oferta não teria mais o que reenviar; ver decisão 78), depois `location.assign` do checkout com as UTMs que vieram e nada de dado pessoal. Mesmo padrão do `aoClicar` atual (`descarrega(true)` e um atraso curto).
- Página `public/quiz/obrigado/index.html`, estática, `noindex` (o bloco `/quiz/(.*)` do `vercel.json` já cobre). Conteúdo: confirma, três passos do vídeo (gravar um jogo inteiro com o celular deitado e o campo todo; dizer quem é ele em campo, cor da camisa e número; enviar), botão pro WhatsApp da equipe (`whatsappFinal`) com mensagem pronta, e a linha "Menor de 18: o vídeo é enviado ou autorizado por um responsável." Sem promessa de prazo (pendência 6).
- `connect-src` do CSP no `vercel.json`: incluir o domínio do webhook (`script.google.com` e `script.googleusercontent.com` se for Apps Script). Navegar pra Sinnu é navegação, não precisa de CSP.
- Webhook (Apps Script do `integracao.md`): acrescentar as colunas `variante`, `checkoutEm` e `produto`. Opcional, só se a Sinnu oferecer webhook de venda: aba `Compras` casando por WhatsApp (verificar a doc da Sinnu, não presumir).

## 10. Medição

Funil: `quiz_view` → fim da T01 → contato enviado → `oferta_view` → `checkout_click` → compra (Sinnu). Eventos novos em `config/eventos.json` (`oferta_view`, `checkout_click`), sem nenhuma chave de `CHAVES_PROIBIDAS`. Cada lead no webhook carrega `variante` pra separar `/quiz/` de `/quiz/pro` por anúncio.

## 11. Recuperação de quem não pagou (operação da equipe, fora do código)

O aceite da T14 cobre. Três segmentos na planilha: saiu antes da oferta, clicou no checkout e não pagou (o mais quente), pagou. Rascunho de duas mensagens, no tom da casa:
- Cerca de 30 minutos depois do clique: "Fala, {nome}! Vi que você começou o seu Scouting PRO e não finalizou. Deu algum problema no pagamento? Responde aqui que a gente resolve."
- No dia seguinte: "{nome}, o seu diagnóstico segue guardado. Quando quiser começar, é só voltar: {link}. A garantia é total, sem prazo."
Para menor, a mensagem fala com o responsável.

## 12. Riscos registrados (`<conformidade>`, uma vez só)

- **Novo nesta variante:** o quiz passa a vender direto, e a T09 ("É isso que acontece com quem usa o Zyron", R$ 30 mil por mês, cerca de 3 meses) fica a uma tela da compra. O Scouting PRO não inclui encaminhamento, então o consumidor pode ler esses números como entrega do produto de R$ 67,90 (CDC arts. 37 e 38). A linha "O encaminhamento a clubes faz parte dos planos de assessoria, não deste" (seção 7) resolve sem cortar nada e ainda planta o degrau seguinte. O dono decide.
- Menor comprando: o responsável é o comprador. Lei Pelé 27-C VI, RNI art. 24 e FIFA FFAR art. 13 não se aplicam a este produto porque não há encaminhamento nem gerenciamento de carreira.
- Garantia total sem prazo e Termos: ver pendência 5.

## 13. Testes

Tudo que existe hoje continua passando: `node quiz/testes/roda-tudo.mjs`.

Novo ou ajustado:
- `teste-regras-da-casa.mjs` com consciência de variante: a copy da variante pode ter `R$ 67,90` e `R$ 247,90` e o nome do produto configurado, mas **continua proibindo** `997`, `1.497`, `2.997`, `parcela`, `à vista`, `12x de` e as palavras proibidas. A copy da base **segue sem preço nenhum** (teste de regressão).
- `teste-variante.mjs` (percurso adulto): chega na T16, o botão abre o `checkoutUrl` com UTMs e **sem nome, WhatsApp nem leadId na URL**; o payload no webhook traz `checkoutEm` e `variante`.
- Menor de 12 a 17: vê a linha do responsável; menor de 12 sai como hoje; tier C vê a oferta.
- Retomada: sair na T16 e voltar cai na T16; o estado de `/quiz/` e o de `/quiz/pro` não se misturam.
- Quiz base: sem `?v=pro` continua terminando no WhatsApp, byte a byte o mesmo comportamento.
- `teste-desempenho.mjs` (LCP) e `teste-acessibilidade.mjs` com a T16 e o obrigado dentro.
- `teste-publicacao.mjs` avisa se `checkoutUrl` ainda é o provisório e se `endpoint` está vazio.

## 14. Entrega

Branch nova a partir de `origin/main` (o checkout local está numa branch já mesclada e atrás), por exemplo `feat/quiz-variante-scouting-pro`. Push da branch; a integração do GitHub gera a prévia (`vercel deploy` pela CLI sai Blocked neste projeto). Conferir a prévia no celular estreito e no Chrome: sem violação de CSP, sem erro no console, `/quiz/pro` abre a variante e `/quiz/` abre o quiz de sempre. PR aberto, **merge é do dono**. Nunca fazer um pagamento real no teste: usar o link provisório até o dono passar o definitivo.

Atualizar `quiz/docs/decisoes.md` (decisões novas), `quiz/docs/copy.md`, `quiz/docs/integracao.md` e a seção "Quiz de pré-qualificação" do `CLAUDE.md` (a frase "o quiz não vende nada" passa a valer só pro quiz base, e a variante é a exceção declarada pelo dono).

## 15. Fora do escopo desta entrega

- `/precos` (`src/pages/precos/data.ts`: Scouting PRO ainda `99700` e o link antigo) e os decks R2 (o plano "Scout PRO" ainda diz R$ 997). Se o produto passou a custar R$ 67,90 em geral, esses dois ficam errados e o closer vai ouvir "vi por 67,90". Atualizar é tarefa separada, depois do ok do dono.
- Automação do WhatsApp de recuperação.
- Upsell pós-compra pro plano de assessoria (a página de obrigado só abre a conversa, não vende).
