"""Textures for the supply-room backdrop (generic text, no brands).

Run: python3 tools/supply_shelf/make_room_textures.py
Writes PNGs to tools/supply_shelf/labels/. build_room.py embeds them in the GLB.
"""
import os
import random

from PIL import Image, ImageDraw, ImageFilter

from make_labels import OUT, INK, WHITE, NAVY, barcode, centered, font


def floor_tiles():
    """2 x 2 speckled vinyl tiles (one texture repeat = 2 tiles of 61 cm)."""
    rnd = random.Random(5)
    n = 1024
    img = Image.new("RGB", (n, n), (206, 202, 192))
    d = ImageDraw.Draw(img)
    for _ in range(26000):  # speckle
        x, y = rnd.randrange(n), rnd.randrange(n)
        c = rnd.choice([(170, 165, 155), (226, 222, 214), (150, 146, 140), (196, 190, 178)])
        d.point((x, y), fill=c)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    d = ImageDraw.Draw(img)
    for k in (0, n // 2):  # seams
        d.line([(k, 0), (k, n)], fill=(176, 172, 164), width=3)
        d.line([(0, k), (n, k)], fill=(176, 172, 164), width=3)
    img.save(os.path.join(OUT, "floor_tiles.png"))


def ceiling_tiles():
    """2 x 2 acoustic ceiling tiles in a white grid."""
    rnd = random.Random(8)
    n = 512
    img = Image.new("RGB", (n, n), (236, 236, 232))
    d = ImageDraw.Draw(img)
    for _ in range(9000):
        d.point((rnd.randrange(n), rnd.randrange(n)), fill=(214, 214, 210))
    for k in (0, n // 2):
        d.rectangle([k, 0, k + 5, n], fill=(250, 250, 250))
        d.rectangle([0, k, n, k + 5], fill=(250, 250, 250))
    img.save(os.path.join(OUT, "ceiling_tiles.png"))


def room_sign():
    img = Image.new("RGB", (900, 300), (30, 78, 150))
    d = ImageDraw.Draw(img)
    d.rectangle([10, 10, 889, 289], outline=(230, 236, 245), width=6)
    centered(d, 450, 60, "CLEAN SUPPLY", font(110, True), WHITE)
    centered(d, 450, 200, "Staff only", font(44), (210, 222, 240))
    img.save(os.path.join(OUT, "sign_clean_supply.png"))


def glove_box(size, color, seed):
    """Front face of an exam glove box (portrait: 256 x 128 cm-ish ratio 2:1 wide)."""
    img = Image.new("RGB", (512, 256), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 512, 70], fill=color)
    centered(d, 256, 12, "NITRILE EXAM GLOVES", font(40, True), WHITE)
    d.ellipse([186, 96, 326, 170], fill=(225, 230, 236), outline=(190, 196, 204), width=3)  # dispenser opening
    d.text((24, 190), "SIZE " + size, font=font(44, True), fill=INK)
    d.text((300, 200), "100 / BOX", font=font(30), fill=INK)
    img.save(os.path.join(OUT, f"glove_box_{size.lower()}.png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    floor_tiles()
    ceiling_tiles()
    room_sign()
    glove_box("S", (124, 72, 190), 1)
    glove_box("M", (40, 110, 200), 2)
    glove_box("L", (30, 140, 120), 3)
    print("room textures ->", OUT)
