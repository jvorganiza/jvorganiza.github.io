# Funções do site (Cloudflare Pages Functions)

- `api/cakto.js`: recebe o aviso de compra da Cakto (compra aprovada libera o e-mail; reembolso e contestação bloqueiam).
- `api/entrar.js`: a tela de entrada do Na Ponta do Lápis pergunta se o e-mail tem compra ativa.
- `api/_comum.js`: lista de produtos e funções de apoio.

Configuração no painel da Cloudflare (projeto jvorganiza → Configurações → Produção):
- Associação KV `ACESSOS` → banco `jv-acessos` (feito em 13/11/2026).
- Variável secreta `CAKTO_SECRET` = segredo do webhook criado na Cakto (quem cola é o João).

O e-mail da compradora não é guardado; fica só um resumo (SHA-256) dele.

Segredo CAKTO_SECRET colado pelo João em 13/11/2026 (noite).

## Pix na conversa (19/11/2026)
- `api/pix.js`: o bloco "Integração HTTP" do Leona chama este endereço e recebe o Pix copia e cola da Cakto, para mandar na conversa.
- Variáveis secretas necessárias: `CAKTO_CLIENT_ID` e `CAKTO_CLIENT_SECRET` (chave da Cakto API com escopo payments, criada pelo João) e `PIX_LEONA_CHAVE` (senha que o Leona manda no cabeçalho X-JV-Chave).
- Sem essas variáveis, o endereço responde "nao_configurado" e não cobra nada.

## Teste grátis de 1 dia (20/11/2026)
- `api/teste.js`: o fluxo do Leona (bloco de requisição HTTP) manda `{ produto: "trancista", chat, nome }` e recebe `{ ok, link, ate, novo }`. Um teste por chat (o mesmo chat recebe sempre o mesmo link).
- O app entra com `?teste=<token>`; o `api/entrar.js` aceita `{ produto, teste }` e o `api/uso.js` conta o uso em `u:trancista:t:<token>`.
- Variáveis opcionais: `TESTE_LEONA_CHAVE` (se existir, o Leona precisa mandar o cabeçalho X-JV-Chave igual) e `TESTE_CHAVE` (libera `GET /api/teste?lista=1&chave=...`). `GET /api/teste?resumo=1` mostra só contagens.
