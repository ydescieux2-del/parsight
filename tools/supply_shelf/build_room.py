"""Build the clean-supply-room backdrop around the ParSight shelf as a GLB with Blender.

Run (after make_labels.py and make_room_textures.py):
  blender --background --factory-startup --python tools/supply_shelf/build_room.py -- Assets/GeneratedMeshes/SupplyRoom.glb

Same frame as build_shelf.py (Lens Studio DisplayCase space): cm, origin = floor at the main
shelf's center, +Y up, +Z toward the user. The main shelf stands against the back wall; the user
starts about 1.15 m in front of it. Visual only: nothing here is interactive or counted.
"""
import math
import os
import sys

import bpy
import bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
LABELS = os.path.join(HERE, "labels")

X0, X1 = -230.0, 230.0     # side walls
Z0, Z1 = -45.0, 340.0      # back wall (behind the shelf) and front wall (behind the user)
CEIL = 270.0
TILE = 122.0               # floor texture repeat (2 tiles of 61 cm)
CEIL_TILE = 122.0
FLOOR_Y = 0.5              # just above the preview's own grid floor, which sits at y = 0 and would z-fight


class Acc:
    def __init__(self):
        self.verts, self.faces, self.uvs = [], [], []

    def face(self, pts, uvs=None):
        base = len(self.verts)
        self.verts.extend(pts)
        self.faces.append(tuple(range(base, base + len(pts))))
        self.uvs.append(uvs or [(0, 0)] * len(pts))

    def box(self, x0, y0, z0, x1, y1, z1):
        v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
             (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
        for f in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (3, 7, 6, 2), (0, 4, 7, 3), (1, 2, 6, 5)]:
            self.face([v[i] for i in f])

    def cyl(self, p0, p1, r, segs=10):
        """Vertical cylinder (p0, p1 differ only in y)."""
        for i in range(segs):
            a0, a1 = 2 * math.pi * i / segs, 2 * math.pi * (i + 1) / segs
            c0 = (p0[0] + r * math.cos(a0), p0[2] - r * math.sin(a0))
            c1 = (p0[0] + r * math.cos(a1), p0[2] - r * math.sin(a1))
            self.face([(c0[0], p0[1], c0[1]), (c1[0], p0[1], c1[1]), (c1[0], p1[1], c1[1]), (c0[0], p1[1], c0[1])])

    def rod_x(self, x0, x1, y, z, r=0.3):
        self.box(x0, y - r, z - r, x1, y + r, z + r)

    def rod_z(self, z0, z1, x, y, r=0.3):
        self.box(x - r, y - r, z0, x + r, y + r, z1)

    def quad(self, p0, p1, p2, p3, uvs=((0, 0), (1, 0), (1, 1), (0, 1))):
        self.face([p0, p1, p2, p3], list(uvs))


MATS = {}


def acc(name):
    return MATS.setdefault(name, Acc())


# ---- Shell ----

def build_shell():
    f = acc("Floor")
    f.quad((X0, FLOOR_Y, Z1), (X1, FLOOR_Y, Z1), (X1, FLOOR_Y, Z0), (X0, FLOOR_Y, Z0),
           ((X0 / TILE, Z1 / TILE), (X1 / TILE, Z1 / TILE), (X1 / TILE, Z0 / TILE), (X0 / TILE, Z0 / TILE)))
    c = acc("Ceiling")
    c.quad((X0, CEIL, Z0), (X1, CEIL, Z0), (X1, CEIL, Z1), (X0, CEIL, Z1),
           ((X0 / CEIL_TILE, Z0 / CEIL_TILE), (X1 / CEIL_TILE, Z0 / CEIL_TILE),
            (X1 / CEIL_TILE, Z1 / CEIL_TILE), (X0 / CEIL_TILE, Z1 / CEIL_TILE)))
    acc("BackWall").quad((X0, 0, Z0), (X1, 0, Z0), (X1, CEIL, Z0), (X0, CEIL, Z0))
    side = acc("Wall")
    side.quad((X0, 0, Z1), (X0, 0, Z0), (X0, CEIL, Z0), (X0, CEIL, Z1))   # left, faces +x
    side.quad((X1, 0, Z0), (X1, 0, Z1), (X1, CEIL, Z1), (X1, CEIL, Z0))   # right, faces -x
    side.quad((X1, 0, Z1), (X0, 0, Z1), (X0, CEIL, Z1), (X1, CEIL, Z1))   # front, faces -z

    base, rail = acc("CoveBase"), acc("CrashRail")
    base.box(X0, 0, Z0, X1, 10, Z0 + 1.2)
    base.box(X0, 0, Z0, X0 + 1.2, 10, Z1)
    base.box(X1 - 1.2, 0, Z0, X1, 10, Z1)
    # Crash rail along the side walls (hospital rooms have them; the back wall is hidden by the shelf).
    rail.box(X0, 84, Z0 + 5, X0 + 3, 98, Z1 - 5)
    rail.box(X1 - 3, 84, Z0 + 5, X1, 98, Z1 - 5)

    light = acc("LightPanel")
    for z in (40.0, 220.0):
        light.box(-30, CEIL - 1.5, z - 60, 30, CEIL - 0.2, z + 60)


# ---- Door, sign, sanitizer (back wall, right of the shelf) ----

def build_door():
    zf = Z0 + 0.6
    frame, leaf, steel = acc("DoorFrame"), acc("DoorLeaf"), acc("Steel")
    dx0, dx1, top = 122.0, 214.0, 213.0
    frame.box(dx0 - 5, 0, Z0, dx0, top + 5, zf + 1.5)
    frame.box(dx1, 0, Z0, dx1 + 5, top + 5, zf + 1.5)
    frame.box(dx0 - 5, top, Z0, dx1 + 5, top + 5, zf + 1.5)
    leaf.box(dx0, 0.5, Z0, dx1, top, zf)
    steel.box(dx0 + 2, 1, zf, dx1 - 2, 26, zf + 0.3)            # kick plate
    steel.box(dx1 - 16, 99, zf, dx1 - 6, 103, zf + 4)          # lever
    steel.box(dx1 - 9, 97, zf, dx1 - 6, 105, zf + 1.5)         # lever rose
    sign = acc("Sign")
    sign.quad((-36, 178, Z0 + 0.8), (36, 178, Z0 + 0.8), (36, 202, Z0 + 0.8), (-36, 202, Z0 + 0.8))
    acc("SignBack").box(-37.5, 176.5, Z0, 37.5, 203.5, Z0 + 0.7)
    disp = acc("Dispenser")
    disp.box(88, 112, Z0, 100, 136, Z0 + 10)
    acc("DispenserWindow").box(90, 118, Z0 + 10, 98, 128, Z0 + 10.3)


# ---- Second shelving unit on the left wall, stocked with exam-glove boxes ----

def build_glove_unit():
    chrome = acc("Chrome")
    xa, xb = X0 + 3, X0 + 43          # unit depth along x (back against the wall)
    za, zb = 20.0, 140.0              # unit length along z
    for x in (xa + 1.3, xb - 1.3):
        for z in (za + 1.3, zb - 1.3):
            chrome.cyl((x, 0, z), (x, 160, z), 1.2, 10)
    for h in (10.0, 45.0, 80.0, 115.0, 150.0):
        chrome.rod_z(za, zb, xb - 0.5, h)            # front lip (faces the room)
        chrome.rod_z(za, zb, xb - 0.5, h - 2.4)
        chrome.rod_z(za, zb, xa + 0.5, h)
        z = za + 2.5
        while z < zb - 1:                            # deck wires, wall to front
            chrome.rod_x(xa, xb, h - 0.2, z, 0.17)
            z += 2.5
    sizes = {45.0: "s", 80.0: "m", 115.0: "l", 150.0: "m"}
    for h, size in sizes.items():
        z = za + 4
        while z + 24 < zb - 2:
            for depth in (0.0, 14.0):                # two boxes deep
                x1 = xb - 3 - depth
                acc("GloveCarton").box(x1 - 13, h + 0.4, z, x1, h + 12.9, z + 24)
                if depth == 0.0:
                    acc("Glove_" + size).quad((x1 + 0.05, h + 0.4, z + 24), (x1 + 0.05, h + 0.4, z),
                                              (x1 + 0.05, h + 12.9, z), (x1 + 0.05, h + 12.9, z + 24))
            z += 26.5


# ---- Blender conversion (same as build_shelf.py) ----

SPEC = {
    "Wall": ((0.90, 0.90, 0.87), 0.0, 0.85, None),
    "BackWall": ((0.74, 0.80, 0.86), 0.0, 0.85, None),
    "CoveBase": ((0.25, 0.26, 0.28), 0.0, 0.5, None),
    "CrashRail": ((0.80, 0.72, 0.58), 0.0, 0.4, None),
    "LightPanel": ((1.0, 1.0, 0.98), 0.0, 0.2, "emit"),
    "DoorFrame": ((0.55, 0.57, 0.60), 0.4, 0.4, None),
    "DoorLeaf": ((0.70, 0.56, 0.40), 0.0, 0.55, None),
    "Steel": ((0.78, 0.80, 0.82), 0.6, 0.3, None),
    "SignBack": ((0.90, 0.92, 0.95), 0.0, 0.4, None),
    "Dispenser": ((0.95, 0.95, 0.96), 0.0, 0.3, None),
    "DispenserWindow": ((0.45, 0.55, 0.65), 0.0, 0.2, None),
    "Chrome": ((0.88, 0.90, 0.92), 0.35, 0.3, None),
    "GloveCarton": ((0.94, 0.95, 0.96), 0.0, 0.5, None),
}
TEX = {
    "Floor": "floor_tiles.png", "Ceiling": "ceiling_tiles.png", "Sign": "sign_clean_supply.png",
    "Glove_s": "glove_box_s.png", "Glove_m": "glove_box_m.png", "Glove_l": "glove_box_l.png",
}


def material(name):
    m = bpy.data.materials.new("Room" + name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    bsdf = nodes["Principled BSDF"]
    if name in TEX:
        node = nodes.new("ShaderNodeTexImage")
        node.image = bpy.data.images.load(os.path.join(LABELS, TEX[name]))
        m.node_tree.links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.6 if name in ("Floor", "Ceiling") else 0.45
        if name == "Ceiling":  # faces away from the scene light; glow so it reads as a lit white ceiling
            m.node_tree.links.new(node.outputs["Color"], bsdf.inputs["Emission Color"])
            bsdf.inputs["Emission Strength"].default_value = 0.85
    else:
        col, metal, rough, extra = SPEC[name]
        bsdf.inputs["Base Color"].default_value = (*col, 1.0)
        bsdf.inputs["Metallic"].default_value = metal
        bsdf.inputs["Roughness"].default_value = rough
        if extra == "emit":
            bsdf.inputs["Emission Color"].default_value = (*col, 1.0)
            bsdf.inputs["Emission Strength"].default_value = 1.0
    m.use_backface_culling = False
    return m


def to_blender(p):
    return (p[0] / 100.0, -p[2] / 100.0, p[1] / 100.0)


def emit(name, a):
    me = bpy.data.meshes.new("Room" + name)
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for f, uvs in zip(a.faces, a.uvs):
        face = bm.faces.new([bm.verts.new(to_blender(a.verts[i])) for i in f])
        for loop, uv in zip(face.loops, uvs):
            loop[uv_layer].uv = uv
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("Room" + name, me)
    bpy.context.collection.objects.link(ob)
    me.materials.append(material(name))
    return len(me.polygons)


def main():
    out = sys.argv[sys.argv.index("--") + 1]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_shell()
    build_door()
    build_glove_unit()
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
