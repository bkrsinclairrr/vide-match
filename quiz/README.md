# Quiz: diagnóstico do atleta (Voxen | Zyron)

Quiz de pré-qualificação em `https://aizyron.com/quiz/`: o atleta chega do anúncio, responde 15 telas curtas, quase todas de um toque, em menos de 4 minutos, recebe o diagnóstico e segue pra landing com a VSL. Estático (HTML, CSS e módulos JavaScript, sem build e sem npm), servido pelo mesmo projeto da Vercel do site (`vide-match`). O quiz não vende nada e não fala de preço em tela nenhuma: quem explica e vende é a VSL.

## Onde fica cada coisa

| Pasta | O que é | Vai ao ar? |
| --- | --- | --- |
| `public/quiz/` | O quiz: `index.html`, `css/`, `js/`, `config/` e `assets/`. É a FONTE: edite aqui. | Sim, em `/quiz/` |
| `quiz/` (esta pasta) | `docs/`, `testes/`, `ferramentas/` e `capturas/` (saída dos testes, fora do Git) | Não |

Nos documentos de `docs/`, os caminhos como `config/geral.json`, `js/telas/`, `css/tokens.css`, `assets/` e `index.html` são relativos a `public/quiz/`; `docs/`, `testes/`, `ferramentas/` e `capturas/` são relativos a esta pasta. Os documentos nasceram numa cópia do quiz (pasta `quiz-zyron` do repositório mnkk, hoje só histórico), por isso alguns trechos falam em "o projeto `quiz-zyron`": hoje o quiz é servido pelo `vide-match`.

Documentos: decisões (a lista de tudo que não vinha do briefing e por quê), contrato, dados, integração, persuasão, riscos, visual, copy e contraste, em `docs/`. O briefing original está no repositório mnkk (`QUIZ_PRE_QUALIFICACAO_PROMPT.md`).

## Rodar no computador

```
node quiz/testes/servidor.mjs
```

Abra `http://127.0.0.1:4400` (serve `public/quiz/` na raiz; no ar ele fica em `/quiz/`, e os caminhos são relativos, então funciona nos dois). Com `?debug=1`, aparece o painel de ensaio (estado, caminho, pontuação, eventos e o payload).

## Testes

Chrome local controlado por CDP (Chrome em `C:/Program Files/Google/Chrome/Application/chrome.exe`, ou a variável `CHROME`). Um teste por vez: dois Chrome em paralelo derrubam a suíte. Rode da raiz do `vide-match`.

```
node quiz/testes/roda-tudo.mjs                       a suíte local (uns 20 minutos)
node quiz/testes/roda-tudo.mjs --fontes              mais os links das provas (internet)
node quiz/testes/roda-tudo.mjs --publicacao <site>   mais o quiz no ar (endereço do SITE, sem /quiz)
```

O `teste-dados.mjs` confere a ficha contra as regras do Painel do Closer, que mora no repositório mnkk (`apresentacoes/jogador-de-elite-closer/api/_base.js`). A variável `PAINEL_BASE` aponta pro arquivo; sem ela, usa o endereço padrão desta máquina, e sem o painel o teste avisa e confere só o schema.

| Teste | O que confere |
| --- | --- |
| `teste-pontuacao.mjs` | Os limites dos tiers (44, 45, 69, 70), a T12 (a chance) sem forçar o C, "ainda não sei", "quero entender", "hobby", o máximo (100 e 94) e a pontuação sem idade |
| `teste-dados.mjs` | O payload no schema e na regra de ficha do Painel do Closer, eventos sem dado de pessoa, a URL da landing, a fila (falha de rede e tempo limite, sem duplicar) e o modo de ensaio |
| `teste-regras-da-casa.mjs` | Travessão em qualquer arquivo, o topo da capa no `index.html` igual à copy, palavras proibidas, ressalva, preço, títulos com até 9 palavras, os números da T08 com o universo e cada fato ligado a uma prova com fonte (com as 4 telas opcionais ligadas) |
| `teste-caminhos.mjs` | Os 12 caminhos do aceite, ponta a ponta, com a sequência de telas, o payload e a varredura de texto e de eventos; o caminho 1 toca a cada 3 s e ouve o áudio inteiro; os caminhos 13 e 14 são de quem volta pela capa (seguir de onde parou e recomeçar) |
| `teste-acessibilidade.mjs` | O quiz inteiro só no teclado, foco visível e em ordem, foco no título, espelhos anunciados, alvos de 44 px, 320 px e zoom de 200%, reduzir movimento e o contraste |
| `teste-audio.mjs` | Os 5 estados do áudio com evento e pontuação, seek, velocidade, `play()` recusado, arquivo ausente e o Continuar em 8 s |
| `teste-quer.mjs` | A T11 sem segurar: um toque e a T12 abre (sim, receio e ainda não sei), com a mesma pontuação de antes, e o estado gravado no formato antigo |
| `teste-posicoes.mjs` | As 11 posições tocadas no campo da T01: cada uma lê a conversa do atleta dela na T07 (nome, cartão, o que o clube procura e a conta do Fernando) |
| `teste-consentimento.mjs` | Nenhuma tag antes da idade nem pra menor, a folha só pra adulto e com ID, botões iguais, rejeitar e aceitar |
| `teste-desempenho.mjs` | Com 4G lento e CPU 4 vezes mais lenta, em HTTP/2: carga, LCP e CLS (mediana de 3 visitas), JavaScript comprimido e nenhum terceiro; a capa antes do JavaScript, sem piscar pra quem volta no meio e sem pular quando a T01 monta |
| `teste-aparelhos.mjs` | As telas em 360, 390, 412, 768 e 1440 px (capturas em `capturas/`) e o navegador do Instagram (Android e iOS) |
| `teste-fontes.mjs` | Cada link do `provas.json` (o que não abre vira aviso) |
| `teste-publicacao.mjs <url>` | A prévia no ar: 200, noindex, MP3, arquivos idênticos aos locais, robots.txt e capturas da T01 e da T14 |

`node quiz/testes/telas.mjs [largura] [altura] [pasta]` tira as capturas de uma largura só (padrão em `quiz/capturas/<largura>/`).

## Configurar e publicar

Endpoint do lead, landing, pixel e telas opcionais: `public/quiz/config/geral.json`, explicado em `docs/integracao.md` (que inclui um webhook pronto pra planilha do Google). Ao ligar o `endpoint`, o domínio dele entra no `connect-src` do CSP do `vercel.json` do site. Publicar: ver "Publicar" em `docs/integracao.md` (branch, push, prévia, PR e merge).

## Ferramentas

- `ferramentas/gera-waveform.py`: a onda do áudio (48 barras) e a versão de 64 kbps (`uv run --python 3.12 --no-project --with soundfile --with numpy --with imageio-ffmpeg python -I quiz/ferramentas/gera-waveform.py`).
- `ferramentas/escudos.py`: copia os escudos do deck R2 (repositório mnkk, variável ESCUDOS_ORIGEM) pro quiz em 96 por 96 (`uv run --python 3.12 --no-project --with pillow python -I quiz/ferramentas/escudos.py`).
- `ferramentas/contraste.mjs`: mede os pares de cor e reescreve `docs/contraste.md`.
