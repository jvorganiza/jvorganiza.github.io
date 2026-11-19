// POST /api/pix — gera o Pix do Na Ponta do Lápis dentro da conversa do WhatsApp (caminho B, 19/11/2026).
// Quem chama é o bloco "Integração HTTP" do Leona, com o cabeçalho X-JV-Chave = PIX_LEONA_CHAVE.
// Corpo: { ramo, nome, email, telefone, chat, cpf? }  →  { ok, erro, codigo, valor, expira, pedido, link }
// Sempre 200 quando a chamada é legítima: o fluxo decide pelo campo "erro" (nenhum | email | cpf | ramo | telefone | cakto_*).
// A venda continua na Cakto (mesmo produto, mesma área de membros, mesmo aviso de compra em /api/cakto).
// Variáveis secretas na Cloudflare: CAKTO_CLIENT_ID, CAKTO_CLIENT_SECRET (chave da Cakto API, escopo payments) e PIX_LEONA_CHAVE.
// LGPD: e-mail e telefone só passam por aqui a caminho da Cakto; não são guardados.
import { json as jsonBase, sha256, igual } from './_comum.js';

// toda resposta traz os mesmos campos (vazios no erro), para o Leona poder mapear todos no teste
const VAZIO = { ok: false, erro: '', codigo: '', valor: '', expira: '', pedido: '', link: '' };
const json = (obj, status) => jsonBase({ ...VAZIO, ...obj }, status);

// oferta principal de R$ 27 de cada ramo (short_id da Cakto)
const OFERTAS = { trancista: '4dkmz5v', confeitaria: 'p2rxiny' };
const API = 'https://api.cakto.com.br/public_api';
const JANELA_MIN = 30; // dentro de 30 min, o mesmo pedido devolve o mesmo Pix (sem cobrança duplicada)

async function token(env) {
  const guardado = env.ACESSOS && (await env.ACESSOS.get('cakto:token'));
  if (guardado) return guardado;
  const r = await fetch(API + '/token/', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.CAKTO_CLIENT_ID, client_secret: env.CAKTO_CLIENT_SECRET }),
  });
  if (!r.ok) throw new Error('token ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  const ttl = Math.max(300, (Number(j.expires_in) || 3600) - 600);
  if (env.ACESSOS) await env.ACESSOS.put('cakto:token', j.access_token, { expirationTtl: ttl });
  return j.access_token;
}

const soDigitos = s => String(s || '').replace(/\D/g, '');
const horaBrasilia = iso => {
  const d = new Date(String(iso).replace(' ', 'T'));
  return isNaN(d) ? '' : d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
};
// CPF com dígitos verificadores certos
const cpfValido = c => {
  if (!/^\d{11}$/.test(c) || /^(\d){10}$/.test(c)) return false;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(c[n])) return false;
  }
  return true;
};
const reais = v => Number(v).toFixed(2).replace('.', ',');

export async function onRequestPost({ request, env }) {
  if (!env.CAKTO_CLIENT_ID || !env.CAKTO_CLIENT_SECRET || !env.PIX_LEONA_CHAVE) return json({ ok: false, erro: 'nao_configurado' }, 503);
  if (!igual(request.headers.get('x-jv-chave') || '', env.PIX_LEONA_CHAVE)) return json({ ok: false, erro: 'origem' }, 401);

  const cru = await request.text();
  if (cru.length > 2000) return json({ ok: false }, 413);
  let c; try { c = JSON.parse(cru); } catch (e) { return json({ ok: false, erro: 'json' }, 400); }

  // diagnóstico: só confere o token da Cakto, sem criar pedido
  if (c.diagnostico === true) {
    try { await env.ACESSOS.delete('cakto:token'); await token(env); return json({ ok: true, erro: 'nenhum', motivo: 'token_ok' }); }
    catch (e) { return json({ ok: false, erro: 'cakto_token', motivo: String(e.message).slice(0, 300) }); }
  }

  const ramo = String(c.ramo || '').toLowerCase().trim();
  const oferta = OFERTAS[ramo];
  // o e-mail pode vir no meio de uma frase ("meu email é ana@gmail.com")
  const email = ((String(c.email || '').match(/[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}/i) || [])[0] || '').toLowerCase();
  let tel = soDigitos(c.telefone);
  if (tel.length === 10 || tel.length === 11) tel = '55' + tel;
  const nome = String(c.nome || '').trim().slice(0, 80) || 'Cliente';
  if (!oferta) return json({ ok: false, erro: 'ramo' });
  if (!email) return json({ ok: false, erro: 'email' });
  if (tel.length < 12) return json({ ok: false, erro: 'telefone' });

  const cliente = { name: nome, email, phone: tel, fingerprint: 'jvwa_' + (await sha256('jv-fp:' + tel)).slice(0, 32) };
  // a Cakto exige CPF para Pix no Brasil (testado em 19/11)
  const cpf = soDigitos(c.cpf);
  if (!cpfValido(cpf)) return json({ ok: false, erro: 'cpf' });
  cliente.docType = 'cpf'; cliente.docNumber = cpf;

  const janela = Math.floor(Date.now() / (JANELA_MIN * 60000));
  // "Manda um código novo" soma 1 em tentativa no Leona → chave nova → Pix novo
  const tentativa = soDigitos(c.tentativa).slice(0, 4) || '0';
  const idem = await sha256(['jv-pix', tel, email, oferta, janela, tentativa].join('|'));
  const corpo = {
    paymentMethod: 'pix',
    customer: cliente,
    items: [{ offerId: oferta }],
    metadata: { utm_source: 'whatsapp', utm_medium: 'conversa', utm_campaign: 'pix-na-conversa', sck: soDigitos(c.chat).slice(0, 20) },
  };

  let r, j;
  try {
    const t = await token(env);
    const pede = tk => fetch(API + '/payments/', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + tk, 'content-type': 'application/json', 'x-idempotency-key': idem },
      body: JSON.stringify(corpo),
    });
    r = await pede(t);
    if (r.status === 401 && env.ACESSOS) { await env.ACESSOS.delete('cakto:token'); r = await pede(await token(env)); }
    j = await r.json().catch(() => ({}));
  } catch (e) {
    return json({ ok: false, erro: 'cakto_fora', motivo: String(e.message).slice(0, 300) });
  }
  if (!r.ok || !j.pix || !j.pix.qrCode) {
    const motivo = JSON.stringify(j).slice(0, 300);
    return json({ ok: false, erro: 'cakto_' + r.status, motivo });
  }
  return json({
    ok: true,
    erro: 'nenhum',
    codigo: j.pix.qrCode,
    valor: reais(j.amount),
    expira: horaBrasilia(j.pix.expirationDate),
    pedido: j.refId || j.id,
    link: j.checkoutUrl || '',
  });
}

export const onRequestGet = () => json({ ok: true, servico: 'pix na conversa' });
