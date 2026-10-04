"""Genera un video Workstream-1 (slide statiche + narrazione TTS) interamente su GitHub Actions.
Uso: python tools/make_video.py <materia> <episodio_dir_name>

Legge da:
  video-src/<materia>/<episodio_dir_name>/slides/slideNN.png
  video-src/<materia>/<episodio_dir_name>/testi/slideNN.txt   (narrazione gia' pronta, UTF-8)

Scrive il risultato in:
  consegne/<materia>/<episodio_dir_name>.mp4

Richiede la variabile d'ambiente TTS_KEY (chiave API Google Cloud Text-to-Speech),
stesso schema di tools/tts.py (voce per materia configurabile via TTS_VOICE).
"""
import base64, glob, json, os, re, subprocess, sys, tempfile, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

KEY = os.environ["TTS_KEY"]
VOICE = os.environ.get("TTS_VOICE", "it-IT-Chirp3-HD-Charon")
RATE = float(os.environ.get("TTS_RATE", "0.94"))
WORKERS = int(os.environ.get("TTS_WORKERS", "6"))


def tts_wav(text):
    body = json.dumps({"input": {"text": text},
                        "voice": {"languageCode": VOICE[:5], "name": VOICE},
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
            print(f"  riprovo TTS ({attempt + 1}): {e}", flush=True)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError("TTS fallita: " + text[:60])


def slide_num(path):
    m = re.search(r"(\d+)", os.path.basename(path))
    return m.group(1)


def make_audio(num, text, out_mp3):
    wav_bytes = tts_wav(text.strip())
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(wav_bytes)
        wav_path = f.name
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path,
                     "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "192k", out_mp3],
                    check=True)
    os.remove(wav_path)
    return out_mp3


def make_segment(slide_png, mp3, out_mp4):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", slide_png,
                     "-i", mp3, "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac",
                     "-b:a", "192k", "-pix_fmt", "yuv420p", "-shortest",
                     "-vf", "scale=1920:1080", out_mp4], check=True)


def main():
    if len(sys.argv) != 3:
        print("Uso: python tools/make_video.py <materia> <episodio_dir_name>")
        sys.exit(1)
    materia, epname = sys.argv[1], sys.argv[2]
    base = f"video-src/{materia}/{epname}"
    slides = sorted(glob.glob(f"{base}/slides/slide*.png"))
    if not slides:
        print(f"ERRORE: nessuna slide trovata in {base}/slides/")
        sys.exit(1)

    work = tempfile.mkdtemp()
    audio_dir = os.path.join(work, "audio")
    seg_dir = os.path.join(work, "seg")
    os.makedirs(audio_dir, exist_ok=True)
    os.makedirs(seg_dir, exist_ok=True)

    nums = [slide_num(s) for s in slides]
    texts = {}
    for num in nums:
        txt_path = f"{base}/testi/slide{num}.txt"
        if not os.path.exists(txt_path):
            print(f"ERRORE: manca {txt_path}")
            sys.exit(1)
        texts[num] = open(txt_path, encoding="utf-8").read()

    print(f"== {materia}/{epname}: {len(slides)} slide, generazione TTS...", flush=True)
    mp3s = {}
    with ThreadPoolExecutor(WORKERS) as ex:
        futs = {ex.submit(make_audio, num, texts[num], os.path.join(audio_dir, f"slide{num}.mp3")): num
                for num in nums}
        for fut in as_completed(futs):
            num = futs[fut]
            mp3s[num] = fut.result()
            print(f"   audio slide{num} ok", flush=True)

    print("== assemblaggio segmenti ffmpeg...", flush=True)
    segs = []
    for slide_png, num in zip(slides, nums):
        seg_path = os.path.join(seg_dir, f"segment{num}.mp4")
        make_segment(slide_png, mp3s[num], seg_path)
        segs.append(seg_path)
        print(f"   segment{num} ok", flush=True)

    list_path = os.path.join(seg_dir, "list.txt")
    with open(list_path, "w") as f:
        for s in segs:
            f.write(f"file '{os.path.abspath(s)}'\n")

    os.makedirs(f"consegne/{materia}", exist_ok=True)
    out = f"consegne/{materia}/{epname}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                     "-i", list_path, "-c", "copy", out], check=True)

    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                           "-of", "csv=p=0", out], capture_output=True, text=True).stdout.strip()
    print(f"DONE {out} duration={dur}s", flush=True)


if __name__ == "__main__":
    main()
