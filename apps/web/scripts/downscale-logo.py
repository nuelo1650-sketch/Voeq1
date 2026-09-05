"""Downscale Logo.png 1200x -> 240px wide (mask asset renders at 94px; 240px
covers 2x-DPR phones with headroom). Keeps RGBA alpha (it's a CSS mask source).
Overwrites in place after verifying output, prints before/after."""
from PIL import Image
import os

PATH = "apps/web/public/Logo.png"
TARGET_W = 240

im = Image.open(PATH)
before = os.path.getsize(PATH)
print("before:", im.size, im.mode, f"{before // 1024}KB")

w, h = im.size
target_h = round(h * TARGET_W / w)
out = im.resize((TARGET_W, target_h), Image.LANCZOS)

tmp = PATH + ".tmp.png"
out.save(tmp, optimize=True)
after = os.path.getsize(tmp)
print("after:", out.size, f"{after // 1024}KB ({100 - after * 100 // before}% smaller)")

if after < before:
    os.replace(tmp, PATH)
    print("replaced")
else:
    os.remove(tmp)
    print("KEPT ORIGINAL (resize did not shrink)")
