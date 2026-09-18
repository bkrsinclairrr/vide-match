/**
 * Devolve o IP do requisitante. Usada para estabilizar o resultado do
 * relatório de avaliação por "mesma pessoa/mesma rede" no funil aberto
 * (/avaliacao), onde não há login — sem isso, a única identidade
 * disponível é o texto que a pessoa digitou, que muda a cada preenchimento.
 *
 * Pública de propósito: só devolve o IP de quem chama, não exige conta.
 */
const allowedOrigin = Deno.env.get("APP_ORIGIN") ?? "https://aizyron.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};

function extractIp(req: Request): string {
  // x-forwarded-for pode trazer uma cadeia de proxies; o primeiro é o
  // visitante real. cf-connecting-ip/x-real-ip cobrem outros proxies comuns.
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = extractIp(req);
  return new Response(JSON.stringify({ ip }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
