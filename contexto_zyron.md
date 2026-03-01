# Contexto do Projeto Zyron (Para a Nova IA - Claude 3.7+ Sonnet)

**Olá, IA sucessora!** Fui eu (Gemini 1.5 Pro) quem trabalhou neste projeto até o momento com o usuário. Este documento contém absolutamente tudo que você precisa saber para continuar o desenvolvimento exatamente de onde parei, mantendo o padrão de qualidade e as preferências estritas do usuário.

## 1. Visão Geral do Projeto
- **Nome:** Zyron
- **Objetivo:** Uma plataforma de gestão de atletas de futebol de ponta (nível *premium* e profissional). O foco principal é captar os dados de jogadores e conectá-los ao mercado.
- **Público-alvo principal atual:** Jogadores de futebol base e profissionais (grande foco inicial em **Brasília - DF** e região).
- **Stack Tecnológico:** React + TypeScript + Vite + Tailwind CSS + Shadcn UI + Radix UI + Lucide React + Supabase.

## 2. Padrões de Qualidade e Design Exigidos (MUITO IMPORTANTE)
- **Nível "Lovable-tier":** O usuário é extremamente exigente quanto ao design. Toda e qualquer tela deve ter qualidade altíssima, visual moderno, *glassmorphism*, gradientes sutis (ex: dourado premium que já usamos), bom espaçamento, tipografia legível e animações. **NUNCA** entregue um MVP feio ou cru.
- **UX Impecável:** Sempre preveja como o usuário irá interagir. Não faça formulários secos. Use ícones, separações lógicas e interações ricas.
- **Autonomia Total de Comandos:** O usuário **NÃO QUER** ter que confirmar comandos no terminal, *git push/commit*, ou aceitar edições. Ele me deu permissão total para rodar comandos `SafeToAutoRun` e modificar arquivos diretamente. **Faça tudo automaticamente** usando seus poderes agentic.

## 3. O Que Já Foi Feito / Alterado (Contexto Atual)
1. **Setup e Ajustes Iniciais:**
   - Dependências instaladas, Tailwind e Shadcn configurados.
   - Atualizado o copyright do footer em `Landing.tsx` para 2026.
2. **Página de Login (`Login.tsx` -> `src/pages/Login.tsx`):**
   - Destruímos o wrapper básico antigo dentro do `App.tsx`.
   - Movida e recriada uma página `/login` de luxo no React Router (split-screen, dark mode premium, formulário com abas de login/registro estruturado).
3. **Fluxo de Onboarding (`Onboarding.tsx`):**
   - **Campos Condicionais:** As estimativas de salários da "Base Nacional" e "Transição Profissional" agora só aparecem se o usuário escolher as categorias adequadas (ex: Sub 16, Sub 17, Sub 20).
   - **Remoção de Experiência:** O campo "Experiência" foi removido da etapa 5. No lugar, colocamos um Seletor de Estado (`playerData.state`).
4. **Autocomplete de Cidades e Integração IBGE (`ibgeApi.ts` & `city-autocomplete.tsx`):**
   - Refizemos totalmente a lógica de busca de cidades.
   - **Problema de Capitais resolvido:** O IBGE frequentemente falhava ou tinha rate limit. Implementamos um *fetch fallback* super robusto para um repositório GitHub (`felipefdl`) que contém os 5570+ municípios, para garantir que cidades do interior sempre carreguem.
   - **Integração do Distrito Federal (CRÍTICO):** O IBGE não trata as RAs do DF (Taguatinga, Brazlândia, Gama, Águas Claras, etc) como municípios. Criei um array fixo com as 37 RAs e **injetei globalmente** junto no resultado final para que elas sempre apareçam no autocomplete (o usuário necessita dessas opções perfeitas).
   - **Filtro por Estado (Última Ação):** Na etapa "Quase lá", a lista de 50 cidades sugeridas agora é **estritamente filtrada** pela sigla do `State` que o usuário escolheu no dropdown anterior (ex: Escolheu "Distrito Federal", a IA na API mapeia o estado correspondente e limita a resposta do autocomplete apenas a itens terminados em `- DF`). O campo cidade também se reseta ao mudar o Estado.
   - **Busca Smart:** Funciona ignorando acentos textuais.

## 4. Onde o Código Está
- O Git e GitHub do usuário (`bkrsinclairrr/vide-match`) **já estão 100% sincronizados** até o passo anterior. Tudo que está na branch `main` é a versão oficial de trabalho.
- Componentes chave para atentar: `src/App.tsx` (Router), `src/services/ibgeApi.ts` (Core da busca BR e DF), `src/pages/Onboarding.tsx` e `src/pages/Login.tsx`.

Vá em frente, traga todo o seu raciocínio (Thinking) e construa algo fenomenal com o usuário!
