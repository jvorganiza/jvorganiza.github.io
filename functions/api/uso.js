// /api/uso — o que a compradora faz no Na Ponta do Lápis (17/11/2026, pedido do João: "monitorar todas as ações possíveis delas").
// POST { produto, h, ev }  → conta a ação (só de quem tem compra; o "h" é o resumo do e-mail que o app já guarda).
// POST { produto, d, ev }  → 20/11: quem entrou pelo link com código não tem e-mail; o app manda um número sorteado do aparelho ("d").
// GET  ?produto=&h=        → { comprou, situacao, primeiro, ultimo, acoes } para o vigia saber quem não entrou ou travou.
// GET  ?produto=&resumo=codigo → quantos aparelhos entraram pelo código, quantos abriram hoje e o total de cada ação.
// Nada do que ela digita é enviado: só o nome da ação e a hora.
import { NICHOS, CORTESIAS, json, sha256 } from './_comum.js';

export const ACOES = ['entrou', 'abriu', 'servico', 'venda', 'conta_fixa', 'meta', 'logo', 'tabela', 'promocao', 'mensagem', 'resumo'];
const LIMITE = 120; // pedidos por hora, por endereço de rede

async function freio(request, env, tipo) {
  const ip = request.headers.get('cf-connecting-ip') || '0', hora = new Date().toISOString().slice(0, 13);
  const kr = 'r' + tipo + ':' + (await sha256('jv-npl-ip:' + ip)).slice(0, 24) + ':' + hora;
  const n = Number(await env.ACESSOS.get(kr)) || 0;
  if (n >= LIMITE) return true;
  await env.ACESSOS.put(kr, String(n + 1), { expirationTtl: 3700 });
  return false;
}

export async function registra(env, nicho, h, ev) {
  const k = 'u:' + nicho + ':' + h, agora = new Date().toISOString();
  const u = (await env.ACESSOS.get(k, 'json')) || { primeiro: agora, acoes: {} };
  u.ultimo = agora;
  u.acoes[ev] = (u.acoes[ev] || 0) + 1;
  if ((ev === 'entrou' || h.startsWith('d:')) && !u.entrou) u.entrou = agora;
  await env.ACESSOS.put(k, JSON.stringify(u));
  return u;
}

export async function onRequestPost({ request, env }) {
  if (!env.ACESSOS) return json({ ok: false }, 503);
  const cru = await request.text();
  if (cru.length > 500) return json({ ok: false }, 413);
  let c; try { c = JSON.parse(cru); } catch (e) { return json({ ok: false }, 400); }
  const nicho = String(c.produto || ''), h = String(c.h || ''), d = String(c.d || ''), ev = String(c.ev || '');
  if (!NICHOS.includes(nicho) || !ACOES.includes(ev)) return json({ ok: false }, 400);
  if (!/^[0-9a-f]{64}$/.test(h) && !/^[0-9a-f]{64}$/.test(d)) return json({ ok: false }, 400);
  if (await freio(request, env, 'u')) return json({ ok: false }, 429);
  if (!/^[0-9a-f]{64}$/.test(h)) { await registra(env, nicho, 'd:' + d, ev); return json({ ok: true, codigo: true }); }
  const reg = (CORTESIAS[h] || []).includes(nicho) ? { s: 'ok' } : await env.ACESSOS.get('a:' + nicho + ':' + h, 'json');
  if (!reg) return json({ ok: true, ignorado: true });
  await registra(env, nicho, h, ev);
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!env.ACESSOS) return json({ ok: false }, 503);
  const q = new URL(request.url).searchParams, nicho = q.get('produto') || '', h = q.get('h') || '';
  if (NICHOS.includes(nicho) && q.get('resumo') === 'codigo') {
    if (await freio(request, env, 'g')) return json({ ok: false }, 429);
    const hoje = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10), acoes = {};
    let aparelhos = 0, hojeN = 0, cursor;
    do {
      const lst = await env.ACESSOS.list({ prefix: 'u:' + nicho + ':d:', cursor });
      for (const k of lst.keys) {
        const u = await env.ACESSOS.get(k.name, 'json'); if (!u) continue;
        aparelhos++;
        if (u.ultimo && new Date(Date.parse(u.ultimo) - 3 * 3600 * 1000).toISOString().slice(0, 10) === hoje) hojeN++;
        for (const [a, n] of Object.entries(u.acoes || {})) acoes[a] = (acoes[a] || 0) + n;
      }
      cursor = lst.list_complete ? null : lst.cursor;
    } while (cursor);
    return json({ ok: true, codigo: { aparelhos, abriram_hoje: hojeN, acoes } });
  }
  if (!NICHOS.includes(nicho) || !/^[0-9a-f]{64}$/.test(h)) return json({ ok: false }, 400);
  if (await freio(request, env, 'g')) return json({ ok: false }, 429);
  const reg = await env.ACESSOS.get('a:' + nicho + ':' + h, 'json');
  if (!reg) return json({ ok: true, comprou: false });
  const u = (await env.ACESSOS.get('u:' + nicho + ':' + h, 'json')) || {};
  return json({ ok: true, comprou: true, situacao: reg.s === 'ok' ? 'ativa' : 'bloqueada', compra: reg.em, entrou: u.entrou || null, ultimo: u.ultimo || null, acoes: u.acoes || {} });
}
