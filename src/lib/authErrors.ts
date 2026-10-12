/**
 * Mensagens de erro de login em português. Separado de `lib/funnel` para as
 * telas de entrada não carregarem o funil (validação, atribuição de anúncios…).
 */
export function friendlyAuthError(message: string | undefined): string {
  const m = (message || "").toLowerCase()

  if (m.includes("email rate limit exceeded") || m.includes("over_email_send_rate_limit")) {
    return "Muitos cadastros em pouco tempo. Espere alguns minutos e tente de novo."
  }
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) {
    return "Confirme seu cadastro para continuar. Toque em \"Já tenho conta\" e tente entrar novamente em instantes."
  }
  if (m.includes("already registered") || m.includes("user_already_exists")) {
    return "Este e-mail já tem uma conta. Toque em \"Já tenho conta\" para entrar — se você criou a conta pelo Google, use o botão \"Entrar com Google\" ou \"Esqueceu a senha?\" para definir uma senha."
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Se você criou a conta pelo Google, entre com o botão \"Entrar com Google\" ou toque em \"Esqueceu a senha?\"."
  }
  if (m.includes("password") && m.includes("character")) {
    return "A senha precisa ter pelo menos 6 caracteres."
  }

  return message || "Algo deu errado. Tente novamente em instantes."
}
