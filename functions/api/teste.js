// /api/teste — teste grátis de 1 dia do Na Ponta do Lápis (20/11/2026, pedido do João).
// O teste chega pelo WhatsApp: a lead manda a mensagem pronta e o fluxo do Leona chama este endereço
// (bloco de requisição HTTP) para pegar o link do teste e mandar na conversa.
//
// POST { produto:'trancista', chat:'<id do chat do Leona, só números>', nome?:'<primeiro nome>' }
//   → { ok:true, link, ate, novo }   (o mesmo chat sempre recebe o mesmo link: um teste por conversa)
//   Se a variável secreta TESTE_LEONA_CHAVE existir, o pedido precisa do cabeçalho X-JV-Chave igual a ela.
// GET ?resumo=1              → só contagens (testes hoje, ativos, abriram, total), sem dados pessoais.
// GET ?lista=1&chave=X       → lista [{ chat, nome, em, ate, abriu }] só se X = TESTE_CHAVE (se a variável não existir: 403).
//
// Chaves no KV ACESSOS:
//   't:<nicho>:<token>'  = { ate, chat, nome, em }   (o app entra com o token; vale até "ate")
//   'tc:<nicho>:<chat>'  = token                        (para não dar dois testes ao mesmo chat)
//   'u:<nicho>:t:<token>' = uso do app (gravado pelo /api/entrar e pelo /api/uso)
import { json, sha256, igual } from './_comum.js';

export const TESTE_NICHOS = ['trancista'];
export const DURACAO = 24 * 3600 * 1000;
const LIMITE = 300; // pedidos por hora, por endereço de rede (o Leona chama sempre do mesmo endereço)

async function freio(request, env, tipo, limite) {
  const ip = request.headers.get('cf-connecting-ip') || '0', hora = new Date().toISOString().slice(0, 13);
  const kr = 'r' + tipo + ':' + (await sha256('jv-npl-ip:' + ip)).slice(0, 24) + ':' + hora;
  const n = Number(await env.ACESSOS.get(kr)) || 0;
  if (n >= limite) return true;
  await env.ACESSOS.put(kr, String(n + 1), { expirationTtl: 3700 });
  return false;
}

function novoToken() {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789', a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map(b => abc[b % 36]).join('');
}

export const linkTeste = (nicho, token) => 'https://jvorganiza.com.br/na-ponta-do-lapis/' + nicho + '/app/?teste=' + token;

export async function onRequestPost({ request, env }) {
  if (!env.ACESSOS) return json({ ok: false, motivo: 'nao_configurado' }, 503);
  if (env.TESTE_LEONA_CHAVE && !igual(request.headers.get('x-jv-chave') || '', env.TESTE_LEONA_CHAVE)) return json({ ok: false, motivo: 'origem' }, 401);
  const cru = await request.text();
  if (cru.length > 2000) return json({ ok: false }, 413);
  let c; try { c = JSON.parse(cru); } catch (e) { return json({ ok: false, motivo: 'json' }, 400); }
  const nicho = String(c.produto || '');
  if (!TESTE_NICHOS.includes(nicho)) return json({ ok: false, motivo: 'produto' }, 400);
  const chat = String(c.chat == null ? '' : c.chat).trim();
  if (!/^\d{1,30}$/.test(chat)) return json({ ok: false, motivo: 'chat' }, 400);
  // 20/11: o Leona manda o telefone da conversa; guardamos só um resumo dele (nunca o número)
  const chatId = chat.length >= 10 ? 'h' + (await sha256('jv-teste-chat:' + chat)).slice(0, 24) : chat;
  // só o primeiro nome, sem sinais que possam virar código
  const nome = String(c.nome || '').replace(/[<>"'`\\\u0000-\u001f]/g, '').trim().split(/\s+/)[0].slice(0, 40);
  if (await freio(request, env, 't', LIMITE)) return json({ ok: false, motivo: 'muitas_tentativas' }, 429);

  const kc = 'tc:' + nicho + ':' + chatId;
  const ja = await env.ACESSOS.get(kc);
  if (ja && /^[a-z0-9]{16}$/.test(ja)) {
    const t = (await env.ACESSOS.get('t:' + nicho + ':' + ja, 'json')) || {};
    return json({ ok: true, link: linkTeste(nicho, ja), ate: t.ate || null, novo: false, vencido: !!(t.ate && Date.now() >= Date.parse(t.ate)) });
  }
  const token = novoToken(), agora = Date.now();
  const reg = { ate: new Date(agora + DURACAO).toISOString(), chat: chatId, nome, em: new Date(agora).toISOString() };
  await env.ACESSOS.put('t:' + nicho + ':' + token, JSON.stringify(reg));
  await env.ACESSOS.put(kc, token);
  return json({ ok: true, link: linkTeste(nicho, token), ate: reg.ate, novo: true });
}

async function todos(env, nicho) {
  const out = []; let cursor;
  do {
    const lst = await env.ACESSOS.list({ prefix: 't:' + nicho + ':', cursor });
    for (const k of lst.keys) {
      const t = await env.ACESSOS.get(k.name, 'json'); if (!t) continue;
      out.push({ token: k.name.slice(('t:' + nicho + ':').length), ...t });
    }
    cursor = lst.list_complete ? null : lst.cursor;
  } while (cursor);
  return out;
}

export async function onRequestGet({ request, env }) {
  if (!env.ACESSOS) return json({ ok: false }, 503);
  const q = new URL(request.url).searchParams, nicho = TESTE_NICHOS.includes(q.get('produto')) ? q.get('produto') : 'trancista';
  if (q.get('lista') === '1') {
    if (!env.TESTE_CHAVE || !igual(q.get('chave') || '', env.TESTE_CHAVE)) return json({ ok: false, motivo: 'proibido' }, 403);
    const lista = [];
    for (const t of await todos(env, nicho)) {
      const u = await env.ACESSOS.get('u:' + nicho + ':t:' + t.token, 'json');
      lista.push({ chat: t.chat, nome: t.nome, em: t.em, ate: t.ate, abriu: (u && u.entrou) || null });
    }
    lista.sort((a, b) => String(b.em).localeCompare(String(a.em)));
    return json({ ok: true, lista });
  }
  if (q.get('resumo') === '1') {
    if (await freio(request, env, 'tg', 120)) return json({ ok: false }, 429);
    const br = ms => new Date(ms - 3 * 3600 * 1000).toISOString().slice(0, 10), agora = Date.now(), hoje = br(agora);
    let total = 0, hojeN = 0, ativos = 0, abriram = 0;
    for (const t of await todos(env, nicho)) {
      total++;
      if (t.em && br(Date.parse(t.em)) === hoje) hojeN++;
      if (t.ate && agora < Date.parse(t.ate)) ativos++;
      const u = await env.ACESSOS.get('u:' + nicho + ':t:' + t.token, 'json');
      if (u && u.entrou) abriram++;
    }
    return json({ ok: true, testes_hoje: hojeN, ativos, abriram, total });
  }
  return json({ ok: true, servico: 'teste grátis de 1 dia' });
}
