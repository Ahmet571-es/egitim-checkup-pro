'use client';
/**
 * Faz 1: İade ve Teslimat Şartları
 * Public page — proxy.ts PUBLIC_PATHS içerisinde '/iade-ve-teslimat-sartlari' eklenmiş.
 */
import Link from 'next/link';
import { ArrowLeft, Printer, RotateCcw, Shield, Mail } from 'lucide-react';

const UPDATED_AT = '30 Nisan 2026';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Hizmet Türü',
    body: [
      'Eğitim Check-Up Pro tamamen dijital bir hizmettir. Fiziksel ürün satışı yapılmamaktadır.',
      'Tüm hizmetler Platform üzerinden anlık olarak sunulur; kargo veya posta yoluyla gönderilen herhangi bir materyal bulunmamaktadır.',
    ],
  },
  {
    title: '2. Teslimat (Hizmet Sunumu)',
    body: [
      'Ödeme onayının ardından, satın alınan paket veya tek tek testler Alıcının Platform hesabı üzerinden anlık olarak erişime açılır.',
      'Alıcı, hesabına giriş yaparak satın aldığı testleri istediği zaman çözebilir ve sonuç raporlarını görüntüleyebilir/indirebilir.',
      'Test sonuçlarının analiz edilip raporlanma süresi otomatik sistemler için anlıktır. Uzman seansı veya manuel uzman raporu içeren paketlerde teslim süresi 3-7 iş günü olabilir; bu durum satın alma sayfasında belirtilir.',
      'Hizmet sunumunda gecikme yaşanması durumunda Alıcı, info@egitimcheckup.com adresinden destek talep edebilir.',
    ],
  },
  {
    title: '3. Cayma Hakkı (Genel)',
    body: [
      '6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca, Alıcı hizmet sunumundan itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin sözleşmeden cayma hakkına sahiptir.',
      'Cayma bildirimi, kvkk@egitimcheckup.com adresine yazılı olarak yapılır. Bildirimde Alıcı hesabı bilgileri ve satın alma referansı yer almalıdır.',
      'Geçerli cayma talebinin Satıcıya ulaşmasından itibaren 14 gün içinde, ödeme aynı yöntem kullanılarak Alıcıya iade edilir.',
    ],
  },
  {
    title: '4. Cayma Hakkının İstisnaları',
    body: [
      '6502 sayılı Kanunun 15. maddesi ve Mesafeli Sözleşmeler Yönetmeliği gereğince, aşağıdaki hallerde cayma hakkı kullanılamaz:',
      'Alıcının onayı ile başlayan ve tamamen ifa edilmiş hizmetler. Yani Alıcı testleri çözmeye başlamış ve raporları görüntülemişse, hizmet ifa edilmiş kabul edilir.',
      'Anında ifa edilen dijital içerik hizmetlerinde, Alıcı sözleşmenin ifasının başlamasını açıkça onayladığı durumlarda.',
      'Satıcının önerisi: Cayma hakkını kullanmak isteyen Alıcının, testleri çözmeden önce başvurmasıdır. Test çözüldükten ve rapor görüntülendikten sonra cayma hakkı kullanılamayabilir.',
    ],
  },
  {
    title: '5. İade Süreçleri',
    body: [
      'Geçerli cayma talebi onaylandığında, ödeme tutarı 14 gün içinde Alıcının ödeme yaptığı kart veya hesaba iade edilir.',
      'iyzico ve banka süreçleri sebebiyle iadenin Alıcının hesabına yansıması bankaya bağlı olarak 1-10 iş günü sürebilir.',
      'Kısmi iade: Eğer Alıcı pakete dahil testlerin bir kısmını çözmüş ise, çözülmemiş testlerin oransal bedeli iade edilebilir. Bu durum vakaya göre değerlendirilir.',
      'İadeyle ilgili herhangi bir sorun yaşanması durumunda info@egitimcheckup.com adresine ulaşabilirsiniz.',
    ],
  },
  {
    title: '6. Hizmet Hatası Durumları',
    body: [
      'Platform kaynaklı teknik sorunlar nedeniyle Alıcı testleri çözememiş veya raporlarına erişememiş ise, sorun giderilene kadar hizmet süresi uzatılır veya tam iade yapılır. Sorumluluk Satıcıya aittir.',
      'Yanlış paket satın alma durumunda, hizmet henüz başlatılmamışsa (test çözülmemişse) Alıcı talebi üzerine paket değişikliği veya iade yapılabilir.',
      'Ödeme onayı alınmasına rağmen hizmete erişim sağlanamadığı durumlarda, en geç 24 saat içinde sorun giderilir veya tam iade yapılır.',
    ],
  },
  {
    title: '7. Hesap Erişimi ve Hizmet Süresi',
    body: [
      'Satın alınan paketin hizmet süresi, satın alma anında belirtilir. Sürenin sonunda paket içeriğine erişim sona erer; ancak Alıcının daha önce indirdiği raporlar Alıcının kendi cihazında saklı kalır.',
      'Sınırsız süreli paket sunulmamaktadır; her paket için makul bir kullanım süresi tanımlanmıştır.',
      'Ücretsiz hesap üzerinden Platform tanıtım amacıyla sınırlı içeriğe erişim sağlanabilir.',
    ],
  },
  {
    title: '8. İletişim',
    body: [
      'Sipariş, ödeme, iade ve teslimat ile ilgili tüm sorular için: info@egitimcheckup.com',
      'KVKK ve veri başvuruları için: kvkk@egitimcheckup.com',
      'Tüm e-postalar en geç 1 iş günü içinde yanıtlanır.',
      'Bu metin ' + UPDATED_AT + ' tarihinde güncellenmiştir.',
    ],
  },
];

export default function ReturnsAndDeliveryPage() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8] print:bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10 print:py-4">
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

        <article className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-8 md:p-12 print:shadow-none print:border-0 print:p-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f2847]">İade ve Teslimat Şartları</h1>
              <p className="text-xs text-gray-500">Güncelleme: {UPDATED_AT}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            Eğitim Check-Up Pro dijital bir hizmettir. Fiziksel teslimat yapılmaz. Bu metin, hizmet sunumu ve iade süreçlerini açıklar.
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
              <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-[#0f2847]">Mesafeli Satış Sözleşmesi</Link>
              <span>·</span>
              <Link href="/kvkk" className="hover:text-[#0f2847] inline-flex items-center gap-1"><Shield className="w-3 h-3" /> KVKK</Link>
              <span>·</span>
              <a href="mailto:info@egitimcheckup.com" className="hover:text-[#0f2847] inline-flex items-center gap-1"><Mail className="w-3 h-3" /> info@egitimcheckup.com</a>
            </div>
            © {new Date().getFullYear()} Eğitim Check-Up Pro
          </div>
        </article>
      </div>
    </div>
  );
}
