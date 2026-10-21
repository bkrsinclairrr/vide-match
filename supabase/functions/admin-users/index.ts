import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Contas e acessos da VOXEN. Só a equipe chama:
 *   admin      todas as ações (listar, mudar acesso, convidar, editar nome, desativar, excluir)
 *   executive  só `list_users` (leitura)
 *   scout      nenhuma (a tela de contas não aparece para ele)
 * Atleta e Scout recebem 403. A confirmação do papel usa a service
 * role (ignora RLS); o token do chamador só serve para saber quem ele é.
 */

const allowedOrigin = Deno.env.get("APP_ORIGIN") ?? "https://aizyron.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};

type Level = "admin" | "executive" | "scout" | "user";
/** Do maior para o menor. */
const STAFF: Level[] = ["admin", "executive", "scout"];
const READ_ACTIONS = ["list_users"];
const WRITE_ACTIONS = ["set_role", "invite_staff", "create_staff", "update_user", "disable_user", "enable_user", "delete_user"];

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const levelOf = (roles: string[]): Level => STAFF.find((r) => roles.includes(r)) ?? "user";
const isEmail = (v: unknown): v is string => typeof v === "string" && v.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return reply(401, { error: "Sessão ausente." });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return reply(401, { error: "Sessão inválida." });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const rolesOf = async (id: string): Promise<string[]> => {
      const { data, error } = await adminClient.from("user_roles").select("role").eq("user_id", id);
      if (error) throw error;
      return (data ?? []).map((r) => String(r.role));
    };
    const adminCount = async () => {
      const { count, error } = await adminClient.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
      if (error) throw error;
      return count ?? 0;
    };
    const listAllUsers = async () => {
      const out = [];
      for (let page = 1; page <= 50; page++) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        out.push(...data.users);
        if (data.users.length < 1000) break;
      }
      return out;
    };

    const me = levelOf(await rolesOf(user.id));
    if (me === "user") return reply(403, { error: "Acesso restrito à equipe." });
    if (me === "scout") return reply(403, { error: "Contas e acessos é só de administradores e executivos." });

    if (Number(req.headers.get("content-length") ?? 0) > 10_000) return reply(413, { error: "Pedido grande demais." });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return reply(400, { error: "Pedido inválido." });
    }
    const action = String(body.action ?? "");
    const target = body.targetUserId;
    if (![...READ_ACTIONS, ...WRITE_ACTIONS].includes(action) || (target !== undefined && typeof target !== "string")) {
      return reply(400, { error: "Pedido inválido." });
    }
    if (WRITE_ACTIONS.includes(action) && me !== "admin") {
      return reply(403, { error: "Somente administradores podem alterar contas e acessos." });
    }

    /** Impede tirar de cena o último administrador (rebaixar, desativar ou excluir). */
    const guardLastAdmin = async (targetId: string, verb: string) => {
      const roles = await rolesOf(targetId);
      if (roles.includes("admin") && (await adminCount()) <= 1) {
        throw new HttpError(409, `Não é possível ${verb} o último administrador.`);
      }
    };

    /** Dá o nível de equipe à conta: entra o papel novo primeiro; só depois saem os outros de equipe. */
    const grantStaff = async (id: string, level: Level) => {
      const { error: upErr } = await adminClient.from("user_roles").upsert({ user_id: id, role: level }, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (upErr) throw upErr;
      const drop = STAFF.filter((r) => r !== level);
      const { error: delErr } = await adminClient.from("user_roles").delete().eq("user_id", id).in("role", drop);
      if (delErr) throw delErr;
    };

    switch (action) {
      case "list_users": {
        const users = await listAllUsers();
        const { data: allRoles, error } = await adminClient.from("user_roles").select("user_id, role");
        if (error) throw error;
        const byUser = new Map<string, string[]>();
        for (const r of allRoles ?? []) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), String(r.role)]);

        const list = users.map((u) => {
          const roles = byUser.get(u.id) ?? [];
          const bannedUntil = (u as { banned_until?: string | null }).banned_until ?? null;
          return {
            id: u.id,
            email: u.email ?? null,
            full_name: (u.user_metadata?.full_name as string | undefined) ?? "",
            avatar_url: (u.user_metadata?.avatar_url as string | undefined) ?? null,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at ?? null,
            confirmed: Boolean(u.email_confirmed_at),
            disabled: Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now()),
            provider: (u.app_metadata?.provider as string | undefined) ?? "email",
            roles,
            level: levelOf(roles),
          };
        });
        return reply(200, { users: list, me: { id: user.id, level: me } });
      }

      case "set_role": {
        const level = body.level as Level;
        if (typeof target !== "string" || ![...STAFF, "user"].includes(level)) throw new HttpError(400, "Pedido inválido.");
        if (target === user.id && level !== "admin") throw new HttpError(400, "Você não pode tirar o seu próprio acesso de administrador.");
        if (level !== "admin") await guardLastAdmin(target, "rebaixar");

        await grantStaff(target, level);
        return reply(200, { success: true, level });
      }

      case "invite_staff": {
        const level = body.level as Level;
        const email = isEmail(body.email) ? body.email.trim().toLowerCase() : null;
        const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
        if (!email || !STAFF.includes(level)) throw new HttpError(400, "Informe um e-mail válido e o nível de acesso.");

        const existing = (await listAllUsers()).find((u) => u.email?.toLowerCase() === email);
        let id = existing?.id;
        let invited = false;
        if (!id) {
          const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${allowedOrigin}/reset-password`, // o convidado define a senha aqui e depois cai na VOXEN
            data: fullName ? { full_name: fullName } : undefined,
          });
          if (error) throw new HttpError(400, "Não foi possível enviar o convite para este e-mail.");
          id = data.user.id;
          invited = true;
        }
        await grantStaff(id, level);
        return reply(200, { success: true, invited, userId: id });
      }

      // Cria a conta já pronta para entrar (e-mail confirmado, senha definida por quem cria).
      // A senha só passa por aqui: não é gravada em lugar nenhum nem aparece nos logs.
      case "create_staff": {
        const level = body.level as Level;
        const email = isEmail(body.email) ? body.email.trim().toLowerCase() : null;
        const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
        const password = typeof body.password === "string" ? body.password : "";
        if (!email || !STAFF.includes(level)) throw new HttpError(400, "Informe um e-mail válido e o nível de acesso.");

        const existing = (await listAllUsers()).find((u) => u.email?.toLowerCase() === email);
        let id = existing?.id;
        let created = false;
        if (!id) {
          if (password.length < 8 || password.length > 72) throw new HttpError(400, "A senha precisa ter de 8 a 72 caracteres.");
          const { data, error } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: fullName ? { full_name: fullName } : undefined,
          });
          if (error || !data.user) {
            throw new HttpError(400, /password|senha/i.test(error?.message ?? "")
              ? "O Supabase recusou esta senha por ser fraca. Use uma mais longa, com letras, números e símbolos."
              : "Não foi possível criar a conta com este e-mail.");
          }
          id = data.user.id;
          created = true;
        }
        // Quem já tinha conta (atleta, por exemplo) só ganha o nível: a senha dela não muda.
        await grantStaff(id, level);
        return reply(200, { success: true, created, userId: id });
      }

      case "update_user": {
        const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
        if (typeof target !== "string" || fullName.length < 2 || fullName.length > 120) throw new HttpError(400, "Informe um nome de 2 a 120 caracteres.");
        const { data: current, error: getErr } = await adminClient.auth.admin.getUserById(target);
        if (getErr || !current.user) throw new HttpError(404, "Conta não encontrada.");
        const { error } = await adminClient.auth.admin.updateUserById(target, { user_metadata: { ...current.user.user_metadata, full_name: fullName } });
        if (error) throw error;
        await adminClient.from("profiles").update({ full_name: fullName, updated_at: new Date().toISOString() }).eq("id", target);
        return reply(200, { success: true });
      }

      case "disable_user": {
        if (typeof target !== "string") throw new HttpError(400, "Pedido inválido.");
        if (target === user.id) throw new HttpError(400, "Você não pode desativar a sua própria conta.");
        await guardLastAdmin(target, "desativar");
        const { error } = await adminClient.auth.admin.updateUserById(target, { ban_duration: "876000h" });
        if (error) throw error;
        return reply(200, { success: true });
      }

      case "enable_user": {
        if (typeof target !== "string") throw new HttpError(400, "Pedido inválido.");
        const { error } = await adminClient.auth.admin.updateUserById(target, { ban_duration: "none" });
        if (error) throw error;
        return reply(200, { success: true });
      }

      case "delete_user": {
        if (typeof target !== "string") throw new HttpError(400, "Pedido inválido.");
        if (target === user.id) throw new HttpError(400, "Você não pode excluir a sua própria conta.");
        await guardLastAdmin(target, "excluir");
        const { error } = await adminClient.auth.admin.deleteUser(target);
        if (error) throw error;
        return reply(200, { success: true });
      }
    }
    return reply(400, { error: "Pedido inválido." });
  } catch (err) {
    if (err instanceof HttpError) return reply(err.status, { error: err.message });
    console.error("admin-users request failed", err);
    return reply(500, { error: "Erro interno. Tente de novo em instantes." });
  }
});
