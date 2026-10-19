"""Build the ParSight supply shelf as a GLB with Blender (stand-in shelf for the preview).

Run (after make_labels.py):
  blender --background --factory-startup --python tools/supply_shelf/build_shelf.py -- Assets/GeneratedMeshes/SupplyShelf.glb

Layout matches the old DisplayCaseBuilder exactly, in Lens Studio units and axes:
cm, origin = floor at the unit's center, +Y up, +Z = front (toward the user).
Shelves at 35 / 70 / 105 cm, floor deck at 8, wire top deck at 131, front lip at z = +22.
Geometry is accumulated per material, then converted to Blender (meters, Z up) so the
exported GLB lands back in this frame at Lens Studio's 100x import.
"""
import math
import os
import random
import sys

import bpy
import bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
LABELS = os.path.join(HERE, "labels")

# ---- Unit layout (cm, Lens Studio frame) ----
HALF_W, HALF_D = 60.0, 25.0
POST_X, POST_Z, POST_R = 58.8, 23.8, 1.27
FRONT_Z, BACK_Z = 22.5, -23.0
DECKS = [8.0, 35.0, 70.0, 105.0, 131.0]
SHELVES = {"top": 105.0, "middle": 70.0, "bottom": 35.0}
BIN_XS = [-38.0, 0.0, 38.0]
BIN_HALF_W, BIN_Z0, BIN_Z1, BIN_H, BIN_T = 17.0, -20.0, 19.0, 10.0, 0.35
WIRE_R = 0.17


def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def mul(a, k): return (a[0] * k, a[1] * k, a[2] * k)
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def norm(a):
    l = math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2)
    return (a[0] / l, a[1] / l, a[2] / l)


class Acc:
    """Vertices / faces / UVs for one material, in Lens Studio cm."""

    def __init__(self):
        self.verts, self.faces, self.uvs, self.smooth = [], [], [], []

    def face(self, pts, uvs=None, smooth=False):
        base = len(self.verts)
        self.verts.extend(pts)
        self.faces.append(tuple(range(base, base + len(pts))))
        self.uvs.append(uvs or [(0, 0)] * len(pts))
        self.smooth.append(smooth)

    def box(self, x0, y0, z0, x1, y1, z1):
        v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
             (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
        for f in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (3, 7, 6, 2), (0, 4, 7, 3), (1, 2, 6, 5)]:
            self.face([v[i] for i in f])

    def cyl(self, p0, p1, r, segs=10, caps=True, smooth=True, uv=False, r1=None):
        """Cylinder (or cone when r1 is set) from p0 to p1. uv=True maps u along, v around."""
        r1 = r if r1 is None else r1
        d = norm(sub(p1, p0))
        helper = (1, 0, 0) if abs(d[0]) < 0.9 else (0, 0, 1)
        u = norm(cross(helper, d))
        w = cross(d, u)  # u x w = d
        ring = lambda c, rr, i: add(c, add(mul(u, rr * math.cos(2 * math.pi * i / segs)),
                                           mul(w, rr * math.sin(2 * math.pi * i / segs))))
        for i in range(segs):
            a0, a1 = ring(p0, r, i), ring(p0, r, i + 1)
            b0, b1 = ring(p1, r1, i), ring(p1, r1, i + 1)
            uvs = [(0, i / segs), (0, (i + 1) / segs), (1, (i + 1) / segs), (1, i / segs)] if uv else None
            self.face([a0, a1, b1, b0], uvs, smooth)
            if caps:
                self.face([p1, ring(p1, r1, i), ring(p1, r1, i + 1)])
                self.face([p0, ring(p0, r, i + 1), ring(p0, r, i)])

    def quad_tex(self, p0, p1, p2, p3):
        """Textured quad, CCW seen from the front: p0 bottom-left, p1 bottom-right, p2 top-right, p3 top-left."""
        self.face([p0, p1, p2, p3], [(0, 0), (1, 0), (1, 1), (0, 1)])


MATS = {}


def acc(name):
    if name not in MATS:
        MATS[name] = Acc()
    return MATS[name]


# ---- Fixture ----

def build_fixture():
    chrome, feet = acc("Chrome"), acc("Feet")
    for sx in (-1, 1):
        for sz in (-1, 1):
            x, z = sx * POST_X, sz * POST_Z
            feet.cyl((x, 0, z), (x, 1.2, z), 1.6, 12)
            chrome.cyl((x, 1.2, z), (x, 133.0, z), POST_R, 12)
            feet.cyl((x, 133.0, z), (x, 133.6, z), 1.4, 12)  # post cap
            for h in DECKS:  # tapered sleeve collar where each deck locks on
                chrome.cyl((x, h - 3.2, z), (x, h + 0.2, z), POST_R + 0.25, 12, r1=POST_R + 0.55)
    for h in DECKS:
        wire_deck(chrome, h)


def truss(a, h, z, x0, x1):
    """Front/back edge: two rails with a zigzag between them (classic wire shelf lip)."""
    lo = h - 2.4
    a.cyl((x0, h, z), (x1, h, z), 0.3, 8)
    a.cyl((x0, lo, z), (x1, lo, z), 0.3, 8)
    n = int((x1 - x0) / 2.5)
    for i in range(n):
        xa, xb = x0 + i * 2.5, x0 + (i + 1) * 2.5
        ya, yb = (h, lo) if i % 2 == 0 else (lo, h)
        a.cyl((xa, ya, z), (xb, yb, z), WIRE_R, 6, caps=False)


def wire_deck(a, h):
    x0, x1 = -POST_X + 1.0, POST_X - 1.0
    truss(a, h, FRONT_Z, x0, x1)
    truss(a, h, BACK_Z, x0, x1)
    for sx in (x0, x1):  # side rails
        a.cyl((sx, h, BACK_Z), (sx, h, FRONT_Z), 0.3, 8)
        a.cyl((sx, h - 2.4, BACK_Z), (sx, h - 2.4, FRONT_Z), 0.3, 8)
    x = x0 + 2.5
    while x < x1 - 1:  # deck wires front to back
        a.cyl((x, h - 0.2, BACK_Z), (x, h - 0.2, FRONT_Z), WIRE_R, 6, caps=False)
        x += 2.5
    for z in (-12.0, 0.0, 12.0):  # cross supports underneath
        a.cyl((x0, h - 0.7, z), (x1, h - 0.7, z), 0.25, 6, caps=False)


# ---- Bins ----

def build_bins():
    plastic = acc("BinPlastic")
    for key, h in (("flush", SHELVES["top"]), ("iv", SHELVES["middle"]), ("foley", SHELVES["bottom"])):
        y0 = h + 0.1
        for cx in BIN_XS:
            x0, x1 = cx - BIN_HALF_W, cx + BIN_HALF_W
            t = BIN_T
            plastic.box(x0, y0, BIN_Z0, x1, y0 + t, BIN_Z1)                      # floor
            plastic.box(x0, y0, BIN_Z0, x1, y0 + BIN_H, BIN_Z0 + t)              # back
            plastic.box(x0, y0, BIN_Z1 - t, x1, y0 + BIN_H * 0.62, BIN_Z1)       # low front (scoop)
            plastic.box(x0, y0, BIN_Z0, x0 + t, y0 + BIN_H, BIN_Z1)              # left
            plastic.box(x1 - t, y0, BIN_Z0, x1, y0 + BIN_H, BIN_Z1)              # right
            plastic.box(x0, y0 + BIN_H, BIN_Z0 - 0.6, x1, y0 + BIN_H + 0.4, BIN_Z0 + 0.4)  # back lip
            # Label holder on the front wall, and its printed label.
            lz = BIN_Z1 + 0.05
            ly0, ly1 = y0 + 1.6, y0 + 5.6
            acc("Holder").box(cx - 7.4, ly0 - 0.3, BIN_Z1, cx + 7.4, ly1 + 0.3, lz)
            acc("BinLabel_" + key).quad_tex((cx - 6.9, ly0, lz + 0.02), (cx + 6.9, ly0, lz + 0.02),
                                            (cx + 6.9, ly1, lz + 0.02), (cx - 6.9, ly1, lz + 0.02))


# ---- Stock ----

def build_flushes():
    """26 prefilled flush syringes standing cap-down, 12 / 12 / 2 per bin (count 26 of par 40)."""
    rnd = random.Random(4)
    white, cap, label = acc("SyringeWhite"), acc("FlushCap"), acc("SyringeLabel")
    y = SHELVES["top"] + 0.5
    for b, n in enumerate((12, 12, 2)):
        for i in range(n):
            col, row = i % 4, i // 4
            x = BIN_XS[b] - 10.5 + col * 7 + rnd.uniform(-0.6, 0.6)
            z = 12 - row * 8 + rnd.uniform(-0.6, 0.6)
            cap.cyl((x, y, z), (x, y + 1.5, z), 0.62, 12)
            cap.cyl((x, y + 1.5, z), (x, y + 1.9, z), 0.45, 12)
            white.cyl((x, y + 1.9, z), (x, y + 9.6, z), 0.8, 16)
            label.cyl((x, y + 2.6, z), (x, y + 8.8, z), 0.815, 16, caps=False, uv=True)
            white.box(x - 1.8, y + 9.6, z - 0.75, x + 1.8, y + 10.0, z + 0.75)   # finger flange
            white.box(x - 0.5, y + 10.0, z - 0.08, x + 0.5, y + 12.5, z + 0.08)  # plunger rod (cross)
            white.box(x - 0.08, y + 10.0, z - 0.5, x + 0.08, y + 12.5, z + 0.5)
            white.cyl((x, y + 12.5, z), (x, y + 12.85, z), 1.05, 16)              # thumb press


def build_iv_kits():
    """20 IV start kit pouches filed upright front to back, 7 / 7 / 6 per bin (count 20 of par 20)."""
    rnd = random.Random(9)
    pouch, label = acc("Pouch"), acc("PouchLabel")
    y = SHELVES["middle"] + 0.5
    for b, n in enumerate((7, 7, 6)):
        for i in range(n):
            x = BIN_XS[b] + rnd.uniform(-0.5, 0.5)
            z = 15 - i * 4.6
            hgt = 15 + rnd.uniform(-0.4, 0.4)
            pouch.box(x - 7, y, z - 0.45, x + 7, y + hgt, z + 0.45)
            pouch.box(x - 7.3, y + hgt - 1.2, z - 0.3, x + 7.3, y + hgt, z + 0.3)  # heat-seal edge
            lz = z + 0.47
            label.quad_tex((x - 6.4, y + 0.8, lz), (x + 6.4, y + 0.8, lz),
                           (x + 6.4, y + hgt - 1.6, lz), (x - 6.4, y + hgt - 1.6, lz))


def build_cases():
    """Taped overstock cases on the floor deck, one per item, each with a shipping label."""
    y = DECKS[0] + 0.3
    for cx, key in zip(BIN_XS, ("flush", "iv", "foley")):
        acc("Cardboard").box(cx - 15, y, -19, cx + 15, y + 22, 15)
        acc("Tape").box(cx - 15.15, y + 21.6, -6.5, cx + 15.15, y + 22.15, -1.5)   # top seam tape
        acc("Tape").box(cx - 15.15, y + 8, 15.0, cx + 15.15, y + 22.15, 15.15)      # tape down the front
        lz = 15.2
        acc("CaseLabel_" + key).quad_tex((cx - 12, y + 1.5, lz), (cx - 1, y + 1.5, lz),
                                         (cx - 1, y + 8.7, lz), (cx - 12, y + 8.7, lz))


# ---- Blender conversion ----

def material(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    spec = {
        "Chrome": ((0.88, 0.9, 0.92), 0.35, 0.3, 1.0),  # low metallic: no env map to reflect in preview
        "Feet": ((0.12, 0.12, 0.13), 0.0, 0.6, 1.0),
        "BinPlastic": ((0.22, 0.48, 0.88), 0.0, 0.3, 0.32),
        "Holder": ((0.85, 0.9, 0.97), 0.0, 0.15, 0.6),
        "SyringeWhite": ((0.93, 0.95, 0.97), 0.0, 0.18, 1.0),
        "FlushCap": ((0.10, 0.38, 0.90), 0.0, 0.35, 1.0),
        "Pouch": ((0.95, 0.96, 0.97), 0.0, 0.28, 1.0),
        "Cardboard": ((0.42, 0.29, 0.16), 0.0, 0.9, 1.0),
        "Tape": ((0.6, 0.48, 0.32), 0.0, 0.25, 1.0),
    }
    tex = {
        "SyringeLabel": "syringe_label.png", "PouchLabel": "pouch_label.png",
        "BinLabel_flush": "bin_label_flush.png", "BinLabel_iv": "bin_label_iv.png",
        "BinLabel_foley": "bin_label_foley.png", "CaseLabel_flush": "case_label_flush.png",
        "CaseLabel_iv": "case_label_iv.png", "CaseLabel_foley": "case_label_foley.png",
    }
    if name in tex:
        node = m.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = bpy.data.images.load(os.path.join(LABELS, tex[name]))
        m.node_tree.links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.45
    else:
        col, metal, rough, alpha = spec[name]
        bsdf.inputs["Base Color"].default_value = (*col, 1.0)
        bsdf.inputs["Metallic"].default_value = metal
        bsdf.inputs["Roughness"].default_value = rough
        if alpha < 1.0:
            bsdf.inputs["Alpha"].default_value = alpha
            m.surface_render_method = "BLENDED"
    m.use_backface_culling = False
    return m


def to_blender(p):
    # Lens Studio (x, y, z) cm -> Blender (x, -z, y) m. Pure rotation, so face winding is kept.
    return (p[0] / 100.0, -p[2] / 100.0, p[1] / 100.0)


def emit(name, a):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for f, uvs, smooth in zip(a.faces, a.uvs, a.smooth):
        vs = [bm.verts.new(to_blender(a.verts[i])) for i in f]
        face = bm.faces.new(vs)
        face.smooth = smooth
        for loop, uv in zip(face.loops, uvs):
            loop[uv_layer].uv = uv
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    me.materials.append(material(name))
    return len(me.polygons)


def main():
    out = sys.argv[sys.argv.index("--") + 1]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_fixture()
    build_bins()
    build_flushes()
    build_iv_kits()
    build_cases()
    total = 0
    for name, a in MATS.items():
        n = emit(name, a)
        total += n
        print(f"  {name}: {n} faces")
    print("total faces", total)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_apply=True)
    print("wrote", out)


main()
