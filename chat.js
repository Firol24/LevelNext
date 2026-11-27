(function(){
"use strict";
if(document.getElementById("lnChatDock"))return;
var markup="<aside id=\"lnChatDock\" aria-label=\"Czat na żywo LEVEL NEXT\">\n<div class=\"ln-chat-head\"><div class=\"ln-mark\">LN</div><div class=\"ln-headtext\"><div class=\"ln-headtitle\">LEVEL NEXT // LIVE CHAT</div><div class=\"ln-headsub\"><span style=\"color:#75db8b\">●</span> COMMUNITY CHANNEL</div></div><button class=\"ln-headbtn\" id=\"lnChatClose\" type=\"button\" aria-label=\"Ukryj czat\">×</button></div>\n<div class=\"ln-channelbar\"><span><strong>#</strong> level-next</span><span class=\"ln-live\">LIVE / DISCORD</span></div>\n<div class=\"ln-messages\" id=\"lnChatMessages\" aria-live=\"polite\"><div class=\"ln-system\">ŁĄCZENIE Z KANAŁEM...</div></div>\n<form class=\"ln-composer\" id=\"lnChatForm\"><div class=\"ln-composebox\"><input id=\"lnChatInput\" maxlength=\"300\" autocomplete=\"off\" placeholder=\"Napisz wiadomość...\" aria-label=\"Wiadomość\"><button class=\"ln-send\" id=\"lnChatSend\" type=\"submit\">WYŚLIJ</button></div><div class=\"ln-hint\" id=\"lnChatHint\">ŁADOWANIE STATUSU LOGOWANIA...</div></form>\n</aside>\n<button type=\"button\" id=\"lnChatLauncher\" class=\"ln-chat-launcher\" hidden>▣ LEVEL NEXT CHAT</button>";
var holder=document.createElement("div");holder.innerHTML=markup;
while(holder.firstChild)document.body.appendChild(holder.firstChild);


(function(){
"use strict";
var API="https://levelnext-forum-api.filipiakr245.workers.dev";
var dock=document.getElementById("lnChatDock");
var list=document.getElementById("lnChatMessages");
var field=document.getElementById("lnChatInput");
var form=document.getElementById("lnChatForm");
var hint=document.getElementById("lnChatHint");
var send=document.getElementById("lnChatSend");
var closeButton=document.getElementById("lnChatClose");
var launcher=document.getElementById("lnChatLauncher");
var dragBar=dock.querySelector(".ln-chat-head");
var user=null,busy=false;
if(!dock||!list||!field||!form)return;

function token(){try{return localStorage.getItem("ln_session")||""}catch(e){return""}}
function headers(json){
 var h={Accept:"application/json"};
 if(json)h["Content-Type"]="application/json";
 var t=token();if(t)h.Authorization="Bearer "+t;
 return h;
}
async function api(path,opts){
 opts=opts||{};
 var r=await fetch(API+path,Object.assign({credentials:"omit",headers:headers(!!opts.body)},opts));
 var d={};try{d=await r.json()}catch(e){}
 if(!r.ok||d.success===false)throw Error(d.error||("HTTP "+r.status));
 return d;
}
function node(tag,cls,txt){
 var e=document.createElement(tag);
 if(cls)e.className=cls;
 if(txt!==undefined)e.textContent=txt;
 return e;
}
function safeUrl(value){
 try{
  var u=new URL(value);
  return (u.protocol==="https:"||u.protocol==="http:")?u:null;
 }catch(e){return null}
}
function isImageUrl(value){
 var u=safeUrl(value);if(!u)return false;
 var host=u.hostname.toLowerCase();
 var trusted=host==="cdn.discordapp.com"||host==="media.discordapp.net"||
  host==="media.tenor.com"||host==="i.giphy.com"||host==="media.giphy.com"||
  host==="giphy.com"||host==="tenor.com";
 return trusted||/\.(?:png|jpe?g|gif|webp|avif)(?:$|\?)/i.test(u.href);
}
function appendImage(parent,url,alt,extraClass){
 var u=safeUrl(url);if(!u||!isImageUrl(url))return false;
 var wrap=document.createElement("a");
 wrap.className="ln-image-link";
 wrap.href=u.href;wrap.target="_blank";wrap.rel="noopener noreferrer";
 var img=document.createElement("img");
 img.className="ln-inline-image"+(extraClass?" "+extraClass:"");
 img.alt=alt||"";
 // Load chat media immediately and preserve the original signed Discord CDN URL.
 img.loading="eager";img.decoding="async";
 var triedProxy=false;
 img.addEventListener("error",function(){
  // Only retry unsigned Discord URLs: signed attachment URLs are host-specific.
  if(!triedProxy&&u.hostname==="cdn.discordapp.com"&&u.pathname.indexOf("/attachments/")===0&&!u.searchParams.has("ex")&&!u.searchParams.has("hm")){
   triedProxy=true;
   var proxy=new URL(u.href);proxy.hostname="media.discordapp.net";
   if(!proxy.searchParams.has("width"))proxy.searchParams.set("width","900");
   img.src=proxy.href;
   return;
  }
  img.remove();
  if(!wrap.querySelector(".ln-image-fallback")){
   var fallback=document.createElement("span");
   fallback.className="ln-image-fallback";
   fallback.textContent="OTWÓRZ OBRAZ / GIF ↗";
   wrap.append(fallback);
  }
 },false);
 img.src=u.href;
 wrap.append(img);
 parent.append(wrap);
 return true;
}
function appendText(parent,text){if(text)parent.append(document.createTextNode(text))}
function renderContent(parent,content){
 // Render Discord custom emoji and URLs as DOM nodes; never inject HTML.
 var source=String(content||"");
 var pattern=/<(a?):([a-zA-Z0-9_]{2,32}):(\d{17,20})>|https?:\/\/[^\s<>\])]+/g;
 var cursor=0,match;
 while((match=pattern.exec(source))){
  appendText(parent,source.slice(cursor,match.index));
  if(match[2]&&match[3]){
   var emoji=document.createElement("img");
   emoji.className="ln-custom-emoji";
   emoji.alt=":"+match[2]+":";
   emoji.title=emoji.alt;
   emoji.loading="lazy";
   emoji.src="https://cdn.discordapp.com/emojis/"+match[3]+"."+(match[1]?"gif":"webp")+"?size=48&quality=lossless";
   emoji.addEventListener("error",function(){this.replaceWith(document.createTextNode(this.alt))},{once:true});
   parent.append(emoji);
  }else{
   var raw=match[0],urlText=raw;
   var trailing="";
   while(/[),.!?;:]$/.test(urlText)){trailing=urlText.slice(-1)+trailing;urlText=urlText.slice(0,-1)}
   var parsed=safeUrl(urlText);
   if(parsed){
    if(isImageUrl(urlText)){
     if(!appendImage(parent,urlText,"Obraz z czatu")) {
      var fallback=document.createElement("a");fallback.href=parsed.href;fallback.target="_blank";fallback.rel="noopener noreferrer";fallback.textContent=urlText;parent.append(fallback);
     }
    }else{
     var a=document.createElement("a");a.href=parsed.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent=urlText;a.className="ln-chat-link";parent.append(a);
    }
   }else appendText(parent,urlText);
   appendText(parent,trailing);
  }
  cursor=pattern.lastIndex;
 }
 appendText(parent,source.slice(cursor));
}
function avatarUrl(author){
 if(!author)return "";
 if(typeof author.avatar_url==="string"&&author.avatar_url.startsWith("https://cdn.discordapp.com/avatars/"))return author.avatar_url;
 if(author.id&&author.avatar){
  var ext=String(author.avatar).startsWith("a_")?"gif":"png";
  return "https://cdn.discordapp.com/avatars/"+encodeURIComponent(author.id)+"/"+encodeURIComponent(author.avatar)+"."+ext+"?size=64";
 }
 return "";
}
function render(messages){
 var wasBottom=list.scrollHeight-list.scrollTop-list.clientHeight<70;
 list.replaceChildren();
 if(!messages.length){list.append(node("div","ln-system","NA RAZIE CISZA. NAPISZ PIERWSZY!"));return}
 messages.forEach(function(m){
  var author=m.author||{};
  var row=node("article","ln-msg");
  var av=node("div","ln-avatar");
  var body=node("div","ln-msgbody");
  var meta=node("div","ln-msgmeta");
  var name=node("span","ln-name",author.global_name||author.username||"Discord user");
  var time=node("span","ln-time");
  var avatar=avatarUrl(author);
  if(avatar){
   var im=document.createElement("img");im.src=avatar;im.alt="";im.loading="lazy";im.referrerPolicy="no-referrer";
   im.addEventListener("error",function(){av.textContent=(name.textContent||"U").charAt(0).toUpperCase()},{once:true});
   av.append(im);
  }else av.textContent=(name.textContent||"U").charAt(0).toUpperCase();
  var dt=new Date(m.timestamp);
  time.textContent=Number.isNaN(dt.getTime())?"":dt.toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"});
  var content=node("div","ln-msgtext");
  renderContent(content,m.content||"");
  meta.append(name,time);body.append(meta,content);

  (Array.isArray(m.attachments)?m.attachments:[]).forEach(function(file){
   if(!file||typeof file.url!=="string")return;
   var type=String(file.content_type||"").toLowerCase();
   if(type.startsWith("image/")||isImageUrl(file.url)){
    appendImage(body,file.url,file.filename||"Załączony obraz","ln-attachment-image");
   }else{
    var link=safeUrl(file.url);
    if(link){var a=document.createElement("a");a.href=link.href;a.target="_blank";a.rel="noopener noreferrer";a.className="ln-chat-link ln-attachment-link";a.textContent="📎 "+(file.filename||"Załącznik");body.append(a)}
   }
  });
  row.append(av,body);list.append(row);
 });
 if(wasBottom)list.scrollTop=list.scrollHeight;
}
async function load(){
 if(busy)return;busy=true;
 try{
  var d=await api("/api/chat?limit=50");
  render(Array.isArray(d.messages)?d.messages:[]);
 }catch(e){
  if(!list.children.length||list.querySelector(".ln-system"))
   list.replaceChildren(node("div","ln-system","CZAT NIEDOSTĘPNY: "+e.message));
 }finally{busy=false}
}
async function account(){
 try{var d=await api("/api/me");user=d.authenticated?d.user:null}
 catch(e){user=null}
 if(user){
  field.disabled=false;send.disabled=false;
  hint.textContent="ZALOGOWANO JAKO "+(user.username||"DISCORD USER").toUpperCase()+" • ENTER = WYŚLIJ";
 }else{
  field.disabled=true;send.disabled=true;hint.replaceChildren();
  hint.append(document.createTextNode("PISANIE DOSTĘPNE PO "));
  var a=document.createElement("a");a.href=API+"/auth/discord";a.className="ln-login";
  a.textContent="ZALOGOWANIU PRZEZ DISCORD";hint.append(a);
 }
}
form.addEventListener("submit",async function(e){
 e.preventDefault();
 var content=field.value.trim();
 if(!content||!user||content.length>300)return;
 send.disabled=true;
 try{await api("/api/chat",{method:"POST",body:JSON.stringify({content:content})});field.value="";await load()}
 catch(err){hint.textContent=err.message}
 finally{send.disabled=!user}
});
var chatVisibilityKey="levelNextChatVisible";
var chatVisible=true;
try{if(localStorage.getItem(chatVisibilityKey)==="0")chatVisible=false}catch(e){}
dock.style.display=chatVisible?"flex":"none";
if(launcher)launcher.hidden=chatVisible;
function setChatVisible(visible){
 chatVisible=visible;
 dock.style.display=visible?"flex":"none";
 if(launcher)launcher.hidden=visible;
 try{localStorage.setItem(chatVisibilityKey,visible?"1":"0")}catch(e){}
}
if(closeButton)closeButton.addEventListener("click",function(e){
 e.preventDefault();
 e.stopPropagation();
 setChatVisible(false);
});
if(launcher)launcher.addEventListener("click",function(){
 setChatVisible(true);
});
// Zapamietywanie polozenia i rozmiaru okna czatu miedzy podstronami.
var chatPositionKey="levelNextChatPosition";
var chatSizeKey="levelNextChatSize";
var savedChatPosition=null,savedChatSize=null;
try{
 savedChatPosition=JSON.parse(localStorage.getItem(chatPositionKey)||"null");
 savedChatSize=JSON.parse(localStorage.getItem(chatSizeKey)||"null");
}catch(e){}
function clampChatPosition(left,top){
 var maxLeft=Math.max(0,window.innerWidth-dock.offsetWidth);
 var maxTop=Math.max(0,window.innerHeight-dock.offsetHeight);
 return {left:Math.max(0,Math.min(maxLeft,left)),top:Math.max(0,Math.min(maxTop,top))};
}
function saveChatPosition(){
 if(dock.style.display==="none")return;
 var rect=dock.getBoundingClientRect();
 try{localStorage.setItem(chatPositionKey,JSON.stringify({left:Math.round(rect.left),top:Math.round(rect.top)}))}catch(e){}
}
function saveChatSize(){
 if(dock.style.display==="none"||window.innerWidth<=620||dock.classList.contains("minimized"))return;
 savedChatSize={width:Math.round(dock.getBoundingClientRect().width),height:Math.round(dock.getBoundingClientRect().height)};
 try{localStorage.setItem(chatSizeKey,JSON.stringify(savedChatSize))}catch(e){}
}
if(window.innerWidth>620&&savedChatSize&&Number.isFinite(savedChatSize.width)&&Number.isFinite(savedChatSize.height)){
 var maxWidth=Math.max(280,window.innerWidth-16),maxHeight=Math.max(220,window.innerHeight-16);
 dock.style.width=Math.max(280,Math.min(maxWidth,savedChatSize.width))+"px";
 dock.style.height=Math.max(220,Math.min(maxHeight,savedChatSize.height))+"px";
}
var initialChatRect=dock.getBoundingClientRect();
var initialChatPosition=savedChatPosition&&Number.isFinite(savedChatPosition.left)&&Number.isFinite(savedChatPosition.top)
 ?clampChatPosition(savedChatPosition.left,savedChatPosition.top)
 :{left:Math.max(0,window.innerWidth-initialChatRect.width-18),top:Math.max(0,window.innerHeight-initialChatRect.height-18)};
dock.style.left=initialChatPosition.left+"px";
dock.style.top=initialChatPosition.top+"px";
dock.style.right="auto";
dock.style.bottom="auto";

if(dragBar){
 var drag=null;
 dragBar.addEventListener("pointerdown",function(e){
  if(e.target.closest("button"))return;
  if(e.button!==undefined&&e.button!==0)return;
  var rect=dock.getBoundingClientRect();
  drag={x:e.clientX,y:e.clientY,left:rect.left,top:rect.top};
  try{dragBar.setPointerCapture(e.pointerId)}catch(err){}
  e.preventDefault();
 });
 dragBar.addEventListener("pointermove",function(e){
  if(!drag)return;
  var pos=clampChatPosition(drag.left+(e.clientX-drag.x),drag.top+(e.clientY-drag.y));
  dock.style.left=pos.left+"px";
  dock.style.top=pos.top+"px";
 });
 function stopChatDrag(){if(!drag)return;drag=null;saveChatPosition()}
 dragBar.addEventListener("pointerup",stopChatDrag);
 dragBar.addEventListener("pointercancel",stopChatDrag);
}
if(typeof ResizeObserver!=="undefined"){
 var chatResizeObserver=new ResizeObserver(function(){saveChatSize()});
 chatResizeObserver.observe(dock);
}
window.addEventListener("resize",function(){
 if(window.innerWidth<=620){
  dock.style.width="";
  dock.style.height="";
 }else if(savedChatSize&&Number.isFinite(savedChatSize.width)&&Number.isFinite(savedChatSize.height)){
  dock.style.width=Math.min(window.innerWidth-16,savedChatSize.width)+"px";
  dock.style.height=Math.min(window.innerHeight-16,savedChatSize.height)+"px";
 }
 if(dock.style.display!=="none"&&dock.style.left){
  var rect=dock.getBoundingClientRect();
  var pos=clampChatPosition(rect.left,rect.top);
  dock.style.left=pos.left+"px";
  dock.style.top=pos.top+"px";
  saveChatPosition();
 }
});
window.addEventListener("pointerup",function(){if(dock.style.display!=="none")saveChatSize()});
account();load();window.setInterval(load,5000);
document.addEventListener("levelnext:authchange",account);
})();

})();
