(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .pair-definition .formula,.pair-definition .mini-formula,
    .pair-example .formula,.pair-example .mini-formula,
    #labResults .formula,#labSteps .formula{
      overflow-x:hidden!important;
      overflow-y:hidden!important;
      white-space:nowrap!important;
      min-height:max-content;
      padding-block:14px!important;
    }
    .formula-parts{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
    .formula-part{display:flex!important;width:100%;min-width:0!important;justify-content:flex-start!important;white-space:nowrap!important}
    .formula.audio-current,.mini-formula.audio-current{background:var(--b)!important;color:#fff!important;outline:5px solid var(--y)!important;outline-offset:4px;box-shadow:0 0 0 10px #ffd21c33,0 0 20px #ffd21c66!important}
    #labControls input[type="number"]{appearance:textfield!important;-moz-appearance:textfield!important;width:92px!important;min-width:92px!important;height:48px!important;padding:6px 12px!important;font-size:1.05rem!important;line-height:1.2!important;text-align:center!important}
    #labControls input[type="number"]::-webkit-inner-spin-button,#labControls input[type="number"]::-webkit-outer-spin-button{-webkit-appearance:none!important;margin:0!important}
    .delta-intro{margin:14px 0}.delta-intro p{line-height:1.55}
  `;
  document.head.append(style);
  const fraction=(formula,numerator,denominator,prefix='x₁,₂ = ')=>{
    formula.innerHTML=`${prefix}<span class="frac"><span class="num">${numerator}</span><span class="den">${denominator}</span></span>`;
    formula.dataset.visibleFraction='1';
  };
  const update=()=>{
    document.querySelectorAll('.pair-definition,.card').forEach(card=>{
      const title=card.querySelector('h3')?.textContent.trim();
      if(title==='Equazione pura'){
        [...card.querySelectorAll('.formula,.mini-formula')]
          .filter(formula=>/x²\s*=/.test(formula.textContent))
          .forEach(formula=>formula.textContent='ax² + c = 0');
      }
      if(title==='Equazione completa'&&!card.querySelector('.delta-intro')){
        const reference=card.querySelector('.formula,.mini-formula');
        if(!reference)return;
        const intro=document.createElement('div');
        intro.className='delta-intro';
        intro.innerHTML='<p class="narrated-text"><b>Il discriminante</b>, indicato con Δ, stabilisce quante soluzioni reali può avere l’equazione.</p><div class="formula">Δ = b² − 4ac</div>';
        reference.before(intro);
      }
    });
    document.querySelectorAll('.formula,.mini-formula').forEach(formula=>{
      if(formula.querySelector('.frac')||formula.dataset.visibleFraction)return;
      const text=formula.textContent.replace(/\s+/g,' ').trim();
      if(/^x(?:₁,₂)?\s*=.*√\(b²\s*[−-]\s*4ac\).*\/\s*\(2a\)/.test(text))fraction(formula,'−b ± √(b² − 4ac)','2a');
      else if(/^x₁,₂\s*=.*√Δ.*\/\s*\(?2a\)?/.test(text))fraction(formula,'−b ± √Δ','2a');
      else {
        const match=text.match(/^(x(?:₁,₂)?)\s*=\s*\((.+)\)\s*\/\s*\(?([^)]+)\)?(?:\s*→\s*(.+))?$/);
        if(match){fraction(formula,match[2],match[3],`${match[1]} = `);if(match[4])formula.append(` → ${match[4]}`)}
      }
    });
    document.querySelectorAll('.formula,.mini-formula,#labResults strong').forEach(formula=>{
      formula.style.setProperty('overflow-x','hidden','important');
      formula.style.setProperty('overflow-y','hidden','important');
      formula.style.setProperty('white-space','nowrap','important');
      if(!formula.offsetParent||formula.clientWidth<1)return;
      const base=Number(formula.dataset.eq2BaseSize)||parseFloat(getComputedStyle(formula).fontSize)||18;
      formula.dataset.eq2BaseSize=String(base);
      formula.style.setProperty('font-size',`${base}px`,'important');
      if(formula.scrollWidth>formula.clientWidth){
        const size=Math.max(10,base*(formula.clientWidth-4)/formula.scrollWidth);
        formula.style.setProperty('font-size',`${size.toFixed(2)}px`,'important');
      }
    });
    const fixInputs=()=>document.querySelectorAll('#labControls input[type="number"]').forEach(input=>{
      input.style.setProperty('width','92px','important');
      input.style.setProperty('min-width','92px','important');
      input.style.setProperty('height','48px','important');
      input.style.setProperty('padding','6px 12px','important');
      input.style.setProperty('font-size','1.05rem','important');
      input.style.setProperty('appearance','textfield','important');
    });
    fixInputs();
    setTimeout(fixInputs,0);
  };
  new MutationObserver(update).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(update,0),true);
  document.addEventListener('input',()=>setTimeout(update,0),true);
  addEventListener('resize',update,{passive:true});
  update();
})();
