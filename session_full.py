import requests, re, json
with open('yeni_ozellikler.py','r',encoding='utf-8') as f: src=f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SID = "sesn_011CZxezbngsD76tuntFdn6J"
H = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01","anthropic-beta": "managed-agents-2026-04-01"}
r = requests.get(f"https://api.anthropic.com/v1/sessions/{SID}", headers=H, timeout=20)
d = r.json()
print(json.dumps({k:v for k,v in d.items() if k in ('status','stats','created_at','updated_at')}, indent=2))
