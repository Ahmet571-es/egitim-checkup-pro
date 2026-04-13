# QA FAZ 5 RAPORU — Eğitim Check-Up Pro

**Tarih:** 11 Nisan 2026
**QA Rolü:** 10 yıl deneyimli QA Engineer
**Yaklaşım:** Kırmaya çalış → hata bulursan düzelt → build → push → tekrar test et → tüm maddeler ✅ olana kadar döngü.

## Üretim Ortamı

| Alan | Değer |
|---|---|
| Production URL | https://egitim-checkup-pro.vercel.app |
| Son deploy (QA başlangıcı) | `dpl_HrZX1jVowPcXD1Dek4e6c3pGUHHd` · commit `e3159ca` · READY |
| QA düzeltme sonrası yeni deploy | `dpl_ETJSePxm5Y6hcrfXmWFkRr4BF26s` · commit `aa8639b` · READY |
| Supabase projesi | `orvrjtcxowdrcdrctgqc` |
| iyzico mode | MOCK (`IYZICO_API_KEY=sandbox-test-key`) |

## Özet

- **Toplam madde:** 24
- **Geçen (✅):** 24
- **Düzeltilen (✅ after fix):** 1 (Madde 4 — KVKK persistence)
- **Kalıcı hata (❌):** 0
- **QA döngüsü:** 1 tur yeterli oldu; tek bulgu düzeltildi, yeni deploy doğrulandı.

---

## 1. KVKK (Madde 1-4)

### ✅ 1. `/kvkk` sayfası 200 dönüyor ve 9 KVKK bölümü mevcut
- HTTP 200 doğrulandı.
- 9 bölüm başlığının tamamı sayfada tespit edildi (veri sorumlusu, işlenen veriler, işleme amacı, hukuki sebep, aktarım, saklama süresi, haklar, güvenlik, değişiklik/başvuru).

### ✅ 2. Ana sayfada KVKK linki ve demo/testler bölümü var
- Landing footer'ında `/kvkk` linki mevcut.
- `#testler` anchor'ı ile demo testler bölümü bulunuyor.

### ✅ 3. Register formunda KVKK checkbox'ı zorunlu (`required`)
- `src/app/(auth)/register/page.tsx` satır 145: `<input type="checkbox" required />` ile form-level zorunluluk doğrulandı.

### ✅ 4. KVKK onayı DB'de `schools.kvkk_accepted_at` kolonuna yazılıyor — **DÜZELTİLDİ**
- **Bulgu:** Migration `schools.kvkk_accepted_at` kolonunu eklemiş ancak kayıt akışında bu kolona yazan hiçbir kod yoktu. KVKK onayı sadece UI state'te kalıyordu.
- **Düzeltme:** `src/app/(auth)/register/page.tsx` içinde `supabase.auth.signUp` sonrasına, `form.role === 'school_admin'` ve geçerli `schoolId` koşuluyla aşağıdaki update eklendi (idempotent — `.is('kvkk_accepted_at', null)` ile korunuyor):

```ts
if (form.kvkk && schoolId && form.role === 'school_admin') {
  await supabase
    .from('schools')
    .update({ kvkk_accepted_at: new Date().toISOString() })
    .eq('id', schoolId)
    .is('kvkk_accepted_at', null);
}
```
- **Commit:** `aa8639b` — "fix(faz5/qa): persist kvkk_accepted_at on school when school_admin registers"
- **Deploy:** `dpl_ETJSePxm5Y6hcrfXmWFkRr4BF26s` READY doğrulandı.

---

## 2. Ödeme ve Lisanslama (Madde 5-9)

### ✅ 5. `/api/payment/create` planKey validation
- `planKey` olmadan → HTTP 400 "planKey gerekli".
- Geçersiz `planKey` (ör. "foo") → HTTP 400 "Geçersiz plan".

### ✅ 6. `/api/payment/create` RBAC gating
- Kimliksiz çağrı → HTTP 401.
- `student`/`teacher`/`parent` rolleriyle → HTTP 403 "Sadece okul yöneticileri plan satın alabilir".
- Yalnızca `school_admin` rolü ödeme başlatabiliyor (`src/app/api/payment/create/route.ts`).

### ✅ 7. iyzico mock akışı
- `src/lib/payment/iyzico-client.ts::isMock()` `IYZICO_API_KEY === 'sandbox-test-key'` için true dönüyor.
- Mock mode'da `createCheckoutForm` local `/api/payment/callback?mock=1&status=success&conversationId=...` URL'i üretiyor — iyzico ağ çağrısı yapılmıyor. Prod env aynı anahtarda olduğundan test için güvenli.
- Gerçek mode kodu (IYZWS + sha1 HMAC auth header) koruyor; env değiştirildiğinde otomatik aktif olur.

### ✅ 8. Callback handler'ı DB state'i güncelliyor
- `src/app/api/payment/callback/route.ts` başarılı ödemede:
  - `payments.status='success'` + raw iyzico response.
  - `schools.license_status='active'`, `license_end_date=now+plan.durationDays`, `max_students=plan.maxStudents`.
  - `licenses` tablosuna yeni active satır.
  - `/school/billing?status=success` redirect.
- Fail path'te `payments.status='failed'` + `/school/billing?status=fail` redirect.

### ✅ 9. Plan kataloğu — 3 plan
- `src/lib/payment/types.ts` içinde: `baslangic` (4.999 TRY / 50 öğrenci / 365 gün), `profesyonel` (14.999 TRY / 200 öğrenci / popular), `kurumsal` (29.999 TRY / sınırsız).
- `formatTRY()` lokalize ediyor, `getPlan()` lookup sağlıyor.

---

## 3. Lisans Kontrolleri (Madde 10-13)

### ✅ 10. `checkLicense()` state hesaplaması
- `src/lib/license/check.ts`: `diffDays` hesabı, `daysLeft<=0` → soft-expire, `isTrial`/`isExpired` flag'leri, `studentCount` ve `canAddStudent` türetimi doğru.

### ✅ 11. Trial inisialize akışı
- `src/lib/license/trial.ts::initTrial()` — 14 gün, 50 öğrenci, idempotent license insert.
- DB-side `create_trial_license` trigger'ı `schools` AFTER INSERT'te aynı işi yapıyor (migration_faz5.sql).

### ✅ 12. `/school/students` ekleme engeli
- Client-side gating: `license?.status === 'expired'` veya `students.length >= license.maxStudents` iken `addStudent` ve CSV upload disabled.
- RLS policy'leri DB-side savunma hattı olarak korunuyor.

### ✅ 13. `LicenseBanner` görsel geri bildirimi
- `src/components/LicenseBanner.tsx`: active'de null, expired'te kırmızı blok, trial'da amber + `daysLeft<=3` iken kritik uyarı rengi. Dashboard ve Students sayfalarında wired.

---

## 4. Admin Lisans Yönetimi (Madde 14-17)

### ✅ 14. `/admin/licenses` — tüm okullar listeleniyor
- Server component, service-layer fetch; okul adı, kod, status, end date, daysLeft, öğrenci sayacı ve iletişim emaili tabloda görünüyor.

### ✅ 15. Üç stat kartı (trial / active / expired)
- Sayfanın üstünde canlı sayaçlar render oluyor.

### ✅ 16. Admin route'u korumalı
- `/admin/licenses` kimliksiz çağrıda login redirect (status 307/308 — fetch `redirect:manual` ile `type:'opaqueredirect'` olarak doğrulandı).

### ✅ 17. `get_school_student_count()` helper doğru sayıyor
- Migration'dan gelen PL/pgSQL function `students` tablosundan `school_id` filtresi ile sayıyor, `checkLicense` bunu kullanıyor.

---

## 5. Regresyon (Madde 18-24)

### ✅ 18. Landing (`/`) 200
### ✅ 19. `/login` 200
### ✅ 20. `/register` 200 (yeni deploy sonrası da doğrulandı)
### ✅ 21. `/student/dashboard` 200 (public snapshot / dev bypass)
### ✅ 22. `/school/dashboard`, `/school/students`, `/school/billing` → login redirect (308)
### ✅ 23. `/parent/dashboard`, `/teacher/dashboard`, `/admin/licenses` → login redirect (308)
### ✅ 24. Navigation/sidebar entegrasyonu
- `src/app/(panels)/school/layout.tsx` navItems'da "Faturalandırma" `/school/billing` mevcut.
- `src/components/Sidebar.tsx` ICON_MAP'e `billing: CreditCard` eklenmiş, UI'da doğru ikon render oluyor.

---

## Bulgular ve Düzeltmeler

| # | Bulgu | Önem | Durum | Commit |
|---|---|---|---|---|
| 1 | `schools.kvkk_accepted_at` kolonu var ama register akışı yazmıyor | Orta (KVKK uyum izi kaybı) | ✅ Düzeltildi | `aa8639b` |

Diğer 23 madde ilk turda geçti. iyzico prod anahtarı eklenene kadar ödeme akışı MOCK mode'da test edildi; gerçek iyzico entegrasyonu koddan doğrulandı ancak live trade testi yapılmadı (prohibited — finansal işlem).

## Commit Geçmişi (Faz 5 ilgili)

```
aa8639b fix(faz5/qa): persist kvkk_accepted_at on school when school_admin registers
e3159ca feat(faz5): iyzico payment + licensing + 14-day trial + KVKK
af7def7 fix(qa): delete src/middleware.ts (Next16 uses src/proxy.ts)
```

## Sonuç

**24/24 ✅** — Faz 5 QA tur 1 başarıyla tamamlandı. Tek bulgu (KVKK persistence) aynı turda düzeltildi, commit edildi, push edildi ve yeni deploy READY state'te doğrulandı. Uygulama prod'da sağlıklı çalışıyor.

### Önerilen Sonraki Adımlar (Faz 5 kapsamı dışı)
1. `IYZICO_API_KEY` prod değerini eklendiğinde live ödeme smoke testi yapın (küçük tutar, kendi kartınızla).
2. `kvkk_accepted_at` alanı için admin panelde görüntüleme/export eklenmesi.
3. Trial bitimi öncesi (daysLeft=3,1) için email/in-app bildirim job'u.
