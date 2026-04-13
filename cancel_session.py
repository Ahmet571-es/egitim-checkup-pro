import requests, re, json
with open('yeni_ozellikler.py','r',encoding='utf-8') as f: src=f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SID = "sesn_011CZxezbngsD76tuntFdn6J"
H = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01",
     "anthropic-beta": "managed-agents-2026-04-01","content-type": "application/json"}

# Try cancel endpoint
for method in ['POST', 'DELETE']:
    for path in [f'sessions/{SID}/cancel', f'sessions/{SID}']:
        r = requests.request(method, f"https://api.anthropic.com/v1/{path}", headers=H, timeout=20)
        print(f"{method} /{path}: {r.status_code} {r.text[:200]}")
