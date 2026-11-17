(()=>{
  const config=document.currentScript?.dataset||{},base=config.audioBase;if(!base||typeof D==='undefined'||typeof screens==='undefined')return;
  const pairedScreen=screens.find(screen=>screen.dataset.title==='Definizioni ed esempi');if(!pairedScreen)return;
  const tracks=D.audio_tracks||[],definitions=D.definitions||[];
  // Menu delle schede: toglie i pulsanti vecchi rimasti doppi e rinumera quelli visibili
  if(typeof nav!=='undefined'&&nav){
    const numbered=[...nav.querySelectorAll('button')].filter(b=>/^\d+\.\s/.test(b.textContent.trim()));
    if(numbered.some(b=>b.dataset.screenIndex!==undefined))numbered.filter(b=>b.dataset.screenIndex===undefined).forEach(b=>b.remove());
    let n=0;[...nav.querySelectorAll('button')].filter(b=>/^\d+\.\s/.test(b.textContent.trim())&&!b.hidden&&getComputedStyle(b).display!=='none').forEach(b=>{n++;b.textContent=b.textContent.trim().replace(/^\d+\./,n+'.')});
  }

  const activeIndex=()=>screens.findIndex(screen=>screen.classList.contains('active'));
  let queue=[],history=[],currentTrack=null,player=null,status=null,auto=false,paused=false;
  // Ogni frase viene scaricata per intero prima di partire (niente partenze a scatti) e le successive vengono precaricate.
  const SILENT='data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEwAAAAAAAAAAAAEluZm8AAAAPAAAABQAAAqAAbW1tbW1tbW1tbW1tbW1tbW1tbZKSkpKSkpKSkpKSkpKSkpKSkpKStra2tra2tra2tra2tra2tra2trbb29vb29vb29vb29vb29vb29vb2///////////////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQEUAAAAAAAAAKgvT9A1gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//NExAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExFMAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKYAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
  const audioEl=new Audio();audioEl.preload='auto';let token=0;const cache=new Map();
  const urlOf=track=>base+'frase-'+track.id+'.mp3'+(config.audioVersion?`?v=${encodeURIComponent(config.audioVersion)}`:'');
  const load=track=>{if(!cache.has(track.id))cache.set(track.id,fetch(urlOf(track)).then(r=>{if(!r.ok)throw new Error(r.status);return r.blob()}).then(b=>URL.createObjectURL(b)).catch(()=>urlOf(track)));return cache.get(track.id)};
  const prefetch=()=>queue.slice(0,2).forEach(load);
  const unlock=()=>{try{if(!audioEl.src||audioEl.src.startsWith('data:')){audioEl.src=SILENT;audioEl.play().catch(()=>{})}}catch(e){}};
  // Il riquadro Indietro/Avanti fisso in primo piano non serve: la navigazione resta nei pulsanti della pagina.
  const style=document.createElement('style');
  style.textContent='.lesson-pager{display:none!important}main{padding-bottom:40px!important}.voice-controls .player-btn{min-width:46px;padding-inline:12px;font-weight:900}.voice-controls .player-btn[disabled]{opacity:.4;cursor:not-allowed}.voice-controls .player-pause[aria-pressed="true"]{background:#ffd21c;color:#0b478c;border-color:#ffd21c}';
  document.head.append(style);
  const clear=()=>document.querySelectorAll('.audio-current').forEach(element=>element.classList.remove('audio-current'));
  const silence=()=>{token++;audioEl.onended=null;audioEl.onerror=null;try{audioEl.pause()}catch(e){};player=null};
  function stop(){queue=[];history=[];currentTrack=null;auto=false;paused=false;clear();silence();document.querySelectorAll('.voice-status').forEach(element=>element.textContent='');refresh()}
  function topicTracks(index){
    const definition=definitions[index];if(!definition)return[];
    const definitionTracks=tracks.filter(track=>track.screen==='Definizioni'&&(track.purpose||'').replace(/^Definizione:\s*/,'').trim()===definition.name);
    const topic=tracks.filter(track=>track.screen===definition.name),ruleTracks=topic.filter(track=>/^Spiegazione visiva:/i.test(track.purpose||'')),exampleTracks=topic.filter(track=>/^Esempio,/i.test(track.purpose||'')),otherTracks=topic.filter(track=>!ruleTracks.includes(track)&&!exampleTracks.includes(track));
    return [...definitionTracks,...ruleTracks,...otherTracks,...exampleTracks];
  }
  function orderedTracks(startIndex=0){return definitions.slice(startIndex).flatMap((_,offset)=>topicTracks(startIndex+offset))}
  function synchronize(track){
    clear();
    const purpose=track.purpose||'',definitionName=track.screen==='Definizioni'?purpose.replace(/^Definizione:\s*/,'').trim():track.screen,index=definitions.findIndex(definition=>definition.name===definitionName),pairs=[...pairedScreen.querySelectorAll('.learning-pair')],pair=pairs[index];
    if(!pair)return;if(window.__activateLearningPair)window.__activateLearningPair(index);
    const definition=pair.querySelector('.pair-definition')||pair.querySelector(':scope > article:first-child'),example=pair.querySelector('.pair-example')||pair.querySelector(':scope > article:last-child'),isDefinition=track.screen==='Definizioni',isRule=/^Spiegazione visiva:/i.test(purpose);
    let target=isDefinition||isRule?definition:example;
    if(isDefinition)target=definition?.querySelector('.narrated-text')||definition;
    if(isRule)target=definition?.querySelector('.formula,.mini-formula,.remember')||definition;
    const match=purpose.match(/passaggio\s+(\d+)/i),step=match?example?.querySelectorAll('.step')[Number(match[1])-1]:null,mapped=pairedScreen.querySelector(`[data-audio-track~="${track.id}"]`);
    const highlight=mapped||step||target;highlight?.classList.add('audio-current');highlight?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function play(track){
    silence();currentTrack=track;paused=false;synchronize(track);
    const label=(track.purpose||'Spiegazione').replace(/passaggio\s+\d+\s*[—-]?\s*/i,'');
    if(status)status.textContent='Caricamento…';
    const mine=token;refresh();
    load(track).then(url=>{
      if(mine!==token)return;
      player=audioEl;audioEl.src=url;
      audioEl.onended=()=>setTimeout(next,300);
      audioEl.onerror=()=>{if(status)status.textContent='Audio non disponibile.';queue=[];auto=false;player=null;refresh()};
      if(status)status.textContent=label;
      audioEl.play().catch(()=>{paused=true;if(status)status.textContent='Tocca ▶ per avviare la voce.';refresh()});
      prefetch();refresh();
    });
  }
  function next(){
    if(currentTrack)history.push(currentTrack);
    const track=queue.shift();
    if(!track){currentTrack=null;silence();clear();refresh();if(auto&&activeIndex()<screens.length-1){go(1);setTimeout(()=>start(true),300)}else if(status)status.textContent='Spiegazione terminata.';return}
    play(track);
  }
  function previous(){
    if(player&&player.currentTime>2.5){player.currentTime=0;if(paused){paused=false;player.play()}refresh();return}
    if(!history.length){if(player){player.currentTime=0;if(paused){paused=false;player.play()}}refresh();return}
    if(currentTrack)queue.unshift(currentTrack);
    const back=history.pop();currentTrack=null;play(back);
  }
  function togglePause(){
    if(!player){if(currentTrack&&!paused){paused=true;silence();if(status)status.textContent='In pausa.'}else if(currentTrack){play(currentTrack)}refresh();return}
    if(paused){paused=false;player.play().catch(()=>{});if(status&&currentTrack)status.textContent=(currentTrack.purpose||'Spiegazione').replace(/passaggio\s+\d+\s*[—-]?\s*/i,'')}
    else{paused=true;player.pause();if(status)status.textContent='In pausa.'}
    refresh();
  }
  function start(continueAutomatically=false){
    stop();auto=continueAutomatically;status=pairedScreen.querySelector('.voice-status');
    const onPaired=pairedScreen.classList.contains('active');
    const selected=Math.max(0,Math.min(definitions.length-1,Number(window.__selectedLearningPair)||0));
    const screen=screens.find(item=>item.classList.contains('active'));
    queue=onPaired?orderedTracks(selected):tracks.filter(track=>track.screen===screen?.dataset.title);
    if(!onPaired)status=screen?.querySelector('.voice-status');
    if(!queue.length){if(auto&&screens.indexOf(screen)<screens.length-1){go(1);setTimeout(()=>start(true),200)}return}
    next();
  }
  document.addEventListener('paired-topic-selected',event=>{unlock();if(!pairedScreen.classList.contains('active'))return;stop();status=pairedScreen.querySelector('.voice-status');queue=topicTracks(Number(event.detail?.index)||0);if(queue.length)next();else if(status)status.textContent='Audio non disponibile.'});
  // Lettore: Ascolta, frase precedente, pausa/riprendi, frase successiva, Stop
  const bar=pairedScreen.querySelector('.voice-controls');
  let prevButton,pauseButton,nextButton;
  function refresh(){
    if(!pauseButton)return;
    const active=!!(player||currentTrack);
    prevButton.disabled=!active;nextButton.disabled=!active||!queue.length;pauseButton.disabled=!active;
    pauseButton.textContent=paused?'▶ Riprendi':'⏸ Pausa';pauseButton.setAttribute('aria-pressed',paused?'true':'false');
  }
  if(bar){
    const listen=bar.children[0],halt=bar.children[1],make=(label,text,cls)=>{const b=document.createElement('button');b.type='button';b.className='secondary player-btn '+cls;b.textContent=text;b.setAttribute('aria-label',label);b.title=label;return b};
    prevButton=make('Riascolta la frase o torna alla precedente','⏮','player-prev');
    pauseButton=make('Metti in pausa o riprendi','⏸ Pausa','player-pause');
    nextButton=make('Passa alla frase successiva','⏭','player-next');
    listen.after(prevButton,pauseButton,nextButton);
    listen.onclick=()=>{unlock();start(true)};halt.textContent='■ Stop';halt.onclick=stop;
    prevButton.onclick=()=>{unlock();previous()};pauseButton.onclick=()=>{togglePause()};nextButton.onclick=()=>{unlock();if(queue.length)next()};
    refresh();
  }
  document.querySelectorAll('.lesson-pager button').forEach((button,index)=>button.onclick=()=>{stop();go(index===0?-1:1)});
  nav.addEventListener('click',stop,true);window.addEventListener('beforeunload',stop);
  document.addEventListener('keydown',event=>{if(!pairedScreen.classList.contains('active')||!(player||currentTrack))return;if(event.target.closest('input,textarea,select'))return;if(event.code==='Space'){event.preventDefault();togglePause()}});
})();
