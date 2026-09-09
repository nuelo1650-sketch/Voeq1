"""Storefront v1.2 + listing honesty pass:
1. Banner caption comment (source = vendor's own cover photo upload)
2. Sold stat OUT -> 'On Voeq since' ; rating value -> em-dash (honest until volume)
3. Reviews block: no aggregate 4.9 + no bars -> texts + replies only, scores unlock at 50 reviews
4. Pills labeled as computed from vendor's listings
5. Footer REMOVED from storefront (founder: footer only on landing/public info pages)
6. Listing: rating pill out, sold stat out
"""
import io

p = r"C:\Users\Legacy\Documents\voeq\money-bag\mocks\storefront-v1.html"
s = io.open(p, encoding="utf-8").read()

# 1. banner source comment
s = s.replace('<img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1400&q=74" alt="" loading="lazy">',
              '<!-- banner = vendor.photos.cover (uploaded by the vendor, like a profile header) -->\n    <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1400&q=74" alt="" loading="lazy">')

# 2. statbar honesty
s = s.replace('<div class="st"><b>212</b><small>Sold</small></div>',
              '<div class="st"><b>2026</b><small>On Voeq since</small></div>')
s = s.replace('<div class="st"><b class="mono">4.9</b><small>Rating</small></div>',
              '<div class="st"><b class="mono">\u2014</b><small>Rating</small></div>')

# 3. reviews: replace whole section (no aggregate, no bars)
rv_start = s.index('  <!-- REVIEWS')
rv_end = s.index('<footer>')
new_reviews = """  <!-- REVIEWS - honest: no aggregate score until volume; show texts + replies -->
  <section class="reviews">
    <div class="rv-head" style="margin-bottom:8px">
      <h2 class="sec-title display" style="font-size:1.2rem">What buyers say<span class="thin">132 reviews \u00b7 scores unlock after 50 reviews \u2014 keeps ratings honest</span></h2>
    </div>
    <div class="rv-row">
      <span class="cm-av">A</span>
      <div class="cm-body">
        <div class="cm-meta"><b>Adaeze</b><span class="cm-t">2d</span><span class="stars">\u2605\u2605\u2605\u2605\u2605</span></div>
        <p>Ordered twice already \u2014 the portion is honest and it arrives hot. 10/10.</p>
        <div class="rv-reply"><span class="rv-reply-name">Mama Tuli</span><p>Thank you! Tomorrow's pots are on by 3pm.</p></div>
      </div>
    </div>
    <div class="rv-row">
      <span class="cm-av">F</span>
      <div class="cm-body">
        <div class="cm-meta"><b>Fortune</b><span class="cm-t">1w</span><span class="stars">\u2605\u2605\u2605\u2605\u2605</span></div>
        <p>The jollof tastes like a Sunday afternoon at home. Delivery was 20 minutes early.</p>
      </div>
    </div>
    <a class="cm-all" href="#" style="display:block;text-align:center;font-size:.78rem;font-weight:700;color:var(--amber-dark);padding:12px 0 2px">All 132 reviews</a>
  </section>

"""
s = s[:rv_start] + new_reviews + s[rv_end:]

# 4. pills source comment
s = s.replace('<div class="pills">',
              '<!-- pills = the vendor\'s active listing categories (computed from their listings) -->\n    <div class="pills">', 1)

# 5. footer out
f_start = s.index('<footer>')
f_end = s.index('</footer>') + len('</footer>')
s = s[:f_start] + s[f_end:]

io.open(p, "w", encoding="utf-8").write(s)
print("storefront v1.2 done")

# ============ LISTING honesty pass ============
p2 = r"C:\Users\Legacy\Documents\voeq\money-bag\mocks\listing-v1.html"
s2 = io.open(p2, encoding="utf-8").read()
s2 = s2.replace('<span class="rate-pill">\u2605 4.9 <span style="font-weight:600;color:var(--ink-subtle)">(132)</span></span>', '')
s2 = s2.replace('<span class="vm">\U0001F6CD <b>212</b> sold</span>', '<span class="vm">\U0001F4C5 <b>2026</b> on Voeq</span>')
# also '212 sold' variant with different emoji
import re
s2 = re.sub(r'<span class="vm">[^<]*<b>212</b> sold</span>', '<span class="vm">\U0001F4C5 <b>2026</b> on Voeq</span>', s2)
io.open(p2, "w", encoding="utf-8").write(s2)
print("listing honesty pass done")
