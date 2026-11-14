(()=>{
  if(D?.title!=='Le disequazioni di secondo grado')return;
  const host=document.querySelector('.paired-content,.learning-pairs');
  if(!host)return;
  document.querySelectorAll('.sign-graphs').forEach(node=>node.remove());
  const guide=document.createElement('section');
  guide.className='quadratic-sign-guide';
  guide.innerHTML=`
    <div class="quadratic-recall"><h3>Dal discriminante allo studio del segno</h3><p>Il discriminante si calcola come nelle equazioni di secondo grado. Qui usiamo il suo segno per sapere se la parabola interseca l’asse e poi leggiamo dove il trinomio è positivo o negativo.</p></div>
    <div class="sign-graphs" aria-label="Confronto tra intervalli esterni e interni">
      <figure class="sign-graph"><figcaption>Trinomio positivo: intervalli esterni</figcaption><svg viewBox="0 0 240 120" role="img" aria-label="Parabola rivolta verso l’alto che interseca due volte l’asse x; evidenziati gli intervalli esterni"><path d="M14 24 Q120 178 226 24" fill="none" stroke="white" stroke-width="4"/><path d="M8 76H232" stroke="white" stroke-width="2"/><path class="mark" d="M10 76H65 M175 76H230"/><circle cx="65" cy="76" r="5"/><circle cx="175" cy="76" r="5"/><text x="65" y="99">x₁</text><text x="175" y="99">x₂</text></svg></figure>
      <figure class="sign-graph"><figcaption>Trinomio negativo: intervallo interno</figcaption><svg viewBox="0 0 240 120" role="img" aria-label="Parabola rivolta verso l’alto che interseca due volte l’asse x; evidenziato l’intervallo interno"><path d="M14 24 Q120 178 226 24" fill="none" stroke="white" stroke-width="4"/><path d="M8 76H232" stroke="white" stroke-width="2"/><path class="mark" d="M65 76H175"/><circle cx="65" cy="76" r="5"/><circle cx="175" cy="76" r="5"/><text x="65" y="99">x₁</text><text x="175" y="99">x₂</text></svg></figure>
    </div>
    <div class="sign-matrix"><h3>Matrice completa dei casi</h3>
      <div class="sign-matrix-grid">
        <article><b>a &gt; 0, Δ &gt; 0</b><span>Segno: + | − | +</span><small>Positivo fuori dalle radici; negativo fra le radici.</small></article>
        <article><b>a &lt; 0, Δ &gt; 0</b><span>Segno: − | + | −</span><small>Negativo fuori dalle radici; positivo fra le radici.</small></article>
        <article><b>a &gt; 0, Δ = 0</b><span>Segno positivo, zero nella radice doppia</span><small>Mai negativo.</small></article>
        <article><b>a &lt; 0, Δ = 0</b><span>Segno negativo, zero nella radice doppia</span><small>Mai positivo.</small></article>
        <article><b>a &gt; 0, Δ &lt; 0</b><span>Sempre positivo</span><small>La parabola resta sopra l’asse x.</small></article>
        <article><b>a &lt; 0, Δ &lt; 0</b><span>Sempre negativo</span><small>La parabola resta sotto l’asse x.</small></article>
      </div>
      <p class="matrix-note">Con ≥ oppure ≤, le radici reali appartengono alla soluzione; con &gt; oppure &lt; sono escluse.</p>
    </div>`;
  host.prepend(guide);
})();
