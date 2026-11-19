// Leitura dos toques no link de pagamento do WhatsApp (contados em /ir/pag/<ramo>).
// GET /api/cliques?dias=3  → totais por dia, ramo e forma (pix/cartao/link). GET /api/cliques?c=<chat> → se aquele chat tocou.
export async function onRequestGet({ request, env }) {
  const h = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  if (!env.ACESSOS) return new Response(JSON.stringify({ ok: false }), { status: 503, headers: h });
  const u = new URL(request.url);
  const c = (u.searchParams.get('c') || '').replace(/[^0-9]/g, '');
  if (c) {
    const r = await env.ACESSOS.get('clkchat:' + c, 'json');
    return new Response(JSON.stringify({ ok: true, chat: c, tocou: !!r, ...(r || {}) }), { headers: h });
  }
  const dias = Math.min(Number(u.searchParams.get('dias')) || 3, 30);
  const out = {};
  for (let i = 0; i < dias; i++) {
    const dia = new Date(Date.now() - 3 * 3600 * 1000 - i * 86400000).toISOString().slice(0, 10);
    const lst = await env.ACESSOS.list({ prefix: 'clk:' + dia + ':' });
    for (const k of lst.keys) out[k.name.slice(4)] = Number(await env.ACESSOS.get(k.name)) || 0;
  }
  return new Response(JSON.stringify({ ok: true, cliques: out }), { headers: h });
}
