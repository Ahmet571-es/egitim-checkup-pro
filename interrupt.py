import requests, re, json
with open('yeni_ozellikler.py','r',encoding='utf-8') as f: src=f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SID = "sesn_011CZxezbngsD76tuntFdn6J"
H = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01",
     "anthropic-beta": "managed-agents-2026-04-01","content-type": "application/json"}

# Send interrupt event
for body in [
    {"events":[{"type":"session.interrupt"}]},
    {"events":[{"type":"user.interrupt"}]},
    {"events":[{"type":"interrupt"}]},
]:
    r = requests.post(f"https://api.anthropic.com/v1/sessions/{SID}/events", headers=H, json=body, timeout=20)
    print(f"{body['events'][0]['type']}: {r.status_code} {r.text[:250]}")
