/**
 * Imagens no navegador, antes de subir para o Storage: abrir o arquivo, recortar, reduzir e
 * comprimir em WebP (ou PNG/JPEG onde o navegador não gera WebP), e medir o que importa
 * (transparência, foto escura, cor dominante do escudo).
 *
 * Nada usa endereço blob:, que a CSP do site bloqueia em img-src: o arquivo vira bitmap
 * (createImageBitmap) e a pré-visualização é desenhada em <canvas> ou vira data:.
 */

export type Source = { bitmap: ImageBitmap | HTMLImageElement; width: number; height: number }

/** Abre a imagem escolhida (até 25 MB). */
export async function openImage(file: Blob): Promise<Source> {
  if (!/^image\//.test(file.type)) throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WebP).")
  if (file.size > 25 * 1024 * 1024) throw new Error("A imagem passa de 25 MB. Use uma menor.")
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions)
      return { bitmap, width: bitmap.width, height: bitmap.height }
    } catch {
      /* cai para o caminho com data: */
    }
  }
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error("Não foi possível ler a imagem."))
    r.readAsDataURL(file)
  })
  const img = new Image()
  img.decoding = "async"
  img.src = url
  await img.decode().catch(() => { throw new Error("Este arquivo não é uma imagem que o navegador consiga abrir.") })
  return { bitmap: img, width: img.naturalWidth, height: img.naturalHeight }
}

function canvasOf(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  const ctx = c.getContext("2d")
  if (!ctx) throw new Error("O navegador não conseguiu processar a imagem.")
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  return { c, ctx }
}

/** Amostra pequena da imagem para medir sem pesar. */
function sample(src: Source, max = 96) {
  const k = Math.min(1, max / Math.max(src.width, src.height))
  const { c, ctx } = canvasOf(src.width * k, src.height * k)
  ctx.drawImage(src.bitmap, 0, 0, c.width, c.height)
  return ctx.getImageData(0, 0, c.width, c.height).data
}

/** Tem fundo transparente (PNG/WebP já recortado)? Pelo menos 4% dos pixels quase invisíveis. */
export function hasTransparency(src: Source) {
  const d = sample(src)
  let clear = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] < 200) clear++
  return clear / (d.length / 4) > 0.04
}

/** Luminância média (0 a 1) da parte visível. Abaixo de ~0,22 a foto fica escura no palco. */
export function luminance(src: Source) {
  const d = sample(src)
  let sum = 0
  let n = 0
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue
    sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255
    n++
  }
  return n ? sum / n : 0.5
}

/** Cor dominante entre os pixels com cor de verdade (ignora branco, preto, cinza e transparente). */
export function dominantColor(src: Source): string | null {
  const d = sample(src, 64)
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b, a] = [d[i], d[i + 1], d[i + 2], d[i + 3]]
    if (a < 160) continue
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max < 40 || max - min < 40) continue
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`
    const k = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    k.n++
    k.r += r
    k.g += g
    k.b += b
    buckets.set(key, k)
  }
  const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0]
  if (!top) return null
  const hex = (v: number) => Math.round(v / top.n).toString(16).padStart(2, "0")
  return `#${hex(top.r)}${hex(top.g)}${hex(top.b)}`
}

/** Recorte: posição da imagem dentro da moldura (em pixels da moldura) e a escala. */
export type Crop = { scale: number; x: number; y: number }

/** Escala para cobrir (ou caber em) uma moldura de `fw`×`fh`. */
export const coverScale = (src: Source, fw: number, fh: number) => Math.max(fw / src.width, fh / src.height)
export const containScale = (src: Source, fw: number, fh: number) => Math.min(fw / src.width, fh / src.height)

/** Centraliza a imagem na moldura com a escala dada. */
export const centered = (src: Source, fw: number, fh: number, scale: number): Crop =>
  ({ scale, x: (fw - src.width * scale) / 2, y: (fh - src.height * scale) / 2 })

/** Prende o recorte para a imagem cobrir a moldura (quando ela é maior que a moldura). */
export function clampCrop(src: Source, fw: number, fh: number, crop: Crop): Crop {
  const w = src.width * crop.scale
  const h = src.height * crop.scale
  const x = w >= fw ? Math.min(0, Math.max(fw - w, crop.x)) : (fw - w) / 2
  const y = h >= fh ? Math.min(0, Math.max(fh - h, crop.y)) : Math.min(fh - h, Math.max(0, crop.y))
  return { ...crop, x, y }
}

/** Desenha o recorte num canvas do tamanho final (`ow`×`oh`), com a moldura de `fw`×`fh`. */
export function render(src: Source, fw: number, fh: number, crop: Crop, ow: number, oh: number, opaque: boolean) {
  const { c, ctx } = canvasOf(ow, oh)
  const k = ow / fw
  if (opaque) {
    ctx.fillStyle = "#0b0b0d"
    ctx.fillRect(0, 0, ow, oh)
  }
  ctx.drawImage(src.bitmap, crop.x * k, crop.y * k, src.width * crop.scale * k, src.height * crop.scale * k)
  return c
}

const toBlob = (c: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("Não foi possível gerar a imagem."))), type, quality))

/**
 * Comprime em WebP até caber em `maxBytes` (tentando qualidades menores). Onde o navegador não
 * gera WebP, usa PNG (com transparência) ou JPEG.
 */
export async function encode(c: HTMLCanvasElement, maxBytes: number, alpha: boolean): Promise<Blob> {
  let last: Blob | null = null
  for (const q of [0.88, 0.8, 0.72, 0.64, 0.56]) {
    const b = await toBlob(c, "image/webp", q)
    if (b.type !== "image/webp") break
    last = b
    if (b.size <= maxBytes) return b
  }
  if (last) return last
  if (alpha) return toBlob(c, "image/png")
  for (const q of [0.88, 0.8, 0.7]) {
    const b = await toBlob(c, "image/jpeg", q)
    if (b.size <= maxBytes || q === 0.7) return b
  }
  return toBlob(c, "image/jpeg", 0.7)
}

export const extOf = (blob: Blob) => (blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : "webp")

/** Pré-visualização leve (data:), aceita pela CSP. */
export const previewUrl = (c: HTMLCanvasElement) => {
  const webp = c.toDataURL("image/webp", 0.82)
  return webp.startsWith("data:image/webp") ? webp : c.toDataURL("image/png")
}

/** Escudo: quadrado de 256 px, inteiro (cabe sem cortar), com fundo transparente. */
export async function crestBlob(src: Source) {
  const size = 256
  const s = containScale(src, size * 0.92, size * 0.92)
  const c = render(src, size, size, centered(src, size, size, s), size, size, false)
  return { blob: await encode(c, 120 * 1024, true), color: dominantColor(src), preview: previewUrl(c) }
}
