import requests, re
with open('yeni_ozellikler.py','r',encoding='utf-8') as f: src=f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SID = "sesn_011CZxezbngsD76tuntFdn6J"
H = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01","anthropic-beta": "managed-agents-2026-04-01"}
# Get max limit to see most recent events
for lim in [500, 200, 100]:
    r = requests.get(f"https://api.anthropic.com/v1/sessions/{SID}/events",
                     headers=H, params={"limit": lim, "order": "desc"}, timeout=30)
    if r.status_code == 200:
        d = r.json()
        evs = d.get('data',[])
        print(f"limit={lim}: got {len(evs)} events, newest={evs[0].get('processed_at','')[:19] if evs else 'none'}")
        if len(evs) > 0:
            for e in evs[:3]:
                t = e.get('type','')
                pa = e.get('processed_at','')[:19]
                desc = ''
                if t == 'agent.tool_use':
                    n=e.get('name','')
                    i=e.get('input',{})
                    desc = f"{n}: {str(i.get('command') or i)[:150]}"
                elif t == 'agent.tool_result':
                    ct=e.get('content',[])
                    tx = str(ct[0].get('text',''))[:150] if ct and isinstance(ct[0],dict) else ''
                    desc = f"{'ERR' if e.get('is_error') else 'OK'}: {tx}"
                elif t == 'agent.message':
                    ct=e.get('content',[])
                    tx = str(ct[0].get('text',''))[:200] if ct and isinstance(ct[0],dict) else ''
                    desc = f"MSG: {tx}"
                print(f"  [{pa}] {t} {desc}")
        break
    else:
        print(f"limit={lim}: status {r.status_code}")
