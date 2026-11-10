"""Gera as páginas das iscas em /ir/<slug>/ (passo a passo com vídeos + botão do modelo no fim).
Uso: py -3 ir/gerar_iscas.py   (a partir de landing-page/)
"""
import os, html

PIXEL = '1129384439673429'
WHATS = '5521984942432'

ISCAS = {
 'calc': dict(nome='Calculadora de preço', emoji='🧮', url='https://jvorganiza.notion.site/Calculadora-de-pre-o-412f6f5a563881a291ead10887cdacb8',
   promessa='Descubra o preço certo do seu serviço, com o material, as suas horas e o seu lucro.',
   uso=['Toque em <b>➕ Calcular um produto novo</b>, logo acima da lista.', 'Troque o nome pelo seu serviço e preencha o <b>Custo dos materiais</b> e as <b>Horas de trabalho</b>.', 'Compare o <b>Preço sugerido</b> com o <b>Preço que cobro hoje</b>. Se a <b>Diferença</b> der negativa, você está cobrando menos do que devia.'],
   video_uso=('ajuda-4-primeiro-calculo', 'Seu primeiro cálculo'), whats_calc='Oi! Quero calcular o preço do meu serviço com vocês'),
 'sobrou': dict(nome='Quanto sobrou no mês', emoji='💰', url='https://jvorganiza.notion.site/Quanto-sobrou-no-m-s-412f6f5a563881f89d90fdd1aa963e15',
   promessa='Veja quanto sobra de verdade no fim do mês, separando o dinheiro do negócio e o da casa.',
   uso=['Toque em <b>➕ Entrou dinheiro</b> a cada venda.', 'Toque em <b>➖ Saiu dinheiro</b> a cada gasto.', 'O <b>Sobrou no mês</b> faz a conta sozinho.'],
   video_uso=('ajuda-3-onde-fica-o-modelo', 'Onde fica o modelo e como lançar'), whats_calc=None),
 'pedidos': dict(nome='Pedidos da semana', emoji='📋', url='https://jvorganiza.notion.site/Pedidos-da-semana-412f6f5a56388163add3cc0e4d4e377f',
   promessa='Nenhuma encomenda perdida no WhatsApp: o que vence, o que atrasou e quanto falta receber.',
   uso=['Toque em <b>➕ Novo pedido</b> a cada encomenda.', 'Coloque a cliente, o que ela pediu, o valor e o dia da entrega.', 'A aba <b>Esta semana</b> mostra o que vence e quanto falta receber.'],
   video_uso=None, whats_calc=None),
 'clientes': dict(nome='Clientes para chamar de volta', emoji='📞', url='https://jvorganiza.notion.site/Clientes-para-chamar-de-volta-412f6f5a563881b4bf7bf0c3326a0b2d',
   promessa='Saiba quem chamar de volta essa semana, antes que a cliente vá pra outra.',
   uso=['Toque em <b>➕ Nova cliente</b>.', 'Coloque a data da última vez que ela veio.', 'Quem passou de 30 dias aparece em <b>Chamar esta semana</b>: é a hora de chamar pra manutenção.'],
   video_uso=None, whats_calc=None),
 'orcamentos': dict(nome='Orçamentos para responder', emoji='🧾', url='https://jvorganiza.notion.site/Or-amentos-para-responder-412f6f5a563881eeb0c0efab40d3e7b4',
   promessa='Nenhum orçamento esquecido: veja quem você precisa chamar de volta hoje.',
   uso=['Toque em <b>➕ Novo orçamento</b> a cada orçamento que mandar.', 'A tela <b>Chamar hoje</b> mostra quem você precisa chamar de volta.', 'A mensagem pronta já está lá embaixo: é só copiar e mandar.'],
   video_uso=None, whats_calc=None),
}

def wa(txt):
    from urllib.parse import quote
    return f'https://wa.me/{WHATS}?text={quote(txt)}'

def video(slug, titulo):
    return (f'<figure class="vid"><video controls playsinline preload="none" poster="/media/ajuda/{slug}.jpg" '
            f'src="/media/ajuda/{slug}.mp4"></video><figcaption>▶ {html.escape(titulo)}</figcaption></figure>')

T = open(os.path.join(os.path.dirname(__file__), 'modelo-isca.html'), encoding='utf-8').read()
for slug, d in ISCAS.items():
    uso = ''.join(f'<li>{u}</li>' for u in d['uso'])
    vu = video(*d['video_uso']) if d['video_uso'] else ''
    calc = ''
    if d['whats_calc']:
        calc = (f'<aside class="atalho"><b>Sem tempo agora?</b><p>A gente faz a primeira conta com você, aqui no WhatsApp: '
                f'é só mandar o serviço, o gasto de material e as horas.</p><a class="btn claro" href="{wa(d["whats_calc"])}">Calcular comigo no WhatsApp</a></aside>')
    pg = (T.replace('{{NOME}}', html.escape(d['nome'])).replace('{{EMOJI}}', d['emoji']).replace('{{SLUG}}', slug)
           .replace('{{URL}}', d['url']).replace('{{PROMESSA}}', html.escape(d['promessa'])).replace('{{USO}}', uso)
           .replace('{{VIDEO_USO}}', vu).replace('{{ATALHO}}', calc).replace('{{PIXEL}}', PIXEL)
           .replace('{{WA_TRAVEI}}', wa('Travei para colocar o modelo'))
           .replace('{{V1}}', video('ajuda-1-criar-a-conta', 'Criar a conta grátis (35 s)'))
           .replace('{{V2}}', video('ajuda-2-trazer-o-modelo', 'Trazer o modelo pro seu Notion (41 s)')))
    os.makedirs(os.path.join(os.path.dirname(__file__), slug), exist_ok=True)
    open(os.path.join(os.path.dirname(__file__), slug, 'index.html'), 'w', encoding='utf-8').write(pg)
    print('ok', slug)
