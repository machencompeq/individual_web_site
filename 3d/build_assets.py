"""
Blender 3D 素材產生器
====================
用程式建模，輸出網站用的 3D 模型 (.glb) 與透明背景渲染圖 (.png)。

執行方式（任一）：
  blender -b -P 3d/build_assets.py
  python 3d/build_assets.py          # 需要 `pip install bpy`

輸出到 assets/3d/
"""
import math
import os
import sys

import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "3d")
os.makedirs(OUT, exist_ok=True)

FAST = "--fast" in sys.argv  # CI 用低取樣快速渲染

# ---------- 調色盤（與網站 style.css 一致） ----------
GRAPHITE = (0.040, 0.034, 0.030, 1)
GRAPHITE_2 = (0.045, 0.038, 0.033, 1)
CREAM = (0.78, 0.68, 0.53, 1)
AMBER = (1.0, 0.30, 0.0, 1)
EMBER = (1.0, 0.20, 0.03, 1)
TERRACOTTA = (0.55, 0.16, 0.06, 1)
LEAF = (0.17, 0.30, 0.09, 1)
CYAN = (0.12, 0.65, 0.60, 1)
COFFEE = (0.06, 0.025, 0.012, 1)


# ---------- 工具 ----------
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


_mats = {}


def mat(name, color, metal=0.0, rough=0.5, emit=None, strength=0.0):
    key = name
    if key in _mats and _mats[key].name in bpy.data.materials:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = color
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    if emit:
        p.inputs["Emission Color"].default_value = emit
        p.inputs["Emission Strength"].default_value = strength
    _mats[key] = m
    return m


def screen_mat(name, img_path, strength=2.2):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (0.01, 0.005, 0, 1)
    p.inputs["Roughness"].default_value = 0.12
    p.inputs["Emission Strength"].default_value = strength
    if os.path.exists(img_path):
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(img_path)
        nt.links.new(tex.outputs["Color"], p.inputs["Emission Color"])
    else:
        p.inputs["Emission Color"].default_value = (1.0, 0.55, 0.1, 1)
    return m


def assign(obj, m):
    obj.data.materials.clear()
    obj.data.materials.append(m)


def finish(obj, m, bevel=0.0, segs=3, smooth=False):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)
    if bevel > 0:
        b = obj.modifiers.new("Bevel", "BEVEL")
        b.width = bevel
        b.segments = segs
        b.limit_method = "ANGLE"
    if smooth:
        for poly in obj.data.polygons:
            poly.use_smooth = True
    assign(obj, m)
    return obj


def box(name, size, loc, m, bevel=0.02, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    return finish(o, m, bevel)


def cyl(name, r, h, loc, m, verts=48, rot=(0, 0, 0), bevel=0.0, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return finish(o, m, bevel, smooth=True)


def sphere(name, r, loc, m, scale=(1, 1, 1), seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    return finish(o, m, smooth=True)


def torus(name, R, r, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot,
                                     major_segments=48, minor_segments=16)
    o = bpy.context.active_object
    o.name = name
    return finish(o, m, smooth=True)


def text(name, body, loc, size, m, depth=0.02, rot=(0, 0, 0)):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.data.body = body
    o.data.size = size
    o.data.extrude = depth
    o.data.align_x = "CENTER"
    o.data.align_y = "CENTER"
    o.data.materials.append(m)
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    return bpy.context.active_object


def link(a, b, r, m, name="link"):
    """兩點間的圓柱（樹的連線）"""
    a, b = Vector(a), Vector(b)
    d = b - a
    o = cyl(name, r, d.length, (a + b) / 2, m, verts=16)
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    return o


def setup_render(res=720, samples=96):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 16 if FAST else samples
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = res
    sc.render.resolution_y = res
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "Medium High Contrast"
    world = bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.03, 0.022, 0.018, 1)
    bg.inputs["Strength"].default_value = 1.0


def light(name, kind, loc, energy, color, size=2.0, target=(0, 0, 0.6)):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    data.color = color
    if kind == "AREA":
        data.size = size
    o = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(o)
    o.location = loc
    d = Vector(target) - Vector(loc)
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("-Z", "Y")
    return o


def camera(loc, target, lens=50):
    data = bpy.data.cameras.new("Cam")
    data.lens = lens
    o = bpy.data.objects.new("Cam", data)
    bpy.context.collection.objects.link(o)
    o.location = loc
    d = Vector(target) - Vector(loc)
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("-Z", "Y")
    bpy.context.scene.camera = o
    return o


def studio(target=(0, 0, 0.6), dist=6.0):
    light("Key", "AREA", (-4, -4, 5), 1000, (1.0, 0.80, 0.60), 4, target)
    light("Rim", "AREA", (4, 3.5, 3.5), 900, (0.40, 0.90, 0.95), 3, target)
    light("Fill", "AREA", (3, -5, 1.5), 200, (1.0, 0.62, 0.38), 4, target)


def shadow_catcher(z=0.0, size=12):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
    p = bpy.context.active_object
    p.name = "ShadowCatcher"
    p.is_shadow_catcher = True
    return p


def export_glb(name):
    path = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_apply=True,
                              export_yup=True, export_lights=False, export_cameras=False)
    print("exported", path)


def render(name):
    path = os.path.join(OUT, name + ".png")
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("rendered", path)


# ======================================================================
# 1. HERO：書桌上的 CRT 終端機、鍵盤、咖啡、盆栽
# ======================================================================
def build_desk():
    reset()
    _mats.clear()
    body = mat("Body", GRAPHITE_2, rough=0.45)
    dark = mat("Dark", GRAPHITE, rough=0.6)
    cream = mat("Cream", CREAM, rough=0.55)
    amber = mat("Amber", AMBER, rough=0.35, emit=AMBER, strength=0.35)
    screen = screen_mat("ScreenMat", os.path.join(ROOT, "3d", "screen.png"))
    mug = mat("Mug", TERRACOTTA, rough=0.35)
    coffee = mat("Coffee", COFFEE, rough=0.1)
    pot = mat("Pot", CREAM, rough=0.7)
    leaf = mat("Leaf", LEAF, rough=0.55)
    soil = mat("Soil", (0.05, 0.03, 0.02, 1), rough=1)

    # CRT 螢幕
    box("Monitor", (1.7, 1.3, 1.35), (0, 0, 1.15), body, 0.08)
    box("MonitorBack", (1.25, 0.9, 0.95), (0, 0.85, 1.12), body, 0.12)
    box("Bezel", (1.48, 0.06, 1.12), (0, -0.66, 1.18), dark, 0.04)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -0.70, 1.18), rotation=(math.pi / 2, 0, 0))
    scr = bpy.context.active_object
    scr.name = "Screen"
    scr.scale = (1.3, 0.96, 1)
    finish(scr, screen)
    box("Neck", (0.5, 0.5, 0.25), (0, 0.15, 0.38), body, 0.04)
    box("Stand", (1.1, 0.9, 0.12), (0, 0.15, 0.24), dark, 0.05)
    cyl("LED", 0.035, 0.03, (0.62, -0.665, 0.56), amber, rot=(math.pi / 2, 0, 0))
    for i in range(5):
        box(f"Vent{i}", (0.18, 0.02, 0.02), (-0.62 + i * 0.07, -0.655, 0.56), dark, 0.005, rot=(0, 0, 0))

    # 鍵盤
    kb_z = 0.1
    box("Keyboard", (2.0, 0.72, 0.1), (0, -1.45, kb_z), dark, 0.03)
    accents = {(0, 0), (1, 11), (2, 11), (3, 4), (3, 5), (3, 6), (3, 7)}
    for row in range(4):
        for col in range(12):
            if row == 3 and col in (5, 6, 7):
                continue
            w = 0.125
            if row == 3 and col == 4:
                w = 0.125 * 4 + 0.03 * 3  # 空白鍵
                x = -0.94 + 4 * 0.155 + w / 2 - 0.0625
            else:
                x = -0.94 + col * 0.155 + (0.04 if row % 2 else 0)
            y = -1.68 + row * 0.155
            m = amber if (row, col) in accents else cream
            box(f"Key{row}_{col}", (w, 0.125, 0.07), (x, -y - 2.9, kb_z + 0.08), m, 0.02)

    # 咖啡杯（溫暖）
    cyl("Mug", 0.2, 0.42, (1.55, -1.05, 0.21), mug, bevel=0.01)
    cyl("Coffee", 0.18, 0.02, (1.55, -1.05, 0.40), coffee)
    torus("Handle", 0.11, 0.035, (1.77, -1.05, 0.22), mug, rot=(math.pi / 2, 0, 0))

    # 盆栽
    cyl("Pot", 0.22, 0.36, (-1.5, -0.65, 0.18), pot, r2=0.17)
    cyl("Soil", 0.205, 0.02, (-1.5, -0.65, 0.35), soil)
    import random
    random.seed(7)
    for i in range(11):
        a = i / 11 * math.tau + random.random() * 0.3
        tilt = 0.5 + random.random() * 0.45
        r = 0.16
        lf = sphere(f"Leaf{i}", 0.1, (-1.5 + math.cos(a) * r, -0.65 + math.sin(a) * r, 0.58 + random.random() * 0.2),
                    leaf, scale=(0.45, 1.0, 2.6), seg=16)
        lf.rotation_mode = "XYZ"
        lf.rotation_euler = (-math.sin(a) * tilt, math.cos(a) * tilt, 0)

    # 磁碟片
    box("Floppy", (0.42, 0.44, 0.03), (1.35, -0.25, 0.03), mat("Floppy", (0.05, 0.25, 0.26, 1), rough=0.4), 0.01,
        rot=(0, 0, 0.3))
    box("FloppyLabel", (0.3, 0.16, 0.005), (1.33, -0.31, 0.05), cream, 0.002, rot=(0, 0, 0.3))

    export_glb("desk")

    setup_render(900, 96)
    shadow_catcher()
    studio((0, -0.5, 0.7))
    light("ScreenGlow", "AREA", (0, -1.6, 1.2), 120, (1.0, 0.6, 0.2), 1.2, (0, -1.4, 0.1))
    camera((3.4, -5.6, 2.9), (0.05, -0.55, 0.8), lens=58)
    render("desk")


# ======================================================================
# 2. 資料結構模型：2-3 Tree 與 Heap
# ======================================================================
def build_tree23():
    reset()
    _mats.clear()
    node = mat("Node", GRAPHITE_2, rough=0.4)
    key = mat("Key", AMBER, rough=0.3, emit=AMBER, strength=0.35)
    key2 = mat("Key2", CREAM, rough=0.5)
    edge = mat("Edge", CYAN, rough=0.3, emit=CYAN, strength=0.6)

    def tnode(name, keys, loc, highlight=False):
        n = len(keys)
        w = 0.55 * n + 0.15
        box(name, (w, 0.5, 0.42), loc, node, 0.08)
        for i, k in enumerate(keys):
            x = loc[0] - w / 2 + 0.35 + i * 0.55
            box(f"{name}_k{i}", (0.42, 0.06, 0.3), (x, loc[1] - 0.26, loc[2]), key if highlight else key2, 0.03)
            text(f"{name}_t{i}", str(k), (x, loc[1] - 0.3, loc[2]), 0.2, node, depth=0.01,
                 rot=(math.pi / 2, 0, 0))
        return loc

    root = tnode("Root", [30, 60], (0, 0, 2.4), True)
    kids = [tnode("A", [10, 20], (-2.0, 0, 1.0)), tnode("B", [40], (0, 0, 1.0)), tnode("C", [70, 90], (2.0, 0, 1.0))]
    for i, k in enumerate(kids):
        link((root[0] - 0.4 + i * 0.4, 0, 2.2), (k[0], 0, 1.2), 0.035, edge, f"E{i}")

    export_glb("tree23")
    setup_render(640, 80)
    studio((0, 0, 1.6))
    camera((2.6, -6.5, 3.6), (0, 0, 1.6), lens=45)
    render("tree23")


def build_heap():
    reset()
    _mats.clear()
    top = mat("Top", AMBER, rough=0.25, emit=AMBER, strength=0.35)
    ball = mat("Ball", CREAM, rough=0.45)
    ball2 = mat("Ball2", GRAPHITE_2, rough=0.35)
    edge = mat("Edge", CYAN, rough=0.3, emit=CYAN, strength=0.6)
    pts = []
    levels = 4
    gap = 0.62  # 最底層節點間距
    for lv in range(levels):
        n = 2 ** lv
        z = 3.0 - lv * 0.95
        step = gap * 2 ** (levels - 1 - lv)
        for i in range(n):
            pts.append(((i - (n - 1) / 2) * step, 0, z))
    for idx, p in enumerate(pts):
        r = 0.32 - 0.05 * int(math.log2(idx + 1))
        sphere(f"N{idx}", r, p, top if idx == 0 else (ball if idx % 2 else ball2))
        if idx > 0:
            link(pts[(idx - 1) // 2], p, 0.03, edge, f"E{idx}")

    export_glb("heap")
    setup_render(640, 80)
    studio((0, 0, 1.6))
    camera((2.4, -7.0, 3.4), (0, 0, 1.6), lens=45)
    render("heap")


# ======================================================================
# 3. 區塊圖示（只渲染 PNG）
# ======================================================================
def build_trophy():
    reset()
    _mats.clear()
    gold = mat("Gold", (1.0, 0.62, 0.18, 1), metal=1, rough=0.22)
    base = mat("Base", GRAPHITE_2, rough=0.4)
    amber = mat("Amber", AMBER, emit=AMBER, strength=0.35)
    box("Base", (1.2, 1.2, 0.35), (0, 0, 0.18), base, 0.05)
    box("Plate", (0.7, 0.02, 0.16), (0, -0.61, 0.18), amber, 0.01)
    cyl("Stem", 0.12, 0.6, (0, 0, 0.65), gold)
    cyl("Knot", 0.25, 0.12, (0, 0, 0.95), gold, bevel=0.03)
    cyl("Cup", 0.72, 1.1, (0, 0, 1.6), gold, r2=0.28, rot=(math.pi, 0, 0), verts=64)
    torus("HandleL", 0.28, 0.06, (-0.75, 0, 1.75), gold, rot=(math.pi / 2, 0, 0))
    torus("HandleR", 0.28, 0.06, (0.75, 0, 1.75), gold, rot=(math.pi / 2, 0, 0))
    setup_render(640, 96)
    studio((0, 0, 1.1))
    camera((2.6, -5.6, 2.8), (0, 0, 1.1), lens=50)
    render("icon_trophy")


def build_camera():
    reset()
    _mats.clear()
    body = mat("Body", GRAPHITE_2, rough=0.45)
    cream = mat("Cream", CREAM, rough=0.6)
    glass = mat("Glass", (0.02, 0.05, 0.06, 1), metal=0.3, rough=0.05)
    amber = mat("Amber", AMBER, emit=AMBER, strength=0.35)
    box("Body", (2.0, 0.8, 1.25), (0, 0, 0.75), body, 0.12)
    box("Grip", (2.02, 0.82, 0.5), (0, 0, 0.45), cream, 0.1)
    box("Top", (0.7, 0.6, 0.3), (-0.45, 0.05, 1.45), body, 0.06)
    cyl("Lens1", 0.5, 0.25, (0.15, -0.5, 0.78), body, rot=(math.pi / 2, 0, 0), bevel=0.03)
    cyl("Lens2", 0.38, 0.35, (0.15, -0.75, 0.78), cream, rot=(math.pi / 2, 0, 0), bevel=0.02)
    cyl("Glass", 0.3, 0.05, (0.15, -0.93, 0.78), glass, rot=(math.pi / 2, 0, 0))
    cyl("Shutter", 0.12, 0.12, (0.65, 0, 1.42), amber)
    box("Flash", (0.35, 0.05, 0.2), (-0.65, -0.41, 1.1), cream, 0.02)
    setup_render(640, 96)
    studio((0, 0, 0.75))
    camera((2.8, -5.0, 2.6), (0, 0, 0.75), lens=50)
    render("icon_camera")


def build_stairs():
    reset()
    _mats.clear()
    step = mat("Step", GRAPHITE_2, rough=0.4)
    step2 = mat("Step2", CREAM, rough=0.55)
    amber = mat("Amber", AMBER, emit=AMBER, strength=0.35)
    for i in range(4):
        box(f"S{i}", (0.9, 1.2, 0.4 * (i + 1)), (-1.35 + i * 0.9, 0, 0.2 * (i + 1)), amber if i == 3 else (step2 if i % 2 else step), 0.04)
        text(f"T{i}", f"Y{i + 1}", (-1.35 + i * 0.9, -0.62, 0.4 * (i + 1) - 0.18), 0.22,
             step if i % 2 or i == 3 else step2, depth=0.02, rot=(math.pi / 2, 0, 0))
    cyl("Pole", 0.03, 1.0, (1.35, 0.2, 2.1), step2)
    box("Flag", (0.5, 0.03, 0.3), (1.6, 0.2, 2.45), amber, 0.01)
    setup_render(640, 96)
    studio((0, 0, 1.0))
    camera((3.0, -6.0, 3.2), (0, 0, 1.0), lens=50)
    render("icon_stairs")


def build_keycaps():
    reset()
    _mats.clear()
    cream = mat("Cream", CREAM, rough=0.5)
    dark = mat("Dark", GRAPHITE_2, rough=0.45)
    amber = mat("Amber", AMBER, rough=0.35, emit=AMBER, strength=0.35)
    legend_dark = mat("LegendDark", GRAPHITE, rough=0.6)
    legend_light = mat("LegendLight", (0.95, 0.88, 0.75, 1), rough=0.6)
    caps = [("C++", (-1.05, 0.0, 0), cream, legend_dark), ("</>", (0.0, 0.25, 0), dark, legend_light),
            ("{ }", (1.05, -0.05, 0), amber, legend_dark)]
    for i, (label, (x, y, _), m, lm) in enumerate(caps):
        z = 0.45 + i * 0.12
        cyl(f"Cap{i}", 0.62, 0.7, (x, y, z), m, verts=4, r2=0.45, bevel=0.06).rotation_euler = (0, 0, math.pi / 4)
        text(f"L{i}", label, (x, y, z + 0.36), 0.3, lm, depth=0.02)
    setup_render(640, 96)
    studio((0, 0, 0.5))
    camera((2.2, -5.2, 3.6), (0, 0, 0.5), lens=50)
    render("icon_keycaps")


def build_envelope():
    reset()
    _mats.clear()
    paper = mat("Paper", CREAM, rough=0.7)
    amber = mat("Seal", EMBER, rough=0.35, emit=EMBER, strength=0.6)
    box("Env", (2.2, 0.12, 1.4), (0, 0, 0.9), paper, 0.03)
    verts = [(-1.08, -0.07, 1.58), (1.08, -0.07, 1.58), (0, -0.07, 0.82),
             (-1.08, -0.11, 1.58), (1.08, -0.11, 1.58), (0, -0.11, 0.82)]
    faces = [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]
    me = bpy.data.meshes.new("Flap")
    me.from_pydata(verts, [], faces)
    flap = bpy.data.objects.new("Flap", me)
    bpy.context.collection.objects.link(flap)
    bpy.context.view_layer.objects.active = flap
    finish(flap, paper, 0.01)
    cyl("Seal", 0.22, 0.08, (0, -0.15, 0.95), amber, rot=(math.pi / 2, 0, 0), bevel=0.02)
    text("Heart", "<3", (0, -0.2, 0.95), 0.18, paper, depth=0.01, rot=(math.pi / 2, 0, 0))
    setup_render(640, 96)
    studio((0, 0, 0.9))
    camera((2.0, -5.4, 2.0), (0, 0, 0.9), lens=50)
    render("icon_envelope")


if __name__ == "__main__":
    only = [a for a in sys.argv if a.startswith("--only=")]
    jobs = {
        "desk": build_desk, "tree23": build_tree23, "heap": build_heap, "trophy": build_trophy,
        "camera": build_camera, "stairs": build_stairs, "keycaps": build_keycaps, "envelope": build_envelope,
    }
    names = only[0].split("=", 1)[1].split(",") if only else list(jobs)
    for n in names:
        print("==>", n)
        jobs[n]()
