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
    const pair=document.createElement('section');pair.className='learning-pair';
    pair.innerHTML=`<article class="card pair-definition"><span class="pair-label">Definizione</span><h3>${esc(definition.name)}</h3><p>${esc(definition.definition)}</p>${rule?.heading?`<div class="formula">${mathFormula(rule.heading,rule.screen)}</div>`:''}${definition.remember?`<p class="remember"><b>Ricorda:</b> ${esc(definition.remember)}</p>`:''}</article><article class="card pair-example"><span class="pair-label">Esempio completo</span><h4>${esc(example.title)}</h4><div class="stepper">${(example.steps||[]).map((step,stepIndex)=>`<div class="step show"><span class="n">${stepIndex+1}</span><div><b>${esc(String(step.label||'').replace(/^Passaggio\s+\d+\s*[—-]\s*/i,''))}</b><p>${esc(step.text)}</p>${step.formula?`<div class="formula">${mathFormula(step.formula,step.text)}</div>`:''}</div></div>`).join('')}</div>${example.result?`<div class="formula" style="margin-top:16px">Risultato: ${esc(example.result)}</div>`:''}</article>`;
    pairs.append(pair);
  });
  definitionScreen.querySelector('#defTabs')?.remove();definitionScreen.querySelector('#definition')?.replaceWith(pairs);exampleScreen.remove();
  const oldIndex=screens.indexOf(exampleScreen);if(oldIndex>=0)screens.splice(oldIndex,1);
  nav.querySelectorAll('button[data-screen-index]').forEach(button=>button.remove());screens.forEach((screen,index)=>{const button=document.createElement('button');button.textContent=`${index+1}. ${screen.dataset.title}`;button.dataset.screenIndex=index;button.onclick=()=>show(index);nav.append(button)});show(Math.min(current,screens.length-1));
})();
