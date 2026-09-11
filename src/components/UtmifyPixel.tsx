import { useEffect } from "react"
import { useLocation } from "react-router-dom"

import { captureUtmifyAttribution } from "@/lib/utmify"

const PIXEL_SCRIPT_ID = "utmify-pixel"
const UTMS_SCRIPT_ID = "utmify-utms"

type WindowWithUtmify = Window & { pixelId?: string }

const isEvaluationRoute = (pathname: string) =>
  pathname === "/avaliacao" || pathname.startsWith("/avaliacao/")

/** Carrega a Utmify somente na entrada e nas subrotas do funil de avaliação. */
export default function UtmifyPixel() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!isEvaluationRoute(pathname)) return

    const pixelId = import.meta.env.VITE_UTMIFY_PIXEL_ID?.trim()
    if (!pixelId) {
      console.warn("[Utmify] VITE_UTMIFY_PIXEL_ID não foi configurado; pixel não carregado.")
      return
    }

    let pixelScript: HTMLScriptElement | null = null
    let utmsScript: HTMLScriptElement | null = null

    try {
      captureUtmifyAttribution(window.location.search)

      // Impede duas instâncias simultâneas, inclusive durante remounts.
      if (document.getElementById(PIXEL_SCRIPT_ID) || document.getElementById(UTMS_SCRIPT_ID)) return

      ;(window as WindowWithUtmify).pixelId = pixelId

      pixelScript = document.createElement("script")
      pixelScript.id = PIXEL_SCRIPT_ID
      pixelScript.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js"
      pixelScript.async = true
      pixelScript.defer = true
      pixelScript.onerror = () => console.warn("[Utmify] O script do pixel não pôde ser carregado.")
      document.head.appendChild(pixelScript)

      utmsScript = document.createElement("script")
      utmsScript.id = UTMS_SCRIPT_ID
      utmsScript.src = "https://cdn.utmify.com.br/scripts/utms/latest.js"
      utmsScript.setAttribute("data-utmify-prevent-subids", "")
      utmsScript.async = true
      utmsScript.defer = true
      utmsScript.onerror = () => console.warn("[Utmify] O script de UTMs não pôde ser carregado.")
      document.head.appendChild(utmsScript)
    } catch (error) {
      pixelScript?.remove()
      utmsScript?.remove()
      console.warn("[Utmify] A avaliação continuará sem tracking nesta navegação.", error)
      return
    }

    return () => {
      try {
        pixelScript?.remove()
        utmsScript?.remove()

        const utmifyWindow = window as WindowWithUtmify
        if (utmifyWindow.pixelId === pixelId) delete utmifyWindow.pixelId
      } catch (error) {
        console.warn("[Utmify] Não foi possível limpar completamente os scripts.", error)
      }
    }
  }, [pathname])

  return null
}
