import { z } from "zod"

export const emailSchema = z.string().trim().email().max(254)
export const passwordSchema = z.string().min(12).max(128)
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