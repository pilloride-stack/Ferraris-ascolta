(()=>{
  const controls=document.getElementById('labControls');
  const results=document.getElementById('labResults');
  const steps=document.getElementById('labSteps');
  if(!controls||!results||!steps||D?.title!=='Le equazioni di secondo grado')return;
  const field=(name,value)=>`<label class="quadratic-field"><span>${name}</span><input id="quadratic-${name}" type="number" value="${value}" step="1" inputmode="decimal" aria-label="Coefficiente ${name}"></label>`;
  controls.innerHTML=`<h3>Modifica i coefficienti</h3><div class="quadratic-fields">${field('a',1)}${field('b',-5)}${field('c',6)}</div><div class="quadratic-equation" id="quadratic-equation"></div><p class="remember" id="quadratic-message" aria-live="polite"></p>`;
  const read=name=>Number(document.getElementById(`quadratic-${name}`).value||0);
  const clean=value=>Math.abs(value)<1e-10?0:value;
  const nice=value=>Math.abs(value-Math.round(value))<1e-9?String(Math.round(value)):value.toFixed(3).replace(/0+$/,'').replace(/\.$/,'').replace('.',',');
  const term=(value,symbol,first=false)=>{
    if(value===0)return'';
    const sign=value<0?'−':first?'': '+';
    const magnitude=Math.abs(value)===1&&symbol?'':nice(Math.abs(value));
    return `${sign}${sign?' ':''}${magnitude}${symbol}`.trim();
  };
  function axis(roots){
    if(!roots.length)return '<div class="quadratic-axis no-roots"><div class="axis-line"></div><p>Nessun punto reale sull’asse.</p></div>';
    const distinct=[...new Set(roots.map(clean))];
    const spread=distinct.length===2?Math.max(1,Math.abs(distinct[1]-distinct[0])):2;
    const min=Math.min(...distinct)-spread*.65,max=Math.max(...distinct)+spread*.65;
    const ticks=Array.from({length:7},(_,index)=>min+(max-min)*index/6);
    return `<div class="quadratic-axis" role="img" aria-label="Asse reale con ${distinct.length===2?'due radici':'una radice doppia'}"><div class="axis-line"></div>${ticks.map(value=>`<span class="axis-tick" style="left:${((value-min)/(max-min))*100}%"><i></i><small>${nice(value)}</small></span>`).join('')}${distinct.map((value,index)=>`<span class="root-point" style="left:${((value-min)/(max-min))*100}%"><b></b><strong>${distinct.length===1?'x₁ = x₂':'x'+(index+1)} = ${nice(value)}</strong></span>`).join('')}</div>`;
  }
  function update(){
    const a=read('a'),b=read('b'),c=read('c');
    const equation=[term(a,'x²',true),term(b,'x'),term(c,'')].filter(Boolean).join(' ')||'0';
    document.getElementById('quadratic-equation').textContent=`${equation} = 0`;
    const message=document.getElementById('quadratic-message');
    if(a===0){
      message.innerHTML='<b>a = 0:</b> questa non è un’equazione di secondo grado.';
      results.innerHTML=`<p><b>Equazione aggiornata</b></p><div class="formula">${equation} = 0</div><div class="quadratic-case warning"><b>Il termine x² è assente.</b><span>Modifica a con un numero diverso da zero per studiare un’equazione di secondo grado.</span></div>${axis([])}`;
      steps.innerHTML='<p><b>1.</b> Controlla il coefficiente di x².</p><p><b>2.</b> Poiché a = 0, il discriminante e la formula risolutiva di secondo grado non si applicano.</p>';
      return;
    }
    message.innerHTML='<b>a ≠ 0:</b> l’equazione è di secondo grado.';
    const delta=clean(b*b-4*a*c);
    const roots=delta>0?[(-b-Math.sqrt(delta))/(2*a),(-b+Math.sqrt(delta))/(2*a)]:delta===0?[-b/(2*a)]:[];
    const caseText=delta>0?`Δ &gt; 0: due soluzioni reali distinte, x₁ = ${nice(roots[0])}, x₂ = ${nice(roots[1])}`:delta===0?`Δ = 0: una soluzione reale doppia, x₁ = x₂ = ${nice(roots[0])}`:'Δ &lt; 0: nessuna soluzione reale';
    const solutionFormula=delta>=0?`<p><b>Formula risolutiva</b></p><div class="formula">x₁,₂ = <span class="frac"><span class="num">−(${nice(b)}) ± √${nice(delta)}</span><span class="den">2 · (${nice(a)})</span></span></div>`:'<div class="quadratic-case"><b>La formula non produce soluzioni reali perché non esiste la radice quadrata reale di un numero negativo.</b></div>';
    results.innerHTML=`<p><b>Equazione aggiornata</b></p><div class="formula">${equation} = 0</div><p><b>Discriminante</b></p><div class="formula">Δ = (${nice(b)})² − 4 · (${nice(a)}) · (${nice(c)}) = ${nice(delta)}</div>${solutionFormula}<div class="quadratic-case"><b>${caseText}</b></div>${axis(roots)}`;
    steps.innerHTML=`<p><b>1.</b> Identifica a = ${nice(a)}, b = ${nice(b)}, c = ${nice(c)}.</p><p><b>2.</b> Calcola Δ = b² − 4ac = ${nice(delta)}.</p><p><b>3.</b> ${delta>=0?'Sostituisci nella formula risolutiva e rappresenta le radici reali sull’asse.':'Il discriminante è negativo: non esistono punti reali da segnare sull’asse.'}</p>`;
  }
  controls.querySelectorAll('input').forEach(input=>input.addEventListener('input',update));
  update();
})();
