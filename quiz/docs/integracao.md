# Integração: como ligar o que está desligado

Tudo se liga em `config/geral.json`, sem mexer em código. Depois de editar, publique de novo (fim deste arquivo).

| Campo | Hoje | Pra ligar |
| --- | --- | --- |
| `endpoint` | vazio (modo de ensaio: o lead fica só no navegador) | o endereço do webhook que recebe o lead (precisa ser `https`) |
| `endpointEventos` | vazio (os eventos iriam pro `endpoint`) | outro webhook só pra eventos, ou `false` pra não enviar eventos |
| `landingUrl` | vazio (o botão da T14 vai pro `landingEnsaio`, aizyron.com) | o endereço da landing com a VSL |
| `pixel.meta` | vazio | o ID do pixel da Meta |
| `pixel.utmify` | vazio | o ID do pixel da Utmify (o aizyron.com usa `6aa46c5bfa49cab73a6e0817` no /avaliacao) |
| `whatsappEquipe` | vazio | o número da equipe, com DDI e DDD (aparece um link "Falar com a equipe no WhatsApp" na T14) |
| `vagas`, `proximaTurma` | nulos | só com número e data reais da semana (regra 7); aparecem na T14 |
| `roteamento.tierC` | `"saida"` (tier C sai pro Instagram) | `"landing"` manda o tier C pra landing também (a tela fica igual à do B; a URL leva `t=C`) |
| `escudos.modo` | `"escudos"` | `"texto"` troca todos os escudos da T07 por selo de texto |
| `legendas.ativo` | `false` | `true` liga as duas legendas do áudio (só depois de ouvir e aprovar o texto em `copy.pt-BR.json`, `audio.legendas`) |
| `telasOpcionais` | todas `false` | `true` liga a tela (`experiencia`, `epoca`, `objetivo`, `trava`); cada uma soma uma tela de um toque |
| `audio.ativo` | `true` | `false` tira a T10 (o máximo da pontuação vira 94) |
| `provas.renda.modo` | `"media"` (inicialmente R$ 30 mil+ por mês) | `"faixa"` mostra a faixa de R$ 5 mil a R$ 30 mil |
| `debug` | `false` | `true` deixa o `?debug=1` funcionar em produção |

## O destino do lead (webhook)

O quiz manda um `POST` com o JSON do lead no corpo e `Content-Type: text/plain` (assim o navegador não faz o pedido extra de CORS, que quebra em muitos webhooks). O destino precisa:

1. Ler o corpo cru e fazer `JSON.parse`.
2. Fazer upsert pelo `leadId`: o mesmo lead pode chegar mais de uma vez (reenvio depois de falha de rede), e tem que virar uma linha só.
3. Separar os lotes de eventos, que chegam no mesmo endereço quando não existe `endpointEventos`: eles têm `tipo: "evento"`; o lead tem `leadId`.

### Pronto pra usar: planilha do Google (Apps Script)

1. Crie uma planilha nova no Google Sheets.
2. Extensões > Apps Script. Apague o que estiver lá e cole o código abaixo. Salve.
3. Implantar > Nova implantação > tipo "App da Web". Executar como: você. Quem pode acessar: qualquer pessoa. Implantar e autorizar.
4. Copie o endereço que termina em `/exec` e cole em `endpoint` no `config/geral.json`.
5. Se o volume de visitas for grande, ponha `"endpointEventos": false` (ou outro destino pros eventos): uma visita gera uns dez lotes, e a cota diária do Apps Script numa conta gratuita é curta.

```js
// Webhook do Quiz Zyron: grava cada lead numa linha (upsert pelo leadId) e os lotes de eventos noutra aba.
const ABA_LEADS = 'Leads';
const ABA_EVENTOS = 'Eventos';
const COLUNAS = ['leadId', 'recebidoEm', 'enviadoEm', 'tier', 'total', 'nome', 'whatsapp', 'responsavel', 'idadeFaixa', 'posicao',
  'peneiras', 'gasto', 'dispensas', 'jogouBem', 'video', 'sonho', 'audio', 'quer', 'compromisso', 'chance',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'plataforma', 'inApp', 'suspeito', 'modoEnsaio', 'payload'];

function doPost(e) {
  const trava = LockService.getScriptLock();
  trava.waitLock(20000);
  try {
    const corpo = JSON.parse(e.postData.contents);
    if (corpo.tipo === 'evento') gravaEventos(corpo);
    else if (corpo.leadId) gravaLead(corpo);
    return ContentService.createTextOutput('ok');
  } catch (erro) {
    return ContentService.createTextOutput('erro: ' + erro);
  } finally {
    trava.releaseLock();
  }
}

function aba(nome, cabecalho) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let a = planilha.getSheetByName(nome);
  if (!a) { a = planilha.insertSheet(nome); a.appendRow(cabecalho); a.setFrozenRows(1); }
  return a;
}

// o apóstrofo segura texto como texto (sem ele, o +55 vira número)
const texto = v => (v === null || v === undefined) ? '' : "'" + String(v);

function gravaLead(p) {
  const a = aba(ABA_LEADS, COLUNAS);
  const f = p.ficha || {}, q = p.quiz || {}, c = p.contato || {}, r = p.rastreio || {}, t = p.tecnico || {}, pt = p.pontuacao || {};
  const linha = [p.leadId, new Date(), p.enviadoEm, pt.tier, pt.total, f.nome, texto(c.whatsapp), c.responsavelNome || '',
    texto(q.idadeFaixa), f.posicao, texto(q.peneirasFaixa), q.gastoFaixa || '', texto(q.dispensas), q.jogouBem || '', q.video, f.sonho,
    (q.audio || {}).estado, q.quer, q.compromisso, q.chance,
    r.utm_source || '', r.utm_medium || '', r.utm_campaign || '', r.utm_content || '', r.plataforma, r.inApp || '',
    t.suspeito, t.modoEnsaio, JSON.stringify(p)];
  const total = a.getLastRow();
  const ids = total > 1 ? a.getRange(2, 1, total - 1, 1).getValues().map(l => l[0]) : [];
  const i = ids.indexOf(p.leadId);
  if (i >= 0) a.getRange(i + 2, 1, 1, linha.length).setValues([linha]);
  else a.appendRow(linha);
}

function gravaEventos(lote) {
  const a = aba(ABA_EVENTOS, ['recebidoEm', 'sessaoId', 'versao', 'evento', 'ms', 'parametros']);
  const agora = new Date();
  const linhas = (lote.eventos || []).map(ev => [agora, lote.sessaoId, lote.versao, ev.e, ev.t, JSON.stringify(ev.p || {})]);
  if (linhas.length) a.getRange(a.getLastRow() + 1, 1, linhas.length, linhas[0].length).setValues(linhas);
}
```

A coluna `payload` guarda o lead inteiro, pra importar no Painel do Closer depois (a `ficha` já vem com as chaves do painel).

### Make, n8n ou Zapier

O corpo chega como texto. Use o gatilho de webhook que entrega o corpo cru e, logo depois, o passo de "converter JSON" do serviço: no Make, o webhook personalizado com o módulo de JSON; no n8n, o nó Webhook com o corpo cru e um nó de código com `JSON.parse`; no Zapier, o "Catch Raw Hook" com um passo de formatação ou código. Faça o "procurar ou criar" pelo `leadId`.

### Conferir sem ligar nada

Abra o quiz com `?debug=1` (na prévia funciona): o painel de ensaio mostra o estado, o caminho, a pontuação, os últimos eventos e o payload que seria enviado. No modo de ensaio, os últimos 5 payloads ficam na `sessionStorage` (`qz:ensaio`) da aba.

## Pixel (Meta e Utmify)

- Só carrega pra adulto (18 ou mais), só depois de a idade ser respondida e de o atleta tocar "Aceitar" na folha de cookies (que aparece sobre a T03, com "Aceitar" e "Rejeitar" iguais). Menor, sem idade ou em dúvida: nunca, e não há folha.
- Eventos enviados: `PageView` (no aceite), `Lead` (envio do contato), `QuizCompleto` e `CtaClick` (personalizados). Nenhum parâmetro: nem tier, nem pontuação, nem contato.
- No Gerenciador de Eventos da Meta, desligue a "Correspondência avançada automática": ela pode ler campos de formulário por conta própria. O quiz já carrega o pixel com a configuração automática desligada.
- No anúncio, nada de "Você tem X anos?" no texto (política da Meta de atributos pessoais). Pra público de menor, a Meta não permite público personalizado, semelhante nem interesses.

## A landing com a VSL

O botão da T14 abre, na mesma aba, a `landingUrl` com: as UTMs que vieram no anúncio, `qz=1` (veio do quiz), `t=A`, `B` ou `C` (o tier) e `lid=<leadId>` (o id opaco do lead, pra cruzar a visita e a compra com a linha da planilha). Nunca nome, telefone nem a pontuação detalhada.

## Publicar

O quiz é servido pelo projeto da Vercel do site (`vide-match`, domínio `aizyron.com`), a partir de `public/quiz/`. O `vercel.json` do site traz as 3 regras do quiz: `/quiz` redireciona pra `/quiz/` (os caminhos do quiz são relativos, então a barra final é obrigatória), noindex em `/quiz/` e cache dos assets.

O caminho que funciona, igual ao do resto do site:

1. Branch nova a partir da `main` (`git switch -c feat/quiz-...`), mexa em `public/quiz/` e rode a suíte (`node quiz/testes/roda-tudo.mjs`).
2. `git push -u origin <branch>`: a integração do GitHub com a Vercel gera a prévia sozinha (o endereço sai no PR; a prévia pede login da Vercel).
3. Conferir a prévia: `node quiz/testes/teste-publicacao.mjs https://<prévia>.vercel.app` (endereço do site, sem `/quiz`).
4. PR e merge na `main`: a produção publica sozinha. Depois, `node quiz/testes/teste-publicacao.mjs https://aizyron.com` (com endpoint ou pixel ligados, o teste pula as capturas pra não mandar lead de teste).

`vercel deploy` pela CLI neste projeto sai **Blocked** ("the commit author doesn't have permission to create deployments"): não use. `vercel curl` e `vercel inspect` funcionam (o teste de publicação usa o `curl`).

Ao ligar o `endpoint` (ou o `endpointEventos`) em `public/quiz/config/geral.json`, inclua o domínio dele no `connect-src` do Content-Security-Policy do `vercel.json` do site (pro webhook do Google Apps Script: `https://script.google.com` e `https://script.googleusercontent.com`); sem isso, o navegador bloqueia o envio e o lead cai só na fila do aparelho.

Histórico: o quiz nasceu publicado como prévia num projeto separado (`quiz-zyron`), por isso as decisões 34 e 35 falam dele. Esse projeto só serviu pra desenvolver.
