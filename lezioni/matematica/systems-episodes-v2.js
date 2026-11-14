(()=>{
 if(typeof D==='undefined'||!['eq','ineq'].includes(D.systems_kind))return;
 document.body.classList.add('systems-episode');
 const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nice=n=>Math.abs(n)<1e-9?'0':String(Number(n.toFixed(3))).replace('.',',');
 const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
 const rat=(a,b)=>{if(b<0){a=-a;b=-b}const g=gcd(Math.abs(a),Math.abs(b))||1;a/=g;b/=g;return b===1?String(a):a+'/'+b};
 const F=s=>mathFormula(String(s));
 const formulaLines=value=>{const out=[];let depth=0,start=0;const s=String(value);for(let i=0;i<s.length;i++){if('([{'.includes(s[i]))depth++;else if(')]}'.includes(s[i]))depth=Math.max(0,depth-1);else if(s[i]===';'&&depth===0){out.push(s.slice(start,i));start=i+1}}out.push(s.slice(start));return out;};
 const linear=(a,b,c)=>{const term=(n,v,first=false)=>!n?'':(n<0?'−':first?'':'+')+(Math.abs(n)===1?'':Math.abs(n))+v;return [term(a,'x',true),term(b,'y',!a)].filter(Boolean).join(' ')+' = '+c};
 const style=document.createElement('style');style.textContent=`
 .systems-episode .learning-pair .formula,.systems-episode #labResults .formula{white-space:normal!important;overflow-x:auto!important;line-height:1.65!important}
 .systems-episode .learning-pair:not([hidden]) .formula-parts{flex-direction:column!important;align-items:stretch!important;flex-wrap:wrap!important}
 .systems-episode .learning-pair:not([hidden]) .formula-part,.systems-episode .formula-chunk{white-space:normal!important;min-width:0!important}
 .systems-episode .sys-formula-line{display:block;margin:5px 0}
 .systems-graph{margin:14px 0;padding:12px;border:1px solid #c8d8e8;border-radius:14px;background:white}
 .systems-graph svg{display:block;width:100%;height:auto;background:white}
 .systems-graph figcaption{font-family:system-ui,sans-serif;font-size:1rem;line-height:1.5;text-align:left;color:var(--b);margin-top:10px}
 .systems-graph .remember{margin:8px 0 0}
 .systems-input-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:12px 0;font-size:1.05rem;font-weight:850;color:var(--b)}
 .systems-input-row input{width:65px!important;min-height:42px;font-size:1rem!important;padding:5px!important;text-align:center;border:2px solid var(--y);border-radius:8px}
 .systems-input-row select{min-height:42px;border:2px solid var(--y);border-radius:8px;padding:5px;background:white;font-size:1rem}
 `;document.head.append(style);
 function classify(rows){
  if(rows.some(([a,b,c])=>a===0&&b===0&&c!==0))return {kind:'empty',reason:'Una delle equazioni è falsa: 0 è diverso dal secondo membro.'};
  const nonzero=rows.filter(([a,b])=>a!==0||b!==0);
  if(!nonzero.length)return {kind:'plane',reason:'Entrambe sono identità: tutte le coppie del piano sono soluzioni.'};
  if(nonzero.length===1)return {kind:'line',reason:'Un’equazione è un’identità. Le soluzioni sono tutti i punti dell’altra retta.'};
  const [[a,b,c],[d,e,f]]=rows,det=a*e-b*d;
  if(Math.abs(det)>1e-10){const nx=c*e-b*f,ny=a*f-c*d;return {kind:'point',point:[nx/det,ny/det],exact:[rat(nx,det),rat(ny,det)],reason:'Sistema determinato: le rette hanno un solo punto comune.'}}
  if(Math.abs(a*f-c*d)>1e-10||Math.abs(b*f-c*e)>1e-10)return {kind:'empty',reason:'Sistema impossibile: le rette sono parallele distinte.'};
  return {kind:'line',reason:'Sistema indeterminato: le rette coincidono. Tutti i punti della retta sono comuni.'};
 }
 function equationGraph(rows,result){
  const point=result.point,px=point?.[0]||0,py=point?.[1]||0,xmin=Math.min(-2,px-2),xmax=Math.max(5,px+2),ymin=Math.min(-2,py-2),ymax=Math.max(5,py+2);
  const X=x=>48+(x-xmin)/(xmax-xmin)*416,Y=y=>306-(y-ymin)/(ymax-ymin)*266;
  const segment=([a,b,c])=>{const points=[];const add=(x,y)=>{if(x>=xmin-1e-8&&x<=xmax+1e-8&&y>=ymin-1e-8&&y<=ymax+1e-8&&!points.some(p=>Math.abs(p[0]-x)<1e-8&&Math.abs(p[1]-y)<1e-8))points.push([x,y])};if(b)for(const x of [xmin,xmax])add(x,(c-a*x)/b);if(a)for(const y of [ymin,ymax])add((c-b*y)/a,y);return points.slice(0,2)};
  const draw=(row,color,width,dash='')=>{const p=segment(row);return p.length===2?`<line class="system-line" data-a="${row[0]}" data-b="${row[1]}" data-c="${row[2]}" data-x1="${p[0][0]}" data-y1="${p[0][1]}" data-x2="${p[1][0]}" data-y2="${p[1][1]}" x1="${X(p[0][0])}" y1="${Y(p[0][1])}" x2="${X(p[1][0])}" y2="${Y(p[1][1])}" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`:''};
  const ticks=(lo,hi)=>{const gap=Math.max(1,Math.ceil((hi-lo)/7)),out=[];for(let v=Math.ceil(lo/gap)*gap;v<=hi;v+=gap)out.push(v);return out};
  const grid=ticks(xmin,xmax).map(x=>`<line x1="${X(x)}" x2="${X(x)}" y1="36" y2="310" stroke="#e6eef5"/>${x===0?'':`<text x="${X(x)}" y="${Y(0)+18}" text-anchor="middle" fill="#5c6b82" font-size="13">${nice(x)}</text>`}`).join('')+ticks(ymin,ymax).map(y=>`<line x1="44" x2="470" y1="${Y(y)}" y2="${Y(y)}" stroke="#e6eef5"/>${y===0?'':`<text x="${X(0)-7}" y="${Y(y)+4}" text-anchor="end" fill="#5c6b82" font-size="13">${nice(y)}</text>`}`).join('');
  const common=result.kind==='line'?draw(rows.find(([a,b])=>a||b),'#ffd21c',10):result.kind==='plane'?'<rect x="48" y="40" width="416" height="266" fill="#ffd21c" opacity=".23"/>':'';
  const marker=point?`<path d="M${X(px)} ${Y(0)} V${Y(py)} H${X(0)}" fill="none" stroke="#5c6b82" stroke-dasharray="4 4"/><circle class="common-point" data-x="${px}" data-y="${py}" cx="${X(px)}" cy="${Y(py)}" r="7" fill="#ffd21c" stroke="#073b82" stroke-width="2"/><text x="${X(px)+12}" y="${Y(py)-10}" fill="#073b82" font-size="17" font-weight="850">P</text>`:'';
  const explanation=result.kind==='point'?`Il punto giallo P appartiene a entrambe le rette. La sua ascissa è x e la sua ordinata è y. Le linee tratteggiate aiutano a leggere le coordinate.`:result.kind==='empty'?'Le rette non hanno punti comuni: non esiste una coppia che soddisfi entrambe le equazioni.':result.kind==='plane'?'Tutto il piano rappresenta le soluzioni: ogni coppia verifica le due identità.':'La parte comune è tutta la retta, non un solo punto e non tutto il piano.';
  return `<figure class="systems-graph" data-graph="equations" data-case="${result.kind}"><svg viewBox="0 0 520 346" role="img" aria-label="${E(result.reason)}"><text x="48" y="19" fill="#0b478c" font-size="14">Prima retta: linea continua</text><text x="272" y="19" fill="#ad7100" font-size="14">Seconda: linea tratteggiata</text>${grid}${common}<line x1="44" x2="475" y1="${Y(0)}" y2="${Y(0)}" stroke="#607089"/><line x1="${X(0)}" x2="${X(0)}" y1="30" y2="315" stroke="#607089"/><text x="480" y="${Y(0)-5}" fill="#073b82">x</text><text x="${X(0)+6}" y="31" fill="#073b82">y</text><text x="${X(0)-10}" y="${Y(0)+17}" fill="#5c6b82" font-size="13">0</text>${draw(rows[0],'#0b478c',3)}${draw(rows[1],'#c08b00',3,'8 5')}${marker}</svg><figcaption>${explanation}</figcaption></figure>`;
 }
 const normalize=sets=>sets.map(([lo,hi,lc,hc])=>({lo:lo===null?-Infinity:lo,hi:hi===null?Infinity:hi,lc:!!lc,hc:!!hc}));
 const contains=(set,x)=>set.some(s=>(x>s.lo||x===s.lo&&s.lc)&&(x<s.hi||x===s.hi&&s.hc));
 function intersect(one,two){const out=[];for(const a of one)for(const b of two){const lo=Math.max(a.lo,b.lo),hi=Math.min(a.hi,b.hi),lc=(a.lo<lo||a.lc)&&(b.lo<lo||b.lc),hc=(a.hi>hi||a.hc)&&(b.hi>hi||b.hc);if(lo<hi||lo===hi&&lc&&hc)out.push({lo,hi,lc,hc})}return out;}
 const notation=set=>!set.length?'∅':set.map(s=>s.lo===s.hi?'{'+nice(s.lo)+'}':(s.lo===-Infinity?'(−∞':(s.lc?'[':'(')+nice(s.lo))+'; '+(s.hi===Infinity?'+∞)':nice(s.hi)+(s.hc?']':')'))).join(' ∪ ');
 function inequalityGraph(sets,probe){
  const bounds=sets.flatMap(set=>set.flatMap(s=>[s.lo,s.hi]).filter(Number.isFinite)).concat(Number.isFinite(probe)?[probe]:[]),min=Math.min(-2,...bounds)-1,max=Math.max(4,...bounds)+1,X=x=>83+(x-min)/(max-min)*397;
  const labels=['S₁','S₂','S₁ ∩ S₂'],colors=['#0b478c','#1670c5','#ffd21c'];
  const rows=sets.map((set,i)=>{const y=46+i*82,color=colors[i];let pieces=set.map(s=>{const l=Number.isFinite(s.lo)?X(s.lo):72,r=Number.isFinite(s.hi)?X(s.hi):491;const dot=(v,closed)=>`<circle cx="${X(v)}" cy="${y}" r="6" fill="${closed?color:'white'}" stroke="#073b82" stroke-width="2"/><text x="${X(v)}" y="${y+24}" fill="#073b82" text-anchor="middle" font-size="15">${nice(v)}</text>`;return `${s.lo===s.hi?'':`<line class="interval-piece" data-lo="${s.lo}" data-hi="${s.hi}" data-lc="${s.lc}" data-hc="${s.hc}" x1="${l}" x2="${r}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="8"/>`}${Number.isFinite(s.lo)?dot(s.lo,s.lc):''}${Number.isFinite(s.hi)&&s.hi!==s.lo?dot(s.hi,s.hc):''}`}).join('');return `<g class="interval-row" data-row="${i}" data-notation="${E(notation(set))}"><text x="4" y="${y+5}" fill="#073b82" font-size="16" font-weight="850">${labels[i]}</text><line x1="72" x2="495" y1="${y}" y2="${y}" stroke="#607089" stroke-width="1.5"/><path d="M488 ${y-4} L495 ${y} L488 ${y+4}" fill="none" stroke="#607089"/>${pieces}${set.length?'':`<text x="280" y="${y-10}" text-anchor="middle" fill="#073b82" font-size="20">∅</text>`}${Number.isFinite(probe)&&probe>=min&&probe<=max?`<path d="M${X(probe)} ${y-18} L${X(probe)-5} ${y-27} L${X(probe)+5} ${y-27} Z" fill="${contains(set,probe)?'#17844a':'#78889a'}"/>`:''}<text x="498" y="${y-7}" font-size="13" fill="#073b82">x</text></g>`}).join('');
  return `<figure class="systems-graph" data-graph="inequalities"><svg viewBox="0 0 520 256" role="img" aria-label="Prima soluzione, seconda soluzione e intersezione sulla stessa scala">${rows}</svg><figcaption>Le tre righe usano la stessa scala. La riga gialla conserva soltanto i valori comuni. Cerchio vuoto: escluso; cerchio pieno: incluso.</figcaption></figure>`;
 }
 function renderFormula(el,value,label){
  if(/sistema iniziale/i.test(label||'')){el.innerHTML=mathFormula(value,'Sistema');return}
  el.innerHTML=formulaLines(value).map(line=>`<span class="sys-formula-line">${F(line.trim())}</span>`).join('');
 }
 function installExamples(){
  document.querySelectorAll('.learning-pair').forEach((pair,i)=>{
   const example=pair.querySelector('.pair-example'),data=D.guided_examples[i],g=data?.solution_graph;if(!example||!g)return;
   const steps=[...example.querySelectorAll('.step')];steps.forEach((step,j)=>{const el=step.querySelector('.formula');if(el)renderFormula(el,data.steps[j].formula,data.steps[j].label)});
   const target=steps[Math.max(0,steps.length-2)]?.querySelector('.formula');if(!target)return;
   const html=g.kind==='eq'?equationGraph(g.rows,classify(g.rows)):inequalityGraph(g.sets.map(normalize));
   target.insertAdjacentHTML('beforebegin',html);
  });
 }
 const input=(id,value,label)=>`<input id="${id}" type="number" min="-9" max="9" step="1" value="${value}" aria-label="${label}">`;
 function equationLab(){
  const host=document.getElementById('labControls'),out=document.getElementById('labResults'),work=document.getElementById('labSteps'),keys=['a','b','c','d','e','f'];
  host.innerHTML='<h3>Modifica le due equazioni</h3><p>Coefficienti interi da −9 a 9.</p>'+[[1,1,5],[1,-1,1]].map((v,i)=>`<p><b>${i?'Seconda':'Prima'} equazione</b></p><div class="systems-input-row">${input('sys-'+keys[i*3],v[0],'coefficiente di x, equazione '+(i+1))}x + ${input('sys-'+keys[i*3+1],v[1],'coefficiente di y, equazione '+(i+1))}y = ${input('sys-'+keys[i*3+2],v[2],'secondo membro, equazione '+(i+1))}</div>`).join('');
  function update(){const vals=keys.map(k=>Number(document.getElementById('sys-'+k).value));if(vals.some(v=>!Number.isInteger(v)||Math.abs(v)>9)){out.innerHTML='<p class="remember">Inserisci coefficienti interi compresi tra −9 e 9.</p>';work.innerHTML='';return}const rows=[vals.slice(0,3),vals.slice(3)],r=classify(rows);out.innerHTML=`<p class="remember"><b>${E(r.reason)}</b></p>${equationGraph(rows,r)}${r.point?`<div class="formula">P = (${F(r.exact[0])}; ${F(r.exact[1])})</div>`:''}`;if(r.point){const [x,y]=r.point;work.innerHTML=`<p><b>1.</b> ${E(linear(...rows[0]))}; ${E(linear(...rows[1]))}.</p><p><b>2.</b> Le rette hanno un punto comune.</p><div class="formula">x = ${F(r.exact[0])} ; y = ${F(r.exact[1])}</div><p><b>3.</b> Verifica nella prima: ${nice(rows[0][0]*x+rows[0][1]*y)} = ${rows[0][2]}.</p><p><b>4.</b> Verifica nella seconda: ${nice(rows[1][0]*x+rows[1][1]*y)} = ${rows[1][2]}.</p>`}else work.innerHTML=`<p><b>1.</b> Osserva se le due condizioni descrivono rette distinte, la stessa retta oppure identità.</p><p><b>2.</b> ${E(r.reason)}</p><p><b>3.</b> ${r.kind==='empty'?'Non esiste una coppia comune.':r.kind==='plane'?'Ogni coppia del piano soddisfa il sistema.':'Ogni punto della retta comune soddisfa il sistema.'}</p>`;}
  keys.forEach(k=>document.getElementById('sys-'+k).addEventListener('input',update));update();
 }
 function inequalityLab(){
  const host=document.getElementById('labControls'),out=document.getElementById('labResults'),work=document.getElementById('labSteps');const select=(id,op)=>`<select id="${id}" aria-label="segno della ${id==='sys-op1'?'prima':'seconda'} disequazione">${['>','≥','<','≤'].map(v=>`<option${v===op?' selected':''}>${E(v)}</option>`).join('')}</select>`;
  host.innerHTML=`<h3>Modifica le condizioni</h3><p>Estremi interi da −9 a 9.</p><div class="systems-input-row">x ${select('sys-op1','>')} ${input('sys-bound1',1,'estremo della prima disequazione')}</div><div class="systems-input-row">x ${select('sys-op2','≤')} ${input('sys-bound2',4,'estremo della seconda disequazione')}</div><label for="sys-probe"><b>Prova un valore di x</b></label><div class="systems-input-row">x = ${input('sys-probe',3,'valore da verificare nelle due condizioni')}</div>`;
  const ray=(op,b)=>normalize(op==='>'?[[b,null,false,false]]:op==='≥'?[[b,null,true,false]]:op==='<'?[[null,b,false,false]]:[[null,b,false,true]]);
  function update(){const a=Number(document.getElementById('sys-bound1').value),b=Number(document.getElementById('sys-bound2').value),p=Number(document.getElementById('sys-probe').value);if([a,b,p].some(v=>!Number.isInteger(v)||Math.abs(v)>9)){out.innerHTML='<p class="remember">Inserisci numeri interi compresi tra −9 e 9.</p>';work.innerHTML='';return}const one=ray(document.getElementById('sys-op1').value,a),two=ray(document.getElementById('sys-op2').value,b),common=intersect(one,two),yes=contains(common,p);out.innerHTML=inequalityGraph([one,two,common],p)+`<div class="formula">S = ${E(notation(common))}</div><p class="remember">x = ${nice(p)} ${yes?'soddisfa entrambe le condizioni e appartiene all’intersezione.':'non soddisfa entrambe le condizioni e non appartiene all’intersezione.'}</p>`;work.innerHTML=`<p><b>1.</b> Prima soluzione: ${E(notation(one))}.</p><p><b>2.</b> Seconda soluzione: ${E(notation(two))}.</p><p><b>3.</b> Intersezione: ${E(notation(common))}.</p><p><b>4.</b> Per x = ${nice(p)}: prima condizione ${contains(one,p)?'vera':'falsa'}; seconda condizione ${contains(two,p)?'vera':'falsa'}.</p>`;}
  ['sys-op1','sys-op2','sys-bound1','sys-bound2','sys-probe'].forEach(id=>document.getElementById(id).addEventListener(id.includes('op')?'change':'input',update));update();
 }
 window.FerrarisSystems={classify,intersect,contains,normalize,notation};
 installExamples();if(D.systems_kind==='eq')equationLab();else inequalityLab();
 document.querySelectorAll('.actions button').forEach(button=>button.addEventListener('click',()=>document.querySelector('.screen.active .voice-controls button:nth-child(2)')?.click(),true));
})();
