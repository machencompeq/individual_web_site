"""產生 CRT 螢幕上的終端機畫面貼圖（3d/screen.png），給 Blender 渲染用。需要 Pillow。"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1040, 768
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
lines = [
    ("$ whoami", 1), ("ming-an.chen  // CSIE x IM", 0), ("", 0),
    ("$ cat skills.txt", 1), ("C/C++  Java  Verilog  HTML/CSS", 0), ("", 0),
    ("$ ./run --motto", 1), ("> the fire inside lasts longer", 0), ("> than any storm.", 0), ("", 0),
    ("$ _", 1),
]
img = Image.new("RGB", (W, H), (20, 9, 0))
d = ImageDraw.Draw(img)
f = ImageFont.truetype(FONT, 46)
y = 50
for t, cmd in lines:
    d.text((54, y), t, font=f, fill=(255, 176, 0) if cmd else (255, 214, 150))
    y += 62
glow = img.filter(ImageFilter.GaussianBlur(6))
img = Image.blend(img, glow, 0.35)
d = ImageDraw.Draw(img)
for yy in range(0, H, 4):
    d.line([(0, yy), (W, yy)], fill=(10, 4, 0))
img.save(os.path.join(HERE, "screen.png"))
print("ok")
