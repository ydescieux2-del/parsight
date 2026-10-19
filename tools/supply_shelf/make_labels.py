"""Generate the printed label textures for the supply shelf model (generic text, no brands).

Run: python3 tools/supply_shelf/make_labels.py
Writes PNGs to tools/supply_shelf/labels/. build_shelf.py embeds them in the GLB.
"""
import os
import random

from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "labels")
FONT = "/System/Library/Fonts/HelveticaNeue.ttc"
NAVY = (20, 45, 95)
BLUE = (30, 95, 200)
GREEN = (40, 140, 90)
AMBER = (200, 120, 20)
INK = (35, 35, 40)
WHITE = (250, 251, 252)


def font(size, bold=False):
    # HelveticaNeue.ttc: index 0 regular, 1 bold
    return ImageFont.truetype(FONT, size, index=1 if bold else 0)


def barcode(d, x, y, w, h, seed):
    rnd = random.Random(seed)
    cx = x
    while cx < x + w:
        bw = rnd.choice([2, 2, 3, 4, 6])
        if rnd.random() < 0.55:
            d.rectangle([cx, y, cx + bw - 1, y + h], fill=INK)
        cx += bw


def centered(d, cx, y, text, f, fill):
    w = d.textlength(text, font=f)
    d.text((cx - w / 2, y), text, font=f, fill=fill)


def syringe_label():
    # x runs along the barrel, y around it. Text is printed twice so either side reads.
    img = Image.new("RGB", (1024, 256), WHITE)
    d = ImageDraw.Draw(img)
    for band in (0, 128):
        d.rectangle([0, band, 1024, band + 22], fill=BLUE)
        d.text((40, band + 30), "0.9% Sodium Chloride", font=font(40, True), fill=NAVY)
        d.text((40, band + 78), "Flush Syringe 10 mL   Sterile fluid path", font=font(26), fill=INK)
        for i in range(11):  # graduations 0..10 mL
            gx = 600 + i * 38
            d.line([gx, band + 30, gx, band + (70 if i % 5 == 0 else 52)], fill=INK, width=3)
            if i % 5 == 0:
                d.text((gx - 8, band + 76), str(i), font=font(24), fill=INK)
    img.save(os.path.join(OUT, "syringe_label.png"))


def pouch_label():
    img = Image.new("RGB", (512, 560), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 512, 90], fill=GREEN)
    centered(d, 256, 18, "IV START KIT", font(54, True), WHITE)
    y = 120
    for line in ["Tourniquet", "Antiseptic swab", "Transparent dressing", "Tape strip", "Gauze sponge 2 x 2"]:
        d.text((40, y), "•  " + line, font=font(30), fill=INK)
        y += 44
    d.rectangle([40, y + 16, 200, y + 60], outline=GREEN, width=4)
    d.text((58, y + 22), "STERILE", font=font(28, True), fill=GREEN)
    d.text((40, y + 84), "LOT 26A417     EXP 2028-06", font=font(24), fill=INK)
    barcode(d, 40, y + 124, 430, 70, 7)
    img.save(os.path.join(OUT, "pouch_label.png"))


def bin_label(name, item, par, color, seed):
    img = Image.new("RGB", (768, 224), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 24, 224], fill=color)
    d.text((52, 22), item, font=font(52, True), fill=INK)
    d.text((52, 96), "PAR " + str(par) + "     BIN " + name.upper(), font=font(34), fill=INK)
    barcode(d, 52, 150, 420, 52, seed)
    img.save(os.path.join(OUT, "bin_label_" + name + ".png"))


def case_label(name, item, qty, seed):
    img = Image.new("RGB", (640, 420), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([12, 12, 628, 408], outline=INK, width=4)
    d.text((40, 36), item, font=font(46, True), fill=INK)
    d.text((40, 104), qty, font=font(34), fill=INK)
    d.text((40, 156), "STORE AT ROOM TEMPERATURE", font=font(26), fill=INK)
    d.text((40, 196), "LOT 26C" + str(100 + seed) + "    EXP 2028-09", font=font(26), fill=INK)
    barcode(d, 40, 250, 560, 110, seed)
    img.save(os.path.join(OUT, "case_label_" + name + ".png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    syringe_label()
    pouch_label()
    bin_label("flush", "SALINE FLUSH 10 mL", 40, BLUE, 1)
    bin_label("iv", "IV START KIT", 20, GREEN, 2)
    bin_label("foley", "FOLEY CATH KIT 16 Fr", 8, AMBER, 3)
    case_label("flush", "SALINE FLUSH 10 mL", "120 EA / CASE", 11)
    case_label("iv", "IV START KIT", "50 EA / CASE", 12)
    case_label("foley", "FOLEY CATH KIT 16 Fr", "10 EA / CASE", 13)
    print("labels ->", OUT, sorted(os.listdir(OUT)))
