// Link de pagamento contado (18/11, pedido do João): o WhatsApp manda jvorganiza.com.br/ir/pag/<ramo>?f=pix|cartao&c=<chat>
// Conta o toque no KV ACESSOS e leva direto ao checkout da Cakto. Não guarda nada da pessoa além do id do chat do Leona.
const CHECKOUT = {
  trancista: 'https://pay.cakto.com.br/4dkmz5v',
  confeitaria: 'https://pay.cakto.com.br/p2rxiny_1327720',
};

function hojeBR() {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function onRequestGet({ params, request, env }) {
  const ramo = String(params.ramo || '').toLowerCase();
  const destino = CHECKOUT[ramo];
  if (!destino) return Response.redirect('https://jvorganiza.com.br/', 302);
  const u = new URL(request.url);
  const f = (u.searchParams.get('f') || 'link').replace(/[^a-z]/g, '').slice(0, 12) || 'link';
  const c = (u.searchParams.get('c') || '').replace(/[^0-9]/g, '').slice(0, 12);
  try {
    if (env.ACESSOS) {
      const dia = hojeBR();
      const k = 'clk:' + dia + ':' + ramo + ':' + f;
      const n = Number(await env.ACESSOS.get(k)) || 0;
      await env.ACESSOS.put(k, String(n + 1), { expirationTtl: 60 * 60 * 24 * 60 });
      if (c) await env.ACESSOS.put('clkchat:' + c, JSON.stringify({ ramo, f, quando: new Date().toISOString() }), { expirationTtl: 60 * 60 * 24 * 30 });
    }
  } catch (e) { /* contar nunca pode travar o pagamento */ }
  const alvo = new URL(destino);
  alvo.searchParams.set('split', '1');
  alvo.searchParams.set('utm_source', 'whatsapp');
  alvo.searchParams.set('utm_medium', 'leona');
  alvo.searchParams.set('utm_campaign', 'npl-v16');
  alvo.searchParams.set('utm_content', f);
  return Response.redirect(alvo.toString(), 302);
}
