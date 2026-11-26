"""Pre-render the published game's transmissions and switch playback to MP3."""
import base64
from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.request

PAGE = Path("arcade/inglese-1-2/secret-transmission.html")
OUTPUT = PAGE.parent / "audio" / "secret-transmission"
ORIGINAL = PAGE.read_text(encoding="utf-8")
BANK = ORIGINAL[ORIGINAL.index("const names="):ORIGINAL.index("let level=")]
JOBS = json.loads(subprocess.check_output([
    "node", "-e", BANK + """
console.log(JSON.stringify(Object.entries(banks).flatMap(([level, cases]) =>
  cases.map((entry, index) => ({
    file: level + '-' + String(index + 1).padStart(2, '0') + '.mp3',
    text: entry.audio,
    voice: index % 2 === 0 ? 'Charon' : 'Aoede',
    rate: level === '1' ? 0.88 : 0.96
  }))
)));
"""
]))

RADIO_MIX = (
    "[0:a]highpass=f=190,lowpass=f=4800,acompressor=threshold=0.10:ratio=2:"
    "attack=8:release=100,loudnorm=I=-18:TP=-2:LRA=7,aresample=24000,"
    "aformat=channel_layouts=mono[voice];"
    "[1:a]bandpass=f=1900:w=2200,afade=t=out:st=0.035:d=0.075[open];"
    "[2:a]bandpass=f=1700:w=2000,afade=t=out:st=0.020:d=0.070[close];"
    "[open][voice][close]concat=n=3:v=0:a=1"
)

def render(job, directory):
    body = json.dumps({
        "input": {"text": job["text"]},
        "voice": {"languageCode": "en-GB", "name": "en-GB-Chirp3-HD-" + job["voice"]},
        "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": 24000,
                        "speakingRate": job["rate"]},
    }).encode()
    request = urllib.request.Request(
        "https://texttospeech.googleapis.com/v1/text:synthesize", data=body,
        headers={"Content-Type": "application/json", "X-Goog-Api-Key": os.environ["TTS_KEY"]},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        wav = base64.b64decode(json.load(response)["audioContent"], validate=True)
    dest = directory / job["file"]
    subprocess.run([
        "ffmpeg", "-v", "error", "-f", "wav", "-i", "pipe:0",
        "-f", "lavfi", "-i", "anoisesrc=a=0.065:r=24000:d=0.11:s=72",
        "-f", "lavfi", "-i", "anoisesrc=a=0.045:r=24000:d=0.09:s=73",
        "-filter_complex", RADIO_MIX, "-ar", "24000", "-ac", "1",
        "-c:a", "libmp3lame", "-b:a", "96k", str(dest),
    ], input=wav, check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(dest),
                    "-f", "null", "-"], check=True)

PLAYER = """let clip;
function stopTransmission() {
  if (clip) {
    const previous = clip;
    clip = undefined;
    previous.pause();
  }
  $('#wave').classList.remove('playing');
}
function transmit() {
  if (locked || silent) return;
  stopTransmission();
  const index = banks[level].indexOf(deck[n]) + 1;
  const file = level + '-' + String(index).padStart(2, '0') + '.mp3';
  const audio = new Audio('audio/secret-transmission/' + file);
  clip = audio;
  const setSignal = (status, playing = false) => {
    if (clip !== audio) return;
    $('#wave').classList.toggle('playing', playing);
    $('#signal').textContent = status;
  };
  audio.onplaying = () => setSignal('LIVE INTERCEPT // LISTEN', true);
  audio.onwaiting = () => setSignal('ENCRYPTED SIGNAL ACQUIRED');
  audio.onended = () => setSignal('SIGNAL DECODED');
  const unavailable = () => setSignal('AUDIO UNAVAILABLE');
  audio.onerror = unavailable;
  audio.play().catch(unavailable);
}
"""

def updated_page():
    start = ORIGINAL.index("function transmit(){")
    end = ORIGINAL.index("function answer(", start)
    result = ORIGINAL[:start] + PLAYER + ORIGINAL[end:]
    return result.replace("speechSynthesis?.cancel()", "stopTransmission()")

def main():
    updated = updated_page()
    if not JOBS or len({job["file"] for job in JOBS}) != len(JOBS):
        raise ValueError("Invalid transmission list")
    with tempfile.TemporaryDirectory() as folder:
        directory = Path(folder)
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(lambda job: render(job, directory), JOBS))
        OUTPUT.mkdir(parents=True, exist_ok=True)
        for job in JOBS:
            (OUTPUT / job["file"]).write_bytes((directory / job["file"]).read_bytes())
    PAGE.write_text(updated, encoding="utf-8")
    print(f"Verified {len(JOBS)} MP3 transmissions.", flush=True)

if __name__ == "__main__":
    main()
