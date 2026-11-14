/* Revisione 45–64: frazioni strutturate, grafici da funzioni, avanzamento esplicito. */
(()=>{
 if(typeof D==='undefined'||!D.revision)return;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const superChars='⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ';
 function leftStart(s,end){
  let i=end-1;while(i>=0&&/\s/.test(s[i]))i--;
  while(i>=0&&superChars.includes(s[i]))i--;
  // A parenthesized numerator may have an adjacent coefficient or radical.
  if(s[i]===')'){let depth=1;i--;while(i>=0&&depth){if(s[i]===')')depth++;if(s[i]==='(')depth--;i--;}if(depth)return end;}
  while(i>=0&&/[\p{L}\p{N}√⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ²³]/u.test(s[i]))i--;
  if(i>=0&&/[−-]/.test(s[i])&&(i===0||/[=;( →]/.test(s[i-1])))i--;
  return i+1;
 }
 function rightEnd(s,start){let i=start;while(/\s/.test(s[i]||'')&&i<s.length)i++;
  if(/[−-]/.test(s[i]||''))i++;
  while(i<s.length&&(superChars.includes(s[i])||s[i]==='√'))i++;
  if(s[i]==='('){let depth=1;i++;while(i<s.length&&depth){if(s[i]==='(')depth++;if(s[i]===')')depth--;i++;}if(depth)return start;}
  else while(i<s.length&&/[\p{L}\p{N}√⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ²³]/u.test(s[i]))i++;
  while(i<s.length&&superChars.includes(s[i]))i++;
  return i;
 }
 function fractions(text){
  let slash=-1,depth=0,minimum=Infinity;for(let i=0;i<text.length;i++){if(text[i]==='(')depth++;if(text[i]===')')depth--;if(text[i]==='/'&&depth<minimum){slash=i;minimum=depth;}}if(slash<0)return escape(text);
  const a=leftStart(text,slash),b=rightEnd(text,slash+1);
  if(a===slash||b<=slash+1)return escape(text);
  const unwrap=v=>v.trim().startsWith('(')&&v.trim().endsWith(')')?v.trim().slice(1,-1):v.trim();
  return fractions(text.slice(0,a))+'<span class="frac math-frac"><span class="num math-num">'+fractions(unwrap(text.slice(a,slash)))+'</span><span class="den math-den">'+fractions(unwrap(text.slice(slash+1,b)))+'</span></span>'+fractions(text.slice(b));
 }
 const original=mathFormula;
 mathFormula=(value,label)=>String(value||'').includes('/')?fractions(String(value)):original(value,label);
 const style=document.createElement('style');style.textContent=`
 .revision-lesson .learning-pair:not([hidden]){grid-template-columns:minmax(0,1fr)!important;gap:18px}
 .revision-lesson .pair-arrow,.revision-lesson .result-arrow,.revision-lesson .lesson-pager{display:none!important}
 .revision-lesson .pair-example .step[hidden],.revision-lesson [hidden]{display:none!important}
 .revision-lesson .formula,.revision-lesson .mini-formula{font-size:clamp(18px,2.1vw,24px)!important;white-space:normal!important;overflow-x:auto!important;overflow-y:hidden!important;line-height:1.8!important;max-width:100%;text-align:left}
 .revision-lesson .learning-pair:not([hidden]) .formula-part,.revision-lesson .learning-pair:not([hidden]) .formula-chunk{white-space:normal!important;min-width:0!important;max-width:100%}
 .revision-lesson .learning-pair:not([hidden]) .formula-parts{flex-direction:column!important;flex-wrap:wrap!important;align-items:stretch!important;gap:14px!important}.revision-lesson .learning-pair:not([hidden]) .formula-part{flex:1 1 auto!important;width:100%!important;justify-content:flex-start!important}
 .revision-lesson .math-frac{display:inline-flex!important;vertical-align:middle;flex-direction:column;align-items:stretch;text-align:center;line-height:1.35;margin:0 .2em;white-space:nowrap;flex-shrink:0}
 .revision-lesson .math-num{display:block;border-bottom:2px solid currentColor;padding:0 .18em .12em}
 .revision-lesson .math-den{display:block;padding:.12em .18em 0}
 .revision-lesson .pair-definition .formula{background:var(--b);color:white;padding:18px;border-radius:12px}
 .revision-lesson .step{opacity:1!important;transform:none!important;min-width:0}
 .revision-lesson .revision-next{margin-top:18px}
 .revision-graph{margin:20px 0 0;padding:12px;background:#fff;border:1px solid #cbdcec;border-radius:14px}
 .revision-graph svg{display:block;width:100%;max-width:780px;margin:auto}
 .revision-graph figcaption{font-size:1rem;line-height:1.5;color:var(--b)}
 @media(min-width:1100px){.revision-lesson .learning-pair:not([hidden]){grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr)!important}}
 `;document.head.append(style);document.body.classList.add('revision-lesson');
 const number=v=>Math.abs(v)<1e-9?'0':Number(v.toFixed(3)).toString().replace('.',',');
 function plot(example){
  if(!example.graph)return '';
  const [a,b,c]=example.graph.coefficients,delta=b*b-4*a*c,roots=delta>0?[(-b-Math.sqrt(delta))/(2*a),(-b+Math.sqrt(delta))/(2*a)].sort((x,y)=>x-y):delta===0?[-b/(2*a)]:[];
  const vertex=-b/(2*a),extent=roots.length>1?Math.max(2,roots[1]-roots[0]):4;
  const xmin=Math.min(0,vertex,...roots)-extent*.45,xmax=Math.max(0,vertex,...roots)+extent*.45;
  const f=x=>a*x*x+b*x+c,low=Math.min(0,f(vertex)),high=Math.max(f(xmin),f(xmax),1),yrange=Math.max(high-low,1),ymin=low-yrange*.22,ymax=high+yrange*.12;
  const X=x=>42+(x-xmin)/(xmax-xmin)*636,Y=y=>255-(y-ymin)/(ymax-ymin)*225;
  const intervals=example.graph.intervals||[];
  const bands=intervals.map(([l,r])=>`<line x1="${l===null?36:X(l)}" x2="${r===null?688:X(r)}" y1="${Y(0)}" y2="${Y(0)}" stroke="#ffd21c" stroke-width="8"/>`).join('');
  const path=Array.from({length:241},(_,i)=>{const x=xmin+(xmax-xmin)*i/240;return `${i?'L':'M'}${X(x).toFixed(2)},${Y(f(x)).toFixed(2)}`}).join(' ');
  return `<figure class="revision-graph"><svg viewBox="0 0 720 315" role="img" aria-label="${escape('Parabola y = '+example.title.replace(/\s*(=|>|<|≤|≥).*$/,''))}"><line x1="36" x2="688" y1="${Y(0)}" y2="${Y(0)}" stroke="#65758a"/><line x1="${X(0)}" x2="${X(0)}" y1="20" y2="268" stroke="#65758a"/><text x="692" y="${Y(0)-5}" fill="#0b478c">x</text><text x="${X(0)+7}" y="19" fill="#0b478c">y</text>${bands}<path d="${path}" fill="none" stroke="#0b478c" stroke-width="3"/>${roots.map(r=>`<circle cx="${X(r)}" cy="${Y(0)}" r="5" fill="${!intervals.length||intervals.some(t=>(t[0]===r&&t[2])||(t[1]===r&&t[3]))?'#ffd21c':'white'}" stroke="#0b478c"/><text x="${X(r)}" y="${Y(0)+25}" text-anchor="middle" fill="#0b478c" font-size="18">${number(r)}</text>`).join('')}<text x="42" y="301" fill="#0b478c" font-size="17">${roots.length?'Zeri: '+roots.map(number).join('; '):'Nessuna intersezione con l’asse x'}</text></svg><figcaption>${escape('Grafico di y = '+example.title.replace(/\s*(=|>|<|≤|≥).*$/,''))}. ${delta<0?'La parabola non incontra l’asse x.':delta===0?'La parabola è tangente all’asse x.':'Le intersezioni coincidono con gli zeri calcolati.'}</figcaption></figure>`;
 }
 function solutionAxis(data){
  if(!data)return '';
  let values=data.points||[...new Set(data.intervals.flatMap(v=>v.slice(0,2)).filter(v=>v!==null))].sort((a,b)=>a-b);
  const min=Math.min(0,...values)-1,max=Math.max(0,...values)+1,X=v=>40+(v-min)/(max-min||1)*620;
  const label=(v)=>data.labels?.[values.indexOf(v)]||number(v);
  const labelHTML=(v)=>{const t=label(v),m=t.match(/^([−-]?\d+)\/(\d+)$/);return m?`<text x="${X(v)}" y="68" text-anchor="middle" fill="#0b478c" font-size="17">${escape(m[1])}</text><line x1="${X(v)-12}" x2="${X(v)+12}" y1="73" y2="73" stroke="#0b478c"/><text x="${X(v)}" y="91" text-anchor="middle" fill="#0b478c" font-size="17">${escape(m[2])}</text>`:`<text x="${X(v)}" y="77" text-anchor="middle" fill="#0b478c" font-size="18">${escape(t)}</text>`};
  const dot=(v,closed)=>`<circle cx="${X(v)}" cy="40" r="6" stroke="#0b478c" stroke-width="2" fill="${closed?'#ffd21c':'white'}"/>`;
  const lines=(data.intervals||[]).map(([a,b])=>`<line x1="${a===null?22:X(a)}" x2="${b===null?688:X(b)}" y1="40" y2="40" stroke="#ffd21c" stroke-width="8"/>`).join('');
  return `<figure class="revision-graph revision-solution"><svg viewBox="0 0 720 105" role="img" aria-label="${escape('Soluzioni: '+(data.points?values.map(label).join('; '):'intervalli evidenziati in giallo'))}"><line x1="18" x2="700" y1="40" y2="40" stroke="#0b478c" stroke-width="2"/><path d="M692 35 L700 40 L692 45" fill="none" stroke="#0b478c"/><text x="700" y="26" fill="#0b478c">x</text>${lines}${values.map(v=>dot(v,!!data.points||(data.intervals||[]).some(t=>(t[0]===v&&t[2])||(t[1]===v&&t[3])))+labelHTML(v)).join('')}</svg><figcaption>Soluzione finale sull’asse reale. ${data.intervals?'Gli estremi vuoti sono esclusi; quelli pieni sono inclusi.':''}</figcaption></figure>`;
 }
 function install(){
  document.querySelectorAll('.learning-pair').forEach((pair,index)=>{
   const ex=D.guided_examples[index],box=pair.querySelector('.pair-example');if(!box||!ex)return;
   if(D.title==='Le equazioni di secondo grado'){const definition=pair.querySelector('.pair-definition');const formula=definition?.querySelector('.formula');if(index===0&&formula){const intro=document.createElement('div');intro.innerHTML='<p>Forma generale: a ≠ 0.</p><div class="formula">ax² + bx + c = 0</div><p>Il discriminante determina il numero di soluzioni reali.</p><div class="formula">Δ = b² − 4ac</div>';formula.before(intro)}if(index===2&&formula)formula.innerHTML=mathFormula('ax² + c = 0 → x² = −c/a');}
   // Rebuild examples once, avoiding old fraction conversion and duplicate result containers.
   box.innerHTML=`<span class="pair-label">Esempio guidato</span><h4>${mathFormula(ex.title)}</h4><div class="stepper">${ex.steps.map((s,i)=>`<div class="step show" hidden><span class="n">${i+1}</span><div><b>${escape(s.label.replace(/^Passaggio\s+\d+\s*[—-]\s*/,''))}</b>${s.text===s.label?'':`<p class="narrated-text">${escape(s.text)}</p>`}<div class="formula">${mathFormula(s.formula,s.text)}</div></div></div>`).join('')}</div><div class="revision-final" hidden>${ex.concept==='Quando una frazione si annulla'?`<div class="formula pair-result">${mathFormula(ex.result)}</div>`:''}${/con x/.test(ex.result||'')&&!/con x/.test(ex.steps.at(-1).formula||'')?`<p class="remember">Condizioni: ${mathFormula(ex.result.slice(ex.result.indexOf('con x')+4))}</p>`:''}${plot(ex)}${ex.graph?'':solutionAxis(ex.solution)}</div><button class="primary revision-next" type="button">Mostra il primo passaggio</button>`;
   const steps=[...box.querySelectorAll('.step')],final=box.querySelector('.revision-final'),button=box.querySelector('.revision-next');
   const reveal=(through,scroll=false)=>{steps.forEach((s,i)=>{if(i<=through)s.hidden=false;s.classList.toggle('audio-current',i===through)});if(through>=steps.length-1){final.hidden=false;button.hidden=true}else button.textContent='Mostra il passaggio successivo';if(scroll)steps[Math.min(through,steps.length-1)]?.scrollIntoView({behavior:'smooth',block:'center'})};
   button.onclick=()=>{window.__stopPairedAudio?.();const i=steps.findIndex(s=>s.hidden);if(i>=0)reveal(i,true)};
   pair.__revealRevision=reveal;
   pair.__resetRevision=()=>{steps.forEach(s=>{s.hidden=true;s.classList.remove('audio-current')});final.hidden=true;button.hidden=false;button.textContent='Mostra il primo passaggio'};
  });
  // Render formulas in definitions that were created by the earlier inline template.
  document.querySelectorAll('.pair-definition .formula,.pair-definition .mini-formula').forEach(el=>{if(!el.querySelector('.frac,.math-frac')&&el.textContent.includes('/'))el.innerHTML=fractions(el.textContent)});
 }
 document.addEventListener('paired-topic-selected',event=>{document.querySelectorAll('.learning-pair')[Number(event.detail?.index)||0]?.__resetRevision?.()},true);
 window.FerrarisRevision={fractions,solutionAxis,install};
 document.addEventListener('DOMContentLoaded',()=>{
  install();
  const convert=()=>document.querySelectorAll('.formula,.mini-formula,#labResults strong,.poly-editor').forEach(host=>{
   const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('.frac,.math-frac,svg,script,style,input,textarea')||!n.nodeValue.includes('/')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
   const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
   nodes.forEach(node=>{const rendered=fractions(node.nodeValue);if(!rendered.includes('math-frac'))return;const template=document.createElement('template');template.innerHTML=rendered;node.replaceWith(template.content)});
  });
  let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;convert()})}).observe(document.body,{childList:true,subtree:true});convert();
 },{once:true});
})();
