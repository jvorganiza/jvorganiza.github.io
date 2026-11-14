# Funções do site (Cloudflare Pages Functions)

- `api/cakto.js`: recebe o aviso de compra da Cakto (compra aprovada libera o e-mail; reembolso e contestação bloqueiam).
- `api/entrar.js`: a tela de entrada do Na Ponta do Lápis pergunta se o e-mail tem compra ativa.
- `api/_comum.js`: lista de produtos e funções de apoio.

Configuração no painel da Cloudflare (projeto jvorganiza → Configurações → Produção):
- Associação KV `ACESSOS` → banco `jv-acessos` (feito em 13/11/2026).
- Variável secreta `CAKTO_SECRET` = segredo do webhook criado na Cakto (quem cola é o João).

O e-mail da compradora não é guardado; fica só um resumo (SHA-256) dele.

Segredo CAKTO_SECRET colado pelo João em 13/11/2026 (noite).
