(function(){
  const { $, esc, toast } = window.demo || { $: id => document.getElementById(id), esc: s => String(s), toast: () => {} };
  const assemble=$('assemblePrompt'), copy=$('copyPrompt');
  if(assemble){
    assemble.addEventListener('click',()=>{
      $('assembledPrompt').textContent=[['SYSTEM',$('systemPrompt').value],['USER',$('userPrompt').value],['NEGATIVE / CONSTRAINTS',$('negativePrompt').value],['REVERSE / GRILL-ME',$('reversePrompt').value]].map(x=>'### '+x[0]+'\n'+(x[1].trim()||'(empty)')).join('\n\n');
      toast('Prompt 已在本機組裝');
    });
  }
  if(copy){
    copy.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText($('assembledPrompt').textContent);toast('Prompt copied');}
      catch(e){toast('Clipboard permission unavailable')}
    });
  }
  let knowledge=[];
  const renderKnowledge=()=>{ if($('knowledgeCount')) $('knowledgeCount').textContent=knowledge.length+' fragments loaded'; };
  if($('addKnowledge')){
    $('addKnowledge').addEventListener('click',()=>{
      const v=$('knowledgeInput').value.trim(); if(!v){toast('請先輸入知識片段');return;}
      knowledge.push(v); $('knowledgeInput').value=''; renderKnowledge();
    });
  }
  if($('sampleKnowledge')){
    $('sampleKnowledge').addEventListener('click',()=>{
      knowledge=['Never expose provider API keys in browser code. Store secrets in environment variables on a trusted backend.','Ollama provides a local model runtime. The client application can call a local service in a controlled development environment.','Retrieval augmented generation combines a query with relevant external context. Retrieved passages should retain source references.','A multi-agent workflow should define role boundaries, handoff contracts, validation, and rollback behavior.'];
      renderKnowledge();
    });
  }
  if($('clearKnowledge')){
    $('clearKnowledge').addEventListener('click',()=>{ knowledge=[]; renderKnowledge(); $('retrievalResults').innerHTML='<div class="hint">Knowledge store cleared.</div>'; });
  }
  if($('runRetrieval')){
    $('runRetrieval').addEventListener('click',()=>{
      const terms=$('retrievalQuery').value.toLowerCase().split(/[^a-z0-9\u00C0-\uFFFF]+/i).filter(x=>x.length>1);
      const ranked=knowledge.map((text,i)=>({text,i,score:terms.filter(t=>text.toLowerCase().includes(t)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
      $('retrievalResults').innerHTML=ranked.length?ranked.map(x=>'<div class="trace-item"><small>FRAGMENT '+(x.i+1)+' · MATCH '+x.score+'/'+Math.max(1,terms.length)+'</small><p>'+esc(x.text)+'</p></div>').join(''):'<div class="hint">No keyword matches. Add context or revise the query.</div>';
    });
  }
})();
