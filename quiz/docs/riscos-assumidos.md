# Riscos assumidos

Registro levantado em 23/10/2026, com fonte primária (seção `<conformidade>` do briefing). NÃO é parecer jurídico e NÃO bloqueia nada: o dono decidiu que o quiz fala como a casa fala. Fica aqui pra consulta e pro advogado dele. O que está marcado com (c) foi conferido também no texto oficial.

## O que o sistema faz sozinho, sem aviso na tela (lei, não preferência de texto)

1. **Nenhuma tag antes da idade, e nunca pra menor.** Nada de pixel, Utmify, API de conversões, público personalizado, semelhante, telefone com hash nem guarda de `fbclid` ou `gclid` antes de a T02 ser respondida. De 12 a 17, sem resposta ou em dúvida: nenhuma tag, nunca. Adulto: a folha de cookies aparece depois da idade, com "Aceitar" e "Rejeitar" do mesmo tamanho e peso; só depois do aceite as tags carregam. Base: Lei 15.211/2025 (ECA Digital), em vigor desde 17/03/2026 (art. 41-A) (c): art. 22, perfilamento pra publicidade a menor (c); art. 26, perfis comportamentais de menor (c); art. 13, dado de verificação de idade só pra essa finalidade (c); Decreto 12.880, art. 33 (c).
2. **A pontuação não usa idade.** O tier depende só das respostas de intenção.
3. **Dado de menor.** Menos de 18: nome e WhatsApp do responsável, com aceite registrado (texto, versão, data). Menos de 12: o quiz encerra.

## Riscos assumidos pelo dono (nada aqui muda o texto do quiz)

| Tema | O que a lei ou a regra diz | Onde aparece |
| --- | --- | --- |
| Resultado e renda | CDC arts. 36 parágrafo único, 37 §1º e 38 (c): o ônus da prova é de quem anuncia. CONAR art. 27 §§1º e 7º e art. 48. | T08: "Inicialmente R$ 30 mil+ por mês" (o "+" amplia a promessa), "cerca de 3 meses" e os 326. O dono guarda a base (lista, período, quem conta como "fechou"); a frase traz o universo: atletas nossos, acompanhados por nós. |
| Depoimento e áudio | CDC art. 37 §2º; CONAR arts. 24, 27 §9º, 37 e Anexo Q; Código Civil arts. 18 e 20; Constituição art. 5º X e XXVIII "a"; LGPD arts. 5º I e 8º. | T08 (os cinco depoimentos do site) e T10 (o áudio). Autorização escrita da mãe e dos depoentes (finalidade, mídias, prazo, território, remuneração, revogação). O "David" citado no áudio também. Desde 23/10/2026 a foto da mãe aparece na T10; o dono declarou ter todos os consentimentos. |
| Escudos e marcas de clube | LPI arts. 125, 126, 132 IV, 189 I, 195 III e IV e 209; Lei 9.615/98 art. 87; Lei 14.597/2023 arts. 168 e 170; lista de alto renome do INPI de 28/07/2026. A revisão de anúncio da Meta olha a página de destino. O levantamento recomendou só o nome em texto. | T06 (clubes da rede no radar) e T07 (clubes que escolhem com dados). `escudos.modo = "texto"` troca os da T07 por selo de texto. |
| Intermediação de atleta menor | Lei 9.615 art. 27-C VI (c); Lei 14.597 art. 95 (c); CBF, regulamento de intermediários, art. 24 (c); FIFA Football Agent Regulations art. 13 (c). | A voz do quiz ("encaminhamos", "conectamos"). É risco do produto, não só do texto. Não resolvido se a Lei Geral do Esporte derrogou o art. 27-C. |
| Pressão sobre adolescente | Decreto 12.880 art. 10, parágrafo único, II (c); CDC art. 39 IV (c). | O quiz não fabrica medo nem urgência e o áudio não vem com prazo nem preço. |
| Preço | CDC arts. 6º III, 31 e 37 §3º; CONAR art. 27 §§3º e 4º. | O quiz não fala de pagamento nem de preço (pedido do dono em 23/10/2026: nada de venda no quiz). O preço e o que está incluído ficam pra VSL e pra conversa. |
| Dado de menor | LGPD art. 14 §1º e Enunciado CD/ANPD nº 1/2023. | Contato do responsável (T13), com aceite registrado. O bloco "chame um responsável" da T02 saiu a pedido do dono em 23/10/2026 ("quem acessa sempre tem o consentimento"). |
| Anúncio | Meta Ad Standards e política de atributos pessoais. | Fora do quiz: sem "Você tem X anos?" no texto do anúncio. |

## Resultado da conferência final (23/10/2026)

**As duas regras do sistema passam nos testes.**
- Tags: `teste-consentimento.mjs`. Todo pedido a servidor de terceiro foi interceptado do começo ao fim: zero antes da idade; zero pra 12 a 17 e pra menos de 12, em momento nenhum, sem `fbclid`, `gclid` nem `sessaoId` no payload nem no aparelho; zero pro adulto antes de escolher e pro adulto que rejeitou (o quiz fecha inteiro); com o aceite, carregam o pixel da Meta e os dois scripts da Utmify, e só saem `Lead`, `QuizCompleto` e `CtaClick`, sem parâmetro. Sem ID configurado, não há folha.
- Pontuação sem idade: `teste-pontuacao.mjs` muda só a idade em 155 combinações de resposta e o total e o tier não mudam.

**Fatos sobre terceiros.** Todo cartão de fato na tela está ligado a um item do `provas.json` (atributo `data-prova`), e todo item de terceiro tem veículo, data e link (`teste-regras-da-casa.mjs`). Correções feitas nesta conferência:
- PEN-06: o DOI citado no briefing (`10.5016/s1980-6574e10240004`) não existe no doi.org nem na Crossref. Trocado por um estudo verificado sobre a mesma Copinha 2023 (RBFF, Moraes e Massa, 20/12/2024).
- REC-06 (Cambridge United): o veículo em português do print do dono não foi achado; o cartão cita o anúncio oficial do clube (29/07/2025).
- IA-06 (Midtjylland): a fonte é o Guardian (via PressReader, 26/10/2020); um link do Independent montado sem conferência foi descartado antes de entrar.
- Os títulos de matéria que não foram conferidos ficaram vazios (só veículo, data e link).
- MUN-01 e MUN-02 (T06): os números da FIFA (78.742 transferências internacionais em 2024; os clubes brasileiros lideraram em número de transferências, com 1.113 saídas) foram conferidos na página oficial, publicada em 30/01/2025. O "mais de 200 por dia" é a conta (78.742 dividido por 366).

**Links das fontes.** O teste de fontes abre cada link (primeiro por pedido simples; quem bloqueia robô ganha uma segunda tentativa no navegador). O resultado da última rodada está no relatório de entrega. Link que não abre vira aviso, não falha.

**Números da casa.** 326, inicialmente R$ 30 mil+ por mês e cerca de 3 meses aparecem com o universo dentro da frase ("atletas nossos", "acompanhados por nós"), como o dono decidiu. O dono responde pela prova.

## Não verificado

- O Enunciado CD/ANPD nº 1/2023 na página da ANPD e o guia de escopo de "acesso provável".
- O RNAF da CBF (a suspensão de janeiro de 2024 só por fontes secundárias).
- Se a Lei Geral do Esporte derrogou o art. 27-C da Lei 9.615.
- As marcas de cada clube no INPI e a jurisprudência.
- A política "Unrealistic Outcomes" da Meta (a página deu 404).
- O enquadramento do pixel como "perfilamento" (leitura do agente de pesquisa, confiança média).
- A transcrição do áudio (automática; as legendas ficam desligadas até o dono ouvir e aprovar).
- Aparelho real: o quiz foi testado em Chrome emulando celular e o navegador do Instagram, não em iPhone e Android de verdade.

## Fontes oficiais

Lei 15.211/2025 `planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm`; Decreto 12.880 `planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12880.htm`; ANPD sobre o ECA Digital `gov.br/anpd/pt-br/assuntos/eca-digital`; LGPD `planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm`; CDC `planalto.gov.br/ccivil_03/leis/l8078compilado.htm`; CONAR `conar.org.br/codigos?section=codigo`; LPI `planalto.gov.br/ccivil_03/leis/l9279.htm`; Lei Pelé `planalto.gov.br/ccivil_03/leis/l9615consol.htm`; Lei 14.597/2023 `planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14597.htm`; CBF RNI `intermediario.cbf.com.br/site/files/Regulamento_Intermediarios_CBF_2022.pdf`; FIFA Football Agent Regulations `digitalhub.fifa.com/m/1e7b741fa0fae779/original/FIFA-Football-Agent-Regulations.pdf`; Meta Ad Standards `transparency.meta.com/policies/ad-standards/`.
