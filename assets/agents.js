(function(){
  const { $, esc, toast, pause } = window.demo || { $: id => document.getElementById(id), esc: s => String(s), toast: () => {}, pause: ms => new Promise(r=>setTimeout(r,ms)) };
  const run=$('runAgents'), reset=$('resetAgents');
  if(run){
    run.addEventListener('click',async()=>{
      const roles=[...$('agentChoices').querySelectorAll('input:checked')].map(x=>x.value);
      const goal=$('objective').value.trim();
      if(!goal||!roles.length){toast('請輸入目標並至少選擇一個角色');return;}
      const host=$('agentTrace');host.innerHTML='';$('agentState').textContent='RUNNING';
      for(let i=0;i<roles.length;i++){
        const item=document.createElement('div');item.className='trace-item';
        item.innerHTML='<small>STAGE 0'+(i+1)+' / '+esc(roles[i].toUpperCase())+'</small><b>'+esc(roles[i])+'</b><p>Objective handoff: '+esc(goal.slice(0,180))+'</p><p>Status: simulated role output prepared for next stage.</p>';
        host.appendChild(item); await pause(260);
      }
      $('agentState').textContent='SIMULATED';
      const summary=document.createElement('div');summary.className='trace-item';
      summary.innerHTML='<small>WORKFLOW COMPLETE</small><b>'+roles.length+' roles traversed</b><p>Next governance step: merge outputs, resolve disagreement, and run an independent validation gate. No external Agent was invoked.</p>';
      host.appendChild(summary);
    });
  }
  if(reset){
    reset.addEventListener('click',()=>{$('agentTrace').innerHTML='<div class="hint">選擇角色並執行工作流，以檢視任務序列與交接紀錄。</div>';$('agentState').textContent='READY'});
  }
  // Diff reviewer
  const compare=$('compareDiff'), resetDiff=$('resetDiff');
  const before=$('before'), after=$('after'), diffOut=$('diffOutput');
  const beforeDefault=before?before.value:'', afterDefault=after?after.value:'';
  if(compare && before && after && diffOut){
    compare.addEventListener('click',()=>{
      const a=before.value.split('\n'),b=after.value.split('\n'),out=[];
      for(let i=0;i<Math.max(a.length,b.length);i++){
        if(a[i]===b[i])out.push('  '+esc(a[i]||''));
        else{ if(a[i]!==undefined)out.push('<span class="removed">- '+esc(a[i])+'</span>'); if(b[i]!==undefined)out.push('<span class="added">+ '+esc(b[i])+'</span>'); }
      }
      diffOut.innerHTML=out.join('\n')||'No differences.';
    });
  }
  if(resetDiff && before && after && diffOut){
    resetDiff.addEventListener('click',()=>{ before.value=beforeDefault; after.value=afterDefault; diffOut.textContent='執行 Compare 以顯示差異。'; });
  }
})();
