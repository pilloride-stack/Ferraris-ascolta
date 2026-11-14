(()=>{
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='../solution-axis.css';document.head.append(stylesheet);
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const dot=(x,label,closed)=>`<circle class="endpoint" cx="${x}" cy="34" r="6" fill="${closed?'var(--y)':'#fff'}"/><text class="label" x="${x}" y="61">${esc(label)}</text>`;
  const base=content=>`<div class="solution-axis" aria-label="Rappresentazione della soluzione sull'asse x"><svg viewBox="0 0 420 68" role="img"><defs><marker id="axis-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="var(--b)"/></marker></defs><line class="axis" x1="18" y1="34" x2="402" y2="34" marker-end="url(#axis-arrow)"/><text class="axis-label" x="402" y="25">x</text>${content}</svg></div>`;
  const normalize=text=>text.replace(/Risultato\s*:/gi,'').replace(/Soluzione\s*:/gi,'').replace(/\s+/g,' ').trim();
  const make=text=>{
    const value=normalize(text),number='([−-]?\\d+(?:[,.]\\d+)?(?:\\s*\\/\\s*[−-]?\\d+(?:[,.]\\d+)?)?|[a-zA-Z][₀-₉0-9]*)';
    let match=value.match(new RegExp(`x\\s*([<>≤≥])\\s*${number}\\s*(?:∨|oppure)\\s*x\\s*([<>≤≥])\\s*${number}`,'i'));
    if(match){const left=match[2],right=match[4];return base(`<line class="solution" x1="20" y1="34" x2="125" y2="34"/>${dot(125,left,match[1].includes('≤'))}<line class="solution" x1="295" y1="34" x2="398" y2="34"/>${dot(295,right,match[3].includes('≥'))}`)}
    match=value.match(new RegExp(`${number}\\s*([<≤])\\s*x\\s*([<≤])\\s*${number}`));
    if(match)return base(`<line class="solution" x1="125" y1="34" x2="295" y2="34"/>${dot(125,match[1],match[2]==='≤')}${dot(295,match[4],match[3]==='≤')}`);
    match=value.match(new RegExp(`x\\s*([<>≤≥])\\s*${number}`));
    if(match){const right=match[1]==='>'||match[1]==='≥',x=210;return base(`${right?`<line class="solution" x1="${x}" y1="34" x2="398" y2="34"/>`:`<line class="solution" x1="20" y1="34" x2="${x}" y2="34"/>`}${dot(x,match[2],match[1]==='≤'||match[1]==='≥')}`)}
    match=value.match(/([[(])\s*([−-]?\d+(?:[,.]\d+)?)\s*;\s*([−-]?\d+(?:[,.]\d+)?)\s*([\])])/);
    if(match)return base(`<line class="solution" x1="125" y1="34" x2="295" y2="34"/>${dot(125,match[2],match[1]==='[')}${dot(295,match[3],match[4]===']')}`);
    const values=[...value.matchAll(new RegExp(`x(?:[₁₂0-9,]*)?\\s*=\\s*${number}`,'g'))].map(item=>item[1]);
    if(values.length){const unique=[...new Set(values)].slice(0,4),step=300/(unique.length+1);return base(unique.map((label,index)=>dot(60+step*(index+1),label,true)).join(''))}
    if(/∅|nessuna soluzione/i.test(value))return base('<text class="label" x="210" y="25">∅</text>');
    return '';
  };
  const scan=()=>{
    document.querySelectorAll('.pair-result').forEach(result=>{const example=result.closest('.pair-example'),previous=example?[...example.querySelectorAll('.step .formula')].at(-1):null;if(!previous)return;const clean=value=>value.replace(/^\s*Risultato\s*:\s*/i,'').replace(/\s+/g,' ').trim();if(clean(previous.textContent)!==clean(result.textContent))return;result.previousElementSibling?.classList.contains('result-arrow')&&result.previousElementSibling.remove();result.nextElementSibling?.classList.contains('solution-axis')&&result.nextElementSibling.remove();result.remove()});
    document.querySelectorAll('.pair-result,.step:last-child .formula,.result-formula,#labResults .formula,#labResults .remember,.solution,.result .formula,.pair .example .step:last-child span').forEach(formula=>{
      if(formula.dataset.solutionAxis)return;
      if(formula.classList.contains('remember')&&!/Risultato\s*:|Soluzione\s*:/i.test(formula.textContent))return;
      const copy=formula.cloneNode(true);copy.querySelectorAll('.frac').forEach(fraction=>{const numerator=fraction.querySelector('.num')?.textContent.trim(),denominator=fraction.querySelector('.den')?.textContent.trim();if(numerator&&denominator)fraction.replaceWith(`${numerator}/${denominator}`)});
      const axis=make(copy.textContent);if(!axis)return;
      formula.dataset.solutionAxis='1';formula.insertAdjacentHTML('afterend',axis);
    });
  };
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(scan,0),true);scan();
})();
