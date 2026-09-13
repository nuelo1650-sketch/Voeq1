import io
from PIL import Image, ImageDraw, ImageFont

# OG default image: forest field, cream voeq wordmark, one amber rule.
im = Image.new("RGB", (1200, 630), (15, 42, 29))
logo = Image.open("apps/web/public/Logo.png").convert("RGBA")
# tint the alpha mask cream
mask = logo.getchannel("A")
cream = Image.new("RGBA", logo.size, (246, 241, 230, 255))
im.paste(cream, (0, 0), mask) if False else None
lw, lh = logo.size
scale = 460 / lw
lg = logo.resize((460, int(lh * scale)), Image.LANCZOS)
tinted = Image.new("RGBA", lg.size, (246, 241, 230, 255))
tinted.putalpha(lg.getchannel("A"))
px, py = (1200 - lg.size[0]) // 2, 250 - lg.size[1] // 2
im.paste(tinted, (px, py), tinted)
d = ImageDraw.Draw(im)
d.rectangle([585, 355, 615, 358], fill=(232, 163, 61))
try:
    f = ImageFont.truetype("arial.ttf", 34)
    txt = "Find it. Chat it. Get it."
    tw = d.textlength(txt, font=f)
    d.text(((1200 - tw) / 2, 392), txt, font=f, fill=(246, 241, 230))
except Exception as e:
    print("font fallback:", e)
    d.text((430, 392), "Find it. Chat it. Get it.", fill=(246, 241, 230))
im.save("apps/web/public/og-voeq.png", optimize=True)
import os
print("saved", os.path.getsize("apps/web/public/og-voeq.png") // 1024, "KB")
