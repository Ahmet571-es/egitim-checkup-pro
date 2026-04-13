import requests, json, re

with open('yeni_ozellikler.py', 'r', encoding='utf-8') as f:
    src = f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SESSION_ID = "sesn_011CZxezbngsD76tuntFdn6J"
HEADERS = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01",
           "anthropic-beta": "managed-agents-2026-04-01"}

all_events = []
cursor = None
pages = 0
while pages < 20:
    params = {"limit": 100}
    if cursor:
        params["after_id"] = cursor
    r = requests.get(f"https://api.anthropic.com/v1/sessions/{SESSION_ID}/events",
                     headers=HEADERS, params=params, timeout=30)
    d = r.json()
    evs = d.get('data', [])
    if not evs:
        break
    all_events.extend(evs)
    cursor = evs[-1].get('id')
    pages += 1
    if not d.get('has_more') and len(evs) < 100:
        break

print(f"Total events: {len(all_events)}, pages: {pages}")
print("=== LAST 20 events ===")
for e in all_events[-20:]:
    t = e.get('type','?')
    pa = e.get('processed_at','')[:19]
    if t == 'agent.tool_use':
        name = e.get('name','')
        inp = e.get('input',{})
        cmd = str(inp.get('command') or inp.get('file_path') or inp.get('path') or inp)[:120]
        print(f"  [{pa}] TOOL {name}: {cmd}")
    elif t == 'agent.tool_result':
        content = e.get('content',[])
        text = ''
        if content and isinstance(content, list) and content:
            text = str(content[0].get('text',''))[:120] if isinstance(content[0], dict) else str(content[0])[:120]
        err = e.get('is_error', False)
        print(f"  [{pa}] RESULT {'ERR' if err else 'OK'}: {text}")
    elif t == 'agent.message':
        content = e.get('content',[])
        txt = ''
        if content and isinstance(content, list) and content:
            txt = str(content[0].get('text',''))[:150] if isinstance(content[0], dict) else ''
        print(f"  [{pa}] MSG: {txt}")
    elif t.startswith('session.'):
        print(f"  [{pa}] {t}")
    else:
        print(f"  [{pa}] {t}")
