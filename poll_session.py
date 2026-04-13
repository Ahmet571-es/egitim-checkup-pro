import requests, json, sys, time, os, re

with open('yeni_ozellikler.py', 'r', encoding='utf-8') as f:
    src = f.read()
m = re.search(r'API_KEY = "([^"]+)"', src)
API_KEY = m.group(1)

SESSION_ID = "sesn_011CZxezbngsD76tuntFdn6J"
BASE = "https://api.anthropic.com/v1"
HEADERS = {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "managed-agents-2026-04-01",
    "content-type": "application/json",
}

r = requests.get(f"{BASE}/sessions/{SESSION_ID}", headers=HEADERS, timeout=20)
print(f"STATUS: {r.status_code}")
try:
    data = r.json()
    print(json.dumps(data, indent=2)[:3000])
except Exception as e:
    print(r.text[:2000])
