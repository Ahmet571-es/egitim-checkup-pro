import requests, json, re

with open('yeni_ozellikler.py', 'r', encoding='utf-8') as f:
    src = f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SESSION_ID = "sesn_011CZxezbngsD76tuntFdn6J"
HEADERS = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01",
           "anthropic-beta": "managed-agents-2026-04-01"}

# Paginate to get all events
all_events = []
params = {"limit": 100, "order": "desc"}
r = requests.get(f"https://api.anthropic.com/v1/sessions/{SESSION_ID}/events",
                 headers=HEADERS, params=params, timeout=30)
d = r.json()
events = d.get('data', [])
print(f"Total returned: {len(events)}, has_more: {d.get('has_more')}")
print("=== LATEST 15 events (newest first) ===")
for e in events[:15]:
    t = e.get('type','?')
    pa = e.get('processed_at','')[:19]
    if t == 'agent.tool_use':
        name = e.get('name','')
        inp = e.get('input',{})
        cmd = str(inp.get('command') or inp.get('path') or inp)[:150]
        print(f"  [{pa}] {t} ({name}): {cmd}")
    elif t == 'agent.tool_result':
        content = e.get('content',[])
        text = ''
        if content and isinstance(content, list):
            text = str(content[0].get('text',''))[:150] if isinstance(content[0], dict) else str(content[0])[:150]
        err = e.get('is_error', False)
        print(f"  [{pa}] {t} {'ERR' if err else 'OK'}: {text}")
    elif t in ('agent.thinking',):
        tx = str(e.get('content','') or e.get('text','') or '')[:150]
        print(f"  [{pa}] {t}: {tx}")
    elif t in ('agent.message',):
        content = e.get('content',[])
        txt = ''
        if content and isinstance(content, list):
            txt = str(content[0].get('text',''))[:200] if isinstance(content[0], dict) else ''
        print(f"  [{pa}] MSG: {txt}")
    else:
        print(f"  [{pa}] {t}")
