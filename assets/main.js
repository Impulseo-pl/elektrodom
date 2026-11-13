/* Elektrodom – demo v4 (układ wg ThermoKonnect) */
(function(){
  var d=document, html=d.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add('anim-ok');

  /* płynne przewijanie */
  var lenis=null;
  if(window.Lenis&&!reduce){
    lenis=new Lenis({lerp:.11,smoothWheel:true});
    (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(performance.now());
  }

  /* nagłówek */
  var top=d.querySelector('.top');
  function onScroll(){
    var y=window.scrollY;
    if(top)top.classList.toggle('solid',y>30);
    html.classList.toggle('scrolled',y>innerHeight*.6);
  }
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* menu mobilne */
  var menu=d.querySelector('.menu');
  d.querySelectorAll('[data-menu]').forEach(function(b){b.addEventListener('click',function(){
    var open=!menu.classList.contains('open');menu.classList.toggle('open',open);
    d.body.style.overflow=open?'hidden':'';if(lenis){open?lenis.stop():lenis.start()}
  })});

  /* ===== zdjęcia przez piksele (jedno przejście w całej stronie) ===== */
  var STEPS=[56,40,28,20,14,10,7,5,3,2,1];
  function Pix(el){
    var self=this;this.el=el;this.imgs=[].slice.call(el.querySelectorAll('img'));this.i=0;this.px=STEPS[0];this.busy=false;
    this.cover=el.classList.contains('cover');
    this.c=d.createElement('canvas');this.ctx=this.c.getContext('2d');this.s=d.createElement('canvas');this.sx=this.s.getContext('2d');
    el.appendChild(this.c);
    var first=this.imgs[0];
    function go(){el.classList.add('ready');self.size();self.draw();}
    if(first.complete&&first.naturalWidth)go();else first.addEventListener('load',go);
    this.imgs.slice(1).forEach(function(im){if(im.loading==='lazy')im.loading='eager'});
    addEventListener('resize',function(){self.size();self.draw()});
  }
  Pix.prototype.size=function(){
    var r=this.el.getBoundingClientRect(),k=Math.min(2,window.devicePixelRatio||1);
    this.W=Math.max(1,Math.round(r.width*k));this.H=Math.max(1,Math.round(r.height*k));this.k=k;
    this.c.width=this.W;this.c.height=this.H;
  };
  Pix.prototype.rect=function(im){
    var W=this.W,H=this.H,ir=im.naturalWidth/im.naturalHeight,cr=W/H,w,h;
    if(this.cover?ir<cr:ir>cr){w=W;h=W/ir}else{h=H;w=H*ir}
    return [(W-w)/2,(H-h)/2,w,h];
  };
  Pix.prototype.draw=function(){
    var im=this.imgs[this.i];if(!im||!im.naturalWidth||!this.W)return;
    var ctx=this.ctx,W=this.W,H=this.H,px=Math.max(1,Math.round(this.px*this.k)),r=this.rect(im);
    ctx.clearRect(0,0,W,H);ctx.save();
    var cx=Math.max(0,r[0]),cy=Math.max(0,r[1]),cw=Math.min(W,r[2]),ch=Math.min(H,r[3]);
    ctx.beginPath();if(ctx.roundRect)ctx.roundRect(cx,cy,cw,ch,4*this.k);else ctx.rect(cx,cy,cw,ch);ctx.clip();
    if(px<=1){ctx.imageSmoothingEnabled=true;ctx.drawImage(im,r[0],r[1],r[2],r[3]);}
    else{
      var sw=Math.ceil(W/px),sh=Math.ceil(H/px);this.s.width=sw;this.s.height=sh;
      this.sx.imageSmoothingEnabled=true;this.sx.clearRect(0,0,sw,sh);this.sx.drawImage(im,r[0]/px,r[1]/px,r[2]/px,r[3]/px);
      ctx.imageSmoothingEnabled=false;ctx.drawImage(this.s,0,0,sw,sh,0,0,sw*px,sh*px);
    }
    ctx.restore();
  };
  Pix.prototype.run=function(seq,cb){
    var self=this,n=0;
    (function step(){
      if(n>=seq.length){cb&&cb();return}
      self.px=seq[n++];self.draw();setTimeout(step,reduce?0:48);
    })();
  };
  Pix.prototype.reveal=function(){if(this.shown)return;this.shown=true;this.run(STEPS.slice())};
  Pix.prototype.go=function(i){
    var self=this;if(i===this.i)return;
    if(this.busy){this.next=i;return}
    this.busy=true;
    this.run(STEPS.slice().reverse().slice(1,8),function(){
      self.i=i;self.run(STEPS.slice(4),function(){self.busy=false;if(self.next!=null&&self.next!==self.i){var n=self.next;self.next=null;self.go(n)}else self.next=null;});
    });
  };
  var pixes=[];
  d.querySelectorAll('.pix').forEach(function(el){var p=new Pix(el);el._pix=p;pixes.push(p)});
  if('IntersectionObserver' in window){
    var pio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target._pix.reveal();pio.unobserve(e.target)}})},{rootMargin:'0px 0px -12% 0px'});
    pixes.forEach(function(p){
      var go=function(){pio.observe(p.el)};
      var im=p.imgs[0];if(im.complete&&im.naturalWidth)go();else im.addEventListener('load',go);
    });
  }

  /* HERO: zmiana usług jak serie produktów */
  var hero=d.querySelector('[data-slides]');
  if(hero){
    var data=JSON.parse(hero.getAttribute('data-slides')),th=hero.querySelectorAll('.thumbs button'),tg=hero.querySelector('.slide-tag'),tx=hero.querySelector('.slide-txt'),hp=hero.querySelector('.pix')._pix,cur=0,timer;
    function show(i){
      if(i===cur)return;cur=i;
      th.forEach(function(b,k){b.classList.toggle('on',k===i);var bar=b.querySelector('i');if(bar){bar.style.animation='none';void bar.offsetWidth;bar.style.animation=''}});
      [tg,tx].forEach(function(e){e.classList.add('out')});
      setTimeout(function(){tg.innerHTML=data[i].tag;tx.textContent=data[i].txt;[tg,tx].forEach(function(e){e.classList.remove('out')})},380);
      hp.go(i);plan();
    }
    function plan(){clearTimeout(timer);if(!reduce)timer=setTimeout(function(){show((cur+1)%data.length)},7000)}
    th.forEach(function(b,i){b.addEventListener('click',function(){show(i)})});
    plan();
  }

  /* usługi przypięte */
  var svc=d.querySelector('.svc');
  if(svc){
    var sd=JSON.parse(svc.getAttribute('data-svc')),N=sd.length,sp=svc.querySelector('.pix')._pix,btns=svc.querySelectorAll('.svc-idx button'),panel=svc.querySelector('.svc-panel'),si=0;
    var sh=svc.querySelector('.svc-head h3'),st=svc.querySelector('.svc-text'),ssym=svc.querySelector('.svc-head .sym'),stag=svc.querySelector('.svc-card .tag'),scard=svc.querySelector('.svc-card');
    function setS(i){
      if(i===si)return;si=i;
      btns.forEach(function(b,k){b.classList.toggle('on',k===i)});
      panel.classList.add('out');
      setTimeout(function(){var s=sd[i];sh.textContent=s.t;st.innerHTML=s.p;ssym.innerHTML=s.sym;stag.textContent=s.tag;scard.href=s.href;panel.classList.remove('out')},320);
      sp.go(i);
    }
    function su(){
      var r=svc.getBoundingClientRect(),h=svc.offsetHeight-innerHeight,p=Math.min(.9999,Math.max(0,-r.top/h));
      setS(Math.floor(p*N));
    }
    addEventListener('scroll',su,{passive:true});su();
    btns.forEach(function(b,i){b.addEventListener('click',function(){
      var y=svc.getBoundingClientRect().top+scrollY+(svc.offsetHeight-innerHeight)*(i+.5)/N;
      lenis?lenis.scrollTo(y,{duration:1.2}):scrollTo({top:y,behavior:'smooth'});
    })});
  }

  /* schemat rysowany przewijaniem */
  d.querySelectorAll('.scheme svg').forEach(function(svg){
    var lns=[].slice.call(svg.querySelectorAll('.ln')),blks=[].slice.call(svg.querySelectorAll('[data-at]'));
    lns.forEach(function(l){var L=l.getTotalLength();l.style.strokeDasharray=L;l.style.strokeDashoffset=L;l._L=L});
    function u(){
      var r=svg.getBoundingClientRect(),p=Math.min(1,Math.max(0,(innerHeight*.92-r.top)/(innerHeight*.75)));
      if(reduce)p=1;
      lns.forEach(function(l){var a=parseFloat(l.dataset.a||0),b=parseFloat(l.dataset.b||1),q=Math.min(1,Math.max(0,(p-a)/(b-a)));l.style.strokeDashoffset=l._L*(1-q)});
      blks.forEach(function(b){b.classList.toggle('on',p>=parseFloat(b.dataset.at))});
    }
    addEventListener('scroll',u,{passive:true});u();
  });

  /* odsłanianie */
  var rv=d.querySelectorAll('.rv');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(e){io.observe(e)});
  }else rv.forEach(function(e){e.classList.add('in')});

  /* lightbox */
  var lb=d.querySelector('.lb');
  if(lb){
    var li=lb.querySelector('img');
    d.querySelectorAll('[data-lb]').forEach(function(f){f.addEventListener('click',function(){
      li.src=f.dataset.lb;li.alt=(f.querySelector('img')||{}).alt||'';lb.classList.add('open');if(lenis)lenis.stop();
    })});
    function close(){lb.classList.remove('open');if(lenis)lenis.start()}
    lb.addEventListener('click',close);addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  }

  /* przejście między podstronami: siatka pikseli */
  function grid(on){
    var cols=innerWidth<700?6:12,rows=Math.ceil(cols*innerHeight/innerWidth),g=d.createElement('div');
    g.className='px-cover'+(on?'':' gone');g.style.gridTemplateColumns='repeat('+cols+',1fr)';g.style.gridTemplateRows='repeat('+rows+',1fr)';
    for(var k=0;k<cols*rows;k++){var c=d.createElement('i');c.style.transitionDelay=(Math.random()*.32).toFixed(3)+'s';g.appendChild(c)}
    d.body.appendChild(g);return g;
  }
  var pre=d.querySelector('.px-cover');
  if(pre){requestAnimationFrame(function(){requestAnimationFrame(function(){pre.classList.add('gone');setTimeout(function(){pre.remove()},800)})})}
  if(!reduce)d.addEventListener('click',function(e){
    var a=e.target.closest('a');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||a.target==='_blank')return;
    var h=a.getAttribute('href')||'';if(!/\.html(#.*)?$/.test(h)||h.charAt(0)==='#')return;
    if(a.pathname===location.pathname&&a.hash)return;
    e.preventDefault();try{sessionStorage.setItem('pxnav','1')}catch(x){}
    var g=grid(false);requestAnimationFrame(function(){requestAnimationFrame(function(){g.classList.remove('gone')})});
    setTimeout(function(){location.href=a.href},560);
  });
  addEventListener('pageshow',function(e){if(e.persisted){d.querySelectorAll('.px-cover').forEach(function(g){g.remove()})}});
})();

(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
