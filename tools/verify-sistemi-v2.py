"""Verify the two replacement lessons without changing shared lesson assets."""
import functools,http.server,json,pathlib,re,threading
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent;OUT=pathlib.Path('/tmp/sistemi-verifica');OUT.mkdir(exist_ok=True)
reference=(ROOT/'lezioni/matematica/disequazioni-irrazionali/index.html').read_text()
reference_style=re.search(r'<style>(.*?)</style>',reference,re.S).group(1)
for name in ['sistemi-equazioni','sistemi-disequazioni']:
 s=(ROOT/'lezioni/matematica'/name/'index.html').read_text();assert re.search(r'<style>(.*?)</style>',s,re.S).group(1)==reference_style,'Stile base diverso dal modello'
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',8765),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();results=[]
with sync_playwright() as p:
 for engine,width,height in [(p.chromium,1440,1000),(p.webkit,1024,1366),(p.webkit,768,1024)]:
  browser=engine.launch();page=browser.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('''window.__audio=[];window.Audio=class{constructor(url){this.src=url;window.__audio.push(this)}pause(){}play(){return Promise.resolve()}};const originalScroll=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(options){return originalScroll.call(this,{...options,behavior:'instant'})};''')
  for name in ['sistemi-equazioni','sistemi-disequazioni']:
   page.goto('http://127.0.0.1:8765/lezioni/matematica/'+name+'/');page.wait_for_timeout(150);data=page.evaluate('D')
   page.locator('#nav button').filter(has_text='Definizioni').click();pairs=page.locator('.learning-pair');assert pairs.count()==len(data['definitions'])
   for i in range(pairs.count()):
    page.locator('.paired-topic-menu button').nth(i).click();page.locator('.screen.active .voice-controls button').nth(1).click();pair=pairs.nth(i)
    assert pair.is_visible();assert pair.locator('.systems-graph').count()==1;assert pair.locator('.solution-axis').count()==0
    assert pair.locator('.step').count()==len(data['guided_examples'][i]['steps'])
    assert not pair.locator('.systems-graph').evaluate('(e)=>e.innerHTML.includes("NaN")')
    assert pair.evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),(name,i,'overflow della scheda')
    page.screenshot(path=str(OUT/f'{engine.name}-{width}-{name}-{i}.png'),full_page=True)
   # Exercise narration follows the same numbered steps displayed in the episode.
   page.locator('.paired-topic-menu button').nth(0).click()
   for j in range(len(data['guided_examples'][0]['steps'])):
    page.evaluate('window.__audio.at(-1).onended()');page.wait_for_timeout(350)
    assert pairs.nth(0).locator('.step').nth(j).evaluate('(e)=>e.classList.contains("audio-current")'),(name,j,'audio fuori sincronia')
   assert page.evaluate('window.__audio.every(a=>a.src.includes("/audio/matematica-sistemi-v2/episodio-"))')
   page.locator('.screen.active .voice-controls button').nth(1).click()
   # Check all supplied solutions mathematically, independently of their text.
   for ex in data['guided_examples']:
    g=ex['solution_graph']
    if g['kind']=='eq':
     r=page.evaluate('(rows)=>FerrarisSystems.classify(rows)',g['rows']);assert r['kind']==g['case']
     if g['point'] is not None:
      assert all(abs(x-y)<1e-9 for x,y in zip(r['point'],g['point']))
      for a,b,c in g['rows']:assert abs(a*r['point'][0]+b*r['point'][1]-c)<1e-8
    else:
     valid=page.evaluate('''g=>{const A=FerrarisSystems;const sets=g.sets.map(A.normalize),common=A.intersect(sets[0],sets[1]);for(let x=-10;x<=10;x+=.25)if(A.contains(common,x)!==A.contains(sets[2],x))return false;return true}''',g);assert valid
   page.locator('#nav button').filter(has_text='Laboratorio').click()
   if name=='sistemi-equazioni':
    def coefficients(values):
     for key,value in zip('abcdef',values):page.locator('#sys-'+key).fill(str(value))
    for values,kind in [([1,1,2,1,1,5],'empty'),([1,1,4,2,2,8],'line'),([0,1,2,1,0,3],'point'),([0,0,0,0,0,0],'plane'),([0,0,1,1,1,2],'empty'),([0,0,0,1,1,2],'line')]:
     coefficients(values);assert page.locator('#labResults .systems-graph').get_attribute('data-case')==kind
    coefficients([1,1,5,1,-1,1]);assert page.locator('#labResults .common-point').get_attribute('data-x')=='3'
   else:
    page.locator('#sys-op1').select_option('≥');page.locator('#sys-op2').select_option('≤');page.locator('#sys-bound1').fill('2');page.locator('#sys-bound2').fill('2')
    assert page.locator('#labResults .interval-row').nth(2).get_attribute('data-notation')=='{2}'
    page.locator('#sys-op2').select_option('<');assert page.locator('#labResults .interval-row').nth(2).get_attribute('data-notation')=='∅'
    page.locator('#sys-op1').select_option('>');page.locator('#sys-bound1').fill('1');page.locator('#sys-bound2').fill('4');page.locator('#sys-op2').select_option('≤');page.locator('#sys-probe').fill('1');assert 'non soddisfa' in page.locator('#labResults').inner_text()
   page.screenshot(path=str(OUT/f'{engine.name}-{width}-{name}-lab.png'),full_page=True)
   page.locator('#nav button').filter(has_text='Allenamento').click();assert page.locator('.q').count()==3
   page.locator('#nav button').filter(has_text='Verifica').click();assert page.locator('#verify input').count()==4
   for i,q in enumerate(data['final_test']):page.locator('#v'+str(i)).fill(str(q['answer']))
   page.get_by_role('button',name='Correggi la verifica',exact=True).click();assert page.locator('#scoreN').inner_text()=='4 / 4'
   results.append(dict(lesson=name,browser=engine.name,width=width,topics=len(data['definitions']),status='passed'))
  assert not errors,errors;browser.close()
server.shutdown();(OUT/'risultati.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print('Sei verifiche complete passate; 15 argomenti, grafici, laboratori, audio e quiz controllati.')
