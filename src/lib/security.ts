import { z } from "zod"

export const emailSchema = z.string().trim().email().max(254)
// 6 é o piso do próprio Supabase Auth (GoTrue) — ele rejeita qualquer coisa
// abaixo disso como "weak_password" antes mesmo de checar a conta.
export const passwordSchema = z.string().min(6).max(128)
export const nameSchema = z.string().trim().min(2).max(100)
const credentialsSchema = z.object({ email: emailSchema, password: passwordSchema })
export interface Credentials {
  email: string
  password: string
}

export function validateCredentials(email: string, password: string): Credentials | null {
  const result = credentialsSchema.safeParse({ email, password })
  return result.success ? { email: result.data.email, password: result.data.password } : null
}