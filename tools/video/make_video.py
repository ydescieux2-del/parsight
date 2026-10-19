"""Render the ParSight demo video (Snap Specs hackathon) with no screen recording.

    ELEVENLABS_API_KEY=... python3 make_video.py out/parsight.mp4      # ElevenLabs narration (Brian)
    python3 make_video.py out/check.mp4 --silent                     # layout check only, no voice credit

Footage is preview captures in frames/ (from Lens Studio). Demo scenes show two views side by side:
"The supply room" (a wide spectator camera, so viewers can see which bins glow) and "Through the
glasses" (what the wearer sees standing at the shelf). Light theme, ElevenLabs narration.
Script of record: devpost/demo-video-script.md. Frames are captured from the Lens Studio preview into frames/ (not in the repo).
"""
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
FR = HERE / "frames"
CACHE = HERE / ".tts_cache"
SILENT = "--silent" in sys.argv
BRIAN = "nPczCjzI2devNBz1zQrb"
W, H, FPS = 1920, 1080, 24
XF = 0.45  # crossfade between shots, seconds

NAVY, BG, SURF, BORDER = (15, 34, 64), (248, 250, 252), (241, 245, 249), (203, 213, 225)
INK, INK2, BLUE, CYAN = (15, 23, 42), (71, 85, 105), (37, 99, 235), (34, 211, 238)
FONT = "/System/Library/Fonts/HelveticaNeue.ttc"


def font(size, bold=False):
    return ImageFont.truetype(FONT, size, index=1 if bold else 0)


# ---- Scenes (narration matches devpost/demo-video-script.md) ----
# Shot lists are (frame, seconds-weight). "pulse" alternates frames quickly to show the arrow's beat.
SCENES = [
    {"kind": "title",
     "say": "It's three in the morning. A float nurse is covering a unit they've never worked on, "
            "and they need a Foley catheter kit, now."},
    {"kind": "problem",
     "say": "In one emergency department study, nurses left the room for supplies eight times a shift. "
            "And the counting behind every supply room is still done by hand, with a clipboard or a scanner."},
    {"kind": "split", "min": 12, "head": "A supply shelf, on Snap Specs", "sub": "Saline flushes, IV start kits and Foley kits, each with a par level",
     "left": [("s3_wide.png", 1)], "right": [("s3_mid.png", 1), ("s4_panel_before.png", 1)],
     "say": "ParSight runs on Snap Specs. On the left is the whole supply room. On the right is exactly what "
            "the nurse sees through the glasses. Saline flushes, IV start kits, and Foley kits, each with a par level."},
    {"kind": "split", "min": 10, "head": "Find it", "sub": "Tap or say the item. Its bins light up on the shelf.",
     "left": [("s3_wide.png", 1), ("w_flush_lit.png", 2)],
     "right": [("s4_panel_before.png", 0.6), ("s4_panel_after.png", 0.8), ("s4_lit_a.png", 1.6)],
     "say": "Say what you need, or tap it. The three flush bins light up, right on the shelf, "
            "and their label glows, so there's nothing to hunt for."},
    {"kind": "split", "min": 11, "head": "The count keeps itself", "sub": "Reach in, take one. No scanning, no tapping, no clipboard.",
     "left": [("w_flush_lit.png", 1), ("w_after_take.png", 1.3)],
     "right": [("s4_lit_b.png", 1), ("s5_after.png", 1.3)],
     "marks": [{"panel": "right", "shot": 0, "xy": (667, 520), "r": 140, "label": "reach in"},
               {"panel": "right", "shot": 1, "xy": (695, 958), "r": 85, "label": "26 to 25"}],
     "say": "Reach in and take one. That's it. The count drops from twenty six to twenty five, by itself. "
            "Nobody stops to scan, tap, or write anything down."},
    {"kind": "split", "min": 14, "head": "Behind you? Follow the arrow", "sub": "Out-of-view bins get an arrow. Empty shelves say so.",
     "left": [("w_foley_lit.png", 1)],
     "marks": [{"panel": "right", "shot": 0, "xy": (1050, 1435), "r": 115, "label": "arrow points back"}],
     "right": [("pulse", ["s6_arrow_1.png", "s6_arrow_2.png", "s6_arrow_3.png", "s6_arrow_4.png"], 1.3),
               ("s6_turn_1.png", 0.45), ("s6_turn_2.png", 0.45), ("s6_turn_3.png", 0.45), ("s6_foley.png", 1.6)],
     "say": "Now the Foley kit. The nurse is facing the wrong way, so an arrow at the edge of their view points back. "
            "They turn, and there are the lit bins. The shelf is empty, and ParSight says so. It's already on the pull list."},
    {"kind": "split", "min": 12, "head": "Restock without a sweep", "sub": "The supply tech sees exactly what to bring.",
     "left": [("w_pull.png", 1.2), ("w_restocked.png", 1)],
     "right": [("s7_pull.png", 1.2), ("s7_restocked.png", 1)],
     "say": "The supply tech sees exactly what to bring up: fifteen flushes and eight Foley kits. "
            "After restocking, one pinch resets every shelf to par."},
    {"kind": "close",
     "say": "Every behavior here is covered by automated tests in Lens Studio. Next comes voice on the glasses, "
            "camera confirmation of each pick, and then the hospital pharmacy. ParSight. Find it, and the count keeps itself."},
]


# ---- Audio ----

def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(f)]).decode())


def tts(text, out):
    if SILENT:
        secs = max(2.0, len(text) / 15)
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", f"{secs:.2f}",
                        str(out)], check=True, capture_output=True)
        return secs
    CACHE.mkdir(exist_ok=True)
    hit = CACHE / (hashlib.sha1(f"{BRIAN}|eleven_multilingual_v2|{text}".encode()).hexdigest() + ".mp3")
    if not hit.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{BRIAN}?output_format=mp3_44100_128",
            data=json.dumps({"text": text, "model_id": "eleven_multilingual_v2"}).encode(),
            headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "content-type": "application/json"})
        hit.write_bytes(urllib.request.urlopen(req, timeout=90).read())
    shutil.copy(hit, out)
    return dur(out)


# ---- Drawing ----

_img_cache = {}


def load(name):
    if name not in _img_cache:
        _img_cache[name] = Image.open(FR / name).convert("RGB")
    return _img_cache[name]


def fit(img, bw, bh, zoom=1.0):
    """Contain img in a bw x bh box (letterboxed on the panel color), with an optional slow zoom."""
    k = min(bw / img.width, bh / img.height) * zoom
    im = img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS)
    box = Image.new("RGB", (bw, bh), (30, 41, 59))
    box.paste(im, ((bw - im.width) // 2, (bh - im.height) // 2))
    return box, k, ((bw - im.width) // 2, (bh - im.height) // 2)


def header(d, head, sub):
    d.rectangle([0, 0, W, 150], fill=NAVY)
    d.text((80, 30), head, font=font(54, True), fill=(255, 255, 255))
    d.text((82, 98), sub, font=font(28), fill=(203, 213, 225))
    tag = "ParSight"
    tw = d.textlength(tag, font=font(34, True))
    d.text((W - 80 - tw, 52), tag, font=font(34, True), fill=CYAN)


PANEL_W, PANEL_H, PANEL_Y = 720, 840, 210
PANEL_X = {"left": W // 2 - PANEL_W - 30, "right": W // 2 + 30}
LABEL = {"left": "THE SUPPLY ROOM", "right": "THROUGH THE GLASSES"}


def shot_at(shots, t, total):
    """Return [(frame_name, alpha)] for time t, crossfading between weighted shots."""
    weights = [s[-1] for s in shots]
    unit = total / sum(weights)
    edges, acc = [], 0.0
    for w in weights:
        edges.append((acc, acc + w * unit))
        acc += w * unit
    out = []
    for i, (a, b) in enumerate(edges):
        if a - XF / 2 <= t < b + XF / 2:
            alpha = 1.0
            if i > 0 and t < a + XF / 2:
                alpha = (t - (a - XF / 2)) / XF
            if i < len(edges) - 1 and t > b - XF / 2:
                alpha = min(alpha, ((b + XF / 2) - t) / XF)
            s = shots[i]
            if s[0] == "pulse":
                frames = s[1]
                name = frames[int(t / 0.22) % len(frames)]
            else:
                name = s[0]
            out.append((i, name, max(0.0, min(1.0, alpha)), (t - a) / max(1e-6, b - a)))
    return out


def draw_mark(panel_img, k, off, mark, phase):
    d = ImageDraw.Draw(panel_img, "RGBA")
    x, y = off[0] + mark["xy"][0] * k, off[1] + mark["xy"][1] * k
    r = mark["r"] * k * (1 + 0.12 * math.sin(phase * math.pi * 2))
    for w, a in ((10, 70), (5, 255)):
        d.ellipse([x - r, y - r, x + r, y + r], outline=CYAN + (a,), width=w)
    label = mark["label"]
    f = font(30, True)
    tw = d.textlength(label, font=f)
    lx, ly = x - tw / 2, y + r + 10
    d.rounded_rectangle([lx - 14, ly - 6, lx + tw + 14, ly + 40], 10, fill=(15, 34, 64, 230))
    d.text((lx, ly), label, font=f, fill=CYAN)


def render_split(sc, t, total):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    header(d, sc["head"], sc["sub"])
    for side in ("left", "right"):
        x0 = PANEL_X[side]
        d.text((x0, PANEL_Y - 42), LABEL[side], font=font(24, True), fill=INK2)
        layer = None
        for idx, name, alpha, local in shot_at(sc[side], t, total):
            zoom = 1.0 + 0.035 * (t / total)
            box, k, off = fit(load(name), PANEL_W, PANEL_H, zoom)
            for m in sc.get("marks", []):
                if m["panel"] == side and m["shot"] == idx and local > 0.12:
                    draw_mark(box, k, off, m, t * 0.9)
            layer = box if layer is None else Image.blend(layer, box, alpha)
        rounded = Image.new("L", (PANEL_W, PANEL_H), 0)
        ImageDraw.Draw(rounded).rounded_rectangle([0, 0, PANEL_W - 1, PANEL_H - 1], 22, fill=255)
        img.paste(layer, (x0, PANEL_Y), rounded)
        d.rounded_rectangle([x0, PANEL_Y, x0 + PANEL_W - 1, PANEL_Y + PANEL_H - 1], 22, outline=BORDER, width=3)
    return img


def render_title(t, total):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 16], fill=NAVY)
    d.text((140, 300), "ParSight", font=font(150, True), fill=NAVY)
    d.text((146, 500), "Find it. The count keeps itself.", font=font(60, True), fill=BLUE)
    d.text((148, 600), "Hospital supply rooms, on Snap Specs", font=font(36), fill=INK2)
    d.text((148, 655), "Built in Lens Studio", font=font(32), fill=INK2)
    box, _, _ = fit(load("w_flush_lit.png"), 600, 760, 1.0 + 0.03 * t / total)
    mask = Image.new("L", box.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, box.width - 1, box.height - 1], 22, fill=255)
    img.paste(box, (W - 600 - 140, 170), mask)
    return img


def render_problem(t, total):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    header(d, "The problem", "Supplies cost nurses time, every shift")
    rows = [("8", "times a shift, nurses left the room for supplies (emergency department study, Richardson et al. 2014)"),
            ("By hand", "supply rooms are still counted with a clipboard or a handheld scanner, in gloved hands"),
            ("~15%", "of hospital expenses are supplies; 30 to 40% in surgery-heavy hospitals (SAGE 2017)")]
    for i, (big, text) in enumerate(rows):
        show = min(1.0, max(0.0, (t - i * total / 4) / 0.6))
        if show <= 0:
            continue
        y = 250 + i * 250
        col = tuple(int(BG[j] + (c - BG[j]) * show) for j, c in enumerate(BLUE))
        ink = tuple(int(BG[j] + (c - BG[j]) * show) for j, c in enumerate(INK))
        d.rounded_rectangle([120, y - 20, W - 120, y + 190], 24, fill=SURF, outline=BORDER, width=2)
        d.text((170, y + 38), big, font=font(96, True), fill=col)
        lines = wrap(d, text, font(40), W - 120 - 720 - 60)
        for j, ln in enumerate(lines):
            d.text((720, y + 40 + j * 54), ln, font=font(40), fill=ink)
    return img


def render_close(t, total):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    header(d, "Logic proven in preview", "7 automated LEAF tests pass in Lens Studio")
    left = ["Find lights the right bins", "Arrow points to out-of-view bins", "Reaching in counts a take",
            "Amber below par, red at zero, Pull List", "Cards stay put as you move"]
    d.text((140, 230), "Tested", font=font(44, True), fill=NAVY)
    for i, s in enumerate(left):
        y = 310 + i * 86
        d.ellipse([140, y + 4, 184, y + 48], fill=CYAN)
        d.line([(151, y + 27), (159, y + 36), (174, y + 16)], fill=NAVY, width=5, joint="curve")
        d.text((210, y), s, font=font(40), fill=INK)
    d.text((1060, 230), "Next", font=font(44, True), fill=NAVY)
    for i, s in enumerate(["Voice: “find Foley sixteen French”", "Camera confirms each pick",
                           "Hospital pharmacy, with barcode checks"]):
        y = 310 + i * 86
        d.rounded_rectangle([1060, y + 14, 1084, y + 38], 6, fill=BLUE)
        d.text((1110, y), s, font=font(40), fill=INK)
    d.text((140, 900), "ParSight. Find it, and the count keeps itself.", font=font(54, True), fill=BLUE)
    return img


def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if d.textlength(trial, font=f) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


def render(sc, t, total):
    k = sc["kind"]
    if k == "title":
        return render_title(t, total)
    if k == "problem":
        return render_problem(t, total)
    if k == "close":
        return render_close(t, total)
    return render_split(sc, t, total)


def main():
    out = Path(sys.argv[1])
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="parsight_"))
    durs, wavs = [], []
    for i, sc in enumerate(SCENES):
        mp3 = tmp / f"n{i}.mp3"
        nd = tts(sc["say"], mp3)
        total = max(nd + 1.1, sc.get("min", 0))  # breath after each line; demo scenes hold longer
        durs.append(total)
        wav = tmp / f"a{i}.wav"
        subprocess.run(["ffmpeg", "-y", "-i", str(mp3), "-af", f"adelay=350|350,apad=whole_dur={total:.3f}",
                        "-ar", "44100", "-ac", "2", str(wav)], check=True, capture_output=True)
        wavs.append(wav)
    lst = tmp / "a.txt"
    lst.write_text("".join(f"file '{w}'\n" for w in wavs))
    audio = tmp / "audio.wav"
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(audio)],
                   check=True, capture_output=True)

    enc = subprocess.Popen(["ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                            "-i", "-", "-i", str(audio), "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)],
                           stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    prev_last = None
    for i, sc in enumerate(SCENES):
        total = durs[i]
        n = int(round(total * FPS))
        for f in range(n):
            t = f / FPS
            frame = render(sc, t, total)
            if prev_last is not None and t < XF:  # crossfade from the previous scene
                frame = Image.blend(prev_last, frame, t / XF)
            enc.stdin.write(frame.tobytes())
        prev_last = render(sc, total - 1 / FPS, total)
        print(f"scene {i + 1}/{len(SCENES)}: {total:.1f}s", flush=True)
    enc.stdin.close()
    enc.wait()
    print(f"wrote {out}  ({sum(durs):.1f}s)")
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
