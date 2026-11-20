// /t/<id> — link do teste grátis de 1 dia que o fluxo do Leona manda no WhatsApp (20/11/2026).
// <id> = número do contato no Leona ({customer.id}), não é telefone. Ao tocar no link, o teste de 24 h
// é criado (ou reaproveitado: um teste por contato) e a pessoa vai direto para o app com ?teste=<token>.
import { sha256 } from '../api/_comum.js';
import { DURACAO, linkTeste } from '../api/teste.js';

const NICHO = 'trancista';

function novoToken() {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789', a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map(b => abc[b % 36]).join('');
}

export async function onRequestGet({ params, env }) {
  const bruto = String(params.id || '');
  if (env.ACESSOS && bruto === 'w') {
    // link único do WhatsApp: cada aparelho que abre ganha um teste novo; o app não deixa o mesmo aparelho renovar
    const token = novoToken(), agora = Date.now();
    await env.ACESSOS.put('t:' + NICHO + ':' + token, JSON.stringify({ ate: new Date(agora + DURACAO).toISOString(), chat: 'w', nome: '', em: new Date(agora).toISOString(), origem: 'whatsapp' }));
    return Response.redirect(linkTeste(NICHO, token), 302);
  }
  const id = bruto.replace(/\D/g, '').slice(0, 20);
  if (!env.ACESSOS || !id) return Response.redirect('https://jvorganiza.com.br/na-ponta-do-lapis/trancista/teste/', 302);
  const chatId = 'l' + (await sha256('jv-teste-leona:' + id)).slice(0, 24);
  const kc = 'tc:' + NICHO + ':' + chatId;
  let token = await env.ACESSOS.get(kc);
  if (!token || !/^[a-z0-9]{16}$/.test(token)) {
    token = novoToken();
    const agora = Date.now();
    const reg = { ate: new Date(agora + DURACAO).toISOString(), chat: chatId, nome: '', em: new Date(agora).toISOString(), origem: 'whatsapp' };
    await env.ACESSOS.put('t:' + NICHO + ':' + token, JSON.stringify(reg));
    await env.ACESSOS.put(kc, token);
  }
  return Response.redirect(linkTeste(NICHO, token), 302);
}
