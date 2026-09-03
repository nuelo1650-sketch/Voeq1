#!/bin/bash
# AUDIT ROUND 2 (leaf A) harness — regression verification of the 9 fixes.
# Repo-local temp files only (Windows/MSYS: /tmp is unreliable). One script =
# one process store (next dev hot-reload wipes in-memory stores on recompile).
set -u
B="http://localhost:3030"
D="C:/Users/Legacy/Documents/voeq/_audit2"; mkdir -p "$D"
VENDOR="3647302d-a59a-404d-aa45-8d0f33eff748"

code() { curl -s -o "$2" -w '%{http_code}' -m 150 "${@:3}" "$1"; }

echo "== WARM compile (pages+routes) =="
curl -s -o /dev/null -m 180 "$B/" -w 'root %{http_code}\n'
curl -s -o /dev/null -m 120 "$B/login" -w 'login %{http_code}\n'
curl -s -o "$D/howitworks.html" -m 120 "$B/how-it-works" -w 'how-it-works %{http_code}\n'
curl -s -o /dev/null -m 120 "$B/signup" -w 'signup %{http_code}\n'
curl -s -o /dev/null -m 120 "$B/forgot-password" -w 'forgot-password %{http_code}\n'
curl -s -o /dev/null -m 120 "$B/consent" -w 'consent %{http_code}\n'
curl -s -o /dev/null -m 120 "$B/api/explore?query=x" -w 'explore %{http_code}\n'
curl -s -o /dev/null -m 120 "$B/api/auth/status" -w 'auth-status %{http_code}\n'
curl -s -o /dev/null -m 120 "$B/api/staff/cases" -w 'staff-cases(anon) %{http_code}\n'
curl -s -o /dev/null -m 120 "$B/onboarding/vendor" -w 'onboarding-vendor(anon) %{http_code}\n'

echo "== SESSIONS =="
curl -s -D "$D/v.hdr" -o "$D/v.json" -m 60 -X POST "$B/api/dev/vendor-session" -H 'Content-Type: application/json' -d "{\"vendorId\":\"$VENDOR\"}"
curl -s -D "$D/s.hdr" -o "$D/s.json" -m 60 -X POST "$B/api/dev/shopper-session" -H 'Content-Type: application/json' -d '{}'
curl -s -D "$D/a.hdr" -o "$D/a.json" -m 60 -X POST "$B/api/dev/admin-session" -H 'Content-Type: application/json' -d '{}'
SID_V=$(grep -i '^set-cookie: sessionId=' "$D/v.hdr" | sed 's/.*sessionId=//;s/;.*//' | tr -d '\r')
SID_S=$(grep -i '^set-cookie: sessionId=' "$D/s.hdr" | sed 's/.*sessionId=//;s/;.*//' | tr -d '\r')
SID_A=$(grep -i '^set-cookie: sessionId=' "$D/a.hdr" | sed 's/.*sessionId=//;s/;.*//' | tr -d '\r')
echo "SIDs: V=${SID_V:0:8}.. S=${SID_S:0:8}.. A=${SID_A:0:8}.."

echo "== F2 live: explore vendor-name search =="
curl -s -D "$D/f2.hdr" -o "$D/f2.json" -m 120 "$B/api/explore?query=Glam" -w 'f2 fetch %{http_code}\n'

echo "== F3 live: vendor self-report on own listing =="
# find jollof listing id owned by $VENDOR
LISTING_ID=$(curl -s -m 120 "$B/api/explore" | python -c "import sys,json;d=json.load(sys.stdin);print([x['id'] for x in d['data'] if x['vendorId']=='$VENDOR'][0])" 2>/dev/null)
echo "listing id: $LISTING_ID"
curl -s -o "$D/f3.json" -w 'f3 %{http_code}\n' -m 120 -X POST "$B/api/reports" -H "Cookie: sessionId=$SID_V" -H 'Content-Type: application/json' -d "{\"targetType\":\"listing\",\"targetId\":\"$LISTING_ID\",\"category\":\"scam\",\"body\":\"self-report attempt\"}"

echo "== F9 live: message-report invalid category =="
curl -s -o "$D/f9a.json" -w 'f9 conv-create %{http_code}\n' -m 120 -X POST "$B/api/conversations" -H "Cookie: sessionId=$SID_S" -H 'Content-Type: application/json' -d "{\"vendorId\":\"$VENDOR\"}"
CONV=$(python -c "import json;print(json.load(open('$D/f9a.json')).get('conversation',{}).get('id',''))" 2>/dev/null)
echo "conv: $CONV"
curl -s -o "$D/f9b.json" -w 'f9 msg-send %{http_code}\n' -m 120 -X POST "$B/api/conversations/$CONV/messages" -H "Cookie: sessionId=$SID_S" -H 'Content-Type: application/json' -d '{"body":"hello audit"}'
MSGID=$(python -c "import json;print(json.load(open('$D/f9b.json')).get('message',{}).get('id','') or json.load(open('$D/f9b.json')).get('sentMessage',{}).get('id',''))" 2>/dev/null)
echo "msg: $MSGID"
curl -s -o "$D/f9c.json" -w 'f9 bad-category %{http_code}\n' -m 120 -X POST "$B/api/messages/report" -H "Cookie: sessionId=$SID_S" -H 'Content-Type: application/json' -d "{\"messageId\":\"$MSGID\",\"category\":\"banana\"}"
curl -s -o "$D/f9d.json" -w 'f9 good-category %{http_code}\n' -m 120 -X POST "$B/api/messages/report" -H "Cookie: sessionId=$SID_S" -H 'Content-Type: application/json' -d "{\"messageId\":\"$MSGID\",\"category\":\"scam\",\"body\":\"test report\"}"

echo "== F5 live: shopper report -> staff case payload+createdAt =="
curl -s -o "$D/f5a.json" -w 'f5 report %{http_code}\n' -m 120 -X POST "$B/api/reports" -H "Cookie: sessionId=$SID_S" -H 'Content-Type: application/json' -d "{\"targetType\":\"vendor\",\"targetId\":\"$VENDOR\",\"category\":\"scam\",\"body\":\"audit round2: verify payload+createdAt\"}"
curl -s -o "$D/f5b.json" -w 'f5 list-queue=reports %{http_code}\n' -m 120 "$B/api/staff/cases?queue=reports" -H "Cookie: sessionId=$SID_A"

echo "== F7 live: triage via listCases('') — assign case =="
CASEID=$(python -c "import json;d=json.load(open('$D/f5b.json'));print([c['id'] for c in d.get('cases',[]) if c.get('queue')=='reports'][-1])" 2>/dev/null)
echo "case: $CASEID"
curl -s -o "$D/f7a.json" -w 'f7 assign %{http_code}\n' -m 120 -X POST "$B/api/staff/cases" -H "Cookie: sessionId=$SID_A" -H 'Content-Type: application/json' -d "{\"caseId\":\"$CASEID\",\"action\":\"assign\"}"

echo "== F4 live: image upload size measured server-side (bytes:1, 6.5MB dataUrl) =="
python - "$D/big.json" <<'PYEOF'
import sys, base64, json
b64 = base64.b64encode(b'\x00' * 6500000).decode()
json.dump({"fileName":"big.png","context":"listing_photo","bytes":1,"dataUrl":"data:image/png;base64,"+b64}, open(sys.argv[1],"w"))
PYEOF
curl -s -o "$D/f4.json" -w 'f4 oversized %{http_code}\n' -m 180 -X POST "$B/api/images/upload" -H "Cookie: sessionId=$SID_S" -H 'Content-Type: application/json' --data-binary "@$D/big.json"

echo "== F6 live: go-live creates verifications case =="
curl -s -o "$D/f6a.json" -w 'f6 go-live %{http_code}\n' -m 120 -X POST "$B/api/vendor/go-live" -H "Cookie: sessionId=$SID_V" -H 'Content-Type: application/json' -d '{}'
curl -s -o "$D/f6b.json" -w 'f6 list-verifications %{http_code}\n' -m 120 "$B/api/staff/cases?queue=verifications" -H "Cookie: sessionId=$SID_A"

echo "== F8 live: how-it-works CTA =="
grep -o 'href="/signup"' "$D/howitworks.html" | head -3
grep -o 'href="/login[^"]*"' "$D/howitworks.html" | head -3
echo "== done =="
