(()=>{
  const clean=()=>{
    document.querySelectorAll('.formula,.mini-formula,#labResults b,#labResults strong,.definition-formula,.result-formula').forEach(element=>{
      const first=element.firstChild;
      if(first?.nodeType===Node.TEXT_NODE)first.nodeValue=first.nodeValue.replace(/^\s*Formula:\s*/i,'');
    });
    document.querySelectorAll('b,strong').forEach(element=>{
      if(/^Formula o proprietà applicata$/i.test(element.textContent.trim()))element.remove();
    });
  };
  new MutationObserver(clean).observe(document.body,{childList:true,subtree:true});
  clean();
})();
