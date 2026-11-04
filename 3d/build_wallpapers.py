"""
經典風格桌布（原創，不使用任何官方桌布圖檔）
  wall_hill.png  綠色山丘 + 藍天白雲（XP 風）：山丘用 Blender 建模渲染，天空和雲用 Pillow 畫
  wall_aqua.png  藍色光帶（Mac Aqua 風）：Pillow
執行：python 3d/build_wallpapers.py   （需要 bpy、pillow）
"""
import math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "wall")
os.makedirs(OUT, exist_ok=True)
W, H = 2560, 1600
FAST = "--fast" in sys.argv


def sky():
    img = Image.new("RGB", (W, H))
    top, bot = (22, 92, 214), (150, 200, 245)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = (y / H) ** 0.9
        d.line([(0, y), (W, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    random.seed(4)
    clouds = Image.new("L", (W, H), 0)
    cd = ImageDraw.Draw(clouds)
    for cx, cy, s in [(420, 300, .8), (1350, 220, 1.0), (2150, 380, .75), (900, 560, .5), (1800, 600, .45)]:
        for _ in range(26):
            rx = random.uniform(90, 230) * s; ry = rx * random.uniform(.45, .7)
            ox = random.gauss(0, 210 * s); oy = random.gauss(0, 45 * s)
            cd.ellipse([cx + ox - rx, cy + oy - ry, cx + ox + rx, cy + oy + ry], fill=random.randint(150, 235))
    clouds = clouds.filter(ImageFilter.GaussianBlur(26))
    white = Image.new("RGB", (W, H), (255, 255, 255))
    return Image.composite(white, img, clouds.point(lambda v: int(v * .92)))


def hill_render(path):
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"
    sc.cycles.samples = 12 if FAST else 64; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "Standard"
    # 山丘：細分平面 + 平滑隆起
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=220, y_subdivisions=220, size=120)
    g = bpy.context.active_object
    for v in g.data.vertices:
        x, y = v.co.x, v.co.y
        h = 3.6 * math.exp(-((x + 4) ** 2) / 230 - ((y - 4) ** 2) / 140)
        h += 1.6 * math.exp(-((x - 18) ** 2) / 160 - ((y - 16) ** 2) / 90)
        h += .15 * math.sin(x * .7) * math.cos(y * .5)
        v.co.z = h
    for p in g.data.polygons:
        p.use_smooth = True
    m = bpy.data.materials.new("Grass"); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    noise = nt.nodes.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 3.0
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.03, 0.30, 0.02, 1)
    ramp.color_ramp.elements[1].color = (0.16, 0.62, 0.03, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = .85
    g.data.materials.append(m)
    sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
    sun.data.energy = 4.5; sun.data.color = (1, .97, .9)
    sun.rotation_euler = (math.radians(62), math.radians(-30), math.radians(25))
    sc.collection.objects.link(sun)
    world = bpy.data.worlds.new("W"); sc.world = world; world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (.45, .62, .95, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = .8
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam")); cam.data.lens = 35
    cam.location = (0, -38, 1.2); cam.rotation_euler = (math.radians(90.5), 0, 0)
    sc.collection.objects.link(cam); sc.camera = cam
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def hill():
    tmp = os.path.join(OUT, "_hill.png")
    hill_render(tmp)
    s = sky().convert("RGBA")
    s.alpha_composite(Image.open(tmp).convert("RGBA"))
    s.convert("RGB").save(os.path.join(OUT, "wall_hill.jpg"), quality=86, optimize=True, progressive=True)
    os.remove(tmp)
    print("wall_hill.jpg")


def aqua():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=(int(8 + 20 * t), int(50 + 70 * t), int(140 + 90 * t)))
    glow = Image.new("L", (W, H), 0); gd = ImageDraw.Draw(glow)
    for k, (amp, off, wdt, a) in enumerate([(260, 760, 120, 170), (200, 900, 70, 230), (320, 640, 200, 90), (150, 1040, 40, 200)]):
        pts = [(x, off + amp * math.sin(x / 520 + k) + 60 * math.sin(x / 190 + k * 2)) for x in range(-40, W + 40, 8)]
        for i in range(len(pts) - 1):
            gd.line([pts[i], pts[i + 1]], fill=a, width=wdt)
    glow = glow.filter(ImageFilter.GaussianBlur(55))
    light = Image.new("RGB", (W, H), (170, 225, 255))
    img = Image.composite(light, img, glow)
    img.save(os.path.join(OUT, "wall_aqua.jpg"), quality=86, optimize=True, progressive=True)
    print("wall_aqua.jpg")


if __name__ == "__main__":
    aqua()
    hill()
