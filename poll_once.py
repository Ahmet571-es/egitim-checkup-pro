import requests, json, re, sys

with open('yeni_ozellikler.py', 'r', encoding='utf-8') as f:
    src = f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SESSION_ID = "sesn_011CZxezbngsD76tuntFdn6J"
HEADERS = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01",
           "anthropic-beta": "managed-agents-2026-04-01", "content-type": "application/json"}

r = requests.get(f"https://api.anthropic.com/v1/sessions/{SESSION_ID}", headers=HEADERS, timeout=20)
data = r.json()
print(f"status={data.get('status')} duration={data.get('stats',{}).get('duration_seconds',0):.1f}s in={data.get('usage',{}).get('input_tokens',0)} out={data.get('usage',{}).get('output_tokens',0)}")
