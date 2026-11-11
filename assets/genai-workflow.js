(function(){
  const { $, esc, toast, pause } = window.demo || { $: id => document.getElementById(id), esc: s => String(s), toast: () => {}, pause: ms => new Promise(r=>setTimeout(r,ms)) };
  function download(name,text,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:type||'text/plain'}));a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
  // GenAI workflow
  const runGen=$('runGen'), exportGen=$('exportGen');
  if(runGen){
    runGen.addEventListener('click',async()=>{
      const nodes=[...$('nodeGraph').children]; nodes.forEach(n=>n.classList.remove('done'));
      $('genState').textContent='RUNNING'; const log=[];
      for(const n of nodes){ n.classList.add('done'); log.push('✓ '+n.textContent.replace(/\s+/g,' ').trim()+' — simulated'); $('genLog').textContent=log.join('\n'); await pause(250); }
      $('genState').textContent='SIMULATED';
      $('genPreview').innerHTML='<b>Workflow graph completed</b><p class="hint">Configuration trace only. No checkpoint was loaded and no image was generated.</p><p class="hint">Model: '+esc($('genModel').value)+' · LoRA: '+esc($('lora').value)+'</p>';
    });
  }
  if(exportGen){
    exportGen.addEventListener('click',()=>{
      const data={model:$('genModel').value,checkpoint:$('checkpoint').value,lora:$('lora').value,positive:$('positive').value,negative:$('negative').value,steps:Number($('steps').value),cfg:Number($('cfg').value),notice:'Configuration only; no image inference has been executed.'};
      download('genai-workflow.json',JSON.stringify(data,null,2),'application/json');
    });
  }
  // UI/UX prototype
  function updatePrototype(){
    if(!$('prototype')) return;
    $('prototypeTitle').textContent=$('productTitle').value;
    $('prototype').style.borderColor=$('productColor').value;
    $('prototype').style.maxWidth=$('productLayout').value==='mobile'?'360px':'none';
  }
  ['productTitle','productColor','productLayout'].forEach(id=>{ const el=$(id); if(el) el.addEventListener('input',updatePrototype); });
  if($('prototypeAction')) $('prototypeAction').addEventListener('click',()=>{ $('prototypeFeedback').textContent=' · Prototype interaction confirmed.'; });
  if($('prototype')) updatePrototype();
  // AI4BI CSV
  if($('analyzeCsv')){
    $('analyzeCsv').addEventListener('click',()=>{
      const lines=$('csv').value.trim().split(/\r?\n/);
      if(lines.length<2){$('biOutput').innerHTML='<div class="hint">CSV needs a header and at least one row.</div>';return;}
      const h=lines.shift().split(',').map(x=>x.trim().toLowerCase()),ci=h.indexOf('category'),vi=h.indexOf('value');
      if(ci<0||vi<0){$('biOutput').innerHTML='<div class="hint">Expected columns: category,value</div>';return;}
      const rows=lines.map(line=>{const x=line.split(',');return{category:(x[ci]||'').trim(),value:Number(x[vi])}}).filter(x=>x.category&&Number.isFinite(x.value));
      if(!rows.length){$('biOutput').innerHTML='<div class="hint">No valid numeric rows.</div>';return;}
      const total=rows.reduce((s,x)=>s+x.value,0),avg=total/rows.length,max=Math.max(...rows.map(x=>x.value));
      $('biOutput').innerHTML='<div class="kpis"><div><small>ROWS</small><b>'+rows.length+'</b></div><div><small>TOTAL</small><b>'+total+'</b></div><div><small>AVERAGE</small><b>'+avg.toFixed(1)+'</b></div></div>'+rows.map(x=>'<div class="checkrow">'+esc(x.category)+' <span style="flex:1" class="bar"><i style="width:'+Math.max(2,x.value/max*100)+'%"></i></span> '+x.value+'</div>').join('');
    });
  }
  if($('sampleCsv')) $('sampleCsv').addEventListener('click',()=>{$('csv').value='category,value\nAI Projects,12\nAutomation,8\nData Apps,6\nPrototypes,10'; if($('analyzeCsv')) $('analyzeCsv').click();});
  // Page builder
  const pageBlocks={hero:['HERO SECTION','Build a better digital workflow.','Compose sections, test content hierarchy, and refine the responsive experience.'],features:['FEATURES SECTION','One workspace. Multiple capabilities.','Connect runtime, agent workflows and knowledge tools through modular building blocks.'],cta:['CALL TO ACTION','Ready to build your next system?','Turn an idea into a testable prototype with measurable acceptance criteria.']};
  document.querySelectorAll('.builder').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.builder').forEach(x=>x.classList.toggle('active',x===b));
    const c=pageBlocks[b.dataset.block]; if(!c||!$('builderPreview')) return;
    $('builderPreview').innerHTML='<small>'+c[0]+'</small><h3>'+c[1]+'</h3><p>'+c[2]+'</p>';
  }));
  // Android checklist
  const checksWrap=$('releaseChecks');
  if(checksWrap){
    const release=[...checksWrap.querySelectorAll('input')];
    function updateRelease(){ const done=release.filter(x=>x.checked).length,p=Math.round(done/release.length*100); $('releasePercent').textContent=p+'%'; $('releaseCount').textContent=done+' / '+release.length; $('releaseBar').style.width=p+'%'; }
    release.forEach(x=>x.addEventListener('change',updateRelease)); updateRelease();
  }
})();
