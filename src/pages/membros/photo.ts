/**
 * Foto do perfil escolhida na área do atleta ou no onboarding. Não há Storage no projeto: a
 * imagem vira um quadrado de 256 px em JPEG (uns 15–40 KB) e vai embutida em `profiles.avatar_url`.
 * Fica num arquivo leve de propósito (o onboarding também usa).
 */
import { supabase } from "@/integrations/supabase/client"

/** Imagem embutida que a própria pessoa enviou (o que `saveOwnPhoto` grava). */
export const isPhotoData = (v: string) => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)

const MAX_FILE = 15 * 1024 * 1024
const MAX_DATA = 60_000

function open(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Não foi possível abrir essa imagem. Tente uma foto em JPG ou PNG."))
    img.src = url
  })
}

/** Recorta o centro (um pouco acima do meio, onde costuma estar o rosto) e reduz para `size` px. */
export async function squarePhoto(file: File, size = 256): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WebP).")
  if (file.size > MAX_FILE) throw new Error("A imagem passa de 15 MB. Escolha uma menor.")
  const url = URL.createObjectURL(file)
  try {
    const img = await open(url)
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (!w || !h) throw new Error("Essa imagem está vazia.")
    const side = Math.min(w, h)
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("O navegador não conseguiu preparar a foto.")
    ctx.imageSmoothingQuality = "high"
    ctx.fillStyle = "#0b0b0d"
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, (w - side) / 2, (h - side) * 0.3, side, side, 0, 0, size, size)
    let quality = 0.86
    let out = canvas.toDataURL("image/jpeg", quality)
    while (out.length > MAX_DATA && quality > 0.5) {
      quality -= 0.12
      out = canvas.toDataURL("image/jpeg", quality)
    }
    return out
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Grava a foto no próprio perfil. A RLS de `profiles` só deixa cada um mudar o seu. */
export async function saveOwnPhoto(userId: string, dataUrl: string) {
  if (!isPhotoData(dataUrl)) throw new Error("Formato de imagem não aceito.")
  if (dataUrl.length > 120_000) throw new Error("A foto ficou grande demais. Tente outra imagem.")
  const { data, error } = await supabase.from("profiles").update({ avatar_url: dataUrl, updated_at: new Date().toISOString() }).eq("id", userId).select("id")
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error("Não encontramos o seu perfil para salvar a foto. Fale com a equipe.")
}
