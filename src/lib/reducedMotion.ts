/**
 * Preferência "reduzir movimento" do sistema. Vive num arquivo próprio porque
 * antes ficava em `hooks/useScrollAnimations`, que importa GSAP, ScrollTrigger e
 * Lenis: quem só queria ler esta preferência (VOXEN, central de administração,
 * telas de entrada) baixava mais de 50 KB de bibliotecas de animação do site.
 */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
