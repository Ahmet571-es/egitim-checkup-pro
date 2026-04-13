import requests, re, json
with open('yeni_ozellikler.py','r',encoding='utf-8') as f: src=f.read()
API_KEY = re.search(r'API_KEY = "([^"]+)"', src).group(1)
SID = "sesn_011CZxezbngsD76tuntFdn6J"
H = {"x-api-key": API_KEY, "anthropic-version": "2023-06-01",
     "anthropic-beta": "managed-agents-2026-04-01","content-type": "application/json"}

msg = """DUR! Git push ve SSH denemelerini iptal et. Sandbox'unda GitHub auth yok, push imkansız.

Bunun yerine şunu yap — bu kritik:

1. Önce hanging süreçleri sonlandır:
   pkill -9 -f "git push" 2>/dev/null; pkill -9 ssh 2>/dev/null; true

2. Sonra repo'daki değişiklikleri tek bir patch dosyası olarak oluştur:
   cd /tmp/egitim-checkup-pro
   git format-patch 464a932..HEAD --stdout > /tmp/yeni_ozellikler.patch
   wc -c /tmp/yeni_ozellikler.patch

3. Patch dosyasını base64 encode et ve TAM İÇERİĞİNİ bana mesaj olarak geri ver:
   base64 -w0 /tmp/yeni_ozellikler.patch

4. Son mesajında SADECE şunu yaz (hiçbir yorum/açıklama ekleme):
   PATCH_BEGIN
   <base64 içeriği tek satırda>
   PATCH_END

Bu base64'ü alıp ben lokal repomda push edeceğim. Adım adım ilerle, tek bir bash komutu ile tüm zinciri çalıştırabilirsin."""

r = requests.post(f"https://api.anthropic.com/v1/sessions/{SID}/events",
                  headers=H, json={"events":[{"type":"user.message","content":[{"type":"text","text":msg}]}]}, timeout=20)
print(r.status_code, r.text[:300])
