/* Aviso de cookies da Empresa JV. O pixel da Meta só envia dados depois do "Aceitar". */
(function(){
var K='jv-cookies',v=null;try{v=localStorage.getItem(K)}catch(e){}
function decide(x){try{localStorage.setItem(K,x)}catch(e){}try{if(window.fbq)fbq('consent',x==='sim'?'grant':'revoke')}catch(e){}var b=document.getElementById('jv-cookies');if(b)b.parentNode.removeChild(b)}
function botao(txt,forte,fn){var b=document.createElement('button');b.type='button';b.textContent=txt;b.onclick=fn;
  b.style.cssText='font:inherit;font-weight:700;font-size:15px;padding:10px 16px;border-radius:10px;cursor:pointer;border:2px solid #16130f;background:'+(forte?'#FFC82E':'#fbfaf4')+';color:#16130f';return b}
function mostra(){if(document.getElementById('jv-cookies'))return;var d=document.createElement('div');d.id='jv-cookies';d.setAttribute('role','dialog');d.setAttribute('aria-label','Aviso de cookies');
  d.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99;background:#16130f;color:#fff;padding:14px 16px calc(14px + env(safe-area-inset-bottom,0px));font:15px/1.4 Inter,system-ui,sans-serif';
  var w=document.createElement('div');w.style.cssText='max-width:760px;margin:0 auto;display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center';
  var p=document.createElement('p');p.style.cssText='margin:0;flex:1 1 260px';p.textContent='Este site usa cookies da Meta para medir as visitas e mostrar nossos anúncios a quem passou por aqui. Você escolhe. ';
  var a=document.createElement('a');a.href='/privacidade/';a.textContent='Saiba mais';a.style.color='#FFC82E';p.appendChild(a);
  var bs=document.createElement('div');bs.style.cssText='display:flex;gap:8px;flex-wrap:wrap';bs.appendChild(botao('Aceitar',true,function(){decide('sim')}));bs.appendChild(botao('Recusar',false,function(){decide('nao')}));
  w.appendChild(p);w.appendChild(bs);d.appendChild(w);document.body.appendChild(d)}
function rodape(){var w=document.querySelector('.rodape .wrap');if(!w||document.getElementById('jv-legal'))return;var p=document.createElement('p');p.id='jv-legal';
  [['Privacidade','/privacidade/'],['Termos de uso','/termos/']].forEach(function(x,i){if(i)p.appendChild(document.createTextNode(' · '));var a=document.createElement('a');a.href=x[1];a.textContent=x[0];p.appendChild(a)});
  p.appendChild(document.createTextNode(' · '));var c=document.createElement('a');c.href='#';c.textContent='Cookies';c.onclick=function(e){e.preventDefault();mostra()};p.appendChild(c);w.appendChild(p)}
function ini(){rodape();if(v!=='sim'&&v!=='nao')mostra()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ini);else ini();
})();
