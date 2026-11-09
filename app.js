(function(){
'use strict';

/* ---------- утилиты ---------- */
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var uid=function(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4)};
var fmt=function(s){if(!isFinite(s)||s<0)return '0:00';s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
var hash=function(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};
function plural(n,f){var a=n%10,b=n%100;var w=(b>=12&&b<=14)?f[2]:a===1?f[0]:(a>=2&&a<=4)?f[1]:f[2];return n+' '+w}
function ago(ts){var s=Math.max(0,(Date.now()-ts)/1000);if(s<60)return 'только что';var m=Math.floor(s/60);if(m<60)return m+' мин назад';var h=Math.floor(m/60);if(h<24)return h+' ч назад';return Math.floor(h/24)+' дн назад'}

var P={
  play:'<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  pause:'<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" stroke="none"/>',
  prev:'<path d="M6 5h2v14H6zM20 5v14L9 12z" fill="currentColor" stroke="none"/>',
  next:'<path d="M16 5h2v14h-2zM4 5v14l11-7z" fill="currentColor" stroke="none"/>',
  shuffle:'<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  repeat:'<path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  heartOn:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" fill="currentColor"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>',
  link:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  vol:'<path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7"/>',
  mute:'<path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  check:'<path d="M5 12l5 5 9-10"/>',
  lib:'<path d="M4 5v14M9 5v14M14 7l6 12M14 19l6-12"/>',
  list:'<path d="M4 7h12M4 12h12M4 17h8M19 14v6M16 17h6"/>',
  video:'<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l4-2v8l-4-2"/>',
  news:'<path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2zM8 9h7M8 13h7M8 17h4"/>',
  mic:'<path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3"/>',
  star:'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="currentColor"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  pin:'<path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7"/>'
};
function ic(n,s){s=s||18;return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+P[n]+'</svg>'}

/* ---------- состояние ---------- */
var LS='sonar:v2',LS_OLD='sonar:v1',FREE_LIMIT=30;
var S={tracks:[],playlists:[],favs:[],sources:[],pods:[],pos:{},news:null,nick:'',sub:null,vol:0.8,rate:1,shuffle:false,repeat:'off',view:{type:'all'},q:''};
function seedNews(){
  var now=Date.now(),m=60000;
  return [
    {id:'n1',sample:true,author:'Nina Hall',tag:'rumor',title:'Neon Orchard, по слухам, выпустят сюрприз-сингл через неделю',text:'Источник в студии говорит, что трек записан за одну ночь и выйдет без анонса. Обложку якобы показали узкому кругу. Подтверждения пока нет.',ts:now-38*m,likes:24,liked:false,comments:[{id:'c1',author:'beatcollector',text:'Надеюсь, не перенесут, как в прошлый раз.',ts:now-21*m},{id:'c2',author:'Mila',text:'Если это правда, беру отгул в пятницу.',ts:now-9*m}]},
    {id:'n2',sample:true,author:'Sonar Editors',apl:true,tag:'release',title:'Paper Satellites анонсировали альбом «Низкая орбита»',text:'Двенадцать треков, релиз в конце месяца. Первый сингл уже попал в плейлисты недели.',ts:now-5*60*m,likes:58,liked:false,comments:[]},
    {id:'n3',sample:true,author:'Kid Lanterna',tag:'tour',title:'Kid Lanterna едет в тур по небольшим клубам',text:'Восемь городов, билеты поступят в продажу с понедельника. Обещают сыграть новый альбом целиком.',ts:now-26*60*m,likes:12,liked:false,comments:[]},
    {id:'n4',sample:true,author:'beatcollector',tag:'talk',title:'Какой альбом года вы переслушиваете чаще всего?',text:'У меня это «Низкая орбита» от Paper Satellites, хотя официально её ещё нет. Расскажите про свои.',ts:now-2*24*60*m,likes:7,liked:false,comments:[]}
  ];
}
(function load(){
  try{
    var r=localStorage.getItem(LS)||localStorage.getItem(LS_OLD);
    if(!r){S.news=seedNews();return}
    var m=JSON.parse(r);
    ['tracks','playlists','favs','sources','pods'].forEach(function(k){if(Array.isArray(m[k]))S[k]=m[k]});
    if(m.pos&&typeof m.pos==='object')S.pos=m.pos;
    if(Array.isArray(m.news))S.news=m.news;
    if(typeof m.nick==='string')S.nick=m.nick;
    if(m.sub&&typeof m.sub==='object')S.sub=m.sub;
    if(typeof m.vol==='number')S.vol=m.vol;
    if(typeof m.rate==='number')S.rate=m.rate;
    S.shuffle=!!m.shuffle;
    if(m.repeat==='all'||m.repeat==='one')S.repeat=m.repeat;
  }catch(e){}
  if(!S.news)S.news=seedNews();
})();
var saveT;
function save(){
  clearTimeout(saveT);
  saveT=setTimeout(function(){
    try{localStorage.setItem(LS,JSON.stringify({tracks:S.tracks,playlists:S.playlists,favs:S.favs,sources:S.sources,pods:S.pods,pos:S.pos,news:S.news,nick:S.nick,sub:S.sub,vol:S.vol,rate:S.rate,shuffle:S.shuffle,repeat:S.repeat}))}catch(e){}
  },150);
}

/* ---------- демо-звук (собирается в браузере) ---------- */
var TIM={
  soft:{decay:1.6,tail:.8,parts:[[2,.3],[3,.1]]},
  bell:{decay:2.4,tail:1.2,parts:[[2.76,.4],[5.4,.15]]},
  pluck:{decay:5,tail:.4,parts:[[2,.5],[3,.25]]},
  bass:{decay:.9,tail:.5,parts:[]}
};
var arp=function(ch,pat,len){var o=[];ch.forEach(function(c){pat.forEach(function(i){o.push([c[i%3]+(i>=3?12:0),len])})});return o};
var rep=function(a,n){var o=[];for(var i=0;i<n;i++)o=o.concat(a);return o};
var DEF=[
  {title:'Тёплый шум',artist:'Демо · синтезатор',bpm:84,timbre:'soft',notes:rep(arp([[57,60,64],[53,57,60],[55,60,64],[55,59,62]],[0,1,2,3,2,1,2,1],.5),2),bass:[45,41,48,43],bassLen:4},
  {title:'Ночной трамвай',artist:'Демо · синтезатор',bpm:104,timbre:'pluck',notes:rep([[62,.5],[65,.5],[69,.5],[72,1],[69,.5],[65,.5],[62,1],[null,1]],5),bass:[38,38,34,36],bassLen:2},
  {title:'Стеклянный час',artist:'Демо · синтезатор',bpm:66,timbre:'bell',notes:rep([[76,2],[79,2],[83,3],[null,1],[81,2],[79,2],[74,4]],2),bass:[40,43,36,38],bassLen:8},
  {title:'Пыль на виниле',artist:'Демо · синтезатор',bpm:72,timbre:'soft',crackle:true,notes:rep([[67,1],[69,1],[71,2],[69,1],[67,1],[64,2],[62,1],[64,1],[67,2],[null,2]],2),bass:[43,40,45,38],bassLen:4}
];
var DEFP=[
  {title:'Эпизод 1 · тест звука',bpm:70,timbre:'soft',notes:rep(arp([[57,60,64],[53,57,60]],[0,1,2,1],1),3),bass:[45,41],bassLen:4},
  {title:'Эпизод 2 · тест скорости',bpm:60,timbre:'bell',notes:rep([[72,2],[76,2],[79,4]],3),bass:[48,43],bassLen:8}
];
function durOf(d){var b=0;d.notes.forEach(function(n){b+=n[1]});return b*60/d.bpm+1.2}
var DEMOS=DEF.map(function(d,i){return {id:'demo-'+(i+1),title:d.title,artist:d.artist,kind:'demo',dur:durOf(d),di:i}});
var SAMPLE_POD={id:'pod-sample',name:'Sonar Sample Show',host:'Sonar',sample:true};
var DEMO_EPS=DEFP.map(function(d,i){return {id:'pdemo-'+(i+1),title:d.title,artist:'Sonar',kind:'podcast',demo:true,podId:'pod-sample',dur:durOf(d),di:i}});
function note(buf,sr,start,midi,dur,vol,tm){
  var f=440*Math.pow(2,(midi-69)/12),n=Math.floor((dur+tm.tail)*sr),s0=Math.floor(start*sr),k=1+tm.parts.length*.3;
  for(var i=0;i<n&&s0+i<buf.length;i++){
    var t=i/sr,env=Math.min(1,t/.015)*Math.exp(-t*tm.decay),y=Math.sin(6.283185307*f*t);
    for(var j=0;j<tm.parts.length;j++)y+=tm.parts[j][1]*Math.sin(6.283185307*f*tm.parts[j][0]*t);
    buf[s0+i]+=y*env*vol/k;
  }
}
function synth(d){
  var sr=22050,beat=60/d.bpm,beats=0;
  d.notes.forEach(function(n){beats+=n[1]});
  var len=Math.ceil((beats*beat+1.2)*sr),buf=new Float32Array(len),tm=TIM[d.timbre],t=0;
  d.notes.forEach(function(n){if(n[0]!=null)note(buf,sr,t*beat,n[0],n[1]*beat,.55,tm);t+=n[1]});
  var bl=d.bassLen||4;
  for(var b=0,i=0;b<beats;b+=bl,i++)note(buf,sr,b*beat,d.bass[i%d.bass.length],bl*beat,.7,TIM.bass);
  if(d.crackle)for(var c=0;c<len;c++)if(Math.random()<.0007)buf[c]+=(Math.random()-.5)*.35;
  var pk=0;for(var p=0;p<len;p++){var a=Math.abs(buf[p]);if(a>pk)pk=a}
  var g=pk?.8/pk:1,fade=Math.floor(sr*.4),dv=new DataView(new ArrayBuffer(44+len*2));
  function ws(o,s){for(var q=0;q<s.length;q++)dv.setUint8(o+q,s.charCodeAt(q))}
  ws(0,'RIFF');dv.setUint32(4,36+len*2,true);ws(8,'WAVE');ws(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,sr,true);dv.setUint32(28,sr*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);ws(36,'data');dv.setUint32(40,len*2,true);
  for(var z=0;z<len;z++){var v=buf[z]*g;if(z>len-fade)v*=(len-z)/fade;dv.setInt16(44+z*2,Math.max(-1,Math.min(1,v))*32767,true)}
  return new Blob([dv],{type:'audio/wav'});
}

/* ---------- хранилище файлов ---------- */
var mem=new Map(),urls=new Map(),dbp=null;
function idb(){
  if(dbp)return dbp;
  dbp=new Promise(function(res,rej){
    try{var r=indexedDB.open('sonar',1);r.onupgradeneeded=function(){r.result.createObjectStore('blobs')};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}}catch(e){rej(e)}
  });
  return dbp;
}
function idbPut(k,b){return idb().then(function(db){return new Promise(function(res,rej){var tx=db.transaction('blobs','readwrite');tx.objectStore('blobs').put(b,k);tx.oncomplete=res;tx.onerror=function(){rej(tx.error)}})})}
function idbGet(k){return idb().then(function(db){return new Promise(function(res,rej){var r=db.transaction('blobs').objectStore('blobs').get(k);r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}})})}
function idbDel(k){return idb().then(function(db){return new Promise(function(res){var tx=db.transaction('blobs','readwrite');tx.objectStore('blobs').delete(k);tx.oncomplete=res;tx.onerror=res})}).catch(function(){})}

async function srcFor(t){
  if(urls.has(t.id))return urls.get(t.id);
  var blob;
  if(t.kind==='demo')blob=synth(DEF[t.di]);
  else if(t.demo)blob=synth(DEFP[t.di]);
  else{blob=mem.get(t.id);if(!blob){try{blob=await idbGet(t.id)}catch(e){}}}
  if(!blob)throw new Error('missing');
  var u=URL.createObjectURL(blob);urls.set(t.id,u);return u;
}

/* ---------- каталог ---------- */
var index=new Map();
function isDemo(t){return t.kind==='demo'||!!t.demo}
function libTracks(){return S.tracks.filter(function(t){return t.kind!=='podcast'}).concat(DEMOS)}
function allPods(){return [SAMPLE_POD].concat(S.pods)}
function podEps(pid){return S.tracks.filter(function(t){return t.podId===pid}).concat(pid==='pod-sample'?DEMO_EPS:[])}
function reindex(){index=new Map(S.tracks.concat(DEMOS,DEMO_EPS).map(function(t){return [t.id,t]}))}
function getTrack(id){return index.get(id)}
function isPlayable(t){return !!t&&(t.kind==='file'||t.kind==='demo'||t.kind==='podcast'||(t.kind==='soundcloud'&&t.scIndex!=null))}
function hasClip(t){return t.kind==='file'||t.kind==='spotify'||t.kind==='soundcloud'}
var SVC={spotify:'Spotify',soundcloud:'SoundCloud'};
var BADGE={file:'Файл',demo:'Демо',podcast:'Подкаст',spotify:'Spotify',soundcloud:'SoundCloud'};
function cover(t){
  var h=hash(t.title+'|'+t.artist)%360,h2=(h+55)%360,sat=(t.kind==='spotify'||t.kind==='soundcloud')?45:80;
  return 'background:repeating-radial-gradient(circle at '+(20+h%60)+'% '+(25+h%50)+'%,transparent 0 7px,rgba(255,255,255,.16) 7px 8px),linear-gradient(140deg,hsl('+h+' '+sat+'% 56%),hsl('+h2+' '+sat+'% 30%))';
}
function ytUrl(t){
  var unknown=t.artist==='Неизвестный исполнитель'||t.artist===SVC[t.kind];
  var q=(unknown?t.title:t.artist+' '+t.title)+' official video';
  return 'https://www.youtube.com/results?search_query='+encodeURIComponent(q);
}
reindex();

/* ---------- разбор ссылок ---------- */
function deslug(s){
  try{s=decodeURIComponent(s)}catch(e){}
  s=s.replace(/[-_]+/g,' ').trim();
  return s?s.charAt(0).toUpperCase()+s.slice(1):s;
}
var KIND_RU={playlist:'Плейлист',album:'Альбом',track:'Трек',artist:'Страница исполнителя',show:'Подкаст',episode:'Эпизод',other:'Ссылка'};
function parseUrl(q){
  q=q.trim();
  if(!q||/\s/.test(q))return null;
  if(!/^https?:\/\//i.test(q)){
    if(/^(open\.spotify\.com|spotify\.link|soundcloud\.com|m\.soundcloud\.com|on\.soundcloud\.com)\//i.test(q))q='https://'+q;
    else return null;
  }
  var u;try{u=new URL(q)}catch(e){return null}
  var h=u.hostname.replace(/^www\./,'').toLowerCase();
  var parts=u.pathname.split('/').filter(Boolean);
  u.searchParams.delete('si');
  var out={url:u.href.replace(/\?$/,'')};
  if(h==='open.spotify.com'||h==='spotify.link'||h==='spoti.fi'){
    if(parts[0]&&/^intl-/.test(parts[0]))parts.shift();
    var k=parts[0];
    out.service='spotify';
    out.kind=(k==='playlist'||k==='album'||k==='track'||k==='artist'||k==='show'||k==='episode')?k:'other';
    out.name=({playlist:'Плейлист Spotify',album:'Альбом Spotify',track:'Трек Spotify',artist:'Исполнитель Spotify',show:'Подкаст Spotify',episode:'Эпизод Spotify'})[out.kind]||'Список Spotify';
    out.titleGuess='';out.artistGuess='';
    return out;
  }
  if(h==='soundcloud.com'||h==='m.soundcloud.com'||h==='on.soundcloud.com'){
    out.service='soundcloud';
    out.titleGuess='';out.artistGuess='';
    if(h==='on.soundcloud.com'){out.kind='other';out.name='Список SoundCloud';return out}
    if(parts.length>=3&&parts[1]==='sets'){out.kind='playlist';out.name=deslug(parts[2]);out.artistGuess=deslug(parts[0])}
    else if(parts.length===2&&['sets','likes','reposts','tracks','albums','popular-tracks'].indexOf(parts[1])<0){out.kind='track';out.name=deslug(parts[1]);out.titleGuess=deslug(parts[1]);out.artistGuess=deslug(parts[0])}
    else if(parts.length>=1){out.kind='artist';out.name=deslug(parts[0])}
    else{out.kind='other';out.name='Список SoundCloud'}
    return out;
  }
  return null;
}

/* ---------- разбор вставленного текста ---------- */
var SEP=/\s+[-–—]\s+/;
var NOISE=[/^\d{1,3}$/,/^\d{1,2}:\d{2}(:\d{2})?$/,/^[\d\s.,]+[KMКМкм]?$/,/^\d{4}-\d{2}-\d{2}$/,/^\d{1,2}\s+\S+\.?\s+\d{4}/,/^\S{3,9}\.?\s+\d{1,2},\s+\d{4}$/,/^\d+\s+(дн|нед|мес|лет|day|week|month|year|час|hour|мин|min)/i,/^(E|#|Название|Title|Album|Альбом|Date added|Дата добавления|Исполнитель|Artist)$/i];
function parseText(text,f,swap){
  var raw=text.split(/\r?\n/).map(function(s){return s.trim()}).filter(Boolean),items=[];
  if(!raw.length)return items;
  var mode=f;
  if(mode==='auto'){var n=raw.filter(function(l){return SEP.test(l)}).length;mode=n>=raw.length*.5?'dashA':'l2'}
  if(mode==='dashA'||mode==='dashT'){
    raw.forEach(function(l){
      if(!SEP.test(l))return;
      var p=l.split(SEP),a=p[0].trim(),b=p.slice(1).join(' - ').trim();
      if(!a||!b)return;
      items.push(mode==='dashA'?{artist:a,title:b}:{title:a,artist:b});
    });
  }else{
    var clean=raw.filter(function(l){return !NOISE.some(function(r){return r.test(l)})});
    var N=mode==='l3'?3:2;
    for(var i=0;i+N<=clean.length;i+=N)items.push({title:clean[i],artist:clean[i+1]});
  }
  if(swap)items=items.map(function(x){return {title:x.artist,artist:x.title}});
  return items.slice(0,500);
}

/* ---------- плеер ---------- */
var audio=new Audio();audio.preload='auto';
/* iOS разрешает звук только после касания: разблокируем плеер первым касанием */
var SILENT='data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
(function(){
  var done=false,evs=['touchend','click','keydown'];
  function unlock(){
    if(done)return;done=true;
    evs.forEach(function(ev){document.removeEventListener(ev,unlock,true)});
    if(audio.getAttribute('src'))return;
    audio.src=SILENT;
    var pr=audio.play();
    if(pr&&pr.then)pr.then(function(){
      if(audio.getAttribute('src')===SILENT){audio.pause();audio.removeAttribute('src')}
    }).catch(function(){});
  }
  evs.forEach(function(ev){document.addEventListener(ev,unlock,true)});
})();

var queue=[],curId=null,playing=false,token=0,toastT,pendingSeek=0,lastPos=0;
var RATES=[1,1.25,1.5,1.75,2];

/* ---------- SoundCloud (официальный виджет) ---------- */
var engine='audio',scw=null,scUrl=null,scPos=0,scMuted=false;
function scShow(v){$('#scDock').hidden=!v}
function scBind(){
  var E=SC.Widget.Events;
  [E.PLAY,E.PAUSE,E.FINISH,E.PLAY_PROGRESS].forEach(function(ev){scw.unbind(ev)});
  scw.bind(E.PLAY,function(){if(engine!=='sc')return;playing=true;renderPlayer();scSync()});
  scw.bind(E.PAUSE,function(){if(engine!=='sc')return;playing=false;renderPlayer()});
  scw.bind(E.FINISH,function(){if(engine!=='sc')return;step(1,true)});
  scw.bind(E.PLAY_PROGRESS,function(e){if(engine!=='sc')return;scPos=e.currentPosition/1000;updateTime()});
}
function scEnsure(url){
  return new Promise(function(res,rej){
    if(typeof SC==='undefined'){rej(new Error('sc'));return}
    var done=false,timer=setTimeout(function(){if(!done){done=true;rej(new Error('timeout'))}},15000);
    function ready(){if(done)return;done=true;clearTimeout(timer);scUrl=url;scBind();res(scw)}
    if(!scw){
      var frame=$('#scFrame');
      frame.src='https://w.soundcloud.com/player/?url='+encodeURIComponent(url)+'&auto_play=false&hide_related=true&show_comments=false&visual=false';
      scw=SC.Widget(frame);
      scw.bind(SC.Widget.Events.READY,ready);
    }else if(scUrl===url){done=true;clearTimeout(timer);res(scw)}
    else scw.load(url,{auto_play:false,hide_related:true,show_comments:false,visual:false,callback:ready});
  });
}
function scSync(){
  if(!scw)return;
  scw.getCurrentSoundIndex(function(i){
    var src=S.sources.filter(function(s){return s.url===scUrl})[0];
    if(!src)return;
    var t=S.tracks.filter(function(x){return x.srcId===src.id&&x.scIndex===i})[0];
    if(t&&t.id!==curId){curId=t.id;renderPlayer();renderContent()}
  });
}
function scFetchSounds(url){
  return scEnsure(url).then(function(w){
    return new Promise(function(res,rej){
      var t=setTimeout(function(){rej(new Error('timeout'))},8000);
      w.getSounds(function(list){clearTimeout(t);res(list||[])});
    });
  });
}
async function playSC(t,my){
  engine='sc';audio.pause();audio.removeAttribute('src');
  var src=S.sources.filter(function(s){return s.id===t.srcId})[0];
  if(!src){toast('Источник трека не найден');return}
  scShow(true);scPos=0;playing=false;renderPlayer();
  try{
    await scEnsure(src.url);
    if(my!==token)return;
    scw.setVolume(scMuted?0:S.vol*100);
    scw.skip(t.scIndex);
    setTimeout(function(){if(my===token&&scw)scw.play()},400);
  }catch(e){
    if(my===token)toast('Не удалось загрузить SoundCloud. Проверьте подключение к интернету.');
  }
}
function leaveSC(){try{if(scw)scw.pause()}catch(e){}engine='audio';scShow(false);scPos=0}
function halt(){
  if(engine==='sc'){try{scw.pause()}catch(e){}}
  else{audio.pause();audio.currentTime=0}
}
function toast(m){var el=$('#toast');el.textContent=m;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('show')},3400)}

async function playTrack(id,list){
  var t=getTrack(id);if(!isPlayable(t))return;
  if(list){queue=list.filter(function(x){return isPlayable(getTrack(x))})}
  if(queue.indexOf(id)<0)queue=[id].concat(queue);
  var my=++token;curId=id;
  renderPlayer();renderContent();
  if(t.kind==='soundcloud'){await playSC(t,my);return}
  if(engine==='sc')leaveSC();
  try{
    var u=await srcFor(t);
    if(my!==token)return;
    var pod=t.kind==='podcast',rate=pod?S.rate:1;
    pendingSeek=pod?(S.pos[id]||0):0;
    audio.defaultPlaybackRate=rate;
    audio.src=u;
    audio.playbackRate=rate;
    await audio.play();
  }catch(e){
    if(my!==token||(e&&e.name==='AbortError'))return;
    toast(e&&e.message==='missing'?'Файл не найден в браузере. Загрузите его заново.':'Не удалось воспроизвести «'+t.title+'»');
  }
  if(my===token)setMedia(t);
}
function toggle(){
  if(!curId){
    var v=currentView(),first=(v.tracks||[]).filter(function(t){return isPlayable(t)})[0];
    if(first)playTrack(first.id,v.tracks.map(function(t){return t.id}));
    return;
  }
  if(engine==='sc'){if(scw)scw.toggle();return}
  if(audio.paused)audio.play().catch(function(){});else audio.pause();
}
function step(dir,auto){
  if(!queue.length)return;
  var cur=getTrack(curId),pod=cur&&cur.kind==='podcast';
  if(auto&&S.repeat==='one'&&!pod){if(engine==='sc'){scw.seekTo(0);scw.play()}else{audio.currentTime=0;audio.play().catch(function(){})}return}
  var qi=queue.indexOf(curId),n;
  if(S.shuffle&&!pod&&queue.length>1){do{n=Math.floor(Math.random()*queue.length)}while(n===qi)}
  else{
    n=qi+dir;
    if(n>=queue.length){if((S.repeat==='all'&&!pod)||!auto)n=0;else{halt();return}}
    if(n<0)n=queue.length-1;
  }
  playTrack(queue[n]);
}
function setMedia(t){
  if(!('mediaSession' in navigator))return;
  try{navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist})}catch(e){}
}
try{
  if('mediaSession' in navigator){
    navigator.mediaSession.setActionHandler('play',function(){audio.play()});
    navigator.mediaSession.setActionHandler('pause',function(){audio.pause()});
    navigator.mediaSession.setActionHandler('previoustrack',function(){prev()});
    navigator.mediaSession.setActionHandler('nexttrack',function(){step(1,false)});
  }
}catch(e){}
function prev(){
  if(engine==='sc'){if(scPos>3){scw.seekTo(0)}else step(-1,false);return}
  if(audio.currentTime>3){audio.currentTime=0}else step(-1,false);
}

audio.addEventListener('play',function(){if(engine!=='audio')return;playing=true;renderPlayer()});
audio.addEventListener('pause',function(){if(engine!=='audio')return;playing=false;renderPlayer()});
audio.addEventListener('ended',function(){
  if(engine!=='audio')return;
  var t=getTrack(curId);
  if(t&&t.kind==='podcast'){delete S.pos[t.id];save()}
  step(1,true);
});
audio.addEventListener('timeupdate',function(){
  if(engine!=='audio')return;
  updateTime();
  var t=getTrack(curId);
  if(t&&t.kind==='podcast'&&Date.now()-lastPos>4000){lastPos=Date.now();S.pos[t.id]=Math.floor(audio.currentTime);save()}
});
audio.addEventListener('loadedmetadata',function(){
  if(engine!=='audio')return;
  var t=getTrack(curId);
  if(pendingSeek&&isFinite(audio.duration)&&audio.duration-pendingSeek>8)audio.currentTime=pendingSeek;
  pendingSeek=0;
  if(t&&!t.dur&&isFinite(audio.duration)&&!isDemo(t)){t.dur=audio.duration;save();renderContent()}
  updateTime();
});
audio.addEventListener('error',function(){if(audio.getAttribute('src'))toast('Не удалось воспроизвести файл. Возможно, браузер не поддерживает этот формат.')});

function setFill(el){el.style.setProperty('--p',(el.value-el.min)/(el.max-el.min)*100+'%')}
function updateTime(){
  var t=getTrack(curId),sc=engine==='sc',d=sc?((t&&t.dur)||0):audio.duration,c=sc?scPos:audio.currentTime,seek=$('#seek');
  seek.value=isFinite(d)&&d>0?c/d*1000:0;setFill(seek);
  $('#tCur').textContent=fmt(c);
  $('#tDur').textContent=isFinite(d)&&d>0?fmt(d):(t&&t.dur?fmt(t.dur):'0:00');
}
function renderPlayer(){
  var t=curId?getTrack(curId):null,pod=!!t&&t.kind==='podcast';
  $('#npTitle').textContent=t?t.title:'Ничего не играет';
  $('#npArtist').textContent=t?t.artist:'Выберите трек в списке';
  $('#npCover').style.cssText=t?cover(t):'';
  var fav=t&&S.favs.indexOf(t.id)>=0,nf=$('#npFav');
  nf.innerHTML=ic(fav?'heartOn':'heart',20);nf.classList.toggle('on',!!fav);nf.disabled=!t;
  var yt=$('#npYt');
  if(t&&hasClip(t)){yt.href=ytUrl(t);yt.innerHTML=ic('video',20);yt.hidden=false}else yt.hidden=true;
  $('#bPlay').innerHTML=ic(playing?'pause':'play',24);
  $('#bPlay').setAttribute('aria-label',playing?'Пауза':'Играть');
  var sh=$('#bShuffle');sh.classList.toggle('on',S.shuffle);sh.setAttribute('aria-pressed',S.shuffle?'true':'false');sh.hidden=pod;
  var rp=$('#bRepeat');rp.innerHTML=ic('repeat',18)+(S.repeat==='one'?'<span class="one">1</span>':'');
  rp.classList.toggle('on',S.repeat!=='off');rp.hidden=pod;
  rp.setAttribute('aria-label',S.repeat==='off'?'Повтор выключен':S.repeat==='all'?'Повторять всё':'Повторять трек');
  $('#bBack').hidden=!pod;$('#bFwd').hidden=!pod;$('#bSpeed').hidden=!pod;
  $('#bSpeed').textContent=S.rate+'×';
  $('#bMute').innerHTML=ic(((engine==='sc'?scMuted:audio.muted)||S.vol===0)?'mute':'vol',20);
  document.body.classList.toggle('is-playing',playing);
}

/* ---------- представления ---------- */
function totalLabel(tracks){
  var s=tracks.reduce(function(a,t){return a+(t.dur||0)},0);
  return plural(tracks.length,['трек','трека','треков'])+(s>=60?' · '+Math.round(s/60)+' мин':'');
}
function currentView(){
  var q=S.q.trim();
  if(q&&!draft){
    var ql=q.toLowerCase();
    var res=Array.from(index.values()).filter(function(t){return (t.title+' '+t.artist).toLowerCase().indexOf(ql)>=0});
    return {type:'search',title:'Результаты',sub:'«'+q+'» · '+totalLabel(res),tracks:res};
  }
  var v=S.view;
  if(v.type==='favs'){
    var f=S.favs.map(getTrack).filter(Boolean);
    return {type:'favs',title:'Любимые',sub:totalLabel(f),tracks:f};
  }
  if(v.type==='playlist'){
    var pl=S.playlists.filter(function(p){return p.id===v.id})[0];
    if(pl){var tr=pl.trackIds.map(getTrack).filter(Boolean);return {type:'playlist',title:pl.name,sub:totalLabel(tr),tracks:tr,pl:pl}}
  }
  if(v.type==='source'){
    var src=S.sources.filter(function(s){return s.id===v.id})[0];
    if(src){var st=S.tracks.filter(function(t){return t.srcId===src.id});return {type:'source',title:src.name,sub:SVC[src.service]+' · '+totalLabel(st),tracks:st,src:src}}
  }
  if(v.type==='pod'){
    var pod=allPods().filter(function(p){return p.id===v.id})[0];
    if(pod){var eps=podEps(pod.id);return {type:'pod',title:pod.name,sub:pod.host+' · '+plural(eps.length,['эпизод','эпизода','эпизодов']),tracks:eps,pod:pod}}
  }
  var all=libTracks();
  return {type:'all',title:'Все треки',sub:totalLabel(all),tracks:all};
}

var draft=null,armed=null,armedT,creatingPl=false;
var composerOpen=false,podFormOpen=false,openC={},cd={},nd={nick:'',tag:'rumor',title:'',text:''},pd={name:'',host:''},subPlan='month',epTarget=null;
function arm(k){armed=k;clearTimeout(armedT);armedT=setTimeout(function(){armed=null;renderContent(true)},3000);renderContent(true)}

function renderSide(){
  var v=S.view,searching=!!S.q.trim();
  function item(type,id,label,count,pre,color){
    var act=!searching&&(v.type===type||(type==='podcasts'&&v.type==='pod'))&&(id==null||v.id===id);
    return '<button class="nav'+(act?' active':'')+'" data-nav="'+type+'"'+(id?' data-id="'+id+'"':'')+' style="--c:var(--'+color+')"><span class="ni">'+pre+'</span><span class="nl">'+esc(label)+'</span><span class="cnt">'+count+'</span></button>';
  }
  var h='<div class="brand"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8M4.8 4.8a10.2 10.2 0 0 0 0 14.4M19.2 4.8a10.2 10.2 0 0 1 0 14.4"/></svg>Sonar</div>';
  h+='<div class="grp">'+item('all',null,'Все треки',libTracks().length,ic('lib',18),'pink')+item('favs',null,'Любимые',S.favs.filter(getTrack).length,ic('heart',18),'pink')+'</div>';
  h+='<div class="sec-title">Открыть</div><div class="grp">'+item('news',null,'Новости',S.news.length,ic('news',18),'yellow')+item('podcasts',null,'Подкасты',allPods().length,ic('mic',18),'cyan')+'</div>';
  h+='<div class="sec-title">Плейлисты</div><div class="grp">';
  S.playlists.forEach(function(p){h+=item('playlist',p.id,p.name,p.trackIds.filter(getTrack).length,ic('list',18),'lime')});
  h+=creatingPl?'<input class="newpl" id="newPl" type="text" maxlength="60" placeholder="Название плейлиста" aria-label="Название плейлиста">':'<button class="nav add" data-newpl="1" style="--c:var(--lime)"><span class="ni">'+ic('plus',18)+'</span><span class="nl">Новый плейлист</span></button>';
  h+='</div>';
  if(S.sources.length){
    h+='<div class="sec-title">Импорт</div><div class="grp">';
    S.sources.forEach(function(s){h+=item('source',s.id,s.name,S.tracks.filter(function(t){return t.srcId===s.id}).length,'<span class="dot '+s.service+'"></span>','cyan')});
    h+='</div>';
  }
  h+='<div class="promo"><b>SonarArtist+</b>'+(S.sub?'<span>Подписка активна. Значок артиста и закрепы включены.</span><button class="btn sm" data-sub="1">Управлять</button>':'<span>Значок артиста, закреп постов и загрузка без лимита.</span><button class="btn sm" data-sub="1">Подробнее</button>')+'</div>';
  $('#side').innerHTML=h;
  $('#subLbl').textContent=S.sub?'Artist+ ✓':'SonarArtist+';
}

function rowHtml(t,i,v){
  var cur=t.id===curId,playable=isPlayable(t),fav=S.favs.indexOf(t.id)>=0;
  var idx=playable
    ?'<button class="idx" data-act="play" aria-label="Играть: '+esc(t.title)+'"><span class="num">'+(i+1)+'</span><span class="ico">'+ic(cur&&playing?'pause':'play',16)+'</span><span class="eq"><i></i><i></i><i></i></span></button>'
    :'<a class="idx" href="'+esc(t.url)+'" target="_blank" rel="noopener" aria-label="Открыть в '+SVC[t.kind]+'">'+ic('link',16)+'</a>';
  var acts='<button class="icon-btn'+(fav?' on':' hid')+'" data-act="fav" aria-label="'+(fav?'Убрать из любимых':'В любимые')+'">'+ic(fav?'heartOn':'heart',17)+'</button>'
    +'<button class="icon-btn hid" data-act="addpl" aria-label="В плейлист">'+ic('plus',17)+'</button>';
  if(hasClip(t))acts+='<a class="icon-btn yt'+(playable?' hid':'')+'" href="'+esc(ytUrl(t))+'" target="_blank" rel="noopener" aria-label="Найти клип на YouTube" title="Найти клип на YouTube">'+ic('video',17)+'</a>';
  if(v.type==='playlist')acts+='<button class="icon-btn hid" data-act="rmpl" aria-label="Убрать из плейлиста">'+ic('minus',17)+'</button>';
  else if(!isDemo(t)){
    acts+=armed==='t:'+t.id
      ?'<button class="btn danger sm" data-act="del">Удалить?</button>'
      :'<button class="icon-btn hid" data-act="del" aria-label="Удалить">'+ic('trash',17)+'</button>';
  }
  var pos=t.kind==='podcast'?(S.pos[t.id]||0):0;
  var bar=pos>0&&t.dur?'<div class="pbar"><i style="width:'+Math.min(100,pos/t.dur*100)+'%"></i></div>':'';
  return '<div class="row'+(cur?' cur':'')+'" data-id="'+t.id+'">'+idx
    +'<div class="tmain"><div class="cover" style="'+cover(t)+'"></div><div class="ttxt"><div class="ttitle">'+esc(t.title)+'</div><div class="tart">'+esc(t.artist)+'</div>'+bar+'</div></div>'
    +'<span class="badge '+t.kind+'">'+BADGE[t.kind]+'</span>'
    +'<span class="dur">'+(t.dur?fmt(t.dur):'')+'</span>'
    +'<div class="acts">'+acts+'</div></div>';
}
function emptyHtml(v){
  if(v.type==='favs')return '<div class="empty"><strong>Пока ничего нет</strong>Нажмите на сердечко у трека, и он появится здесь.</div>';
  if(v.type==='playlist')return '<div class="empty"><strong>Плейлист пуст</strong>Нажмите «+» у любого трека и выберите этот плейлист.</div>';
  if(v.type==='pod')return '<div class="empty"><strong>Эпизодов пока нет</strong>Нажмите «Добавить эпизоды» и выберите аудиофайлы.</div>';
  if(v.type==='search')return '<div class="empty"><strong>Ничего не найдено</strong>Попробуйте другое слово. Чтобы импортировать список, вставьте в эту строку ссылку на плейлист Spotify или SoundCloud.</div>';
  return '<div class="empty"><strong>Здесь пока пусто</strong></div>';
}

/* --- новости --- */
function avatar(name,cls){
  var h=hash(name)%360;
  return '<div class="av" style="background:hsl('+h+' 85% 62%)">'+esc((name.trim().charAt(0)||'?').toUpperCase())+'</div>';
}
var TAGS={rumor:'Слух',release:'Релиз',tour:'Тур',talk:'Обсуждение'};
function postHtml(p){
  var likes=p.likes+(p.liked?1:0),open=!!openC[p.id];
  var notes='';
  if(p.sample)notes+='<span class="note">Пример · вымышленные артисты</span>';
  if(p.tag==='rumor')notes+='<span class="note">Не подтверждено</span>';
  var h='<article class="post'+(p.pinned?' pinned':'')+'" data-post="'+p.id+'">'
    +'<div class="prow">'+avatar(p.author)+'<div class="who"><b>'+esc(p.author)+(p.apl?' <span class="apl">ARTIST+</span>':'')+'</b><small>'+ago(p.ts)+(p.pinned?' · закреплено':'')+'</small></div><span class="tag '+p.tag+'">'+TAGS[p.tag]+'</span></div>'
    +'<h3 class="ptitle">'+esc(p.title)+'</h3><p class="ptext">'+esc(p.text)+'</p>'
    +(notes?'<div class="notes">'+notes+'</div>':'')
    +'<div class="pfoot"><button class="cb'+(p.liked?' on':'')+'" data-act="like" aria-pressed="'+(p.liked?'true':'false')+'">'+ic(p.liked?'heartOn':'heart',16)+'<span>'+likes+'</span></button>'
    +'<button class="cb'+(open?' on':'')+'" data-act="cmts" aria-expanded="'+(open?'true':'false')+'">'+ic('chat',16)+'<span>'+p.comments.length+'</span></button>';
  if(p.me&&S.sub)h+='<button class="cb pin'+(p.pinned?' on':'')+'" data-act="pin">'+ic('pin',16)+'<span>'+(p.pinned?'Открепить':'Закрепить')+'</span></button>';
  if(p.me)h+=armed==='n:'+p.id?'<button class="btn danger sm cb right" data-act="delpost" style="height:36px">Удалить?</button>':'<button class="cb right" data-act="delpost" aria-label="Удалить пост">'+ic('trash',16)+'</button>';
  h+='</div>';
  if(open){
    h+='<div class="cmts">';
    p.comments.forEach(function(c){
      h+='<div class="cm">'+avatar(c.author)+'<div class="cb2"><b>'+esc(c.author)+'</b>'+(c.apl?' <span class="apl">ARTIST+</span>':'')+' <small>'+ago(c.ts)+'</small><p>'+esc(c.text)+'</p></div></div>';
    });
    h+='<div class="cform"><input type="text" data-cd="'+p.id+'" maxlength="300" placeholder="Ваш комментарий" aria-label="Комментарий" value="'+esc(cd[p.id]||'')+'"><button class="btn primary" data-act="sendc">Отправить</button></div></div>';
  }
  return h+'</article>';
}
function composerHtml(){
  var opts=Object.keys(TAGS).map(function(k){return '<option value="'+k+'"'+(nd.tag===k?' selected':'')+'>'+TAGS[k]+'</option>'}).join('');
  return '<div class="post">'
    +'<div class="fld"><span>Ваше имя</span><input type="text" data-nd="nick" maxlength="30" placeholder="Как вас подписать" value="'+esc(nd.nick||S.nick)+'"></div>'
    +'<div class="fld"><span>Тип поста</span><select data-nd="tag">'+opts+'</select></div>'
    +'<div class="fld"><span>Заголовок</span><input type="text" data-nd="title" maxlength="120" value="'+esc(nd.title)+'"></div>'
    +'<div class="fld"><span>Текст</span><textarea class="t" data-nd="text" maxlength="1000">'+esc(nd.text)+'</textarea></div>'
    +'<p class="fine">Посты типа «Слух» автоматически помечаются как неподтверждённые.</p>'
    +'<div class="imp-btns"><button class="btn primary" data-act="publish">Опубликовать</button></div></div>';
}
function renderNews(c){
  var posts=S.news.slice().sort(function(a,b){return (b.pinned?1:0)-(a.pinned?1:0)||b.ts-a.ts});
  var h='<div class="vhead"><div class="vtitle"><h1>Новости</h1><p class="sub">Релизы, туры и слухи. Посты пишут пользователи. Примеры с вымышленными артистами помечены.</p></div><div class="vact"><button class="btn gold" data-act="newpost">'+ic(composerOpen?'x':'plus',16)+'<span>'+(composerOpen?'Закрыть':'Написать пост')+'</span></button></div></div><div class="wall">';
  if(composerOpen)h+=composerHtml();
  posts.forEach(function(p){h+=postHtml(p)});
  c.innerHTML=h+'</div>';
}

/* --- подкасты --- */
function podCard(p){
  var n=podEps(p.id).length;
  return '<button class="pod" data-openpod="'+p.id+'"><div class="cover" style="'+cover({title:p.name,artist:p.host,kind:'podcast'})+'"></div><div class="ttxt"><div class="ttitle">'+esc(p.name)+'</div><div class="tart">'+esc(p.host)+' · '+plural(n,['эпизод','эпизода','эпизодов'])+'</div></div></button>';
}
function renderPods(c){
  var pods=allPods();
  var h='<div class="vhead"><div class="vtitle"><h1>Подкасты</h1><p class="sub">Создайте подкаст и добавьте эпизоды файлами. Скорость и место остановки запоминаются.</p></div><div class="vact"><button class="btn cyan" data-act="newpod">'+ic(podFormOpen?'x':'plus',16)+'<span>'+(podFormOpen?'Закрыть':'Новый подкаст')+'</span></button></div></div>';
  if(podFormOpen)h+='<div class="formcard"><div class="fld"><span>Название подкаста</span><input type="text" data-pd="name" maxlength="80" value="'+esc(pd.name)+'"></div><div class="fld"><span>Ведущий</span><input type="text" data-pd="host" maxlength="60" value="'+esc(pd.host)+'"></div><div class="imp-btns"><button class="btn primary" data-act="createpod">Создать</button></div></div>';
  h+='<div class="pods">'+pods.map(podCard).join('')+'</div>';
  c.innerHTML=h;
}

function renderContent(force){
  var c=$('#content');
  if(draft){
    if(c.dataset.mode==='import'&&!force)return;
    c.dataset.mode='import';buildImport(c);return;
  }
  var special=!S.q.trim()&&(S.view.type==='news'||S.view.type==='podcasts')?S.view.type:null;
  if(special){
    if(c.dataset.mode===special&&!force)return;
    c.dataset.mode=special;
    if(special==='news')renderNews(c);else renderPods(c);
    return;
  }
  c.dataset.mode='list';
  var v=currentView(),tracks=v.tracks,acts='';
  if(tracks.some(isPlayable))acts+='<button class="btn primary" data-act="playall">'+ic('play',16)+'<span>Играть</span></button>';
  if(v.type==='source'){
    acts+='<a class="btn" href="'+esc(v.src.url)+'" target="_blank" rel="noopener">'+ic('link',16)+'<span>Открыть в '+SVC[v.src.service]+'</span></a>';
    acts+=armed==='s:'+v.src.id?'<button class="btn danger" data-act="delsrc">Точно удалить?</button>':'<button class="btn" data-act="delsrc">'+ic('trash',16)+'<span>Удалить список</span></button>';
  }
  if(v.type==='playlist'){
    acts+=armed==='p:'+v.pl.id?'<button class="btn danger" data-act="delpl">Точно удалить?</button>':'<button class="btn" data-act="delpl">'+ic('trash',16)+'<span>Удалить плейлист</span></button>';
  }
  if(v.type==='pod'&&!v.pod.sample){
    acts+='<button class="btn cyan" data-act="addep">'+ic('upload',16)+'<span>Добавить эпизоды</span></button>';
    acts+=armed==='d:'+v.pod.id?'<button class="btn danger" data-act="delpod">Точно удалить?</button>':'<button class="btn" data-act="delpod">'+ic('trash',16)+'<span>Удалить подкаст</span></button>';
  }
  var dz=(v.type==='all'&&!S.tracks.some(function(t){return t.kind==='file'}))
    ?'<div class="dz"><div><strong>Добавьте свою музыку</strong><span>Нажмите кнопку и выберите аудиофайлы. Они хранятся только на этом устройстве.</span></div><button class="btn primary" data-act="upload">'+ic('upload',16)+'<span>Загрузить файлы</span></button></div>':'';
  var body=tracks.length?'<div class="list">'+tracks.map(function(t,i){return rowHtml(t,i,v)}).join('')+'</div>':emptyHtml(v);
  c.innerHTML='<div class="vhead"><div class="vtitle"><h1>'+esc(v.title)+'</h1><p class="sub">'+esc(v.sub)+'</p></div><div class="vact">'+acts+'</div></div>'+dz+body;
}

/* ---------- импорт по ссылке ---------- */
function buildImport(c){
  var d=draft,svc=SVC[d.service];
  c.innerHTML='<section class="imp">'
    +'<div class="imp-head"><span class="chip '+d.service+'">'+svc+'</span><h1>Ссылка распознана</h1></div>'
    +'<p>'+esc(KIND_RU[d.kind])+' на '+svc+'. <a href="'+esc(d.url)+'" target="_blank" rel="noopener">Открыть страницу</a></p>'
    +(d.service==='soundcloud'?'<p class="imp-note">Нажмите кнопку, и Sonar получит список треков через виджет SoundCloud. Эти треки играют прямо в Sonar, а виджет SoundCloud показывается над плеером. Если не получилось, вставьте текст списка вручную ниже.</p><div class="imp-btns"><button class="btn cyan" id="impAuto">Загрузить треки из SoundCloud</button><span class="fine" id="impStat" role="status"></span></div>':'<p class="imp-note">Spotify не даёт читать список с этой страницы. Откройте ссылку, выделите список (Ctrl+A), скопируйте и вставьте текст ниже. У каждого трека будет кнопка поиска клипа на YouTube, а играют здесь загруженные файлы.</p>')
    +'<label class="fld"><span>Название списка</span><input id="impName" type="text" maxlength="80" value="'+esc(d.name)+'"></label>'
    +'<label class="fld"><span>Скопированный текст</span><textarea id="impText" placeholder="Исполнитель — Название&#10;Исполнитель — Название"></textarea></label>'
    +'<div class="imp-opts"><label class="fld"><span>Как записаны треки</span><select id="impFmt">'
    +'<option value="auto">Определить автоматически</option>'
    +'<option value="dashA">Исполнитель — Название, в одной строке</option>'
    +'<option value="dashT">Название — Исполнитель, в одной строке</option>'
    +'<option value="l2">Название и исполнитель на соседних строках</option>'
    +'<option value="l3">Название, исполнитель и альбом на трёх строках</option>'
    +'</select></label>'
    +'<label class="chk"><input type="checkbox" id="impSwap">Поменять название и исполнителя местами</label></div>'
    +'<div class="imp-prev" id="impPrev"></div>'
    +'<div class="imp-btns"><button class="btn primary" id="impAdd"></button><button class="btn" id="impCancel">Отмена</button></div>'
    +'</section>';
  function upd(){
    if(!($('#impText').value.trim())&&d.auto){}
    else{d.auto=false;d.items=parseText($('#impText').value,$('#impFmt').value,$('#impSwap').checked)}
    var n=d.items.length,pv=$('#impPrev'),add=$('#impAdd');
    if(!$('#impText').value.trim()&&!d.auto)pv.innerHTML='<span class="ph">Здесь появится список треков.</span>';
    else if(!n)pv.innerHTML='<span class="ph">Треки не найдены. Попробуйте другой вариант в поле «Как записаны треки».</span>';
    else pv.innerHTML='<strong>'+plural(n,['трек найден','трека найдено','треков найдено'])+'</strong><ol>'+d.items.slice(0,6).map(function(x){return '<li>'+esc(x.title)+' <span>· '+esc(x.artist)+'</span></li>'}).join('')+'</ol>'+(n>6?'<div class="ph" style="margin-top:6px">и ещё '+(n-6)+'</div>':'');
    if(n){add.disabled=false;add.textContent='Добавить '+plural(n,['трек','трека','треков'])}
    else if(d.kind==='track'){add.disabled=false;add.textContent='Добавить ссылку как один трек'}
    else{add.disabled=true;add.textContent='Добавить треки'}
  }
  ['impText','impFmt','impSwap'].forEach(function(id){$('#'+id).addEventListener('input',upd);$('#'+id).addEventListener('change',upd)});
  var auto=$('#impAuto');
  if(auto)auto.addEventListener('click',function(){
    var st=$('#impStat');auto.disabled=true;st.textContent='Загружаю список…';
    scFetchSounds(d.url).then(function(list){
      auto.disabled=false;
      if(!list.length){st.textContent='SoundCloud не вернул треков. Вставьте список вручную.';return}
      d.items=list.map(function(s,i){return {title:s.title||('Трек '+(i+1)),artist:(s.user&&s.user.username)||'SoundCloud',dur:(s.duration||0)/1000,scIndex:i,url:s.permalink_url}});
      d.auto=true;$('#impText').value='';st.textContent='Готово';upd();
    }).catch(function(){auto.disabled=false;st.textContent='Не удалось связаться с SoundCloud. Проверьте интернет или вставьте список вручную.'});
  });
  $('#impCancel').addEventListener('click',function(){clearSearch();renderAll()});
  $('#impAdd').addEventListener('click',commitImport);
  upd();
}
function commitImport(){
  var d=draft;if(!d)return;
  var items=d.items||[],svc=SVC[d.service];
  if(!items.length){
    if(d.kind==='track')items=[{title:d.titleGuess||('Трек '+svc),artist:d.artistGuess||svc}];
    else return;
  }
  var src={id:uid(),service:d.service,kind:d.kind,url:d.url,name:($('#impName').value.trim()||d.name)};
  S.sources.push(src);
  items.forEach(function(it){
    var tr={id:uid(),title:it.title,artist:it.artist,kind:d.service,srcId:src.id,url:it.url||d.url,dur:it.dur||0};
    if(it.scIndex!=null)tr.scIndex=it.scIndex;
    S.tracks.push(tr);
  });
  reindex();save();
  clearSearch();S.view={type:'source',id:src.id};
  renderAll();$('#content').scrollTop=0;
  toast('Добавлено: '+plural(items.length,['трек','трека','треков']));
}

/* ---------- действия ---------- */
function clearSearch(){S.q='';draft=null;$('#q').value='';$('#qClear').hidden=true}
function renderAll(){renderSide();renderContent(true);renderPlayer()}
function toggleFav(id){
  var i=S.favs.indexOf(id);
  if(i>=0)S.favs.splice(i,1);else S.favs.push(id);
  save();renderSide();renderContent(true);renderPlayer();
}
function createPlaylist(name,ids){
  var p={id:uid(),name:(name||'').trim()||('Плейлист '+(S.playlists.length+1)),trackIds:ids||[]};
  S.playlists.push(p);save();return p;
}
function removeTrack(id){
  var t=getTrack(id);if(!t||isDemo(t))return;
  S.tracks=S.tracks.filter(function(x){return x.id!==id});
  S.favs=S.favs.filter(function(x){return x!==id});
  S.playlists.forEach(function(p){p.trackIds=p.trackIds.filter(function(x){return x!==id})});
  queue=queue.filter(function(x){return x!==id});
  delete S.pos[id];
  if(t.kind==='file'||t.kind==='podcast'){mem.delete(id);idbDel(id);if(urls.has(id)){URL.revokeObjectURL(urls.get(id));urls.delete(id)}}
  if(t.srcId&&!S.tracks.some(function(x){return x.srcId===t.srcId})){
    S.sources=S.sources.filter(function(s){return s.id!==t.srcId});
    if(S.view.type==='source'&&S.view.id===t.srcId)S.view={type:'all'};
  }
  if(curId===id){token++;if(engine==='sc')leaveSC();audio.pause();audio.removeAttribute('src');audio.load();curId=null;playing=false}
  reindex();
}
function deleteTrack(id){removeTrack(id);save();renderAll();updateTime()}
function deleteSource(sid){
  S.tracks.filter(function(t){return t.srcId===sid}).forEach(function(t){removeTrack(t.id)});
  S.sources=S.sources.filter(function(s){return s.id!==sid});
  S.view={type:'all'};save();renderAll();
}
function deletePlaylist(pid){
  S.playlists=S.playlists.filter(function(p){return p.id!==pid});
  S.view={type:'all'};save();renderAll();
}
function deletePod(pid){
  S.tracks.filter(function(t){return t.podId===pid}).forEach(function(t){removeTrack(t.id)});
  S.pods=S.pods.filter(function(p){return p.id!==pid});
  S.view={type:'podcasts'};save();renderAll();updateTime();
}

var menuEl=null;
function closeMenu(){if(menuEl){menuEl.remove();menuEl=null}}
function openMenu(btn,id){
  closeMenu();
  var m=document.createElement('div');m.className='menu';m.setAttribute('role','menu');
  m.innerHTML=S.playlists.map(function(p){
    return '<button role="menuitem" data-pl="'+p.id+'"><span class="mn">'+esc(p.name)+'</span>'+(p.trackIds.indexOf(id)>=0?ic('check',16).replace('<svg','<svg class="ck"'):'')+'</button>';
  }).join('')+'<button role="menuitem" data-pl="__new">'+ic('plus',16)+'<span class="mn">Новый плейлист</span></button>';
  document.body.appendChild(m);
  var r=btn.getBoundingClientRect(),w=m.offsetWidth,h=m.offsetHeight;
  var left=Math.min(Math.max(8,r.right-w),innerWidth-w-8),top=r.bottom+4;
  if(top+h>innerHeight-8)top=Math.max(8,r.top-h-4);
  m.style.left=left+'px';m.style.top=top+'px';
  m.addEventListener('click',function(ev){
    var b=ev.target.closest('[data-pl]');if(!b)return;
    var pid=b.dataset.pl,p;
    if(pid==='__new'){p=createPlaylist(null,[id]);toast('Создан «'+p.name+'», трек добавлен')}
    else{
      p=S.playlists.filter(function(x){return x.id===pid})[0];if(!p)return;
      if(p.trackIds.indexOf(id)>=0){p.trackIds=p.trackIds.filter(function(x){return x!==id});toast('Убрано из «'+p.name+'»')}
      else{p.trackIds.push(id);toast('Добавлено в «'+p.name+'»')}
    }
    save();closeMenu();renderSide();renderContent();
  });
  menuEl=m;
}
document.addEventListener('pointerdown',function(e){if(menuEl&&!menuEl.contains(e.target)&&!e.target.closest('[data-act="addpl"]'))closeMenu()});
$('#content').addEventListener('scroll',closeMenu);

/* ---------- загрузка файлов ---------- */
function nameFromFile(n){
  n=n.replace(/\.[^.]+$/,'').replace(/_+/g,' ').replace(/^\d{1,3}[\s.\-_)]+(?=\S)/,'').trim();
  var p=n.split(SEP);
  if(p.length>1)return {artist:p[0].trim(),title:p.slice(1).join(' - ').trim()};
  return {artist:'Неизвестный исполнитель',title:n||'Без названия'};
}
function probeDuration(blob){
  return new Promise(function(res){
    var a=new Audio(),u=URL.createObjectURL(blob),done=false;
    function fin(v){if(done)return;done=true;URL.revokeObjectURL(u);res(v)}
    a.preload='metadata';
    a.addEventListener('loadedmetadata',function(){fin(isFinite(a.duration)?a.duration:0)});
    a.addEventListener('error',function(){fin(0)});
    setTimeout(function(){fin(0)},5000);
    a.src=u;
  });
}
function audioOnly(files){return Array.prototype.slice.call(files).filter(function(f){return /^audio\//.test(f.type)||/\.(mp3|m4a|aac|flac|wav|ogg|oga|opus|weba|webm)$/i.test(f.name)})}
async function storeFiles(list,make){
  var failed=false;
  for(var i=0;i<list.length;i++){
    var f=list[i],id=uid();
    mem.set(id,f);
    try{await idbPut(id,f)}catch(e){failed=true}
    var t=make(f,id);
    S.tracks.unshift(t);
    (function(tr,file){probeDuration(file).then(function(d){if(d){tr.dur=d;save();renderContent()}})})(t,f);
  }
  reindex();save();
  return failed;
}
async function addFiles(files){
  var list=audioOnly(files);
  if(!list.length){toast('Это не аудиофайлы. Подойдут mp3, m4a, flac, wav, ogg.');return}
  var have=S.tracks.filter(function(t){return t.kind==='file'}).length,limited=false;
  if(!S.sub){
    var room=FREE_LIMIT-have;
    if(room<=0){toast('Бесплатный лимит: '+FREE_LIMIT+' треков. SonarArtist+ снимает его.');openSub();return}
    if(list.length>room){list=list.slice(0,room);limited=true}
  }
  var failed=await storeFiles(list,function(f,id){var nm=nameFromFile(f.name);return {id:id,title:nm.title,artist:nm.artist,kind:'file',dur:0}});
  clearSearch();S.view={type:'all'};renderAll();$('#content').scrollTop=0;
  toast('Добавлено: '+plural(list.length,['трек','трека','треков'])+(limited?'. Остальные не поместились в бесплатный лимит':'')+(failed?'. Браузер не смог сохранить файлы, они пропадут после закрытия страницы':''));
}
async function addEpisodes(files,pid){
  var pod=S.pods.filter(function(p){return p.id===pid})[0];
  if(!pod)return;
  var list=audioOnly(files);
  if(!list.length){toast('Это не аудиофайлы. Подойдут mp3, m4a, flac, wav, ogg.');return}
  var failed=await storeFiles(list,function(f,id){
    var title=f.name.replace(/\.[^.]+$/,'').replace(/_+/g,' ').trim()||'Без названия';
    return {id:id,title:title,artist:pod.host,kind:'podcast',podId:pid,dur:0};
  });
  S.view={type:'pod',id:pid};clearSearch();renderAll();
  toast('Добавлено: '+plural(list.length,['эпизод','эпизода','эпизодов'])+(failed?'. Браузер не смог сохранить файлы, они пропадут после закрытия страницы':''));
}
var dragN=0;
function hasFiles(e){return e.dataTransfer&&Array.prototype.indexOf.call(e.dataTransfer.types||[],'Files')>=0}
addEventListener('dragenter',function(e){if(hasFiles(e)){dragN++;document.body.classList.add('drag')}});
addEventListener('dragleave',function(e){if(hasFiles(e)){dragN=Math.max(0,dragN-1);if(!dragN)document.body.classList.remove('drag')}});
addEventListener('dragover',function(e){if(hasFiles(e))e.preventDefault()});
addEventListener('drop',function(e){
  if(!hasFiles(e))return;
  e.preventDefault();dragN=0;document.body.classList.remove('drag');
  var pid=S.view.type==='pod'&&!S.q.trim()?S.view.id:null;
  if(pid&&S.pods.some(function(p){return p.id===pid}))addEpisodes(e.dataTransfer.files,pid);
  else addFiles(e.dataTransfer.files);
});

/* ---------- подписка SonarArtist+ ---------- */
function renderSub(){
  var m=$('#modal'),act=!!S.sub;
  var perks=['Золотой значок ARTIST+ на ваших постах и комментариях','Закрепление своего поста вверху новостей','Загрузка треков без лимита (в бесплатном плане до '+FREE_LIMIT+')'];
  var body='<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="subTitle">'
    +'<div class="top"><span class="apl big">SonarArtist+</span><button class="icon-btn" data-sub-close aria-label="Закрыть">'+ic('x',18)+'</button></div>'
    +'<h2 id="subTitle">Для тех, кто выпускает музыку</h2>'
    +'<ul class="perks">'+perks.map(function(p){return '<li>'+ic('check',18)+'<span>'+p+'</span></li>'}).join('')+'</ul>';
  if(act){
    body+='<div class="activebox"><b>Подписка активна</b><br><span>План: '+(S.sub.plan==='year'?'год':'месяц')+' · с '+new Date(S.sub.since).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})+'</span></div>'
      +'<button class="btn danger" data-sub-cancel>Отменить подписку</button>';
  }else{
    body+='<div class="plans"><button class="plan'+(subPlan==='month'?' sel':'')+'" data-plan="month"><span>Месяц</span><b>$4.99</b><span>в месяц</span></button>'
      +'<button class="plan'+(subPlan==='year'?' sel':'')+'" data-plan="year"><span>Год</span><b>$39.99</b><em>−33% к месячной оплате</em></button></div>'
      +'<button class="btn gold" data-sub-buy>'+ic('star',16)+'<span>Оформить '+(subPlan==='year'?'за $39.99 в год':'за $4.99 в месяц')+'</span></button>';
  }
  body+='<p class="fine">Демо-режим: оплата не подключена, деньги не списываются, цены условные. Подписка действует только в этом браузере.</p></div>';
  m.innerHTML=body;
}
function openSub(){renderSub();var m=$('#modal');m.classList.add('open');m.setAttribute('aria-hidden','false');var b=$('[data-sub-buy]',m)||$('[data-sub-close]',m);if(b)b.focus()}
function closeSub(){var m=$('#modal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}
$('#modal').addEventListener('click',function(e){
  if(e.target===this||e.target.closest('[data-sub-close]')){closeSub();return}
  var pl=e.target.closest('[data-plan]');
  if(pl){subPlan=pl.dataset.plan;renderSub();return}
  if(e.target.closest('[data-sub-buy]')){
    S.sub={plan:subPlan,since:Date.now()};save();renderSub();renderSide();renderContent(true);
    toast('SonarArtist+ включён (демо)');return;
  }
  if(e.target.closest('[data-sub-cancel]')){S.sub=null;save();renderSub();renderSide();renderContent(true);toast('Подписка отменена')}
});
$('#subBtn').addEventListener('click',openSub);

/* ---------- события интерфейса ---------- */
$('#upBtn').addEventListener('click',function(){$('#file').click()});
$('#file').addEventListener('change',function(e){if(e.target.files.length)addFiles(e.target.files);e.target.value=''});
$('#fileEp').addEventListener('change',function(e){if(e.target.files.length&&epTarget)addEpisodes(e.target.files,epTarget);e.target.value=''});

$('#q').addEventListener('input',function(){
  var v=this.value;S.q=v;$('#qClear').hidden=!v;
  var p=parseUrl(v);
  if(p){
    if(!draft||draft.url!==p.url){draft=p;draft.items=[];renderSide();renderContent(true)}
  }else{
    draft=null;renderSide();renderContent(true);
  }
});
$('#q').addEventListener('keydown',function(e){
  if(e.key==='Escape'){clearSearch();renderAll()}
  if(e.key==='Enter'&&draft){var t=$('#impText');if(t)t.focus()}
});
$('#qClear').addEventListener('click',function(){clearSearch();renderAll();$('#q').focus()});

$('#side').addEventListener('click',function(e){
  if(e.target.closest('[data-sub]')){openSub();return}
  var n=e.target.closest('[data-nav]');
  if(n){S.view={type:n.dataset.nav,id:n.dataset.id};clearSearch();renderAll();$('#content').scrollTop=0;return}
  if(e.target.closest('[data-newpl]')){creatingPl=true;renderSide();var i=$('#newPl');if(i)i.focus()}
});
$('#side').addEventListener('keydown',function(e){
  if(e.target.id!=='newPl')return;
  if(e.key==='Enter'){
    var p=createPlaylist(e.target.value);creatingPl=false;
    clearSearch();S.view={type:'playlist',id:p.id};renderAll();
  }else if(e.key==='Escape'){creatingPl=false;renderSide()}
});
$('#side').addEventListener('focusout',function(e){
  if(e.target.id!=='newPl'||!creatingPl)return;
  var val=e.target.value;creatingPl=false;
  if(val.trim()){var p=createPlaylist(val);clearSearch();S.view={type:'playlist',id:p.id};renderAll()}
  else renderSide();
});

function playRow(id){
  if(id===curId){toggle();return}
  playTrack(id,currentView().tracks.map(function(t){return t.id}));
}
function sendComment(pid){
  var p=S.news.filter(function(x){return x.id===pid})[0],text=(cd[pid]||'').trim();
  if(!p||!text)return;
  var name=(S.nick||'').trim()||'Вы';
  p.comments.push({id:uid(),me:true,author:name,text:text,ts:Date.now(),apl:!!S.sub});
  cd[pid]='';openC[pid]=true;save();renderContent(true);
  var i=$('[data-cd="'+pid+'"]');if(i)i.focus();
}
$('#content').addEventListener('input',function(e){
  var t=e.target;
  if(t.dataset.nd)nd[t.dataset.nd]=t.value;
  else if(t.dataset.cd)cd[t.dataset.cd]=t.value;
  else if(t.dataset.pd)pd[t.dataset.pd]=t.value;
});
$('#content').addEventListener('keydown',function(e){
  if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.cd){e.preventDefault();sendComment(e.target.dataset.cd)}
});
$('#content').addEventListener('click',function(e){
  if(e.target.closest('a'))return;
  var op=e.target.closest('[data-openpod]');
  if(op){S.view={type:'pod',id:op.dataset.openpod};clearSearch();renderAll();$('#content').scrollTop=0;return}
  var a=e.target.closest('[data-act]'),row=e.target.closest('.row');
  if(!a){if(row&&isPlayable(getTrack(row.dataset.id)))playRow(row.dataset.id);return}
  var act=a.dataset.act,id=row?row.dataset.id:null,v,post=e.target.closest('[data-post]'),pid=post?post.dataset.post:null;
  if(act==='play')playRow(id);
  else if(act==='playall'){v=currentView();var f=v.tracks.filter(isPlayable)[0];if(f)playTrack(f.id,v.tracks.map(function(t){return t.id}))}
  else if(act==='fav')toggleFav(id);
  else if(act==='addpl')openMenu(a,id);
  else if(act==='rmpl'){
    v=currentView();
    if(v.pl){v.pl.trackIds=v.pl.trackIds.filter(function(x){return x!==id});save();renderSide();renderContent(true)}
  }
  else if(act==='del'){if(armed!=='t:'+id)arm('t:'+id);else{armed=null;deleteTrack(id)}}
  else if(act==='delpl'){v=currentView();if(armed!=='p:'+v.pl.id)arm('p:'+v.pl.id);else{armed=null;deletePlaylist(v.pl.id)}}
  else if(act==='delsrc'){v=currentView();if(armed!=='s:'+v.src.id)arm('s:'+v.src.id);else{armed=null;deleteSource(v.src.id)}}
  else if(act==='delpod'){v=currentView();if(armed!=='d:'+v.pod.id)arm('d:'+v.pod.id);else{armed=null;deletePod(v.pod.id)}}
  else if(act==='upload')$('#file').click();
  else if(act==='addep'){v=currentView();if(v.pod){epTarget=v.pod.id;$('#fileEp').click()}}
  else if(act==='newpod'){podFormOpen=!podFormOpen;renderContent(true)}
  else if(act==='createpod'){
    var nm=pd.name.trim();
    if(nm.length<2){toast('Введите название подкаста');return}
    var pod={id:uid(),name:nm,host:pd.host.trim()||'Без ведущего'};
    S.pods.push(pod);pd={name:'',host:''};podFormOpen=false;save();
    S.view={type:'pod',id:pod.id};renderAll();toast('Подкаст создан. Добавьте эпизоды.');
  }
  else if(act==='newpost'){composerOpen=!composerOpen;renderContent(true)}
  else if(act==='publish'){
    var title=nd.title.trim(),text=nd.text.trim();
    if(title.length<3||!text){toast('Нужны заголовок и текст');return}
    S.nick=(nd.nick||S.nick||'').trim();
    S.news.unshift({id:uid(),me:true,author:S.nick||'Вы',tag:nd.tag,title:title,text:text,ts:Date.now(),likes:0,liked:false,comments:[],pinned:false,apl:!!S.sub});
    nd.title='';nd.text='';composerOpen=false;save();renderSide();renderContent(true);$('#content').scrollTop=0;
    toast(nd.tag==='rumor'?'Опубликовано с пометкой «Не подтверждено»':'Пост опубликован');
  }
  else if(act==='like'){var p=S.news.filter(function(x){return x.id===pid})[0];if(p){p.liked=!p.liked;save();renderContent(true)}}
  else if(act==='cmts'){openC[pid]=!openC[pid];renderContent(true)}
  else if(act==='sendc')sendComment(pid);
  else if(act==='pin'){var q=S.news.filter(function(x){return x.id===pid})[0];if(q&&S.sub){q.pinned=!q.pinned;save();renderContent(true)}}
  else if(act==='delpost'){if(armed!=='n:'+pid)arm('n:'+pid);else{armed=null;S.news=S.news.filter(function(x){return x.id!==pid});save();renderSide();renderContent(true)}}
});

$('#bPlay').addEventListener('click',toggle);
$('#bNext').addEventListener('click',function(){step(1,false)});
$('#bPrev').addEventListener('click',prev);
$('#bShuffle').addEventListener('click',function(){S.shuffle=!S.shuffle;save();renderPlayer()});
$('#bRepeat').addEventListener('click',function(){S.repeat=S.repeat==='off'?'all':S.repeat==='all'?'one':'off';save();renderPlayer()});
$('#bBack').addEventListener('click',function(){audio.currentTime=Math.max(0,audio.currentTime-15)});
$('#bFwd').addEventListener('click',function(){var d=audio.duration;audio.currentTime=isFinite(d)?Math.min(d,audio.currentTime+30):audio.currentTime+30});
$('#bSpeed').addEventListener('click',function(){
  var i=RATES.indexOf(S.rate);S.rate=RATES[(i+1)%RATES.length];
  audio.defaultPlaybackRate=S.rate;audio.playbackRate=S.rate;save();renderPlayer();
});
$('#npFav').addEventListener('click',function(){if(curId)toggleFav(curId)});
$('#seek').addEventListener('input',function(){
  setFill(this);
  if(engine==='sc'){
    var tt=getTrack(curId);
    if(scw&&tt&&tt.dur){scPos=this.value/1000*tt.dur;scw.seekTo(scPos*1000);$('#tCur').textContent=fmt(scPos)}
    return;
  }
  var d=audio.duration;
  if(isFinite(d)&&d>0){audio.currentTime=this.value/1000*d;$('#tCur').textContent=fmt(audio.currentTime)}
});
$('#vol').addEventListener('input',function(){
  S.vol=this.value/100;audio.volume=S.vol;if(S.vol>0)audio.muted=false;
  if(scw){scMuted=S.vol===0;scw.setVolume(S.vol*100)}
  setFill(this);save();renderPlayer();
});
$('#bMute').addEventListener('click',function(){
  if(engine==='sc'){scMuted=!scMuted;if(scw)scw.setVolume(scMuted?0:S.vol*100)}
  else audio.muted=!audio.muted;
  renderPlayer();
});

addEventListener('keydown',function(e){
  if(e.key==='Escape'&&$('#modal').classList.contains('open')){closeSub();return}
  var tg=e.target&&e.target.tagName;
  if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT'||tg==='BUTTON'||tg==='A')return;
  if(e.code==='Space'){e.preventDefault();toggle()}
  else if(e.key==='Escape')closeMenu();
});

/* ---------- старт ---------- */
if(window.matchMedia&&matchMedia('(max-width:760px)').matches)$('#q').placeholder='Поиск или ссылка';
$('#siIcon').innerHTML=ic('search',18);
$('#qClear').innerHTML=ic('x',16);
$('#upIcon').innerHTML=ic('upload',18);
$('#subIcon').innerHTML=ic('star',18);
$('#bShuffle').innerHTML=ic('shuffle',18);
$('#bPrev').innerHTML=ic('prev',20);
$('#bNext').innerHTML=ic('next',20);
audio.volume=S.vol;
$('#vol').value=Math.round(S.vol*100);setFill($('#vol'));
setFill($('#seek'));
renderAll();
updateTime();
save();
})();

if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
}
