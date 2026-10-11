/** Geração e download de arquivos no navegador (CSV para planilha e JSON para cópia de segurança). */

/** Células que começam com = + - @ viram texto: planilhas as executariam como fórmula. */
function cell(v: unknown) {
  let s = v === null || v === undefined ? "" : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV com `;` (abre direto no Excel em português) e BOM para os acentos. */
export function toCsv<T>(rows: T[], columns: { label: string; value: (row: T) => unknown }[]) {
  const head = columns.map((c) => cell(c.label)).join(";")
  const body = rows.map((r) => columns.map((c) => cell(c.value(r))).join(";"))
  return "﻿" + [head, ...body].join("\r\n")
}

export function downloadFile(name: string, content: string, mime = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Data de hoje para nome de arquivo (2026-10-11). */
export const stamp = () => new Date().toISOString().slice(0, 10)
