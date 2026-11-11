(function(){
  const { $, esc, toast } = window.demo || { $: id => document.getElementById(id), esc: s => String(s), toast: () => {} };
  const temp=$('temp'), tempOut=$('tempOut'), provider=$('provider');
  if(temp && tempOut){ temp.addEventListener('input',()=>{ tempOut.textContent=temp.value; }); }
  if(provider){
    provider.addEventListener('change',()=>{
      const p=provider.value; const local=p==='Ollama';
      $('endpoint').value=local?'http://localhost:11434':p==='Groq'?'https://api.groq.com/openai/v1':'https://api-inference.huggingface.co';
      $('model').value=local?'qwen2.5:7b':p==='Groq'?'llama-3.3-70b-versatile':'meta-llama/Meta-Llama-3-8B-Instruct';
      $('providerOut').textContent=p; $('modeOut').textContent=local?'LOCAL':'HOSTED';
    });
  }
  const run=$('runRuntime'), reset=$('resetRuntime');
  if(run){
    run.addEventListener('click',()=>{
      const p=$('provider').value,m=$('model').value.trim(),prompt=$('runtimePrompt').value.trim();
      if(!m||!prompt){toast('Model 與 Prompt 不可空白');return;}
      const local=p==='Ollama';
      $('runtimeState').textContent='SIMULATED';$('providerOut').textContent=p;$('modeOut').textContent=local?'LOCAL':'HOSTED';
      $('contextOut').textContent=Math.max(64,Number($('tokens').value)||1024).toLocaleString();
      $('runtimeOutput').textContent='[SIMULATION ONLY]\nProvider: '+p+'\nModel: '+m+'\nEndpoint: '+$('endpoint').value+'\nTemperature: '+$('temp').value+'\nMax tokens: '+$('contextOut').textContent+'\n\nRequest accepted by the demo interface. No HTTP request was sent and no model was invoked.\n\nSuggested architecture: Browser UI → secure backend / local runtime adapter → provider → normalized response.';
    });
  }
  if(reset){
    reset.addEventListener('click',()=>{
      $('provider').value='Ollama';$('provider').dispatchEvent(new Event('change'));
      $('temp').value='.7';$('temp').dispatchEvent(new Event('input'));
      $('tokens').value='1024';
      $('runtimePrompt').value='Explain how multi-agent collaboration can reduce single-agent failure risk.';
      $('runtimeState').textContent='IDLE';$('runtimeOutput').textContent='// Awaiting request…';
    });
  }

  // Developer toolchain command playbook
  const commandSets={powershell:{title:'Inspect development tools',cmd:'node --version\nnpm --version\ngit --version',note:'確認 Node.js、npm 與 Git 是否已加入 PATH。'},cmd:{title:'Inspect project files',cmd:'dir\ntree /F\ngit status --short',note:'檢查檔案樹與 Git 工作目錄狀態。'},bash:{title:'Inspect Ubuntu environment',cmd:'uname -a\npython3 --version\ngit status --short',note:'確認 Linux 環境、Python 與版本控制狀態。'},bat:{title:'Windows setup check',cmd:'@echo off\nnode --version\ngit --version\nif errorlevel 1 echo Check installation and PATH\npause',note:'Batch 腳本範例；執行前先確認命令來源與副作用。'}};
  const shell=$('shell');
  if(shell){
    shell.addEventListener('change',()=>{
      const x=commandSets[shell.value]; if(!x) return;
      $('commandTitle').textContent=x.title;$('commandText').textContent=x.cmd;$('commandNote').textContent=x.note;
    });
  }
  const copyCmd=$('copyCommand');
  if(copyCmd){
    copyCmd.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText($('commandText').textContent);toast('Command copied');}
      catch(e){toast('Clipboard permission unavailable')}
    });
  }
})();
