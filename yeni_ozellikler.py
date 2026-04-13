"""
Eğitim Check-Up Pro — Yeni Özellikler:
Mezun sınıf seçimi + Öğretmen şifre yönetimi + Yönetim paneli güncelleme
Managed Agents ile otonom geliştirme (Windows uyumlu)

Kullanım:
1. API_KEY satırına kendi Claude API key'ini yaz
2. Terminal/PowerShell'de çalıştır: python yeni_ozellikler.py
"""

import requests
import json
import sys

# ▶▶▶ API KEY'İNİ BURAYA YAZ ◀◀◀
API_KEY = "sk-ant-PLACEHOLDER"

BASE = "https://api.anthropic.com/v1"
HEADERS = {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "managed-agents-2026-04-01",
    "content-type": "application/json",
}

def api_call(endpoint, data):
    r = requests.post(f"{BASE}/{endpoint}", headers=HEADERS, json=data)
    if r.status_code >= 400:
        print(f"❌ HATA ({r.status_code}): {r.text}")
        sys.exit(1)
    return r.json()

def stream_events(session_id):
    url = f"{BASE}/sessions/{session_id}/events"
    r = requests.get(url, headers={**HEADERS, "accept": "text/event-stream"}, stream=True)
    for line in r.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data: "):
            continue
        try:
            event = json.loads(line[6:])
            etype = event.get("type", "")
            if etype == "agent.tool_use":
                tool = event.get("name", "")
                inp = event.get("input", {})
                if tool == "bash":
                    print(f"\n🔧 Komut: {inp.get('command', '')[:120]}")
                elif tool == "file_write":
                    print(f"\n📄 Dosya: {inp.get('path', '')}")
                elif tool == "file_read":
                    print(f"\n👁️ Okuyor: {inp.get('path', '')}")
            elif etype == "agent.tool_result":
                output = str(event.get("output", ""))[:200]
                if output.strip():
                    print(f"   → {output}")
            elif etype == "agent.message":
                text = event.get("content", [{}])[0].get("text", "")
                if text:
                    print(f"\n💬 {text[:300]}")
            elif etype == "session.completed":
                print("\n\n✅ SESSION TAMAMLANDI!")
                return True
            elif etype == "session.failed":
                print(f"\n\n❌ SESSION BAŞARISIZ: {event.get('error', '')}")
                return False
        except json.JSONDecodeError:
            continue
    return False

print("=" * 60)
print("🔧 Eğitim Check-Up Pro — Yeni Özellikler")
print("   Mezun + Öğretmen Şifre + Yönetim Paneli")
print("=" * 60)
print()

print("🤖 Agent oluşturuluyor...")
agent = api_call("agents", {
    "name": "Egitim CheckUp Feature Update",
    "model": "claude-sonnet-4-6",
    "system": """Sen Türkiye'deki okullar için profesyonel bir psikometrik test platformu geliştiren senior full-stack developer'sın.

Platform: Eğitim Check-Up Pro
Stack: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase
Domain: egitim-checkup.com
Tüm UI metinleri Türkçe olacak.

ÇALIŞMA PRENSİPLERİN:
1. Önce mevcut projeyi klonla ve npm install yap
2. Mevcut kodu oku, yapıyı anla, mevcut özellikleri bozma
3. Yeni özellikleri mevcut yapıya entegre et
4. Her adımda npm run build ile hatasız derleme kontrolü yap
5. Hata bulursan düzelt ve tekrar kontrol et
6. Bittiğinde git add + commit + push yap

TASARIM YÖNERGELERİ:
- Ana koyu: #0f2847, Vurgu: #10b981
- Glassmorphism kartlar: bg-white/70 backdrop-blur-xl rounded-2xl border-white/40
- Rol bazlı accent: admin=amber, school=sky, teacher=emerald, student=violet, parent=pink
- Font: Plus Jakarta Sans, font-extrabold başlıklar
- Mobil responsive""",
    "tools": [{"type": "agent_toolset_20260401"}]
})

AGENT_ID = agent["id"]
AGENT_VERSION = agent["version"]
print(f"✅ Agent: {AGENT_ID} (v{AGENT_VERSION})\n")

print("🌐 Environment oluşturuluyor...")
env = api_call("environments", {
    "name": "egitim-checkup-new-features",
    "config": {"type": "cloud", "networking": {"type": "unrestricted"}}
})
ENV_ID = env["id"]
print(f"✅ Environment: {ENV_ID}\n")

print("🚀 Session başlatılıyor...")
session = api_call("sessions", {
    "agent": AGENT_ID,
    "environment_id": ENV_ID,
    "title": "Egitim CheckUp - Mezun + Ogretmen Sifre + Yonetim"
})
SESSION_ID = session["id"]
print(f"✅ Session: {SESSION_ID}\n")

print("📨 Görev gönderiliyor...\n")

TASK = """
Eğitim Check-Up Pro — 3 Yeni Özellik Eklenmesi

Mevcut proje: https://github.com/Ahmet571-es/egitim-checkup-pro
Bu projeyi klonla, npm install yap, mevcut yapıyı oku ve aşağıdaki 3 özelliği ekle.

═══════════════════════════════════════
ÖZELLİK 1: Öğrenci Girişinde "Mezun" Sınıf Seçimi
═══════════════════════════════════════

Mevcut öğrenci kayıt ve profil yapısında sınıf seçimi var. Buna "Mezun" seçeneğini ekle:

1. Öğrenci kayıt formunda (register sayfası):
   - Rol "Öğrenci" seçildiğinde sınıf seçimi dropdown'ı göster
   - Sınıf seçeneklerinin en altına "Mezun" ekle
   - Mezun seçildiğinde okul kodu zorunlu olmasın (mezunlar bağımsız kayıt olabilir)

2. Okul yöneticisi → Öğrenciler sayfasında:
   - Öğrenci eklerken sınıf atamasında "Mezun" seçeneği olsun
   - CSV import'ta sınıf sütununda "Mezun" yazarsa bu kategoriye düşsün

3. Öğrenci profil sayfasında:
   - Sınıf bilgisi olarak "Mezun" görüntülensin
   - Mezun öğrenciler normal öğrencilerle aynı testleri çözebilsin

4. Supabase:
   - classes tablosuna "Mezun" eklemek yerine, profiles tablosuna `is_graduated BOOLEAN DEFAULT FALSE` sütunu ekle (migration SQL oluştur)
   - Veya daha basit çözüm: sınıf seçiminde "Mezun" string olarak kabul et
   - En temiz çözümü sen seç

═══════════════════════════════════════
ÖZELLİK 2: Öğretmen / Koç Paneli Şifre Korumalı Giriş
═══════════════════════════════════════

Her öğretmenin kendine özel şifresi olacak. Bu şifre yönetim panelinden atanacak.

1. Öğretmen giriş akışı:
   - Mevcut login sayfası zaten email + şifre ile çalışıyor (Supabase Auth)
   - Ek olarak: öğretmen giriş yaptığında kendi panelinde sadece kendine atanmış sınıfları ve öğrencileri görsün
   - Başka öğretmenlerin verilerine erişemesin

2. Öğretmen paneli kişiselleştirme:
   - Öğretmen dashboard'da "Hoş geldiniz, [Ad Soyad]" mesajı
   - "Sınıflarım" sayfasında sadece kendisine atanmış sınıflar
   - "Sonuçlar" sayfasında sadece kendi sınıflarındaki öğrencilerin test sonuçları
   - "Raporlar" sayfasında sadece kendi öğrencileri için rapor üretebilsin

3. Öğretmen sekmeleri:
   - Öğretmen panelinde üst kısımda veya sidebar'da öğretmenin adı görünsün
   - Her öğretmen kendi test atamalarını yapabilsin
   - Ortak rapor motoru kullanılsın (aynı AI analiz sistemi)

4. RLS güncelleme:
   - Öğretmen sadece kendi school_id'sindeki ve kendi teacher_id'sine atanmış sınıflardaki verilere erişsin
   - Supabase RLS policy'lerini kontrol et ve gerekiyorsa güncelle
   - Migration SQL oluştur

═══════════════════════════════════════
ÖZELLİK 3: Yönetim Paneli — Öğretmen Tanımlama ve Şifre Atama
═══════════════════════════════════════

Okul yöneticisi panelinde öğretmen yönetimini geliştir:

1. Öğretmenler sayfası (src/app/(panels)/school/teachers/page.tsx) güncelle:
   - Öğretmen ekleme formunda:
     - Ad Soyad
     - E-posta
     - Şifre (yönetici belirler, öğretmene iletilir)
     - Sınıf ataması (çoklu seçim — hangi sınıfları yönetecek)
   - Mevcut öğretmenler listesinde:
     - Her öğretmenin yanında "Şifre Sıfırla" butonu
     - "Sınıf Ata" butonu (mevcut sınıflardan seçim)
     - "Aktif/Pasif" toggle
   - Öğretmen düzenleme modal'ı:
     - Ad soyad, email değiştirme
     - Şifre sıfırlama (yeni şifre girme)
     - Sınıf atamalarını güncelleme

2. Şifre sıfırlama API:
   - src/app/api/admin/reset-password/route.ts → POST endpoint
   - Body: { user_id, new_password }
   - Supabase Admin API ile şifre değiştirme
   - Sadece school_admin rolü çağırabilsin
   - SUPABASE_SERVICE_ROLE_KEY env variable gerekecek (.env.local'a placeholder ekle)

3. Genel istatistikler:
   - Okul yöneticisi dashboard'unda (src/app/(panels)/school/dashboard/page.tsx):
     - Toplam öğretmen sayısı
     - Toplam öğrenci sayısı
     - Toplam çözülen test sayısı
     - Toplam üretilen rapor sayısı
     - Son 7 günde çözülen test trendi (basit çubuk grafik)
     - En çok çözülen test türü
   - StatCard bileşenini kullan (zaten var)
   - Veriler Supabase'den çekilsin (count sorgularıyla)

4. Admin (platform yöneticisi) dashboard'u da güncelle:
   - src/app/(panels)/admin/dashboard/page.tsx:
     - Toplam okul sayısı
     - Toplam kullanıcı sayısı (rol bazlı dağılım)
     - Aktif lisans sayısı / süresi dolan lisanslar
     - Son 30 günde yeni kayıtlar

═══════════════════════════════════════
GENEL TALİMATLAR
═══════════════════════════════════════

- Tüm metinler Türkçe
- Mevcut tasarım dilini koru (glassmorphism, gradient butonlar, rol bazlı renkler)
- Mobil responsive
- Mevcut özellikleri BOZMA — sadece yeni özellik ekle veya mevcut sayfaları geliştir
- Supabase migration SQL'lerini supabase/ klasörüne kaydet (migration_yeni_ozellikler.sql)
- Her adımda npm run build — hatasız derlenene kadar düzelt
- Bittiğinde:
  git add .
  git commit -m "feat: Mezun sınıf + öğretmen şifre yönetimi + yönetim paneli istatistikleri"
  git push origin main
- Tüm dosya değişikliklerini listele
"""

api_call(f"sessions/{SESSION_ID}/events", {
    "events": [{"type": "user.message", "content": [{"type": "text", "text": TASK}]}]
})

print("✅ Görev gönderildi. Agent çalışmaya başlıyor...")
print("=" * 60)
print("📡 Gerçek zamanlı izleme başlıyor...")
print("   (Ctrl+C ile izlemeyi durdurabilirsin)")
print("=" * 60 + "\n")

try:
    stream_events(SESSION_ID)
except KeyboardInterrupt:
    print(f"\n⏸️ İzleme durduruldu. Session ID: {SESSION_ID}")

print(f"\n{'=' * 60}")
print(f"   AGENT_ID:       {AGENT_ID}")
print(f"   ENVIRONMENT_ID: {ENV_ID}")
print(f"   SESSION_ID:     {SESSION_ID}")
print(f"{'=' * 60}")
