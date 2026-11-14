(()=>{
  const graphs={
    'x² − 5x + 6 > 0':{path:'M60 40 Q210 265 360 40',roots:[155,265],labels:['x₁ = 2','x₂ = 3'],solution:'outside',note:'La parabola è positiva negli intervalli esterni: x < 2 oppure x > 3.'},
    'x² − 2x + 1 > 0':{path:'M60 40 Q210 360 360 40',roots:[210],labels:['x = 1'],solution:'except',note:'La parabola è positiva per ogni valore tranne x = 1.'},
    'x² + x + 12 > 0':{path:'M60 75 Q210 245 360 75',roots:[],labels:[],solution:'all',note:'La parabola resta sopra l’asse: la disequazione è verificata per ogni numero reale.'},
    'x² ≤ 0':{path:'M60 40 Q210 360 360 40',roots:[210],labels:['x = 0'],solution:'point',note:'Il quadrato è minore o uguale a zero soltanto in x = 0.'}
  };
  const graph=data=>{
    const marks=data.roots.map((x,index)=>`<circle cx="${x}" cy="200" r="7" fill="${data.solution==='except'?'#fff':'#ffd429'}" stroke="#073b82" stroke-width="3"/><text x="${x}" y="225" text-anchor="middle" fill="#073b82" font-weight="800">${data.labels[index]}</text>`).join('');
    const highlight=data.solution==='outside'?'<line x1="30" y1="200" x2="155" y2="200" stroke="#ffd429" stroke-width="8"/><line x1="265" y1="200" x2="390" y2="200" stroke="#ffd429" stroke-width="8"/>':data.solution==='except'?'<line x1="30" y1="200" x2="202" y2="200" stroke="#ffd429" stroke-width="8"/><line x1="218" y1="200" x2="390" y2="200" stroke="#ffd429" stroke-width="8"/>':data.solution==='all'?'<line x1="30" y1="200" x2="390" y2="200" stroke="#ffd429" stroke-width="8"/>':'';
    return `<div class="dq-example-graph card" style="margin-top:14px"><svg viewBox="0 0 420 250" style="width:100%;max-width:620px;display:block;margin:auto;background:#fff;border-radius:14px" role="img" aria-label="Grafico della parabola e soluzione sull’asse x"><line x1="25" y1="200" x2="395" y2="200" stroke="#607089" stroke-width="2"/><line x1="210" y1="18" x2="210" y2="230" stroke="#607089" stroke-width="2"/>${highlight}<path d="${data.path}" fill="none" stroke="#0a57b7" stroke-width="5"/>${marks}</svg><p class="remember">${data.note}</p></div>`;
  };
  const scan=()=>document.querySelectorAll('.pair-example,.card').forEach(example=>{
    const title=example.querySelector('h3,h4')?.textContent.trim(),data=graphs[title];
    if(!data||example.querySelector('.dq-example-graph'))return;
    example.insertAdjacentHTML('beforeend',graph(data));
  });
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();
