// POST /api/cakto — recebe o aviso (webhook) da Cakto a cada compra, reembolso ou contestação.
// Compra aprovada libera o e-mail; reembolso e contestação bloqueiam.
import { PRODUTOS, json, resumoEmail, hmac, igual } from './_comum.js';

const LIBERA = ['purchase_approved'];
const BLOQUEIA = ['refund', 'chargeback'];

export async function onRequestPost({ request, env }) {
  if (!env.ACESSOS || !env.CAKTO_SECRET) return json({ ok: false, erro: 'nao_configurado' }, 503);
  const cru = await request.text();
  if (cru.length > 60000) return json({ ok: false }, 413);
  let corpo; try { corpo = JSON.parse(cru); } catch (e) { return json({ ok: false, erro: 'json' }, 400); }

  // origem: assinatura no cabeçalho (v1=HMAC-SHA256 de "tempo.corpo") ou o segredo dentro do corpo
  let confere = false;
  const ass = (request.headers.get('x-cakto-signature') || '').replace(/^v1=/, ''), ts = request.headers.get('x-cakto-timestamp') || '';
  if (ass && ts && Math.abs(Date.now() / 1000 - Number(ts)) < 300) confere = igual(ass, await hmac(env.CAKTO_SECRET, ts + '.' + cru));
  if (!confere && corpo && typeof corpo.secret === 'string') confere = igual(corpo.secret, env.CAKTO_SECRET);
  if (!confere) return json({ ok: false, erro: 'origem' }, 401);

  const ev = String(corpo.event || ''), d = corpo.data || {};
  const nicho = PRODUTOS[(d.product || {}).id];
  const email = ((d.customer || {}).email || '').trim().toLowerCase();
  if (!nicho || !email || !(LIBERA.includes(ev) || BLOQUEIA.includes(ev))) return json({ ok: true, ignorado: true });

  const chave = 'a:' + nicho + ':' + await resumoEmail(email);
  await env.ACESSOS.put(chave, JSON.stringify({ s: LIBERA.includes(ev) ? 'ok' : 'x', ev, pedido: String(d.id || '').slice(0, 40), em: new Date().toISOString() }));
  return json({ ok: true });
}

export const onRequestGet = () => json({ ok: true, servico: 'aviso de compras' });
