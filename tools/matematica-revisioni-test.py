"""Browser regression checks for revision 45–64 (Chromium and iPad WebKit)."""
import functools,http.server,json,pathlib,threading
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=pathlib.Path('/tmp/ferraris-verifica');OUT.mkdir(exist_ok=True)
NAMES=['divisione-polinomi','frazioni-algebriche','radicali','equazioni-primo-grado','equazioni-secondo-grado','disequazioni-secondo-grado','binomie-biquadratiche','equazioni-irrazionali']
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',8765),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
results=[]
with sync_playwright() as p:
 for engine,width,height in [(p.chromium,1440,1000),(p.webkit,1024,1366),(p.webkit,768,1024)]:
  browser=engine.launch();page=browser.new_page(viewport={'width':width,'height':height});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('''window.__audio=[];window.Audio=class{constructor(url){this.src=url;window.__audio.push(this)}play(){return Promise.resolve()}pause(){}}''')
  for name in NAMES:
   page.goto('http://127.0.0.1:8765/lezioni/matematica/'+name+'/');page.wait_for_timeout(150)
   page.locator('#nav button').filter(has_text='Definizioni').click()
   pairs=page.locator('.learning-pair');count=pairs.count();assert count>0,name
   for i in range(count):
    page.locator('.paired-topic-menu button').nth(i).click()
    pair=pairs.nth(i)
    assert pair.locator('.step:visible').count()==0,(name,i,'risultato anticipato')
    assert pair.locator('.revision-final').is_hidden(),(name,i,'grafico anticipato')
    steps=pair.locator('.step').count()
    for j in range(steps):pair.locator('.revision-next').click()
    assert pair.locator('.step:visible').count()==steps,(name,i,'passaggi mancanti')
    assert pair.locator('.revision-final').get_attribute('hidden') is None and pair.locator('.step').last.is_visible(),(name,i,'conclusione mancante')
    assert pair.locator('.solution-axis').count()==0,(name,i,'asse duplicato')
    assert pair.locator('.revision-solution').count()<=1,(name,i,'soluzioni duplicate')
    # No formula may be reduced below a readable size on iPad.
    sizes=pair.locator('.formula').evaluate_all('(els)=>els.map(e=>parseFloat(getComputedStyle(e).fontSize))')
    assert all(s>=17.9 for s in sizes),(name,i,sizes)
    if i==count-1 or (name in ['equazioni-secondo-grado','disequazioni-secondo-grado']):
     page.screenshot(path=str(OUT/f'{engine.name}-{width}-{name}-{i}.png'),full_page=True)
   # Every spoken example step has a corresponding DOM step and a generated file.
   data=page.evaluate('D');manifest=json.loads((ROOT/'tools/matematica-audio-revisioni.json').read_text())
   for track in data['audio_tracks']:
    assert track['file'].removeprefix('../../../') in manifest
   if name=='equazioni-irrazionali':
    labels=pairs.nth(6).locator('.revision-solution text').all_text_contents()
    assert labels==['x','−1','3','3'],labels # minus one over three, then three
   if name=='equazioni-secondo-grado':assert page.locator('.learning-pair .revision-graph').count()==6
   # Audio consumes title then numbered steps, never restarting the definition.
   page.locator('.paired-topic-menu button').nth(0).click()
   expected=len([t for t in data['audio_tracks'] if t['screen'] in ['Definizioni',data['definitions'][0]['name']] and (t['screen']!='Definizioni' or t['purpose']=='Definizione: '+data['definitions'][0]['name'])])
   start=page.evaluate('window.__audio.length')
   for j in range(expected-1):
    page.evaluate('window.__audio.at(-1).onended()');page.wait_for_timeout(325)
   assert pairs.nth(0).locator('.revision-final').get_attribute('hidden') is None and pairs.nth(0).locator('.step').last.is_visible(),(name,'audio non sincronizzato')
   assert page.evaluate('window.__audio.length')-start==expected-1
   page.locator('.screen.active .voice-controls button').nth(1).click()
   results.append({'browser':engine.name,'width':width,'lesson':name,'topics':count,'status':'passed'})
  # Unchanged lessons must still open and display their examples.
  for name in ['prodotti-notevoli','esponenziali','mcd-mcm']:
   page.goto('http://127.0.0.1:8765/lezioni/matematica/'+name+'/');page.wait_for_timeout(150)
   assert page.locator('#nav button').count()>2
  assert not errors,errors
  browser.close()
server.shutdown()
(OUT/'risultati.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(f'{len(results)} verifiche di lezione completate su Chromium e WebKit')
