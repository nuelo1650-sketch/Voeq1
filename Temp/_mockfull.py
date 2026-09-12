import io, re
s = io.open('money-bag/mocks/explore-v1.html', encoding='utf-8').read()
css = "\n".join(re.findall(r'<style[^>]*>(.*?)</style>', s, re.S))
# print every rule for the card/rail/grid family, base + inside media queries
sels = ['grid2','gcard','gimg','gbody','gtitle','gprice','gmeta','mini-rate','gtag','rail','bigcard','stage-card','sec','sec-head','sec-title','sec-link','drops','dots','imgcount','cat','thin','grow']
for sel in sels:
    for m in re.finditer(r'(?:^|[\s,}])\.' + re.escape(sel) + r'\s*\{([^}]*)\}', css, re.M):
        print(f'.{sel} {{', ' '.join(m.group(1).split()), '}}')
# media blocks
for m in re.finditer(r'@media([^{]*)\{', css):
    q = m.group(1).strip(); i = m.end(); depth = 1
    while i < len(css) and depth:
        if css[i]=='{': depth+=1
        elif css[i]=='}': depth-=1
        i+=1
    blk = css[m.end():i-1]
    for mm in re.finditer(r'([^{}]+)\{([^}]*)\}', blk):
        sel = mm.group(1).strip()
        if any(k in sel for k in ['grid2','gcard','gimg','rail','bigcard','stage-card','drops','hero','spot','door','pick','cat-grid','tcard','hs-card','sec']):
            print(f'@media {q} :: {sel} {{', ' '.join(mm.group(2).split()), '}}')
