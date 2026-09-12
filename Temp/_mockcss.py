import io, re
s = io.open('money-bag/mocks/explore-v1.html', encoding='utf-8').read()
css = "\n".join(re.findall(r'<style[^>]*>(.*?)</style>', s, re.S))
for sel in ['.grid', '.gcard', '.gimg', '.gbody', '.gprice', '.gmeta', '.gtitle', '.mini-rate', '.gtag']:
    for m in re.finditer(re.escape(sel) + r'\s*\{([^}]*)\}', css):
        body = ' '.join(m.group(1).split())
        print(sel, '{', body[:170], '}')
# media queries touching grid/gcard
for m in re.finditer(r'@media[^{]*\{([^@]*?)\}\s*(?:@|$)', css):
    blk = m.group(1)
    if 'grid' in blk or 'gcard' in blk:
        print('MEDIA:', ' '.join(blk.split())[:260])
