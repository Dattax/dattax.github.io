/* Minimal vanilla JS replacing the Next.js/React interactivity for the static clone. */
(function(){
  function swap(el,a,b){ if(!el) return; el.classList.remove(a); el.classList.add(b); }
  // ---- Mobile menu
  var btn=document.querySelector('button[aria-label="Open Menu"],button[aria-label="Close Menu"]');
  var overlay=document.querySelector('div.lg\\:hidden.fixed.inset-0.z-40');
  if(btn&&overlay){
    var open=false, lines=btn.querySelectorAll('line'), sr=btn.querySelector('.sr-only');
    var backdrop=overlay.children[0], panel=overlay.children[1];
    var links=overlay.querySelectorAll('a'), extra=overlay.querySelector('.mt-6.flex.flex-col.gap-3');
    function set(o){
      open=o; btn.setAttribute('aria-expanded',o?'true':'false');
      btn.setAttribute('aria-label',o?'Close Menu':'Open Menu'); if(sr) sr.textContent=o?'Close':'Menu';
      if(lines.length===3){
        lines[0].style.transform=o?'translateY(4px) rotate(45deg)':'none';
        lines[1].style.opacity=o?'0':'1'; lines[1].style.transform=o?'scaleX(0)':'scaleX(1)';
        lines[2].style.transform=o?'translateY(-4px) rotate(-45deg)':'none';
      }
      o?swap(overlay,'pointer-events-none','pointer-events-auto'):swap(overlay,'pointer-events-auto','pointer-events-none');
      if(backdrop) o?swap(backdrop,'opacity-0','opacity-100'):swap(backdrop,'opacity-100','opacity-0');
      if(panel){ if(o){swap(panel,'-translate-y-4','translate-y-0');swap(panel,'opacity-0','opacity-100');}
                 else{swap(panel,'translate-y-0','-translate-y-4');swap(panel,'opacity-100','opacity-0');} }
      links.forEach(function(a){a.style.transform=o?'translateX(0px)':'translateX(-8px)';a.style.opacity=o?'1':'0';});
      if(extra){extra.style.transform=o?'translateY(0px)':'translateY(8px)';extra.style.opacity=o?'1':'0';}
      document.body.style.overflow=o?'hidden':'';
    }
    btn.addEventListener('click',function(){set(!open);});
    if(backdrop) backdrop.addEventListener('click',function(){set(false);});
    links.forEach(function(a){a.addEventListener('click',function(){set(false);});});
  }
  // ---- FAQ accordions (one open at a time, like the original)
  var faqs=document.querySelectorAll('button[data-faq]');
  function setFaq(b,o){
    var p=b.querySelector('[data-faq-panel]'), ch=b.querySelector('span.shrink-0');
    if(!p) return;
    p.style.transition='height .3s ease, opacity .3s ease';
    if(o){ p.style.display='block'; var h=p.scrollHeight; p.style.height='0px'; p.offsetHeight; p.style.height=h+'px'; p.style.opacity='1';
           setTimeout(function(){ if(b._open) p.style.height='auto'; },310); }
    else { p.style.height=p.scrollHeight+'px'; p.offsetHeight; p.style.height='0px'; p.style.opacity='0'; }
    if(ch){ ch.style.transition='transform .3s'; ch.style.transform=o?'rotate(180deg)':'none'; }
    b._open=o;
  }
  faqs.forEach(function(b){
    var p=b.querySelector('[data-faq-panel]');
    b._open=!!(p && p.style.height!=='0px');
    b.addEventListener('click',function(){
      var o=!b._open;
      faqs.forEach(function(x){ if(x!==b && x._open && x.parentElement===b.parentElement) setFaq(x,false); });
      setFaq(b,o);
    });
  });
  // ---- Testimonial carousel
  document.querySelectorAll('button[aria-label="Next"]').forEach(function(next){
    var wrap=next.parentElement, prev=wrap.querySelector('button[aria-label="Previous"]');
    var track=wrap.querySelector('.touch-pan-y'), vp=track&&track.parentElement; if(!track) return;
    var idx=0;
    function step(){ var c=track.querySelector('article'); return c? c.getBoundingClientRect().width+20 : 340; }
    function maxX(){ return Math.max(0, track.scrollWidth - vp.clientWidth + parseFloat(getComputedStyle(vp).paddingLeft||0)); }
    function vis(b,show){ if(!b) return; if(show){b.classList.remove('opacity-0','pointer-events-none');b.classList.add('opacity-100');} else {b.classList.remove('opacity-100');b.classList.add('opacity-0','pointer-events-none');} }
    function render(){ var x=Math.min(idx*step(),maxX()); track.style.transition='transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)'; track.style.transform='translateX('+(-x)+'px)'; vis(prev,idx>0); vis(next,x<maxX()-1); }
    next.addEventListener('click',function(){ if(idx*step()<maxX()) idx++; render(); });
    if(prev) prev.addEventListener('click',function(){ if(idx>0) idx--; render(); });
    // drag / swipe
    var sx=null; vp.addEventListener('pointerdown',function(e){sx=e.clientX;});
    window.addEventListener('pointerup',function(e){ if(sx===null) return; var d=e.clientX-sx; sx=null; if(d<-40&&idx*step()<maxX()){idx++;render();} else if(d>40&&idx>0){idx--;render();} });
  });
  // ---- Password show/hide (seller/profile)
  document.querySelectorAll('input[type="password"]').forEach(function(inp){
    var t=inp.parentElement.querySelector('button[type="button"]');
    if(t) t.addEventListener('click',function(){ inp.type = inp.type==='password'?'text':'password'; });
  });
  // ---- Static site: forms/API-backed buttons have no backend
  document.querySelectorAll('form').forEach(function(f){ f.addEventListener('submit',function(e){ e.preventDefault(); }); });
  var em=document.querySelector('input[type="email"][required]'); var jb=document.querySelector('button[type="submit"][disabled]');
  if(em&&jb){ em.addEventListener('input',function(){ jb.disabled=!em.checkValidity()||!em.value; }); }
  document.querySelectorAll('a[href="#"]').forEach(function(a){ a.addEventListener('click',function(e){e.preventDefault();}); });
})();
