(()=>{
  if(typeof D==='undefined'||D.title!=='Le disequazioni di secondo grado')return;
  document.body.classList.add('dq-lesson');
  const style=document.createElement('style');
  style.textContent=`
    .dq-lesson .learning-pair .pair-definition .formula{font-size:18px!important;white-space:normal!important;overflow-x:visible!important;line-height:1.65!important;text-align:left!important}
    .dq-lesson .learning-pair:not([hidden]) .pair-definition .formula-parts{flex-direction:column!important;align-items:stretch!important;gap:14px!important;flex-wrap:wrap!important}
    .dq-lesson .learning-pair:not([hidden]) .pair-definition .formula-part{display:block!important;min-width:0!important;white-space:normal!important;width:100%!important;flex:1 1 auto!important}
    .dq-lesson .pair-definition .formula-part .roman{display:none}
    .dq-lesson .dq-example-graph{margin:12px 0!important;padding:12px!important;box-shadow:none!important}
    .dq-lesson .dq-example-graph svg{width:100%;height:auto;display:block;background:#fff;border-radius:12px}
    .dq-lesson .dq-example-graph .remember{margin:10px 0 0;font-size:1rem}
  `;
  document.head.append(style);
  const graphs={
    'x² − 5x + 6 > 0':{a:1,b:-5,c:6,mode:'outside',note:'La parabola è sopra l’asse x per x < 2 oppure x > 3. Gli estremi 2 e 3 sono esclusi perché la disequazione è stretta.'},
    'x² − 2x + 1 > 0':{a:1,b:-2,c:1,mode:'except',note:'La parabola tocca l’asse x in 1 e resta sopra l’asse negli altri punti. Quindi x ≠ 1.'},
    'x² + x + 12 > 0':{a:1,b:1,c:12,mode:'all',note:'La parabola resta sempre sopra l’asse x: la disequazione è vera per ogni numero reale.'},
    'x² ≤ 0':{a:1,b:0,c:0,mode:'point',note:'La parabola non scende sotto l’asse x. È uguale a zero soltanto in 0, che è incluso nella soluzione.'}
  };
  const nice=n=>Math.abs(n)<1e-9?'0':String(Number(n.toFixed(3))).replace('.',',');
  function graph(data,id){
    const {a,b,c}=data,delta=b*b-4*a*c,v=-b/(2*a),f=x=>a*x*x+b*x+c;
    const roots=delta>0?[(-b-Math.sqrt(delta))/(2*a),(-b+Math.sqrt(delta))/(2*a)]:delta===0?[v]:[];
    const margin=roots.length===2?Math.max(1,(roots[1]-roots[0])*.75):2;
    const xmin=Math.min(0,v,...roots)-margin,xmax=Math.max(0,v,...roots)+margin;
    const X=x=>25+(x-xmin)/(xmax-xmin)*370,scale=delta>0?Math.min(100,28/Math.abs(f(v))):delta===0?45:130/f(v),Y=y=>170-scale*y;
    const mid=(xmin+xmax)/2,p0=Y(f(xmin)),p2=Y(f(xmax)),control=2*Y(f(mid))-(p0+p2)/2;
    const path=`M25 ${p0} Q210 ${control} 395 ${p2}`;
    const segment=(lo,hi)=>`<line x1="${lo}" x2="${hi}" y1="170" y2="170" stroke="#ffd21c" stroke-width="8"/>`;
    const highlight=data.mode==='outside'?segment(25,X(roots[0]))+segment(X(roots[1]),395):data.mode==='except'||data.mode==='all'?segment(25,395):'';
    const marks=roots.map(r=>`<circle cx="${X(r)}" cy="170" r="6" fill="${data.mode==='point'?'#ffd21c':'white'}" stroke="#073b82" stroke-width="2"/><text x="${X(r)}" y="225" text-anchor="middle" fill="#073b82" font-size="18" font-weight="800">${nice(r)}</text>`).join('');
    return `<div class="dq-example-graph card"><svg viewBox="0 0 420 245" role="img" aria-label="Parabola dell’esempio e soluzioni evidenziate in giallo" data-a="${a}" data-b="${b}" data-c="${c}" data-xmin="${xmin}" data-xmax="${xmax}" data-scale="${scale}"><defs><clipPath id="dq-clip-${id}"><rect x="24" y="18" width="372" height="188"/></clipPath></defs><line x1="25" y1="170" x2="398" y2="170" stroke="#607089" stroke-width="2"/><line x1="${X(0)}" y1="18" x2="${X(0)}" y2="205" stroke="#607089" stroke-width="2"/><text x="399" y="158" fill="#073b82" font-size="16">x</text><text x="${X(0)+7}" y="18" fill="#073b82" font-size="16">y</text>${highlight}<path class="dq-parabola" d="${path}" clip-path="url(#dq-clip-${id})" fill="none" stroke="#0a57b7" stroke-width="4"/>${marks}</svg><p class="remember">${data.note}</p></div>`;
  }
  function scan(){
    document.querySelectorAll('.pair-example').forEach((example,index)=>{
      const data=graphs[example.querySelector('h3,h4')?.textContent.trim()];if(!data)return;
      if(!example.querySelector('.dq-example-graph')){
        const step=example.querySelector('.step:last-child > div'),formula=step?.querySelector('.formula');
        if(formula)formula.insertAdjacentHTML('beforebegin',graph(data,index));
        else example.insertAdjacentHTML('beforeend',graph(data,index));
      }
      example.querySelectorAll('.solution-axis').forEach(axis=>axis.remove());
      const result=example.querySelector('.pair-result'),last=[...example.querySelectorAll('.step .formula')].at(-1);
      const clean=s=>s.replace(/^\s*Risultato\s*:\s*/i,'').replace(/\s+/g,' ').trim();
      if(result&&last&&clean(result.textContent)===clean(last.textContent)){if(result.previousElementSibling?.classList.contains('result-arrow'))result.previousElementSibling.remove();result.remove()}
    });
    document.querySelectorAll('.pair-definition .formula').forEach(el=>el.style.setProperty('font-size','18px','important'));
  }
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  addEventListener('resize',scan,{passive:true});scan();
})();
