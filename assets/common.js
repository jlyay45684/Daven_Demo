(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast=msg=>{const t=$('toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2100)};
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  window.demo={$,$: $,esc,toast,pause};

  // In-page nav buttons (index)
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{
    const target=b.dataset.go && document.getElementById(b.dataset.go);
    if(target) target.scrollIntoView({behavior:'smooth'});
  }));
  const sections=['runtime','agents','prompt','genai','devtools','product'].map(id=>$(id)).filter(Boolean);
  if(sections.length){
    const navObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===e.target.id));}}),{rootMargin:'-25% 0px -65% 0px'});
    sections.forEach(s=>navObserver.observe(s));
  }

  // Shared shell: mobile navigation, reading progress and keyboard escape.
  const menuToggle=$('menuToggle');
  const top=document.querySelector('.top');
  if(menuToggle && top){
    menuToggle.addEventListener('click',()=>{
      const open=top.classList.toggle('nav-open');
      menuToggle.setAttribute('aria-expanded',String(open));
      menuToggle.innerHTML=open?'CLOSE <span aria-hidden="true">×</span>':'MENU <span aria-hidden="true">☰</span>';
    });
    document.querySelectorAll('#primaryNav [data-go], #primaryNav a').forEach(el=>el.addEventListener('click',()=>{
      top.classList.remove('nav-open');
      menuToggle.setAttribute('aria-expanded','false');
      menuToggle.innerHTML='MENU <span aria-hidden="true">☰</span>';
    }));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        top.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded','false');
        menuToggle.innerHTML='MENU <span aria-hidden="true">☰</span>';
      }
    });
  }
  const progressBar=$('pageProgressBar');
  const updatePageProgress=()=>{
    const root=document.documentElement;
    const available=root.scrollHeight-root.clientHeight;
    const percent=available>0?(root.scrollTop/available)*100:0;
    if(progressBar)progressBar.style.width=Math.min(100,Math.max(0,percent))+'%';
  };
  window.addEventListener('scroll',updatePageProgress,{passive:true});
  window.addEventListener('resize',updatePageProgress);
  updatePageProgress();
})();
