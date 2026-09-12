import io, re
s = io.open('money-bag/mocks/home-v7.html', encoding='utf-8').read()
css = "\n".join(re.findall(r'<style[^>]*>(.*?)</style>', s, re.S))
print("=== ALL RULES mentioning grid/card/jostle/tilt ===")
for m in re.finditer(r'([^{}]+)\{([^}]*)\}', css):
    sel, body = m.group(1).strip(), ' '.join(m.group(2).split())
    if any(k in sel for k in ['.grid','.card','.gcard','.gimg','.gbody','.jostle','.tilt','.pol','.rail','.bigcard','.stage','.showcase','.mini']):
        print(sel, '{', body[:160], '}')
# media
print("=== MEDIA with grid/card ===")
for m in re.finditer(r'@media([^{]*)\{', css):
    q=m.group(1).strip(); i=m.end(); d=1
    while i<len(css) and d:
        if css[i]=='{':d+=1
        elif css[i]=='}':d-=1
        i+=1
    blk=css[m.end():i-1]
    for mm in re.finditer(r'([^{}]+)\{([^}]*)\}',blk):
        sel, body = mm.group(1).strip(), ' '.join(mm.group(2).split())
        if any(k in sel for k in ['.grid','.card','.gcard','.rail','.bigcard','.jostle','.tilt']):
            print(f'@{q} :: {sel} {{ {body[:150]} }}')
