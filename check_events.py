import requests, json, re

with open('yeni_ozellikler.py', 'r', encoding='utf-8') as f:
    src = f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SESSION_ID = "sesn_011CZxezbngsD76tuntFdn6J"
HEADERS = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01",
           "anthropic-beta": "managed-agents-2026-04-01"}

# Try listing events
r = requests.get(f"https://api.anthropic.com/v1/sessions/{SESSION_ID}/events",
                 headers=HEADERS, params={"limit": 20}, timeout=20)
print(f"GET events status: {r.status_code}")
ct = r.headers.get('content-type','')
print(f"content-type: {ct}")
if 'json' in ct:
    data = r.json()
    if 'data' in data:
        for e in data['data'][:20]:
            print(f"  {e.get('type','?')}: {json.dumps(e)[:200]}")
    else:
        print(json.dumps(data, indent=2)[:2000])
else:
    print(r.text[:2000])
