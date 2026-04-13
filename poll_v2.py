import requests, re, json
with open('yeni_ozellikler.py','r',encoding='utf-8') as f: src=f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SID = "sesn_011CZxhzRxwV2yAFZb2cHFG6"
H = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01","anthropic-beta": "managed-agents-2026-04-01"}

r = requests.get(f"https://api.anthropic.com/v1/sessions/{SID}", headers=H, timeout=20)
d = r.json()
print(f"status={d.get('status')} dur={d.get('stats',{}).get('duration_seconds',0):.1f}s active={d.get('stats',{}).get('active_seconds',0):.1f}s updated={d.get('updated_at','')[:19]}")

r = requests.get(f"https://api.anthropic.com/v1/sessions/{SID}/events",
                 headers=H, params={"limit": 30, "order": "desc"}, timeout=30)
evs = r.json().get('data', [])
for e in reversed(evs[:15]):
    t = e.get('type','?'); pa = e.get('processed_at','')[:19]
    if t=='agent.tool_use':
        n=e.get('name',''); i=e.get('input',{})
        c = str(i.get('command') or i.get('file_path') or i.get('path') or i)[:110]
        print(f"  {pa} TOOL {n}: {c}")
    elif t=='agent.tool_result':
        ct=e.get('content',[])
        tx=''
        if ct and isinstance(ct,list) and ct: tx=str(ct[0].get('text',''))[:110] if isinstance(ct[0],dict) else str(ct[0])[:110]
        err=e.get('is_error',False)
        print(f"  {pa} RES {'E' if err else 'O'}: {tx}")
    elif t=='agent.message':
        ct=e.get('content',[]); tx=''
        if ct and isinstance(ct,list) and ct: tx=str(ct[0].get('text',''))[:140] if isinstance(ct[0],dict) else ''
        print(f"  {pa} MSG: {tx}")
