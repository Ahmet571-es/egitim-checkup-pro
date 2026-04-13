import requests, re, json
with open('yeni_ozellikler.py','r',encoding='utf-8') as f: src=f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SID = "sesn_011CZxezbngsD76tuntFdn6J"
H = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01",
     "anthropic-beta": "managed-agents-2026-04-01","content-type": "application/json"}

msg = """Git push hanging. Önce mevcut hanging süreci iptal et (eğer mümkünse), sonra şu adımları dene:

1. env | grep -i -E "github|gh_token|git_token" — çevrede GitHub token var mı bak
2. Eğer GH_TOKEN veya GITHUB_TOKEN varsa:
   cd /tmp/egitim-checkup-pro && git push https://x-access-token:$GH_TOKEN@github.com/Ahmet571-es/egitim-checkup-pro.git main
3. Eğer hiç token yoksa: cat /home/claude/.netrc ve cat /home/claude/.git-credentials — kayıtlı credential var mı?
4. git config --global credential.helper — helper aktif mi?

Push başarılı olunca hemen "PUSH BAŞARILI" yaz ve dur."""

r = requests.post(f"https://api.anthropic.com/v1/sessions/{SID}/events",
                  headers=H, json={"events":[{"type":"user.message","content":[{"type":"text","text":msg}]}]}, timeout=20)
print(r.status_code, r.text[:500])
