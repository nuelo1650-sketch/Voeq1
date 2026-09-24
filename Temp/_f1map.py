"""Map every layer of the F1 non-campus chain."""
import io, re
s = io.open('packages/db/src/schema.ts', encoding='utf-8').read()
i = s.find('export const areas = pgTable')
print("AREAS TABLE:\n", s[i:i+520], "\n")
r = io.open('packages/db/src/repos.ts', encoding='utf-8').read()
for mm in re.finditer(r'\.set\(\{([^}]*)\}\)', r):
    body = ' '.join(mm.group(1).split())
    if 'campus' in body or 'areaId' in body or 'subArea' in body:
        print("VENDOR/LISTING SET:", body[:200], "\n")
h = io.open('apps/web/components/storefront/StorefrontHero.tsx', encoding='utf-8').read()
print("hero areaId refs:", h.count('areaId'), "| campus refs:", h.count('campus'))
st = io.open('apps/web/app/api/onboarding/vendor/step-2/route.ts', encoding='utf-8').read()
print("STEP2 mentions area?", 'area' in st.lower())
w = io.open('apps/web/app/onboarding/vendor/OnboardingWizard.tsx', encoding='utf-8').read()
print("wizard mentions Area?", 'Area' in w)
# does mockVendorRepo.patch pass through unknown keys?
q = io.open('packages/data/src/mock.ts', encoding='utf-8').read()
k = q.find('patch:')
print("\nMOCK PATCH:", ' '.join(q[k:k+260].split()))
