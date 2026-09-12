import io, re
# ACTUAL built card: MbCard.tsx + its CSS (mb-gcard) + ExploreMB grid
mb = io.open('apps/web/components/explore/mb/MbCard.tsx', encoding='utf-8').read()
css = io.open('apps/web/app/mb-explore.css', encoding='utf-8').read()
print("=== MbCard inline styles (key lines) ===")
for l in mb.split("\n"):
    if any(k in l for k in ["aspectRatio", "borderRadius", "fontSize", "padding", "minWidth", "grid"]):
        print(" ", l.strip()[:120])
print("=== .mb-gcard / grid CSS ===")
for m in re.finditer(r'\.(mb-gcard|mb-grid|mb-g[a-z]*)\s*\{([^}]*)\}', css):
    print(m.group(1), '{', ' '.join(m.group(2).split())[:160], '}')
for m in re.finditer(r'@media[^{]*\{([^@]*?)\}\s*(?:@|$)', css):
    blk = m.group(1)
    if 'mb-grid' in blk or 'mb-gcard' in blk:
        print('MEDIA:', ' '.join(blk.split())[:240])
print("=== ExploreMB grid container ===")
ex = io.open('apps/web/components/explore/mb/ExploreMB.tsx', encoding='utf-8').read()
i = ex.find('mb-grid')
print(ex[max(0,i-200):i+300])
