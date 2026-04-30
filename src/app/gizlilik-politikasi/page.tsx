'use client';
/**
 * Faz 1: Gizlilik Politikası
 * Public page — proxy.ts PUBLIC_PATHS içerisinde '/gizlilik-politikasi' eklenmiş.
 */
import Link from 'next/link';
import { ArrowLeft, Printer, Lock, Shield, Mail } from 'lucide-react';

const UPDATED_AT = '30 Nisan 2026';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Giriş',
    body: [
      'Bu Gizlilik Politikası, Eğitim Check-Up Pro platformunun (bundan sonra "Platform" olarak anılacaktır) kullanıcılardan topladığı bilgileri nasıl işlediği, sakladığı ve koruduğu hakkında bilgi verir.',
      'Politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ile uyumlu olarak hazırlanmıştır. Detaylı KVKK aydınlatma metnimiz için /kvkk sayfasını ziyaret ediniz.',
    ],
  },
  {
    title: '2. Toplanan Bilgiler',
    body: [
      'Kayıt sırasında verdiğiniz bilgiler: ad-soyad, e-posta adresi, telefon numarası, doğum tarihi ve okul bilgisi.',
      'Test sonuçları: Platform üzerindeki psikometrik testlerin verdiğiniz cevapları ve bu cevaplardan üretilen analiz raporları.',
      'Otomatik toplanan bilgiler: IP adresi, tarayıcı türü, ziyaret edilen sayfalar, oturum süresi ve cihaz bilgileri.',
      'Çerez (cookie) verileri: oturum yönetimi, tema tercihi ve site kullanım analizi için sınırlı çerezler.',
    ],
  },
  {
    title: '3. Bilgilerin Kullanım Amacı',
    body: [
      'Hizmetin sunulması ve kullanıcı hesaplarının yönetilmesi.',
      'Test sonuçlarına dayalı kişiselleştirilmiş analiz raporlarının üretilmesi.',
      'Yapay zekâ destekli analizler için yalnızca anonimleştirilmiş test verisinin işlenmesi.',
      'Platform performansının izlenmesi, hata tespiti ve güvenlik önlemlerinin alınması.',
      'Yasal yükümlülüklerin yerine getirilmesi.',
    ],
  },
  {
    title: '4. Çerezler (Cookies)',
    body: [
      'Platform, kullanıcı deneyimini iyileştirmek için temel düzeyde çerez kullanır. Site ilk ziyaretinizde KVKK uyumlu çerez onay bandı görüntülenir.',
      'Zorunlu çerezler: Oturum yönetimi ve güvenlik için kullanılır, devre dışı bırakılamaz.',
      'Tercih çerezleri: Tema seçimi (açık/koyu mod), dil tercihi gibi kullanıcı tercihlerini hatırlamak için kullanılır.',
      'Analitik çerezler: Vercel Analytics ve Speed Insights aracılığıyla anonim sayfa görüntüleme istatistikleri toplanır.',
      'Tarayıcı ayarlarınızdan çerezleri yönetebilir veya silebilirsiniz. Ancak zorunlu çerezleri devre dışı bırakmak Platform fonksiyonlarını etkileyebilir.',
    ],
  },
  {
    title: '5. Üçüncü Taraf Hizmetler',
    body: [
      'Platform, hizmetlerini sunmak için aşağıdaki üçüncü taraf hizmet sağlayıcılarıyla çalışır. Bu sağlayıcılar yalnızca hizmeti sunmak için gerekli olan veriye erişir ve gizlilik sözleşmeleri çerçevesinde davranır.',
      'Vercel: Web sitesi barındırma ve performans analizi.',
      'Supabase: Veritabanı, kullanıcı kimlik doğrulama ve dosya depolama.',
      'Anthropic (Claude AI): Yapay zekâ destekli analiz raporlarının üretimi. Veriler raporlama için işlenir, eğitim verisi olarak kullanılmaz.',
      'Resend: İşlem e-postalarının (kayıt onayı, şifre sıfırlama, bildirim) gönderimi.',
      'iyzico: Ödeme işlemleri (yalnızca ödeme akışı kullanıldığında).',
    ],
  },
  {
    title: '6. Veri Güvenliği',
    body: [
      'Tüm veri iletişimi HTTPS/TLS şifrelemesi ile korunur.',
      'Şifreler bcrypt algoritması ile hashlenerek saklanır; düz metin olarak tutulmaz.',
      'Kullanıcı verilerine yalnızca rol bazlı yetkilendirme (RBAC) ve satır seviyesinde güvenlik (RLS) politikaları çerçevesinde erişilebilir.',
      'Düzenli güvenlik denetimleri ve sızma testleri yapılır. Tespit edilen güvenlik açıkları derhal giderilir.',
      'Olası bir veri ihlali durumunda KVKK madde 12 uyarınca en geç 72 saat içinde Kişisel Verileri Koruma Kurulu’na ve etkilenen kullanıcılara bildirim yapılır.',
    ],
  },
  {
    title: '7. Çocukların Gizliliği',
    body: [
      'Platform 18 yaş altı kullanıcılara hizmet vermektedir. Bu nedenle çocukların gizliliği konusunda özel önlemler alınır:',
      'Çocuklar kendi başına hesap oluşturamaz; öğrenci kayıtları yalnızca okul yöneticisi veya öğretmen tarafından oluşturulur.',
      'Veli izni alınmadan çocuk verileri işlenmez; kayıt sırasında veli onayı şarttır.',
      'Çocuk verilerine erişim, role göre sıkı şekilde kısıtlanmıştır. Öğretmen yalnızca kendi öğrencilerinin, veli yalnızca kendi çocuğunun verisine erişebilir.',
      'Reklam veya pazarlama amacıyla çocuk verisi asla kullanılmaz.',
    ],
  },
  {
    title: '8. Veri Saklama Süreleri',
    body: [
      'Aktif hesap verileri: Hesap aktif olduğu sürece.',
      'Hesabı silinen kullanıcıların verileri: 30 gün içinde anonimleştirilir veya silinir.',
      'Test sonuçları: Eğitim yılı sonundan itibaren 5 yıl (anonim arşiv olarak tutulabilir).',
      'Ödeme kayıtları: Vergi mevzuatı gereği 10 yıl.',
      'Erişim ve sistem logları: 12 ay.',
    ],
  },
  {
    title: '9. Kullanıcı Hakları',
    body: [
      'KVKK madde 11 uyarınca aşağıdaki haklara sahipsiniz:',
      'Kişisel verilerinizin işlenip işlenmediğini öğrenme.',
      'İşlenmişse, hangi amaçla işlendiğini sorma.',
      'Eksik veya hatalı bilgileri düzelttirme.',
      'KVKK madde 7\'de öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme.',
      'Otomatik sistemlerle yapılan analizlerin sonuçlarına itiraz etme.',
      'Bu hakları kullanmak için kvkk@egitimcheckup.com adresine yazılı başvuru yapabilirsiniz.',
    ],
  },
  {
    title: '10. Politikadaki Değişiklikler',
    body: [
      'Bu Gizlilik Politikası gerektiğinde güncellenebilir. Önemli değişikliklerde kayıtlı kullanıcılara e-posta ile bildirim yapılır.',
      'Politika, ' + UPDATED_AT + ' tarihinde güncellenmiştir. Değişiklikler yayımlandığı anda yürürlüğe girer.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8] print:bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10 print:py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900">
            <ArrowLeft className="w-4 h-4" /> Ana sayfa
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2847] text-white text-sm font-semibold hover:bg-[#1a3a5f] transition-colors"
          >
            <Printer className="w-4 h-4" /> Yazdır
          </button>
        </div>

        {/* Card */}
        <article className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-8 md:p-12 print:shadow-none print:border-0 print:p-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f2847]">Gizlilik Politikası</h1>
              <p className="text-xs text-gray-500">Güncelleme: {UPDATED_AT}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            Eğitim Check-Up Pro olarak gizliliğinize önem veriyoruz. Bu metin, bilgilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
          </p>

          <div className="space-y-6">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="text-lg font-bold text-[#0f2847] mb-2">{s.title}</h2>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  {s.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center print:hidden">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Link href="/kvkk" className="hover:text-[#0f2847] inline-flex items-center gap-1">
                <Shield className="w-3 h-3" /> KVKK Aydınlatma Metni
              </Link>
              <span>·</span>
              <a href="mailto:kvkk@egitimcheckup.com" className="hover:text-[#0f2847] inline-flex items-center gap-1">
                <Mail className="w-3 h-3" /> kvkk@egitimcheckup.com
              </a>
            </div>
            © {new Date().getFullYear()} Eğitim Check-Up Pro
          </div>
        </article>
      </div>
    </div>
  );
}
