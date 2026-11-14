(()=>{
  const layout=document.createElement('style');layout.textContent='.learning-pair[hidden]{display:none!important}.pair-example h3,.pair-example h4,.pair-example .remember{text-align:center!important}.pair-label{background:#eef4fa!important;color:var(--b)!important}.learning-pair .pair-definition{border-top-color:var(--b2)!important}.pair-definition .remember,.pair-example .remember{background:#eef4fa!important;border-left-color:var(--b2)!important}.audio-current{outline:5px solid var(--y)!important;outline-offset:4px!important;box-shadow:0 0 0 10px #ffd21c33,0 0 20px #ffd21c66!important}.audio-current .narrated-text{background:transparent!important;color:inherit!important}.audio-current.narrated-text{background:transparent!important;color:inherit!important}@media(min-width:850px){.learning-pair:not([hidden]){grid-template-columns:minmax(0,.85fr) 70px minmax(0,1.4fr);align-items:start}.learning-pair:not([hidden]) .pair-arrow{align-self:center;flex-direction:column}.learning-pair:not([hidden]) .pair-arrow b{transform:none}.learning-pair:not([hidden]) .formula-parts{flex-wrap:nowrap!important}.learning-pair:not([hidden]) .formula-part{flex:0 1 auto!important;min-width:max-content!important;padding-inline:10px!important}}';document.head.append(layout);
  const installTopicMenu=pairs=>{
    if(!pairs.length||document.querySelector('.paired-topic-menu'))return;
    const menu=document.createElement('div');menu.className='tabs paired-topic-menu';menu.setAttribute('role','navigation');menu.setAttribute('aria-label','Menu delle definizioni');
    const controls=document.createElement('div');controls.className='paired-topic-nav';controls.setAttribute('aria-label','Navigazione tra le definizioni');
    const previous=document.createElement('button'),next=document.createElement('button');previous.type=next.type='button';previous.className='secondary';next.className='primary';previous.textContent='← Indietro';next.textContent='Avanti →';controls.append(previous,next);
    const activate=(index,play=true)=>{const safe=Math.max(0,Math.min(pairs.length-1,index));pairs.forEach(item=>{item.classList.remove('pair-selected');item.hidden=true});pairs[safe].hidden=false;pairs[safe].classList.add('pair-selected');window.__selectedLearningPair=safe;menu.querySelectorAll('button').forEach((item,itemIndex)=>item.classList.toggle('active',itemIndex===safe));previous.disabled=safe===0;next.disabled=safe===pairs.length-1;pairs[safe].focus({preventScroll:true});if(play)document.dispatchEvent(new CustomEvent('paired-topic-selected',{detail:{index:safe}}))};
    pairs.forEach((pair,index)=>{
      const button=document.createElement('button'),title=pair.querySelector('.pair-definition h3')?.textContent?.trim()||`Definizione ${index+1}`;
      button.type='button';button.textContent=`${index+1}. ${title}`;pair.hidden=index!==0;
      button.onclick=()=>activate(index,true);
      menu.append(button);
    });
    window.__activateLearningPair=index=>activate(index,false);previous.onclick=()=>activate((Number(window.__selectedLearningPair)||0)-1,true);next.onclick=()=>activate((Number(window.__selectedLearningPair)||0)+1,true);
    menu.firstElementChild?.classList.add('active');previous.disabled=true;pairs[0].before(menu);pairs.at(-1).after(controls);
  };
  const enhanceExistingPairs=()=>{
    const pairs=[...document.querySelectorAll('.learning-pair')];
    if(!pairs.length)return false;
    window.__selectedLearningPair=0;
    pairs.forEach((pair,index)=>{
      pair.tabIndex=0;pair.dataset.pairIndex=String(index);
      const definition=pair.querySelector('.pair-definition'),example=pair.querySelector('.pair-example');
      const title=definition?.querySelector('h3')?.textContent?.trim()||`argomento ${index+1}`;
      pair.setAttribute('aria-label',`Seleziona ${title} per iniziare l'ascolto da questo argomento`);
      const label=definition?.querySelector('.pair-label');
      if(label)label.textContent=`Definizione ${index+1} di ${pairs.length}`;
      definition?.querySelectorAll('p:not(.remember)').forEach(text=>text.classList.add('narrated-text'));
      example?.querySelectorAll('.step p').forEach(text=>text.classList.add('narrated-text'));
      if(definition&&example&&!pair.querySelector('.pair-arrow')){
        const arrow=document.createElement('div');arrow.className='pair-arrow';arrow.setAttribute('aria-hidden','true');
        arrow.innerHTML='<span>Applica la regola</span><b>➜</b>';definition.after(arrow);
      }
      const result=example?.querySelector(':scope > .formula:last-child');
      if(result&&!example.querySelector('.result-arrow')){
        result.classList.add('pair-result');const resultArrow=document.createElement('div');
        resultArrow.className='result-arrow';resultArrow.setAttribute('aria-hidden','true');resultArrow.textContent='↓';result.before(resultArrow);
      }
      const select=()=>{pairs.forEach(item=>item.classList.remove('pair-selected'));pair.classList.add('pair-selected');window.__selectedLearningPair=index};
      pair.addEventListener('click',select);pair.addEventListener('focus',select);
      pair.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select();document.querySelector('.screen.active .voice-controls button')?.focus()}});
    });
    pairs[0].classList.add('pair-selected');
    installTopicMenu(pairs);
    const screen=pairs[0].closest('.screen');
    const forward=screen?.querySelector('.actions .primary');
    if(forward)forward.textContent='Allenamento →';
    return true;
  };
  if(enhanceExistingPairs())return;
  const definitionScreen=document.querySelector('.screen[data-title="Definizioni"]');
  const exampleScreen=document.querySelector('.screen[data-title="Esempi"]');
  const definitionHost=document.getElementById('definition');
  const exampleHost=document.getElementById('example');
  const definitionTabs=[...document.querySelectorAll('#defTabs button')];
  const exampleTabs=[...document.querySelectorAll('#exTabs button')];
  if(!definitionScreen||!exampleScreen||!definitionHost||!exampleHost||!definitionTabs.length)return;

  const definitions=definitionTabs.map(button=>{
    button.click();
    return [...definitionHost.children].map(node=>node.cloneNode(true));
  });
  const examples=definitionTabs.map((_,index)=>{
    const button=exampleTabs[index];
    if(button)button.click();
    return [...exampleHost.children].map(node=>node.cloneNode(true));
  });

  definitionScreen.dataset.title='Definizioni ed esempi';
  const heading=definitionScreen.querySelector('h2');
  if(heading)heading.textContent='Ogni regola con il suo esempio';
  definitionScreen.querySelector('.eyebrow')?.replaceChildren('Riconosci e applica');
  document.getElementById('defTabs')?.remove();
  definitionHost.replaceChildren();
  definitionHost.className='paired-content';

  definitions.forEach((definitionNodes,index)=>{
    const pair=document.createElement('article');
    pair.className='learning-pair';
    pair.tabIndex=0;
    pair.dataset.pairIndex=String(index);
    const title=D?.definitions?.[index]?.name||`argomento ${index+1}`;
    pair.setAttribute('aria-label',`Seleziona ${title} per iniziare l'ascolto da questo argomento`);
    const definition=document.createElement('section');
    definition.className='pair-definition';
    const label=document.createElement('div');
    label.className='pair-label';
    label.textContent=`Definizione ${index+1} di ${definitions.length}`;
    definition.append(label,...definitionNodes);
    definition.querySelectorAll('p:not(.remember)').forEach(text=>text.classList.add('narrated-text'));
    const arrow=document.createElement('div');
    arrow.className='pair-arrow';
    arrow.setAttribute('aria-hidden','true');
    arrow.innerHTML='<span>Applica la regola</span><b>➜</b>';
    const example=document.createElement('section');
    example.className='pair-example';
    const exampleLabel=document.createElement('div');
    exampleLabel.className='pair-label';
    exampleLabel.textContent='Esempio completo';
    example.append(exampleLabel,...(examples[index]||[]));
    example.querySelectorAll('.step p').forEach(text=>text.classList.add('narrated-text'));
    const result=example.querySelector(':scope > .formula:last-child');
    if(result){
      result.classList.add('pair-result');
      const resultArrow=document.createElement('div');
      resultArrow.className='result-arrow';
      resultArrow.setAttribute('aria-hidden','true');
      resultArrow.textContent='↓';
      result.before(resultArrow);
    }
    pair.append(definition,arrow,example);
    const select=()=>{
      definitionHost.querySelectorAll('.learning-pair').forEach(item=>item.classList.remove('pair-selected'));
      pair.classList.add('pair-selected');
      window.__selectedLearningPair=index;
    };
    pair.addEventListener('click',select);
    pair.addEventListener('focus',select);
    pair.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();select();
        definitionScreen.querySelector('.voice-controls button')?.focus();
      }
    });
    definitionHost.append(pair);
  });
  window.__selectedLearningPair=0;
  definitionHost.querySelector('.learning-pair')?.classList.add('pair-selected');
  installTopicMenu([...definitionHost.querySelectorAll('.learning-pair')]);

  const obsoleteNav=[...document.querySelectorAll('#nav button[data-screen-index]')]
    .find(button=>button.textContent.includes('Esempi'));
  if(obsoleteNav)obsoleteNav.hidden=true;
  const definitionNav=[...document.querySelectorAll('#nav button[data-screen-index]')]
    .find(button=>button.textContent.includes('Definizioni'));
  if(definitionNav)definitionNav.textContent=definitionNav.textContent.replace('Definizioni','Definizioni ed esempi');
  const forward=definitionScreen.querySelector('.actions .primary');
  if(forward){forward.textContent='Allenamento →';forward.setAttribute('onclick','go(2)')}
  exampleScreen.setAttribute('aria-hidden','true');
  [...document.querySelectorAll('.lesson-pager button')].forEach((button,index)=>{
    button.addEventListener('click',event=>{
      if(!definitionScreen.classList.contains('active'))return;
      event.preventDefault();event.stopImmediatePropagation();
      if(index===0)go(-1);else go(2);
    },true);
  });
})();
