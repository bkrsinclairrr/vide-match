# Contrato

Os ids, as chaves e as convenções que todo arquivo do quiz segue. Mudou um id ou uma chave: muda aqui e nos testes no mesmo dia.

## Convenções

- Identificadores em português, sem acento (`peneiras`, `jogouBem`, `viuInimigo`). Arquivos em kebab-case (`audio-voz.js`, `copy.pt-BR.json`). Um módulo por componente e um por tela.
- Toda frase da tela mora em `config/copy.pt-BR.json`; todo número e toda afirmação de fato mora em `config/provas.json`, com fonte. O JavaScript só referencia o id. Ênfase na copy: `*palavra*` (vira o itálico dourado). Variáveis: `{quem}`, `{peneirasTexto}`, `{nome}` (entram escapadas).
- Tudo que muda sem código está em `config/geral.json` (endpoint, landing, pixel, telas opcionais, áudio, escudos, roteamento do tier C, escassez).
- Sem travessão em nada (código, comentário, copy, documento). Datas e números no formato brasileiro.
- Sem npm e sem build: módulos ES nativos, servidos como estão.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `index.html` | A casca: cabeçalho (voltar, marca, capítulo, progresso), o palco das telas e a barra fixa da ação. Traz pronto o topo da T01 (selo, título e apoio, iguais aos do `copy.pt-BR.json`), que aparece antes do JavaScript. Pré-carrega as fontes, os JSON e os módulos da primeira tela. |
| `config/geral.json` | Configuração (ver `integracao.md`). |
| `config/fluxo.json` | As telas, a ordem, o capítulo, a condição de cada uma (declarativa, sem `eval`) e as variantes da T05. |
| `config/copy.pt-BR.json` | Todo texto de tela, por id de tela. |
| `config/provas.json` | Os fatos com fonte: números da casa, peneira, recortes de imprensa, clubes com dados, depoimentos, o áudio. |
| `config/pontuacao.json` | Os pesos e os limites dos tiers. |
| `config/eventos.json` | O catálogo de eventos (nome e parâmetros permitidos) e o mapa pro pixel. |
| `config/payload.schema.json` | O JSON Schema 2020-12 do lead. |
| `css/tokens.css` | Cores, fontes, formas e medidas (fonte única). |
| `css/base.css`, `css/componentes.css`, `css/telas.css` | Base e cabeçalho; um bloco por componente; ajustes por tela. |
| `js/casca.js` | Script clássico que roda antes da primeira pintura: esconde o topo da capa pra quem volta no meio do quiz (ver `decisoes.md`, item 29). |
| `js/app.js` | A entrada: carrega os contratos e liga estado, eventos, rastreio, envio e o motor. |
| `js/motor/` | `navegacao.js` (o motor das telas e do histórico), `estado.js` (respostas e derivação da ficha), `fluxo.js` (o caminho e as condições), `barra.js` (a barra fixa), `util.js`. |
| `js/telas/` | Uma tela por arquivo (`posicao.js` até `resultado.js`, e `opcionais.js` pras quatro opcionais). |
| `js/componentes/` | `campo.js` (o campo da T01 e o olhômetro contra a IA da T05), `radar.js` (T06), `trilho.js` (cartões que se arrastam), `audio-voz.js` (T10), `conversa.js` (T07, o chat do Fernando), `opcoes.js`, `folha.js`, `fontes.js`, `icones.js`. |
| `js/dados/` | `pontuacao.js`, `payload.js`, `eventos.js`, `envio.js` (fila), `rastreio.js` (UTMs, cookies e pixel), `debug.js` (`?debug=1`). |
| `js/vendor/mapa-calor.js` | Cópia do `mapa-calor.js` do Painel do Closer (os nomes das 11 posições). |
| `assets/` | Fontes (Inter e Playfair itálico, latin e latin-ext), o áudio da mãe (original e a versão de 64 kbps) e a onda, escudos 96 por 96, fotos dos depoimentos, o favicon. |
| `testes/` | A suíte (ver `README.md`). |
| `ferramentas/` | `gera-waveform.py` (onda e áudio leve), `escudos.py` (escudos do deck pro quiz), `contraste.mjs` (gera `contraste.md`). |

## Telas (`config/fluxo.json`)

| Passo | n | Capítulo | Tipo | Aparece quando | Grava |
| --- | --- | --- | --- | --- | --- |
| `posicao` | 1 | I | capa-campo | sempre | `ficha.posicao`, `quiz.posicaoChave`, `quiz.posicaoQuem` |
| `idade` | 2 | I | chips | sempre | `ficha.idade`, `quiz.idadeFaixa`, `quiz.idadeEstimada` |
| `experiencia` | opcional | I | chips | tela opcional ligada em geral.json | `ficha.experiencia` |
| `epoca` | opcional | I | chips | tela opcional ligada em geral.json | `quiz.epoca` |
| `objetivo` | opcional | I | chips | tela opcional ligada em geral.json | `quiz.objetivo` |
| `peneiras` | 3 | I | chips-duas-perguntas | sempre | `ficha.peneirasFeitas`, `ficha.gastoPeneiras`, `quiz.peneirasFaixa`, `quiz.peneirasEstimado`, `quiz.gastoFaixa`, `quiz.gastoEstimado` |
| `trava` | opcional | I | chips | tela opcional ligada em geral.json | `quiz.trava` |
| `dispensas` | 4 | I | chips-duas-perguntas | `quiz.peneirasFaixa != "0"` | `quiz.dispensas`, `quiz.recusado`, `quiz.jogouBem` |
| `inimigo` | 5 | II | narrativa-campo | sempre (variantes A, B, C) | `quiz.viuOlhometro` |
| `zyron` | 6 | III | narrativa-radar | sempre | (nada: conta como vista no Continuar) |
| `video` | 7 | III | chips | sempre | `quiz.video`, `ficha.temVideo` |
| `mundo` | 8 | III | recortes-escudos | sempre | |
| `historico` | 9 | III | provas-depoimentos | sempre | |
| `sonho` | 10 | IV | chips | sempre | `ficha.sonho` |
| `audio` | 11 | IV | audio | `config.audio.ativo = true` | `quiz.audio` |
| `quer` | 12 | IV | chips | sempre | `quiz.quer`, `quiz.compromisso` |
| `chance` | 13 | V | chips | sempre | `quiz.chance` |
| `contato` | 14 | V | formulario | sempre | `ficha.nome`, `contato.whatsapp`, `contato.responsavelNome`, `consentimento.aceite` |
| `resultado` | 15 | V | resultado | sempre | `pontuacao.total`, `pontuacao.tier` |

Variantes da T05: A (`quiz.recusado = true`), B (fez peneira e não foi dispensado), C (nunca fez peneira). Caminho mais longo: 15 telas; sem peneira: 14; sem peneira e sem áudio: 13. Nos documentos, a tela do vídeo é a T06b, pra não renumerar as outras.

## Respostas (no aparelho: `qz:estado.respostas`)

| Resposta | Valores |
| --- | --- |
| `posicao` | `GOL`, `LD`, `LE`, `ZAG-d`, `ZAG-e`, `VOL-d`, `VOL-e`, `MC`, `ALE`, `ADD`, `CA` (as mesmas chaves do mapa de calor do painel) |
| `idade` | `menos12`, `12_14`, `15_17`, `18_21`, `22_mais` |
| `responsavel` | `true` (menor de 12 a 17 marcou que o responsável está junto) |
| `peneiras` | `0`, `1_2`, `3_5`, `6_mais` |
| `gasto` | `nada`, `ate_500`, `500_2000`, `mais_2000` |
| `dispensas` | `0`, `1_2`, `3_5`, `6_mais` (nunca maior que `peneiras`) |
| `jogouBem` | `sim`, `as_vezes`, `nao` |
| `viuOlhometro`, `viuInimigo`, `viuMundo`, `viuHistorico` | `true` |
| `video` | `jogos`, `lances`, `nada` |
| `sonho` | `brasil`, `europa`, `chance`, `selecao` |
| `audio` | `{ estado, pct }`, estado `nao_tocou`, `menos`, `mais_da_metade`, `ate_o_fim` ou `erro` |
| `quer` | `sim`, `receio`, `nao_sei` |
| `compromisso` | `true` ou `false` |
| `chance` | `pronto`, `familia`, `entender`, `nao_sei` |
| `nome`, `responsavelNome`, `whatsapp`, `aceite` | o contato (apagado do aparelho depois do envio) |
| `experiencia`, `epoca`, `objetivo`, `trava` | só com a tela opcional ligada: `menos1`, `1_3`, `3_5`, `mais5`; `jan_mar`, `abr_jun`, `jul_set`, `out_dez`, `nao_dizer`; `hobby`, `chance`, `profissional`; `ninguem_viu`, `sem_contato`, `gastei`, `qual_clube`, `recursos`, `nivel` |

## Armazenamento no aparelho

| Chave | Onde | O que guarda |
| --- | --- | --- |
| `qz:estado` | `localStorage` | Versão, respostas, passo atual, datas, `enviado`, `leadId`, tier e total. Vale 7 dias (`retomadaDias`). Sem nome, telefone nem aceite depois do envio. |
| `qz:fila` | `localStorage` | Leads esperando reenvio (`{ tipo, id, payload, tentativas, proximaEm }`). |
| `qz:cookies` | `localStorage` | A escolha da folha de cookies (`aceito` ou `rejeitado`). Só existe pra adulto. |
| `qz:utm` | `sessionStorage` | As UTMs do primeiro toque da sessão. |
| `qz:ensaio` | `sessionStorage` | Os últimos 5 payloads no modo de ensaio (sem endpoint). |

Tudo em `try/catch`: com o armazenamento bloqueado (navegador do Instagram, aba anônima), o quiz guarda na memória e segue.

## Eventos (`config/eventos.json`)

`quiz_view` (utm_source, utm_medium, utm_campaign, utm_content, utm_term, plataforma, inApp, versao); `quiz_start`; `step_view` (id, n, ms); `step_answer` (id, valor); `step_back` (id); `menor_declarado` (faixa); `menor12_saida`; `campo_toggle` (modo); `prova_fontes_open` (tela); `recorte_view` (id); `audio_view`; `audio_play` (pct); `audio_pause` (pct); `audio_progress` (pct); `audio_end`; `audio_seek` (pct); `audio_error` (estado); `audio_skip` (estado); `compromisso` (ms); `contact_submit` (tier, total, adulto, duracaoSeg); `lead_enviado` (tentativa); `lead_fila` (tentativa); `quiz_complete` (tier, total); `cta_click` (tier); `tierC_click`; `abandono` (id, n); `erro_js` (msg, id); `cookies_escolha` (aceite).

Parâmetro fora do catálogo é descartado na origem. Nenhum evento leva nome, telefone, e-mail, texto livre, idade exata nem `leadId`.

## Provas (`config/provas.json`)

Cada item: `id`, `tipo`, `ativo`, `confirmadoPeloDono`, `texto` (e `numero`, `manchete`, `clube`, `escudo`, `selo`, `nome`, `papel`, `foto` quando cabe), `fonte` (`veiculo`, `data`, `url`, `titulo`), `confianca`, `conferidoEm`, `notaLegal`, `observacao`.

| Tipo | Ids | Na tela |
| --- | --- | --- |
| `declarado_pelo_dono` | `casa-anos`, `casa-326`, `casa-renda`, `casa-prazo` | T01 e T08 |
| `experiencia_da_casa` | `frase-marca` | T05 |
| `fato_com_fonte` | `PEN-01` a `PEN-09` | T05 ("Ver os números" e fontes) |
| `recorte_de_imprensa` | `REC-01` a `REC-06` (`ordem` dá a sequência) | T07 |
| `afirmacao_atribuida` e `fato_com_fonte` | `IA-00` a `IA-10` | T07 (escudos) |
| `depoimento` | `lucas-silva`, `cecilia`, `marcos-oliveira`, `cleiton`, `catia-silva` | T08 |
| `depoimento_audio` | `audio-mae` | T10 |

Na tela, todo cartão de fato leva `data-prova="<id>"`: o teste de regras da casa confere que cada um existe no arquivo e, quando é de terceiro, tem veículo, data e link.

## Ganchos de teste

`window.QZ_TESTE` (configuração de teste; só em localhost), `window.__qz` (o app; localhost, `.vercel.app`, ensaio ou `debug: true`), `window.__qzAudio` (o elemento de áudio), o evento `qz:evento` no `window` (cada evento registrado) e `?debug=1` (o painel de ensaio).
