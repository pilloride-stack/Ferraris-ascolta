"""Generate only content-addressed audio clips requested by revision 45–64."""
import base64, concurrent.futures, hashlib, json, os, pathlib, subprocess, tempfile, urllib.request, threading, time
ROOT=pathlib.Path(__file__).resolve().parent.parent
MANIFEST=json.loads((ROOT/'tools/matematica-audio-revisioni.json').read_text())
RATE_LOCK=threading.Lock()
NEXT_REQUEST=0.0
def throttle():
    global NEXT_REQUEST
    with RATE_LOCK:
        delay=max(0,NEXT_REQUEST-time.monotonic())
        if delay:time.sleep(delay)
        NEXT_REQUEST=time.monotonic()+0.45
def generate(item):
    relative,text=item; target=ROOT/relative
    if target.exists() and target.stat().st_size>1000:return
    target.parent.mkdir(parents=True,exist_ok=True)
    payload={'input':{'text':text},'voice':{'languageCode':'it-IT','name':'it-IT-Chirp3-HD-Charon'},'audioConfig':{'audioEncoding':'LINEAR16','speakingRate':0.94,'sampleRateHertz':24000}}
    import time
    for attempt in range(8):
        try:
            throttle()
            req=urllib.request.Request('https://texttospeech.googleapis.com/v1/text:synthesize?key='+os.environ['TTS_KEY'],data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
            with urllib.request.urlopen(req,timeout=120) as response: wav=base64.b64decode(json.load(response)['audioContent'])
            break
        except Exception as error:
            code=getattr(error,'code',type(error).__name__)
            print(f'TTS riprova {attempt+1}/8, stato {code}, file {relative}',flush=True)
            if attempt==7:raise RuntimeError('TTS non riuscita per '+relative+'; stato '+str(code)) from None
            time.sleep(min(65,5*2**attempt))
    with tempfile.NamedTemporaryFile(suffix='.wav') as temp:
        temp.write(wav);temp.flush()
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',temp.name,'-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','96k',str(target)],check=True)
    subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],check=True)
    return relative
if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i,result in enumerate(pool.map(generate,MANIFEST.items()),1):
            if i%20==0:print(f'{i}/{len(MANIFEST)} audio verificati',flush=True)
    missing=[name for name in MANIFEST if not (ROOT/name).exists() or (ROOT/name).stat().st_size<=1000]
    if missing:raise RuntimeError('Audio mancanti: '+str(missing))
    print(f'{len(MANIFEST)} audio pronti')
