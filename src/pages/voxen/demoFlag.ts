/**
 * Demonstração da VOXEN com dados fictícios. Existe em dois lugares:
 *  - `npm run dev`, ligada com /voxen?demo;
 *  - no build separado `npm run build:voxen-demo` (vite.demo.config.ts), que
 *    define VITE_VOXEN_DEMO=1 e sobe como um projeto à parte na Vercel.
 * No build de produção do site, as duas condições são falsas e o gerador de
 * dados fictícios some do bundle.
 */
export const DEMO_ONLY = import.meta.env.VITE_VOXEN_DEMO === "1"

// ATENÇÃO: quem decide chamar o gerador de dados fictícios (store.tsx) escreve
// `import.meta.env.DEV || import.meta.env.VITE_VOXEN_DEMO === "1"` por extenso. Uma constante
// exportada daqui não é resolvida na compilação, e o gerador iria para o bundle do site.

/** O build de demonstração não tem o site: os atalhos apontam para o domínio real. */
export const SITE_BASE = DEMO_ONLY ? "https://aizyron.com" : ""
