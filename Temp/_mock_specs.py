import io, re, glob

def css_of(path):
    s = io.open(path, encoding='utf-8').read()
    return "\n".join(re.findall(r'<style[^>]*>(.*?)</style>', s, re.S)), s

def media_blocks(css):
    # yield (query_or_None, block_text)
    out = []
    for m in re.finditer(r'@media([^{]*)\{', css):
        q = m.group(1).strip()
        # naive brace matching
        i = m.end(); depth = 1
        while i < len(css) and depth:
            if css[i] == '{': depth += 1
            elif css[i] == '}': depth -= 1
            i += 1
        out.append((q, css[m.end():i-1]))
    return out

for f in ['explore-v1', 'home-v7', 'live-page', 'trending-page', 'listing-v1', 'storefront-v1']:
    p = f'money-bag/mocks/{f}.html'
    try:
        css, html = css_of(p)
    except FileNotFoundError:
        print(f'== {f}: MISSING =='); continue
    print(f'\n===== {f} =====')
    # base grid/card rules
    for sel in [r'\.grid2', r'\.grid\b', r'\.gcard', r'\.gimg', r'\.rail', r'\.track\b', r'\.stage2', r'\.vs-grid', r'\.picks', r'\.board', r'\.hero-stage', r'\.xrail', r'\.gl', r'\.card\b']:
        for m in re.finditer(sel + r'\s*\{([^}]*)\}', css):
            body = ' '.join(m.group(1).split())
            if any(k in body for k in ['grid-template', 'flex', 'aspect', 'width', 'columns', 'overflow', 'scroll-snap']):
                print('  BASE', m.group(0).strip()[:150])
    for q, blk in media_blocks(css):
        hits = []
        for m in re.finditer(r'([.#][\w-]+[^{]*)\{([^}]*)\}', blk):
            sel, body = m.group(1).strip(), ' '.join(m.group(2).split())
            if any(k in body for k in ['grid-template', 'flex:0', 'aspect', 'repeat(']):
                hits.append(f'{sel}{{{body[:90]}}}')
        if hits:
            print(f'  @media {q}: ' + ' ;; '.join(hits[:6]))
    # section order (h2/sec titles)
    titles = re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.S)
    clean = [re.sub(r'<[^>]+>', '', t).strip().split('\n')[0][:44] for t in titles]
    print('  SECTIONS:', ' | '.join([c for c in clean if c][:14]))
