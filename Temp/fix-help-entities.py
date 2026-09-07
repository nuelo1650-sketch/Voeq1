import re

p = "apps/web/app/help/page.tsx"
s = open(p, encoding="utf-8").read()

# q:/a: literals are single-quoted JS strings containing &apos; entities.
# Replace entity with a real apostrophe; re-quote with double quotes when the
# body contains an apostrophe (legal JS, renders correctly).
def fix(m, key):
    indent, body = m.group(1), m.group(2)
    body = body.replace("&apos;", "'")
    if "'" in body:
        # preserve EXISTING \" escapes; only escape raw " (none expected, but
        # belt-and-braces: sentinel round-trip).
        body = body.replace('\\"', "\x00").replace('"', '\\"').replace("\x00", '\\"')
        return f'{indent}{key}: "{body}",'
    return f"{indent}{key}: '{body}',"

s = re.sub(r"( *)q: '((?:[^']|&apos;)*)',?", lambda m: fix(m, "q"), s)
s = re.sub(r"( *)a: '((?:[^']|&apos;)*)',?", lambda m: fix(m, "a"), s)
open(p, "w", encoding="utf-8").write(s)
print("remaining &apos;:", s.count("&apos;"))
