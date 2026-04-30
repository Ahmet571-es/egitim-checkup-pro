'use client';
/**
 * Faz 1: Mesafeli Satış Sözleşmesi
 * Public page — proxy.ts PUBLIC_PATHS içerisinde '/mesafeli-satis-sozlesmesi' eklenmiş.
 * 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ilgili yönetmelikler kapsamında hazırlanmıştır.
 */
import Link from 'next/link';
import { ArrowLeft, Printer, FileText, Shield, Mail } from 'lucide-react';

const UPDATED_AT = '30 Nisan 2026';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Taraflar',
    body: [
      'SATICI: Otonom Reklam Ajansı, Ankara, Türkiye (bundan sonra "Satıcı" olarak anılacaktır).',
      'ALICI: Platform üzerinden hizmet satın alan gerçek veya tüzel kişi (bundan sonra "Alıcı" olarak anılacaktır).',
      'Satıcının iletişim bilgileri: info@egitimcheckup.com — egitim-checkup.com',
    ],
  },
  {
    title: '2. Sözleşmenin Konusu',
    body: [
      'İşbu sözleşme, Alıcının Satıcıya ait Platform üzerinden elektronik ortamda satın aldığı, niteliği ve fiyatı aşağıda belirtilen dijital eğitim hizmetlerinin satışı ve sunumu ile ilgili olarak tarafların hak ve yükümlülüklerini belirler.',
      '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uygulanır.',
    ],
  },
  {
    title: '3. Sözleşme Konusu Hizmetin Niteliği',
    body: [
      'Hizmet türü: Dijital ortamda sunulan psikometrik test ve yapay zekâ destekli analiz raporu hizmeti.',
      'Hizmet kapsamı: Alıcının seçtiği paket ve/veya tek tek testlerin Platform üzerinden gerçekleştirilmesi, sonuçların analiz edilmesi ve detaylı rapor sunulması.',
      'Teslim şekli: Hizmet, ödemenin onaylanmasının ardından Alıcının Platform hesabı üzerinden anlık olarak erişime açılır. Fiziksel teslimat söz konusu değildir.',
      'Hizmet süresi: Paket içeriğine bağlı olarak değişkendir; satın alma sayfasında belirtilir.',
      'Fiyat: Sözleşme konusu hizmetin fiyatı, satın alma anında Platform üzerinde gösterilen ve onaylanan tutardır. KDV dahildir.',
    ],
  },
  {
    title: '4. Genel Hükümler',
    body: [
      'Alıcı, sözleşme konusu hizmetin temel nitelikleri, satış fiyatı ve ödeme şekli hakkında bilgi sahibi olduğunu, gerekli teyidi elektronik ortamda verdiğini kabul eder.',
      'Alıcı, Platform üzerinde sunulan kayıt formunu eksiksiz ve doğru biçimde doldurmakla yükümlüdür. Yanlış veya eksik bilgi sebebiyle doğacak sorunlardan Alıcı sorumludur.',
      'Hizmet bedeli, ödeme altyapı sağlayıcısı (iyzico) aracılığıyla tahsil edilir. Satıcı, kart bilgilerine doğrudan erişmez.',
      'Satın alma işleminin tamamlanmasının ardından elektronik fatura, Alıcının kayıtlı e-posta adresine gönderilir.',
    ],
  },
  {
    title: '5. Cayma Hakkı',
    body: [
      'Alıcı, sözleşme konusu hizmetin kendisine sunulmasından itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.',
      'Cayma hakkının kullanılması için bu süre içinde Satıcıya kvkk@egitimcheckup.com adresinden yazılı bildirim yapılması gerekir.',
      'Cayma bildiriminin Satıcıya ulaştığı tarihten itibaren 14 gün içinde, ödeme aynı yöntem kullanılarak Alıcıya iade edilir.',
    ],
  },
  {
    title: '6. Cayma Hakkının Kullanılamayacağı Durumlar',
    body: [
      '6502 sayılı Kanunun 15. maddesi ve Mesafeli Sözleşmeler Yönetmeliği\'nin 15. maddesi uyarınca, aşağıdaki hallerde cayma hakkı kullanılamaz:',
      'Alıcının onayı ile ifasına başlanan ve sözleşme süresi içinde tamamen ifa edilen hizmetler. Yani Alıcı testleri çözmüş ve raporları indirip görüntülemişse, bu kapsamda hizmet ifa edilmiş sayılır.',
      'Elektronik ortamda anında ifa edilen hizmetlerde, Alıcı sözleşmenin ifasının başlamasını açıkça onayladığı durumlar.',
      'Bu sebeple, Alıcı testleri çözmeye başlamadan önce cayma hakkını kullanması önerilir.',
    ],
  },
  {
    title: '7. Sorumluluk Sınırlaması',
    body: [
      'Satıcı, Platform üzerinde sunulan testlerin bilimsel temele dayandığını taahhüt eder. Ancak test sonuçları yalnızca yönlendirici niteliktedir; psikolojik veya tıbbi teşhis amacı taşımaz.',
      'Yapay zekâ destekli analiz raporları danışmanlık niteliğinde olup, kesin tavsiye veya tıbbi öneri olarak yorumlanmamalıdır. Profesyonel destek ihtiyacı durumunda uzman psikolog veya rehberlik öğretmeni ile görüşülmesi önerilir.',
      'Mücbir sebepler (doğal afet, internet kesintisi, hizmet sağlayıcı arızaları vb.) nedeniyle hizmet sunumunda yaşanan gecikmelerden Satıcı sorumlu tutulamaz.',
    ],
  },
  {
    title: '8. Uyuşmazlık Çözümü',
    body: [
      'İşbu sözleşmeden doğan uyuşmazlıklarda, ilgili yıl için Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. Tüketici Hakem Heyeti parasal sınırı her yıl Ticaret Bakanlığı tarafından güncellenmektedir.',
      'Uyuşmazlıklar öncelikle dostane çözüm yoluyla giderilmeye çalışılır. Bu amaçla Alıcı, info@egitimcheckup.com adresine başvurabilir.',
    ],
  },
  {
    title: '9. Yürürlük',
    body: [
      'Alıcı, Platform üzerinden satın alma işlemini onayladığında, işbu sözleşme şartlarını ve cayma hakkı bilgilendirmesini eksiksiz okuduğunu, anladığını ve kabul ettiğini beyan etmiş olur.',
      'Sözleşme, Alıcının elektronik onayı ile yürürlüğe girer. Satıcı, sözleşmenin elektronik kaydını saklar.',
      'Bu metin ' + UPDATED_AT + ' tarihinde güncellenmiştir.',
    ],
  },
];

export default function DistanceSalesAgreementPage() {
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f2847]">Mesafeli Satış Sözleşmesi</h1>
              <p className="text-xs text-gray-500">Güncelleme: {UPDATED_AT}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında hazırlanmıştır. Lütfen satın alma işleminden önce dikkatlice okuyunuz.
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
              <Link href="/iade-ve-teslimat-sartlari" className="hover:text-[#0f2847]">İade ve Teslimat Şartları</Link>
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
