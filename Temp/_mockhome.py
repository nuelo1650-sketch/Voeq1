import io, re
s = io.open('money-bag/mocks/home-v7.html', encoding='utf-8').read()
css = "\n".join(re.findall(r'<style[^>]*>(.*?)</style>', s, re.S))
for m in re.finditer(r'@media([^{]*)\{', css):
    q = m.group(1).strip(); i = m.end(); depth = 1
    while i < len(css) and depth:
        if css[i]=='{': depth+=1
        elif css[i]=='}': depth-=1
        i+=1
    blk = css[m.end():i-1]
    for mm in re.finditer(r'([^{}]+)\{([^}]*)\}', blk):
        sel = mm.group(1).strip()
        if any(k in sel for k in ['hero','spot','door','grid2','gcard','rail','vp-','split','trust','collage','pol','area','band']):
            print(f'@media {q} :: {sel} {{', ' '.join(mm.group(2).split())[:150], '}}')
print('--- base hero/spot/door ---')
for sel in ['hero','spot-stage','spot','door','collage','pol','vp-grid','vp-steps','split']:
    for m in re.finditer(r'(?:^|[\s,}])\.' + re.escape(sel) + r'[^{]*\{([^}]*)\}', css, re.M):
        print(f'.{sel} {{', ' '.join(m.group(1).split())[:150], '}}')
