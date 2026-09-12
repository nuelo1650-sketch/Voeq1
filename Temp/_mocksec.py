import io, re
s = io.open('money-bag/mocks/explore-v1.html', encoding='utf-8').read()
# which sections use bigcard vs stage-card vs rail
for sec in ['Fresh drops', 'Live shelf', 'Trending', 'Under', 'grid today']:
    i = s.find(sec)
    if i < 0: continue
    blk = s[i:i+2600]
    cls = re.findall(r'class="([^"]+)"', blk)[:12]
    print(f'== {sec}:', ' | '.join(cls[:10]))
