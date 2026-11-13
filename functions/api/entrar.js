// POST /api/entrar — a tela de entrada do sistema pergunta se o e-mail (ou o resumo dele) tem compra ativa.
// Corpo: { produto: "trancista", email: "..." }  ou  { produto, h: "<resumo já guardado no aparelho>" }
import { NICHOS, json, resumoEmail, sha256 } from './_comum.js';

const LIMITE = 30; // tentativas por hora, por endereço de rede

export async function onRequestPost({ request, env }) {
  if (!env.ACESSOS) return json({ ok: false, motivo: 'nao_configurado' }, 503);
  const cru = await request.text();
  if (cru.length > 2000) return json({ ok: false }, 413);
  let c; try { c = JSON.parse(cru); } catch (e) { return json({ ok: false, motivo: 'json' }, 400); }
  const nicho = String(c.produto || '');
  if (!NICHOS.includes(nicho)) return json({ ok: false, motivo: 'produto' }, 400);

  // freio contra quem tenta adivinhar e-mails
  const ip = request.headers.get('cf-connecting-ip') || '0', hora = new Date().toISOString().slice(0, 13);
  const kr = 'r:' + (await sha256('jv-npl-ip:' + ip)).slice(0, 24) + ':' + hora;
  const n = Number(await env.ACESSOS.get(kr)) || 0;
  if (n >= LIMITE) return json({ ok: false, motivo: 'muitas_tentativas' }, 429);
  await env.ACESSOS.put(kr, String(n + 1), { expirationTtl: 3700 });

  let h = '';
  if (typeof c.h === 'string' && /^[0-9a-f]{64}$/.test(c.h)) h = c.h;
  else if (typeof c.email === 'string' && /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(c.email.trim())) h = await resumoEmail(c.email);
  else return json({ ok: false, motivo: 'email' }, 400);

  const reg = await env.ACESSOS.get('a:' + nicho + ':' + h, 'json');
  if (!reg) return json({ ok: false, motivo: 'nao_achou' });
  if (reg.s !== 'ok') return json({ ok: false, motivo: 'reembolso' });
  return json({ ok: true, h });
}
