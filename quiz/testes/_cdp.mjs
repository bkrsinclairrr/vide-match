// Ajudante de Chrome DevTools Protocol pros testes do quiz (Chrome sem janela, perfil temporário, uma aba). Sem npm.
// Mesmo padrão do painel (apresentacoes/jogador-de-elite-closer/testes/_cdp.mjs), com toque, rede, aparelho e script antes da página.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const espera = ms => new Promise(r => setTimeout(r, ms));
export const UA = {
  instagramAndroid: 'Mozilla/5.0 (Linux; Android 13; SM-A346M Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36 Instagram 352.0.0.33.94 Android (33/13; 450dpi; 1080x2340; samsung; SM-A346M; a34x; mt6877; pt_BR; 650361640)',
  instagramIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 352.0.0.20.85 (iPhone14,7; iOS 17_6; pt_BR; pt; scale=3.00; 1170x2532; 650000000)',
  android: 'Mozilla/5.0 (Linux; Android 13; SM-A346M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36'
};

export async function abreChrome({ largura = 390, altura = 844, movel = true, ua = UA.android, escala = 1, reduz = false, antes = null, extras = [] } = {}) {
  const perfil = mkdtempSync(path.join(os.tmpdir(), 'quiz-cdp-'));
  const porta = 9300 + Math.floor(Math.random() * 600);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, `--window-size=${largura},${altura}`,
    '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', '--mute-audio', ...extras, 'about:blank'], { stdio: 'ignore' });
  let wsUrl;
  for (let i = 0; i < 200 && !wsUrl; i++) {
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find(a => a.type === 'page').webSocketDebuggerUrl; } catch { await espera(100); }
  }
  if (!wsUrl) { proc.kill(); throw new Error('Chrome não abriu'); }
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let seq = 0; const pend = new Map(); const ouvintes = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { ok, erro } = pend.get(m.id); pend.delete(m.id); m.error ? erro(new Error(JSON.stringify(m.error))) : ok(m.result); }
    else if (m.method) ouvintes.forEach(f => f(m));
  });
  // toda chamada tem prazo: um teste que trava calado é pior que um teste que falha
  const envia = (method, params = {}, ms = 30000) => new Promise((ok, erro) => {
    const id = ++seq;
    const t = setTimeout(() => { pend.delete(id); erro(new Error('CDP sem resposta em ' + ms + ' ms: ' + method)); }, ms);
    pend.set(id, { ok: v => { clearTimeout(t); ok(v); }, erro: e => { clearTimeout(t); erro(e); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await envia('Page.enable'); await envia('Runtime.enable'); await envia('DOM.enable'); await envia('Network.enable');
  await envia('Emulation.setDeviceMetricsOverride', { width: largura, height: altura, deviceScaleFactor: escala, mobile: movel });
  if (movel) await envia('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (ua) await envia('Emulation.setUserAgentOverride', { userAgent: ua, acceptLanguage: 'pt-BR' });
  if (reduz) await envia('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (antes) await envia('Page.addScriptToEvaluateOnNewDocument', { source: antes });

  const pedidos = [];
  const console_ = [];
  ouvintes.push(m => {
    if (m.method === 'Network.requestWillBeSent') pedidos.push({ url: m.params.request.url, metodo: m.params.request.method, tipo: m.params.type, corpo: m.params.request.postData || null });
    if (m.method === 'Runtime.exceptionThrown') console_.push('EXC ' + ((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) console_.push(m.params.type.toUpperCase() + ' ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  });

  const avalia = async (expr) => {
    const r = await envia('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error('JS: ' + ((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text));
    return r.result.value;
  };
  const vai = async (url) => { await envia('Page.navigate', { url }); await espera(300); };
  const ate = async (expr, ms = 15000, passo = 80) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await avalia(expr)) return true; } catch { /* carregando */ } await espera(passo); } return false; };
  // toque de verdade (eventos de toque do CDP) no centro do elemento
  const centro = async (sel) => avalia(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; })()`);
  // o alvo parado: mede até duas leituras seguidas iguais (folha subindo, carrossel andando), no máximo 1,5 s
  const parado = async (sel) => {
    let c = await centro(sel);
    if (!c) throw new Error('não achei ' + sel);
    for (let i = 0; i < 20; i++) {
      await espera(60);
      const d = await centro(sel);
      if (!d) throw new Error('sumiu ' + sel);
      if (Math.abs(d.x - c.x) < 0.5 && Math.abs(d.y - c.y) < 0.5) return d;
      c = d;
    }
    return c;
  };
  const toca = async (sel, { segura = 0 } = {}) => {
    const c = await parado(sel);
    await envia('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y, id: 1 }] });
    if (segura) await espera(segura);
    await envia('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return c;
  };
  const clica = async (sel, { segura = 0 } = {}) => {
    const c = await parado(sel);
    await envia('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x, y: c.y });
    await envia('Input.dispatchMouseEvent', { type: 'mousePressed', x: c.x, y: c.y, button: 'left', buttons: 1, clickCount: 1 });
    if (segura) await espera(segura);
    await envia('Input.dispatchMouseEvent', { type: 'mouseReleased', x: c.x, y: c.y, button: 'left', buttons: 0, clickCount: 1 });
    return c;
  };
  const tecla = async (key, code, vk) => {
    await envia('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code: code || key, windowsVirtualKeyCode: vk || 0 });
    if (key.length === 1) await envia('Input.dispatchKeyEvent', { type: 'char', key, text: key });
    await envia('Input.dispatchKeyEvent', { type: 'keyUp', key, code: code || key, windowsVirtualKeyCode: vk || 0 });
  };
  // teclado de verdade: o Enter e o Espaço levam o caractere (é o que ativa botão); Tab com Shift volta
  const TECLAS = { Enter: ['Enter', 13, String.fromCharCode(13)], ' ': ['Space', 32, ' '], Tab: ['Tab', 9], Escape: ['Escape', 27], ArrowDown: ['ArrowDown', 40], ArrowUp: ['ArrowUp', 38],
    ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39], End: ['End', 35], Home: ['Home', 36] };
  const aperta = async (key, { shift = false } = {}) => {
    const [code, vk, text] = TECLAS[key] || [key, 0];
    const modifiers = shift ? 8 : 0;
    await envia('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text, unmodifiedText: text, modifiers });
    await envia('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
  };
  const digita = async (texto) => { for (const ch of texto) { await envia('Input.insertText', { text: ch }); await espera(8); } };
  // só a tela do aparelho. Sem captureBeyondViewport: depois de várias capturas além da tela, o Chrome sem janela muda a janela
  // (844 vira 853) e para de processar toque (a caixa não marca, o toque seguinte fica sem resposta). Pra ver o resto, role e fotografe.
  const foto = async (arq) => {
    const r = await envia('Page.captureScreenshot', { format: 'png' });
    writeFileSync(arq, Buffer.from(r.data, 'base64'));
  };
  // rola até o fim e fotografa o que o atleta vê lá embaixo; volta pro topo. Devolve false se a tela cabe inteira.
  const fotoFim = async (arq) => {
    const rolou = await avalia(`(() => { const d = document.documentElement; if (d.scrollHeight - innerHeight < 8) return false; scrollTo(0, d.scrollHeight); return true; })()`);
    if (!rolou) return false;
    await espera(600);
    await foto(arq);
    await avalia('scrollTo(0, 0); true');
    await espera(250);
    return true;
  };
  // quantas abas existem (um link que abre outra aba tira o atleta do quiz)
  const abas = async () => { try { return (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).filter(a => a.type === 'page').length; } catch { return -1; } };
  const fecha = async () => { try { ws.close(); } catch { /* nada */ } proc.kill(); await espera(400); try { rmSync(perfil, { recursive: true, force: true }); } catch { /* nada */ } };
  return { envia, avalia, vai, ate, toca, clica, tecla, aperta, digita, foto, fotoFim, abas, fecha, centro, pedidos, console_, aoEvento: f => ouvintes.push(f) };
}

// contagem de verificações: OK / FALHA, e o código de saída no fim (mesmo padrão do painel)
export function verificador(titulo) {
  let falhas = 0, total = 0;
  const ok = (cond, txt) => { total++; console.log((cond ? 'OK    ' : 'FALHA ') + txt); if (!cond) falhas++; return !!cond; };
  const fim = () => { console.log('\n' + titulo + ': ' + (total - falhas) + ' de ' + total + ' verificações passaram.'); process.exitCode = falhas ? 1 : 0; return falhas; };
  return { ok, fim, get falhas() { return falhas; } };
}
