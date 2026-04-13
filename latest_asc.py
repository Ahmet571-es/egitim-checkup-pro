import requests, re, json
with open('yeni_ozellikler.py','r',encoding='utf-8') as f: src=f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SID = "sesn_011CZxezbngsD76tuntFdn6J"
H = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01","anthropic-beta": "managed-agents-2026-04-01"}
# Get all events in asc and check for any message events or latest tool results
r = requests.get(f"https://api.anthropic.com/v1/sessions/{SID}/events",
                 headers=H, params={"limit": 1000, "order": "desc"}, timeout=30)
d = r.json()
evs = d.get('data', [])
print(f"total={len(evs)}")
# Find latest tool_result with actual content
for e in evs[:50]:
    t = e.get('type','')
    pa = e.get('processed_at','')[:19]
    if t == 'agent.tool_result':
        ct = e.get('content',[])
        tx = ''
        if ct and isinstance(ct[0], dict):
            tx = str(ct[0].get('text',''))
        if tx.strip():
            print(f"[{pa}] RESULT: {tx[:200]}")
            break
# Also find latest tool_use
for e in evs[:50]:
    t = e.get('type','')
    pa = e.get('processed_at','')[:19]
    if t == 'agent.tool_use':
        n = e.get('name','')
        i = e.get('input',{})
        c = str(i.get('command') or i.get('file_path') or i)[:200]
        print(f"[{pa}] TOOL {n}: {c}")
        break
# Any messages recently?
print("---messages last 10---")
msg_count = 0
for e in evs:
    if e.get('type') == 'agent.message':
        ct = e.get('content', [])
        if ct and isinstance(ct[0], dict):
            pa = e.get('processed_at','')[:19]
            print(f"[{pa}] {str(ct[0].get('text',''))[:120]}")
            msg_count += 1
            if msg_count >= 10: break
