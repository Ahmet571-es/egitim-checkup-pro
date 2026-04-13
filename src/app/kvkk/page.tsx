'use client';
/**
 * Faz 5: KVKK / Aydınlatma Metni
 * Public page — proxy.ts PUBLIC_PATHS içerisinde '/kvkk' mevcut.
 */
import Link from 'next/link';
import { ArrowLeft, Printer, Shield } from 'lucide-react';

const UPDATED_AT = '11 Nisan 2026';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Veri Sorumlusu',
    body: [
      'Eğitim Check-Up Pro ("Platform", "biz"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket eder. Bu aydınlatma metni, Platform tarafından toplanan kişisel verilerin işlenmesine ilişkin esasları açıklar.',
      'Okullar ("Veri Sorumlusu Ortağı") kendi öğretmen, öğrenci ve veli verilerini yönetir; Platform bu verileri yalnızca hizmetin sunulması amacıyla işler.',
    ],
  },
  {
    title: '2. İşlenen Kişisel Veri Kategorileri',
    body: [
      'Kimlik: Ad soyad, doğum tarihi, okul numarası.',
      'İletişim: E-posta adresi, telefon numarası.',
      'Eğitim: Sınıf bilgisi, ders başarısı, test sonuçları.',
      'Ölçme ve değerlendirme: Kişilik envanteri cevapları, öğrenme stili, dikkat testi performansı.',
      'İşlem güvenliği: IP adresi, oturum bilgileri, erişim logları.',
    ],
  },
  {
    title: '3. İşleme Amaçları',
    body: [
      'Eğitim Check-Up hizmetlerinin sunulması ve iyileştirilmesi.',
      'Öğrencilere kişiselleştirilmiş raporlar ve yönlendirme sağlanması.',
      'Okul yöneticilerinin sınıf ve öğrenci performansını izlemesi.',
      'Mevzuattan kaynaklanan yükümlülüklerin yerine getirilmesi.',
      'Sistem güvenliği, hata tespiti ve kötüye kullanımın önlenmesi.',
    ],
  },
  {
    title: '4. Hukuki Sebepler (KVKK m.5)',
    body: [
      'Sözleşmenin kurulması ve ifası (okul aboneliği, öğrenci kaydı).',
      'Veri sorumlusunun meşru menfaati (hizmet kalitesi, güvenlik).',
      'Kanunlarda açıkça öngörülmesi (eğitim ve denetim mevzuatı).',
      'İlgili kişinin açık rızası (pazarlama iletişimi gibi ek amaçlar için).',
    ],
  },
  {
    title: '5. Aktarım',
    body: [
      'Verileriniz, hizmetin sunumu için barındırma ve altyapı sağlayıcılarına (Supabase, Vercel) ve ödeme altyapısı için iyzico\'ya aktarılmaktadır. Aktarımlar yalnızca gerekli olan veri kapsamında ve gizlilik sözleşmeleri çerçevesinde yapılır.',
      'Yurt dışına aktarım, ilgili sağlayıcıların Türkiye veri merkezlerini kullanması veya KVKK m.9 hükümleri çerçevesinde ve veri güvenliği taahhütleri altında gerçekleşir.',
    ],
  },
  {
    title: '6. Saklama Süreleri',
    body: [
      'Aktif kullanıcı verileri: Abonelik süresince.',
      'Test sonuçları: Eğitim yılı sonundan itibaren 5 yıl (arşivleme amacıyla anonim tutulabilir).',
      'Ödeme kayıtları: Vergi mevzuatı gereği 10 yıl.',
      'Erişim logları: 12 ay.',
      'Süre sonunda veriler silinir, yok edilir veya anonim hale getirilir.',
    ],
  },
  {
    title: '7. KVKK m.11 Kapsamındaki Haklarınız',
    body: [
      'Kişisel verilerinizin işlenip işlenmediğini öğrenme,',
      'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,',
      'Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,',
      'Eksik veya yanlış işlenmiş ise düzeltilmesini isteme,',
      'KVKK m.7\'de öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme,',
      'Otomatik sistemlerle analiz edilmesi sonucu aleyhe çıkan sonuçlara itiraz etme,',
      'Kanuna aykırı işleme nedeniyle zarara uğramanız halinde tazminat talep etme haklarına sahipsiniz.',
    ],
  },
  {
    title: '8. Çocukların Verileri',
    body: [
      'Platform, 18 yaş altı kullanıcılar için öğretmen/veli onayı ile çalışır. Öğrenci kayıtları yalnızca okul tarafından oluşturulabilir; kendi kendine hesap açılamaz. Veliler, çocuklarına ait verilere erişebilir ve silinmesini talep edebilir.',
    ],
  },
  {
    title: '9. Başvuru ve İletişim',
    body: [
      'Haklarınızı kullanmak için kvkk@egitimcheckup.com adresine yazılı başvuru yapabilirsiniz. Başvurular 30 gün içinde ücretsiz olarak sonuçlandırılır.',
      'Güncelleme: Bu metin ' + UPDATED_AT + ' tarihinde güncellenmiştir. Değişiklikler platformda yayımlandığı anda yürürlüğe girer.',
    ],
  },
];

export default function KvkkPage() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8] print:bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10 print:py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900"
          >
            <ArrowLeft className="w-4 h-4" /> Ana sayfa
          </Link>
          <button
            onClick={handlePrint}
            data-test="kvkk-print"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2847] text-white text-sm font-semibold hover:bg-[#1a3a5f] transition-colors"
          >
            <Printer className="w-4 h-4" /> Yazdır
          </button>
        </div>

        {/* Card */}
        <article className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-8 md:p-12 print:shadow-none print:border-0 print:p-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f2847]">
                KVKK Aydınlatma Metni
              </h1>
              <p className="text-xs text-gray-500">Güncelleme: {UPDATED_AT}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) kapsamında
            Eğitim Check-Up Pro platformunun kişisel verilerinizi nasıl işlediği ve
            koruduğu hakkında bilgi edinmek için lütfen aşağıdaki metni okuyunuz.
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

          <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Eğitim Check-Up Pro · KVKK Aydınlatma Metni
          </div>
        </article>
      </div>
    </div>
  );
}
