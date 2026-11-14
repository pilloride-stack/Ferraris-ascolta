(()=>{
  const pairs=[...document.querySelectorAll('.learning-pair')].slice(0,2);
  const system=(label,rows)=>`<span class="system"><span class="system-brace" aria-hidden="true">{</span><span class="system-lines"><b>${label}</b>${rows.map(row=>`<span>${row}</span>`).join('')}</span></span>`;
  const main=(operator)=>`<span class="irrational-main"><span class="principal-root">√</span><span class="radicand">A</span><span class="principal-operator">${operator}</span><span>B</span><span class="yellow-arrow">→</span></span>`;
  const formulas=[
    `${main('&gt;')}<span class="systems">${system('B negativo',['A ≥ 0','B &lt; 0'])}<b class="system-or">oppure</b>${system('B non negativo',['B ≥ 0','A &gt; B²'])}</span>`,
    `${main('&lt;')}<span class="systems">${system('B positivo',['A ≥ 0','B &gt; 0','A &lt; B²'])}</span>`,
  ];
  pairs.forEach((pair,index)=>{
    const formula=pair.querySelector('.pair-definition .formula');if(!formula)return;
    formula.classList.add('irrational-rule');
    formula.innerHTML=formulas[index];
    formula.setAttribute('aria-label',index===0?'Radice di A maggiore di B: due sistemi alternativi':'Radice di A minore di B: un sistema di condizioni');
  });
})();
