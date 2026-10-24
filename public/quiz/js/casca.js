// Roda antes da primeira pintura (script clássico no head, fora dos módulos): quem volta no meio do quiz (recarregou num #/passo
// com progresso salvo) ou já enviou não vê o topo da capa piscar antes da tela dele. É a regra do motor (navegacao.js, inicia) e
// do estado (estado.js, temRetomada); com a retomada vencida, a capa só aparece quando a T01 monta, como era antes.
try {
  const s = JSON.parse(localStorage.getItem('qz:estado') || 'null');
  if (s && s.v === 1) {
    const r = s.respostas || {};
    const passo = /^#\/([\w-]+)/.exec(location.hash);
    const retoma = r.idade && r.idade !== 'menos12' && s.passo && s.passo !== 'posicao';
    if (s.enviado || (passo && passo[1] !== 'posicao' && retoma)) document.documentElement.classList.add('retoma');
  }
} catch { /* sem localStorage (o navegador do Instagram às vezes bloqueia): a capa aparece, como pra quem chega */ }
