/* Aviso de cookies da Empresa JV. O pixel da Meta só envia dados depois do "Aceitar".
   20/11/2026: o aviso virou um cartão pequeno no canto de baixo (no máximo 2 linhas de texto no celular).
   Enquanto ele está aberto, a página ganha folga embaixo (padding) e a barra fixa de compra (.fixo) sobe
   acima dele, para o aviso nunca cobrir o botão de compra. A lógica de consentimento não mudou. */
(function(){
var K='jv-cookies',v=null;try{v=localStorage.getItem(K)}catch(e){}
var ro=null;
function folga(px){var h=document.documentElement;if(px){h.style.setProperty('--jv-ck-h',px+'px');h.classList.add('jv-ck')}else{h.style.removeProperty('--jv-ck-h');h.classList.remove('jv-ck')}}
function decide(x){try{localStorage.setItem(K,x)}catch(e){}try{if(window.fbq)fbq('consent',x==='sim'?'grant':'revoke')}catch(e){}var b=document.getElementById('jv-cookies');if(b)b.parentNode.removeChild(b);if(ro){ro.disconnect();ro=null}folga(0)}
function estilo(){if(document.getElementById('jv-cookies-css'))return;var s=document.createElement('style');s.id='jv-cookies-css';
  s.textContent='#jv-cookies{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:99;background:#fffdf7;color:#16130f;border:2px solid #16130f;border-radius:14px;box-shadow:4px 4px 0 #16130f;padding:10px 12px;font:13.5px/1.35 Inter,system-ui,sans-serif;display:grid;gap:8px}'
   +'#jv-cookies p{margin:0}#jv-cookies a{color:#0E3B2A;font-weight:700}'
   +'#jv-cookies .jv-ck-bts{display:flex;gap:8px}'
   +'#jv-cookies button{flex:1;font:700 14px/1 Inter,system-ui,sans-serif;min-height:38px;padding:8px 12px;border-radius:10px;cursor:pointer;border:2px solid #16130f;background:#fbfaf4;color:#16130f;white-space:nowrap}'
   +'#jv-cookies button.forte{background:#FFC82E}'
   +'@media (min-width:600px){#jv-cookies{right:auto;width:340px;left:16px;bottom:16px}}'
   +'html.jv-ck body{padding-bottom:var(--jv-ck-h,0px)}'
   +'@media (max-width:599px){html.jv-ck .fixo{bottom:var(--jv-ck-h,0px)}html.jv-ck .fixo:not(.on){transform:translateY(calc(110% + var(--jv-ck-h,0px)))}}';
  document.head.appendChild(s)}
function botao(txt,forte,fn){var b=document.createElement('button');b.type='button';b.textContent=txt;b.onclick=fn;if(forte)b.className='forte';return b}
function mostra(){if(document.getElementById('jv-cookies'))return;estilo();var d=document.createElement('div');d.id='jv-cookies';d.setAttribute('role','dialog');d.setAttribute('aria-label','Aviso de cookies');
  var p=document.createElement('p');p.textContent='Usamos cookies da Meta para medir as visitas e mostrar nossos anúncios. ';
  var a=document.createElement('a');a.href='/privacidade/';a.textContent='Saiba mais';p.appendChild(a);
  var bs=document.createElement('div');bs.className='jv-ck-bts';bs.appendChild(botao('Aceitar',true,function(){decide('sim')}));bs.appendChild(botao('Recusar',false,function(){decide('nao')}));
  d.appendChild(p);d.appendChild(bs);document.body.appendChild(d);
  /* folga = altura do cartão + a distância até o fim da tela + um respiro */
  function mede(){var r=d.getBoundingClientRect();folga(Math.ceil(window.innerHeight-r.top+8))}
  mede();if('ResizeObserver' in window){ro=new ResizeObserver(mede);ro.observe(d)}window.addEventListener('resize',function(){if(document.getElementById('jv-cookies'))mede()})}
function rodape(){var w=document.querySelector('.rodape .wrap');if(!w||document.getElementById('jv-legal'))return;var p=document.createElement('p');p.id='jv-legal';
  [['Privacidade','/privacidade/'],['Termos de uso','/termos/']].forEach(function(x,i){if(i)p.appendChild(document.createTextNode(' · '));var a=document.createElement('a');a.href=x[1];a.textContent=x[0];p.appendChild(a)});
  p.appendChild(document.createTextNode(' · '));var c=document.createElement('a');c.href='#';c.textContent='Cookies';c.onclick=function(e){e.preventDefault();mostra()};p.appendChild(c);w.appendChild(p)}
function ini(){rodape();if(v!=='sim'&&v!=='nao')mostra()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ini);else ini();
})();
