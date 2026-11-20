// Peças comuns das funções do Na Ponta do Lápis (Cloudflare Pages Functions).
// Ligações esperadas no projeto da Cloudflare: KV "ACESSOS" e a variável secreta "CAKTO_SECRET".
// LGPD: o e-mail nunca é guardado. Fica só o resumo (SHA-256) dele, que não permite recuperar o endereço.

// produto da Cakto → sistema que ele libera
export const PRODUTOS = { 'cb9d7036-778e-441b-a04c-b7257e62cba9': 'trancista', '2df01558-1d28-40e2-9bd5-db934f3933da': 'confeitaria' };
export const NICHOS = ['trancista', 'confeitaria'];
// produtos do Na Ponta do Lápis Completo (e do upgrade para ele): liberam o sistema E as telas do Completo
export const COMPLETOS = { 'b4c0b291-577d-42e4-b7e7-389493ef2d61': 'trancista', '504b20b8-a154-481e-9e2c-7d3054e19d4d': 'trancista', '33692ce0-4785-4596-ab65-dfedb2a7b767': 'confeitaria', '3135ce3e-43e5-463b-a8c9-ff074b0c0d8e': 'confeitaria' }; // Completo R$ 67 e Upgrade R$ 40

// cortesias (20/11, pedido do João): presente para cliente antiga em troca de depoimento.
// Chave = resumo SHA-256 do e-mail (resumoEmail), nunca o e-mail. Valor = lista de nichos com o Completo liberado.
export const CORTESIAS = {};

export const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
export const sha256 = async txt => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)));
export const resumoEmail = email => sha256('jv-npl-email:' + String(email).trim().toLowerCase());

export async function hmac(segredo, txt) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(txt)));
}

// comparação sem vazar pelo tempo de resposta
export function igual(a, b) {
  a = String(a); b = String(b); if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0;
}
