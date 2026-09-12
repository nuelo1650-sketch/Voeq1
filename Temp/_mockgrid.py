import io, re
# Compare mock vs actual for: explore grid, rails, landing showcase cards
mock = io.open('money-bag/mocks/explore-v1.html', encoding='utf-8').read()
css = "\n".join(re.findall(r'<style[^>]*>(.*?)</style>', mock, re.S))
# find the grid container rule
for m in re.finditer(r'\.grid\s*\{([^}]*)\}', css):
    print('MOCK .grid {', ' '.join(m.group(1).split()), '}')
# rails
for m in re.finditer(r'\.(rail|track|drops)\s*\{([^}]*)\}', css):
    print('MOCK .'+m.group(1), '{', ' '.join(m.group(2).split())[:140], '}')
# desktop media for grid
for m in re.finditer(r'@media[^{]*\{([^@]*?)\}\s*(?:@|$)', css):
    blk = m.group(1)
    if '.grid' in blk:
        g = re.search(r'\.grid\s*\{([^}]*)\}', blk)
        print('MOCK MEDIA grid:', ' '.join(g.group(1).split()) if g else '?', '| query:', blk.split('{')[0][:40])
