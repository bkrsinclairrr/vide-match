import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { invalidReason, parseEvent, sanitizeEvent } from "../_shared/crm-context-parse.ts";
import { sha256Hex, verifySignature } from "../_shared/crm-bridge-signature.ts";

/**
 * Ponte CRM (wsltda.com) → VOXEN: recebe o contexto de um atleta e aplica pelo banco.
 * Contrato: PONTE_CRM_PARA_VOXEN.md (Parte A). Sem JWT (verify_jwt = false): quem prova a origem
 * é a assinatura HMAC com o segredo CRM_BRIDGE_SHARED_SECRET (só nos secrets dos dois projetos).
 *
 *   200 { ok, receipt_id, event_id, status }  applied | waiting_member | superseded | duplicate | quarantined
 *       (o prospect_context nunca volta quarantined: applied | superseded | duplicate)
 *   400 formato · 403 assinatura ou horário · 409 mesmo event_id com outro corpo · 413 tamanho
 *   500/503 erro do lado de cá: o CRM tenta de novo com o mesmo evento.
 *
 * A função só limpa (lista fechada de chaves), interpreta os textos e chama o banco:
 *   athlete_context  -> crm_context_receive(): idempotência, ordem das revisões, só preenche campo vazio
 *   prospect_context -> crm_prospect_receive(): pré-cadastro de lead do CRM que ainda não se cadastrou,
 *                       só para a equipe, sem criar atleta nem contato (contrato v1.2)
 */

const SOURCE_PROJECT = "mbzwchnxtskysqplqiyy";
const MAX_BYTES = 1024 * 1024;

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { ok: false, error: "Use POST." });

  const secret = Deno.env.get("CRM_BRIDGE_SHARED_SECRET");
  if (!secret) return reply(503, { ok: false, error: "A ponte ainda não foi configurada na VOXEN." });

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) return reply(413, { ok: false, error: "Corpo grande demais." });

  try {
    const body = new Uint8Array(await req.arrayBuffer());
    if (body.byteLength > MAX_BYTES) return reply(413, { ok: false, error: "Corpo grande demais." });

    const verdict = await verifySignature({
      secret,
      timestamp: req.headers.get("x-crm-timestamp") ?? "",
      signature: req.headers.get("x-crm-signature") ?? "",
      body,
    });
    if (verdict !== "ok") return reply(403, { ok: false, error: verdict === "stale" ? "Horário fora da janela de 5 minutos." : "Assinatura inválida." });

    let event: unknown;
    try {
      event = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
    } catch {
      return reply(400, { ok: false, error: "Corpo não é JSON válido em UTF-8." });
    }
    const invalid = invalidReason(event, SOURCE_PROJECT);
    if (invalid) return reply(400, { ok: false, error: invalid });

    const clean = sanitizeEvent(event as Record<string, unknown>);
    const parsed = parseEvent(clean);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const rpc = clean.kind === "prospect_context" ? "crm_prospect_receive" : "crm_context_receive";
    const { data, error } = await admin.rpc(rpc, { p_event: clean, p_parsed: parsed, p_sha: await sha256Hex(body) });
    if (error) {
      console.error(`${rpc} falhou`, error.code, error.message);
      return reply(500, { ok: false, error: "Erro ao aplicar. Tente de novo." });
    }
    const r = (data ?? {}) as { http?: number; status?: string; receipt_id?: string; event_id?: string; error?: string };
    if (r.http === 200) return reply(200, { ok: true, receipt_id: r.receipt_id ?? null, event_id: r.event_id ?? clean.event_id, status: r.status });
    return reply(r.http ?? 500, { ok: false, error: r.error ?? "Erro ao aplicar." });
  } catch (err) {
    console.error("crm-context-receiver", err instanceof Error ? err.message : String(err));
    return reply(500, { ok: false, error: "Erro interno. Tente de novo." });
  }
});
