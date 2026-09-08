# Security checklist

## Required deployment configuration

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel. Only the publishable/anon key may use the `VITE_` prefix. Never expose `SUPABASE_SERVICE_ROLE_KEY` to Vite or commit it.
- Set `APP_ORIGIN=https://www.aizyron.site` on the `admin-users` Edge Function. Keep the service-role key only in Supabase Edge Function secrets.
- Use Cloudflare Turnstile as the CAPTCHA provider. Configure its site key and secret key in Supabase Authentication > Protection; do not commit either value.
- Rate-limit policy targets: maximum 5 failed password logins per IP in 15 minutes, maximum 3 password-reset requests per account/IP per hour, and maximum 5 signups per IP per hour. Configure the closest supported Supabase Auth limits and monitor rejected requests.
- Keep Supabase Auth rate limits enabled. Do not implement rate limiting with local browser storage; it is bypassable.
- Require email confirmation, breached-password protection, and a strong minimum password in Supabase Auth settings. Supabase Auth hashes passwords server-side.
- Supabase hosted Auth manages its secure, HttpOnly session cookies for SSR. This Vite SPA uses `sessionStorage` to avoid persistent browser sessions; do not move tokens to `localStorage`.
- Keep database encryption at rest and TLS enabled in Supabase. For application-level encryption, use a server-side Edge Function and a secret stored in Supabase Vault; never put an encryption key in `VITE_*` variables.

## Data and uploads

- Apply `supabase/migrations/20260907000000_security_hardening.sql` before deploying the client. The file contains the complete SQL; it must appear in the Supabase migration history after deployment.
- Keep RLS enabled and test anonymous, cross-user, and admin access separately in Supabase SQL tests.
- Upload processing must enforce MIME, extension, byte-size, duration, and content checks again on the server/storage boundary. The browser validation is only an early rejection.
- Return only the fields required by each screen. Never expose service-role responses or raw database errors to clients.

## Edge Function secrets

`admin-users` requires the platform-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY` (or publishable key), and `SUPABASE_SERVICE_ROLE_KEY`, plus the explicit non-secret `APP_ORIGIN`. Keep `verify_jwt = true` in `supabase/config.toml` and retain the handler's admin-role check.

## Secret removal

The old access password was removed from the working tree. If it was ever committed to a remote repository, rotate it and rewrite Git history with an approved secret-removal procedure (for example `git filter-repo`), then force-push under repository-owner approval.

Run `npm audit` and review each finding before deployment; update lockfiles through the package manager rather than hand-editing them.