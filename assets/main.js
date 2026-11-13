/* Elektrodom – demo v3 „Pstryk” */
(function(){
  var d=document, html=d.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch=window.matchMedia&&matchMedia('(hover: none)').matches;
  html.classList.add('anim-ok');

  /* płynne przewijanie */
  var lenis=null;
  if(window.Lenis&&!reduce){
    lenis=new Lenis({lerp:.1,smoothWheel:true});
    (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(performance.now());
  }

  /* nagłówek */
  var top=d.querySelector('.top'), lastY=0;
  function onScroll(){
    var y=window.scrollY;
    if(top){
      top.classList.toggle('solid',y>40);
      top.classList.toggle('hide',y>500&&y>lastY+2&&!d.querySelector('.menu.open'));
      if(y<lastY-2)top.classList.remove('hide');
    }
    html.classList.toggle('scrolled',y>innerHeight*.7);
    lastY=y;
  }
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* menu mobilne */
  var menu=d.querySelector('.menu');
  d.querySelectorAll('[data-menu]').forEach(function(b){b.addEventListener('click',function(){
    var open=!menu.classList.contains('open');menu.classList.toggle('open',open);
    d.body.style.overflow=open?'hidden':'';
    if(lenis){open?lenis.stop():lenis.start()}
  })});

  /* latarka: kursor oświetla zdjęcie */
  function torch(el,opts){
    opts=opts||{};
    var tx=parseFloat(getComputedStyle(el).getPropertyValue('--mx'))||50,ty=parseFloat(getComputedStyle(el).getPropertyValue('--my'))||45;
    var x=tx,y=ty,moved=false,t0=performance.now(),vis=true;
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*100;ty=(e.clientY-r.top)/r.height*100;moved=true;
    });
    new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(el);
    (function loop(now){
      if(vis){
        if(!moved&&!reduce){ /* sama wędruje, dopóki nikt nie ruszy myszą / na telefonie */
          var t=(now-t0)/1000;tx=(opts.cx||55)+Math.sin(t*.55)*(opts.ax||18);ty=(opts.cy||45)+Math.sin(t*.8+1)*(opts.ay||14);
        }
        x+=(tx-x)*.12;y+=(ty-y)*.12;
        el.style.setProperty('--mx',x.toFixed(2)+'%');el.style.setProperty('--my',y.toFixed(2)+'%');
      }
      requestAnimationFrame(loop);
    })(t0);
  }

  /* HERO: włącznik */
  var hero=d.querySelector('.hero');
  if(hero){
    torch(hero,{cx:62,cy:42,ax:16,ay:12});
    var sw=hero.querySelector('.switch'), words=hero.querySelectorAll('h1 .w'), lbl=sw&&sw.querySelector('.lbl span'), auto;
    function setLit(on){
      clearTimeout(auto);
      sw.setAttribute('aria-pressed',on?'true':'false');
      if(lbl)lbl.textContent=on?'Wyłącz światło':'Włącz światło';
      if(on){
        hero.classList.remove('flick');void hero.offsetWidth;hero.classList.add('flick','lit');
        words.forEach(function(w,i){setTimeout(function(){w.classList.add('on')},(reduce?0:380)+i*110)});
      }else{
        hero.classList.remove('lit','flick');words.forEach(function(w){w.classList.remove('on')});
      }
    }
    if(sw){
      sw.addEventListener('click',function(){setLit(sw.getAttribute('aria-pressed')!=='true')});
      auto=setTimeout(function(){setLit(true)},reduce?0:9000);
    }
  }

  /* nagłówki podstron: zapalają się same */
  d.querySelectorAll('.phero').forEach(function(p){
    torch(p,{cx:64,cy:40});
    setTimeout(function(){p.classList.add('flick','lit')},reduce?0:900);
  });

  /* CTA: pioruny pod latarką */
  d.querySelectorAll('.call').forEach(function(c){torch(c,{cx:50,cy:50,ax:30,ay:22})});

  /* lot zdjęć w 3D */
  var fly=d.querySelector('.fly');
  if(fly){
    var cards=[].slice.call(fly.querySelectorAll('.card3d')),bar=fly.querySelector('.fly-bar'),title=fly.querySelector('.fly-title');
    var GAP=900,N=cards.length;
    function flyUpd(){
      var r=fly.getBoundingClientRect(),h=fly.offsetHeight-innerHeight;
      var p=Math.min(1,Math.max(0,-r.top/h));
      var mob=innerWidth<760;
      cards.forEach(function(c,i){
        var z=-2600-i*GAP+p*((N-1)*GAP+2600+80);
        var x=parseFloat(c.dataset.x)*(mob?.45:1),y=parseFloat(c.dataset.y)*(mob?.8:1);
        var o=z<-1900?Math.max(0,(z+2700)/800):z>300?Math.max(0,1-(z-300)/350):1;
        c.style.transform='translate(-50%,-50%) translate3d('+x+'vw,'+y+'vh,'+z.toFixed(0)+'px)';
        c.style.opacity=o.toFixed(3);
        c.style.visibility=o<=0?'hidden':'visible';
      });
      if(bar)bar.style.setProperty('--fill',p.toFixed(4));
      if(title){var to=1-Math.min(1,p/.16);title.style.opacity=to.toFixed(3);title.style.transform='scale('+(1+p*.6).toFixed(3)+')';}
    }
    addEventListener('scroll',flyUpd,{passive:true});addEventListener('resize',flyUpd);flyUpd();
  }

  /* anatomia rozdzielnicy */
  d.querySelectorAll('[data-anat]').forEach(function(a){
    var spots=a.querySelectorAll('.spot'),items=a.querySelectorAll('.parts li'),board=a.querySelector('.board');
    function pick(i){
      spots.forEach(function(s,k){s.classList.toggle('on',k===i)});
      items.forEach(function(s,k){s.classList.toggle('on',k===i)});
    }
    spots.forEach(function(s,i){s.addEventListener('click',function(){pick(i)});s.addEventListener('mouseenter',function(){pick(i)})});
    items.forEach(function(s,i){s.addEventListener('click',function(){pick(i)});s.addEventListener('mouseenter',function(){pick(i)})});
    pick(0);
  });

  /* oferta: podgląd zdjęcia przy kursorze */
  var peek=d.querySelector('.peek');
  if(peek&&!touch){
    var px=0,py=0,qx=0,qy=0,imgs={};
    peek.querySelectorAll('img').forEach(function(im){imgs[im.dataset.k]=im});
    d.querySelectorAll('.svc a[data-k]').forEach(function(a){
      a.addEventListener('mouseenter',function(){peek.classList.add('show');for(var k in imgs)imgs[k].classList.toggle('on',k===a.dataset.k)});
      a.addEventListener('mouseleave',function(){peek.classList.remove('show')});
    });
    addEventListener('pointermove',function(e){px=e.clientX+190;py=e.clientY});
    (function l(){qx+=(px-qx)*.15;qy+=(py-qy)*.15;peek.style.left=qx+'px';peek.style.top=qy+'px';requestAnimationFrame(l)})();
  }

  /* galeria pozioma: przeciąganie i strzałki */
  d.querySelectorAll('.rail').forEach(function(r){
    var down=false,sx=0,sl=0,movedR=false;
    r.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;down=true;movedR=false;sx=e.clientX;sl=r.scrollLeft;r.classList.add('drag')});
    addEventListener('pointerup',function(){down=false;r.classList.remove('drag')});
    addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-sx;if(Math.abs(dx)>4)movedR=true;r.scrollLeft=sl-dx});
    r.addEventListener('click',function(e){if(movedR){e.preventDefault();e.stopPropagation()}},true);
    var nav=d.querySelector('[data-rail="'+r.id+'"]');
    if(nav)nav.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){
      r.scrollBy({left:(b.dataset.dir==='1'?1:-1)*Math.min(innerWidth*.6,620),behavior:'smooth'});
    })});
  });

  /* opinie: Google / Fixly */
  d.querySelectorAll('.src-tabs').forEach(function(t){
    var bs=t.querySelectorAll('button');
    bs.forEach(function(b){b.addEventListener('click',function(){
      bs.forEach(function(x){var on=x===b;x.setAttribute('aria-selected',on);var p=d.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!on;});
      var sc=d.querySelector('[data-score]');if(sc){sc.querySelector('b').textContent='5,0';sc.querySelector('.cnt').textContent=b.dataset.cnt;}
    })});
  });

  /* proces: prąd płynie przewodem */
  d.querySelectorAll('.steps').forEach(function(s){
    var lis=s.querySelectorAll('li');
    function u(){
      var r=s.getBoundingClientRect(),mid=innerHeight*.6;
      var p=Math.min(1,Math.max(0,(mid-r.top)/r.height));
      s.style.setProperty('--fill',p.toFixed(4));
      lis.forEach(function(li){li.classList.toggle('on',li.getBoundingClientRect().top<mid)});
    }
    addEventListener('scroll',u,{passive:true});u();
  });

  /* parallax zdjęć w dużych panelach */
  var plx=[].slice.call(d.querySelectorAll('[data-plx]'));
  if(plx.length&&!reduce){
    function pu(){plx.forEach(function(im){var r=im.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;var p=(r.top+r.height/2-innerHeight/2)/innerHeight;im.style.transform='translateY('+(p*-parseFloat(im.dataset.plx)).toFixed(1)+'px)'})}
    addEventListener('scroll',pu,{passive:true});pu();
  }

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
})();

(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
