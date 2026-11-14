(()=>{
  if(typeof D==='undefined'||typeof screens==='undefined')return;
  const definitionScreen=screens.find(screen=>screen.dataset.title==='Definizioni'),exampleScreen=screens.find(screen=>screen.dataset.title==='Esempi');
  if(!definitionScreen||!exampleScreen)return;
  definitionScreen.dataset.title='Definizioni ed esempi';
  definitionScreen.querySelector('h2').textContent='Ogni regola con il suo esempio';
  definitionScreen.querySelector('.eyebrow').textContent='Riconosci e applica';
  const pairs=document.createElement('div');pairs.className='learning-pairs';
  D.definitions.forEach((definition,index)=>{
    const example=(D.guided_examples||[]).find(item=>item.concept===definition.name)||D.guided_examples?.[index],rule=(D.visual_explanations||[]).find(item=>item.screen===definition.name)||D.visual_explanations?.[index];
    if(!example)return;
    const pair=document.createElement('section');pair.className='learning-pair';pair.tabIndex=0;pair.dataset.pairIndex=String(index);pair.setAttribute('aria-label',`Seleziona ${definition.name} per iniziare l'ascolto da questo argomento`);
    pair.innerHTML=`<article class="card pair-definition"><span class="pair-label">Definizione ${index+1} di ${D.definitions.length}</span><h3>${esc(definition.name)}</h3><p class="narrated-text">${esc(definition.definition)}</p>${rule?.heading?`<div class="formula">${mathFormula(rule.heading,rule.screen)}</div>`:''}${definition.remember?`<p class="remember"><b>Ricorda:</b> ${esc(definition.remember)}</p>`:''}</article><div class="pair-arrow" aria-hidden="true"><span>Applica la regola</span><b>➜</b></div><article class="card pair-example"><span class="pair-label">Esempio completo</span><h4>${esc(example.title)}</h4><div class="stepper">${(example.steps||[]).map((step,stepIndex)=>`<div class="step show"><span class="n">${stepIndex+1}</span><div><b>${esc(String(step.label||'').replace(/^Passaggio\s+\d+\s*[—-]\s*/i,''))}</b><p class="narrated-text">${esc(step.text)}</p>${step.formula?`<div class="formula">${mathFormula(step.formula,step.text)}</div>`:''}</div></div>`).join('')}</div>${example.result?`<div class="result-arrow" aria-hidden="true">↓</div><div class="formula pair-result">Risultato: ${esc(example.result)}</div>`:''}</article>`;
    const select=()=>{pairs.querySelectorAll('.learning-pair').forEach(item=>item.classList.remove('pair-selected'));pair.classList.add('pair-selected');window.__selectedLearningPair=index};pair.addEventListener('click',select);pair.addEventListener('focus',select);pair.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select();definitionScreen.querySelector('.voice-controls button')?.focus()}});pairs.append(pair);
  });
  definitionScreen.querySelector('#defTabs')?.remove();definitionScreen.querySelector('#definition')?.replaceWith(pairs);pairs.firstElementChild?.classList.add('pair-selected');window.__selectedLearningPair=0;exampleScreen.remove();
  const oldIndex=screens.indexOf(exampleScreen);if(oldIndex>=0)screens.splice(oldIndex,1);
  nav.querySelectorAll('button[data-screen-index]').forEach(button=>button.remove());screens.forEach((screen,index)=>{const button=document.createElement('button');button.textContent=`${index+1}. ${screen.dataset.title}`;button.dataset.screenIndex=index;button.onclick=()=>show(index);nav.append(button)});show(Math.min(current,screens.length-1));
})();
