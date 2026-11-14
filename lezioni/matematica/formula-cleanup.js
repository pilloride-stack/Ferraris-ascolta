(()=>{
  const formulaSelector='.formula,.mini-formula,#labResults strong,#labSteps .formula,.definition-formula,.result-formula';
  const fit=element=>{
    if(!element.dataset.baseFormulaSize)element.dataset.baseFormulaSize=String(parseFloat(getComputedStyle(element).fontSize)||18);
    const base=Number(element.dataset.baseFormulaSize),available=element.clientWidth-2;
    element.style.setProperty('font-size',base+'px','important');
    const required=element.scrollWidth;
    if(available>0&&required>available){
      const size=Math.max(13,base*available/required);
      element.style.setProperty('font-size',size.toFixed(2)+'px','important');
    }
  };
  const resize=new ResizeObserver(entries=>entries.forEach(entry=>fit(entry.target)));
  const clean=()=>{
    document.querySelectorAll('.formula,.mini-formula,#labResults b,#labResults strong,.definition-formula,.result-formula').forEach(element=>{
      const first=element.firstChild;
      if(first?.nodeType===Node.TEXT_NODE)first.nodeValue=first.nodeValue.replace(/^\s*Formula:\s*/i,'');
    });
    document.querySelectorAll('b,strong').forEach(element=>{
      if(/^Formula o proprietà applicata$/i.test(element.textContent.trim()))element.remove();
    });
    document.querySelectorAll(formulaSelector).forEach(element=>{
      fit(element);
      if(!element.dataset.formulaObserved){element.dataset.formulaObserved='1';resize.observe(element)}
    });
  };
  new MutationObserver(clean).observe(document.body,{childList:true,subtree:true});
  addEventListener('resize',clean,{passive:true});
  clean();
})();
