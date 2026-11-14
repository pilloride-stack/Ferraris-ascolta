(()=>{
  const pairs=[...document.querySelectorAll('.learning-pair')].slice(0,2);
  const wrapFirst=(root,pattern,className)=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while(node=walker.nextNode()){
      const match=node.nodeValue.match(pattern);if(!match)continue;
      const index=match.index,mark=document.createElement('span');mark.className=className;mark.textContent=match[0];
      const after=node.splitText(index);after.nodeValue=after.nodeValue.slice(match[0].length);after.before(mark);return;
    }
  };
  pairs.forEach(pair=>{
    const formula=pair.querySelector('.pair-definition .formula');if(!formula)return;
    formula.classList.add('irrational-rule');
    wrapFirst(formula,/√/u,'principal-root');
    wrapFirst(formula,/[<>≤≥]/u,'principal-operator');
    formula.querySelectorAll('.flow-arrow').forEach(arrow=>arrow.classList.add('yellow-arrow'));
    const walker=document.createTreeWalker(formula,NodeFilter.SHOW_TEXT);const arrows=[];let node;
    while(node=walker.nextNode())if(node.nodeValue.includes('→'))arrows.push(node);
    arrows.forEach(text=>{let index=text.nodeValue.indexOf('→'),after=text.splitText(index);after.nodeValue=after.nodeValue.slice(1);const mark=document.createElement('span');mark.className='yellow-arrow';mark.textContent='→';after.before(mark)});
  });
})();
