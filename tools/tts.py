"""Genera gli audio mancanti (una frase = un mp3) per tutte le materie in episodi/<materia>/.
Uso: python tools/tts.py [materia ...]   (senza argomenti: tutte le materie)
Richiede la variabile d'ambiente TTS_KEY (chiave API Google Cloud Text-to-Speech)."""
import base64, glob, json, os, subprocess, sys, tempfile, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

KEY = os.environ["TTS_KEY"]
VOICE = os.environ.get("TTS_VOICE", "it-IT-Chirp3-HD-Charon")
VOICE_EN = os.environ.get("TTS_VOICE_EN", "en-GB-Chirp3-HD-Charon")
RATE = float(os.environ.get("TTS_RATE", "0.94"))
WORKERS = int(os.environ.get("TTS_WORKERS", "10"))

def tts(text, lang="it"):
    voice = VOICE_EN if lang == "en" else VOICE
    body = json.dumps({"input": {"text": text},
                       "voice": {"languageCode": voice[:5], "name": voice},
                       "audioConfig": {"audioEncoding": "LINEAR16", "speakingRate": RATE,
                                       "sampleRateHertz": 24000}}).encode()
    for attempt in range(6):
        try:
            req = urllib.request.Request(
                "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + KEY,
                data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                return base64.b64decode(json.load(r)["audioContent"])
        except Exception as e:
            print(f"  riprovo ({attempt + 1}): {e}", flush=True)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError("TTS fallita: " + text[:60])

def make(job):
    text, out = job
    # text: stringa (una sola voce) oppure lista di parti [{"lang": "it"|"en", "text": ...}]
    parts = text if isinstance(text, list) else [{"lang": "it", "text": text}]
    wavs = []
    for p in parts:
        if not p["text"].strip():
            continue
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(tts(p["text"].strip(), p.get("lang", "it")))
            wavs.append(f.name)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    part = out + ".part.mp3"
    if len(wavs) == 1:
        inp = ["-i", wavs[0]]
    else:
        lst = out + ".list.txt"
        with open(lst, "w") as f:
            f.write("".join(f"file '{w}'\n" for w in wavs))
        inp = ["-f", "concat", "-safe", "0", "-i", lst]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inp, "-ac", "1", "-ar", "24000",
                    "-c:a", "libmp3lame", "-b:a", "96k", part], check=True)
    os.replace(part, out)
    for w in wavs:
        os.remove(w)
    if len(wavs) > 1:
        os.remove(lst)
    return out

def jobs_for(materia):
    jobs, expected = [], []
    for f in sorted(glob.glob(f"episodi/{materia}/episodio-*.json")):
        d = json.load(open(f, encoding="utf-8"))
        for i, s in enumerate(d["sentences"], 1):
            out = f"audio/{materia}/episodio-{d['episode']}/frase-{i:02d}.mp3"
            expected.append((out, len(s.get("speech") or s["text"])))
            if not (os.path.exists(out) and os.path.getsize(out) > 1000):
                jobs.append((s.get("parts") or s.get("speech") or s["text"], out))
    return jobs, expected

def check(expected):
    bad = []
    for out, n in expected:
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", out, "-f", "null", "-"],
                           capture_output=True, text=True)
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                    "-of", "csv=p=0", out], capture_output=True, text=True).stdout or 0)
        if r.stderr.strip() or dur < n / 25 or dur > n / 6 + 3:
            bad.append((out, n, round(dur, 1)))
    return bad

materie = sys.argv[1:] or sorted(os.path.basename(p.rstrip("/")) for p in glob.glob("episodi/*/"))
ok = True
for m in materie:
    jobs, expected = jobs_for(m)
    print(f"== {m}: {len(expected)} frasi, da generare {len(jobs)}", flush=True)
    done = 0
    with ThreadPoolExecutor(WORKERS) as ex:
        for fut in as_completed([ex.submit(make, j) for j in jobs]):
            fut.result()
            done += 1
            if done % 25 == 0:
                print(f"   {done}/{len(jobs)}", flush=True)
    if jobs:
        bad = check(expected)
        print(f"   controllo: {len(expected)} file, problemi {len(bad)}", flush=True)
        for b in bad:
            print("   PROBLEMA", b)
        ok = ok and not bad
        json.dump({"voice": VOICE, "speakingRate": RATE, "encoding": "mp3 96k mono 24kHz",
                   "episodes": len(glob.glob(f"episodi/{m}/episodio-*.json")), "files": len(expected)},
                  open(f"audio/{m}/manifest.json", "w"), indent=2)
sys.exit(0 if ok else 1)
