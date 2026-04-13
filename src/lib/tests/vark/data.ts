// ============================================================
// VARK Öğrenme Stilleri — Veri
// ============================================================

export interface VarkQuestion {
  id: number;
  text: string;
  options: { a: string; b: string; c: string; d: string };
}

export const VARK_SCORING: Record<number, Record<string, string>> = {
  1:  { a: 'K', b: 'A', c: 'R', d: 'V' },
  2:  { a: 'V', b: 'A', c: 'R', d: 'K' },
  3:  { a: 'K', b: 'V', c: 'R', d: 'A' },
  4:  { a: 'K', b: 'A', c: 'V', d: 'R' },
  5:  { a: 'A', b: 'V', c: 'K', d: 'R' },
  6:  { a: 'K', b: 'R', c: 'V', d: 'A' },
  7:  { a: 'K', b: 'A', c: 'V', d: 'R' },
  8:  { a: 'R', b: 'K', c: 'A', d: 'V' },
  9:  { a: 'R', b: 'A', c: 'K', d: 'V' },
  10: { a: 'K', b: 'V', c: 'R', d: 'A' },
  11: { a: 'V', b: 'R', c: 'A', d: 'K' },
  12: { a: 'A', b: 'R', c: 'V', d: 'K' },
  13: { a: 'K', b: 'A', c: 'R', d: 'V' },
  14: { a: 'K', b: 'R', c: 'A', d: 'V' },
  15: { a: 'K', b: 'A', c: 'R', d: 'V' },
  16: { a: 'V', b: 'A', c: 'R', d: 'K' },
};

export const VARK_QUESTIONS: VarkQuestion[] = [
  { id: 1,  text: "Bir yere gitmek istiyorsun ama yolu bilmiyorsun. Ne yaparsın?", options: { a: "Doğru yönde yürümeye başlar, yolu bulmaya çalışırım.", b: "Birinden yol tarifi isterim veya sesli navigasyon kullanırım.", c: "Yol tarifini yazılı olarak okurum.", d: "Harita veya navigasyondaki haritaya bakarım." } },
  { id: 2,  text: "Bir internet sitesinde grafik nasıl yapılır diye bir video var. En çok hangisinden öğrenirsin?", options: { a: "Şemaları ve diyagramları görerek.", b: "Anlatanı dinleyerek.", c: "Yazılı açıklamaları okuyarak.", d: "Yapılan işlemleri izleyerek." } },
  { id: 3,  text: "Katılacağın bir gezi hakkında bilgi edinmek istiyorsun. Ne yaparsın?", options: { a: "Gezinin etkinlik ve öne çıkan yerlerinin detaylarına bakarım.", b: "Haritaya bakıp gidilecek yerleri görürüm.", c: "Gezi programını okuyarak bilgi edinirim.", d: "Geziyi planlayan kişiyle ya da gidecek olan arkadaşlarımla konuşurum." } },
  { id: 4,  text: "Gelecekte ne yapmak istediğine karar verirken hangisi senin için önemlidir?", options: { a: "Bilgimi gerçek durumlarla uygulayabilmek.", b: "Başkalarıyla tartışarak iletişim kurabilmek.", c: "Tasarımlarla, haritalarla veya çizelgelerle çalışabilmek.", d: "Yazarak kendimi iyi ifade edebilmek." } },
  { id: 5,  text: "Bir şey öğrenirken hangisini tercih edersin?", options: { a: "Konuyu biriyle konuşarak tartışmayı.", b: "Kalıpları ve örüntüleri görmeyi.", c: "Örnekler ve uygulamalar üzerinden denemeyi.", d: "Kitap, makale ve ders notlarını okumayı." } },
  { id: 6,  text: "Birçok seçenek arasında karar vermen gerekiyor. Ne yaparsın?", options: { a: "Her seçeneği kendi bilgilerimle örnekleyerek değerlendiririm.", b: "Seçenekleri anlatan yazılı bir belgeyi okurum.", c: "Karşılaştırma grafikleri ve tabloları incelerim.", d: "Konuyu bilen biriyle konuşurum." } },
  { id: 7,  text: "Yeni bir masa oyunu veya kart oyunu öğrenmek istiyorsun. Ne yaparsın?", options: { a: "Başkalarının oynamasını izler, sonra katılırım.", b: "Birinin bana anlatmasını ve soru sormamı tercih ederim.", c: "Oyunun şemalarını ve strateji diyagramlarını incelerim.", d: "Oyunun kurallarını okurum." } },
  { id: 8,  text: "Sağlığınla ilgili bir konu hakkında bilgi edinmek istiyorsun. Ne yaparsın?", options: { a: "Konuyla ilgili bir makale veya yazı okurum.", b: "Konuyu anlatan bir model veya görsel üzerinde incelerim.", c: "Doktorla veya konuyu bilenle detaylı konuşurum.", d: "Konuyu gösteren bir şema veya diyagrama bakarım." } },
  { id: 9,  text: "Bilgisayarda yeni bir şey öğrenmek istiyorsun. Ne yaparsın?", options: { a: "Yazılı kullanım kılavuzunu okurum.", b: "Konuyu bilen birinden sözlü anlatım dinlerim.", c: "Deneme-yanılma yöntemiyle kendim denerim.", d: "Kitaptaki veya ekrandaki diyagramları takip ederim." } },
  { id: 10, text: "İnternetten bir şey öğrenirken hangisini tercih edersin?", options: { a: "Nasıl yapıldığını gösteren videoları.", b: "İlginç tasarımları ve görsel özellikleri.", c: "Detaylı yazılı makaleleri.", d: "Uzmanların konuştuğu podcastleri ve videoları." } },
  { id: 11, text: "Yeni bir proje hakkında bilgi almak istiyorsun. Ne istersin?", options: { a: "Proje aşamalarını gösteren şemalar ve grafikler.", b: "Projenin ana özelliklerini anlatan yazılı bir rapor.", c: "Projeyi tartışma fırsatı.", d: "Projenin başarıyla uygulandığı örnekler." } },
  { id: 12, text: "Daha iyi fotoğraf çekmeyi öğrenmek istiyorsun. Ne yaparsın?", options: { a: "Soru sorar, kamera ve özellikleri hakkında konuşurum.", b: "Ne yapılması gerektiğini anlatan yazılı talimatları okurum.", c: "Kameranın her parçasını gösteren şemaları incelerim.", d: "İyi ve kötü fotoğraf örneklerini inceleyerek farkları anlarım." } },
  { id: 13, text: "Bir öğretmenin veya sunum yapan birinin hangisini kullanmasını tercih edersin?", options: { a: "Gösteriler, modeller veya uygulamalı çalışmalar.", b: "Soru-cevap, tartışma veya konuk konuşmacılar.", c: "Ders notları, kitaplar veya okuma materyalleri.", d: "Şemalar, grafikler, haritalar veya çizelgeler." } },
  { id: 14, text: "Bir sınavdan veya yarışmadan sonra geri bildirim almak istiyorsun. Nasıl almayı tercih edersin?", options: { a: "Yaptıklarımdan örneklerle.", b: "Sonuçlarımın yazılı açıklamasıyla.", c: "Birinin benimle konuşarak açıklamasıyla.", d: "Performansımı gösteren grafiklerle." } },
  { id: 15, text: "Bir evi veya daireyi ziyaret etmeden önce ne istersin?", options: { a: "Evin videosunu izlemeyi.", b: "Ev sahibiyle konuşmayı.", c: "Odaların ve özelliklerin yazılı açıklamasını okumayı.", d: "Oda planını ve bölge haritasını görmeyi." } },
  { id: 16, text: "Parçalardan oluşan bir mobilyayı kurmakta zorlanıyorsun. Ne yaparsın?", options: { a: "Montaj aşamalarını gösteren şemaları incelerim.", b: "Daha önce mobilya kurmuş birinden tavsiye isterim.", c: "Birlikte gelen yazılı talimatları okurum.", d: "Benzer bir mobilyayı kuran birinin videosunu izlerim." } },
];

export interface VarkStyleInfo {
  name: string;
  icon: string;
  description: string;
  characteristics: string[];
  studyTips: string[];
  avoid: string;
}

export const VARK_STYLES: Record<string, VarkStyleInfo> = {
  V: {
    name: "Görsel (Visual)",
    icon: "👁️",
    description: "Sen görsel bir öğrenicisin! Şemalar, grafikler, haritalar ve diyagramlar senin en iyi öğrenme araçların.",
    characteristics: ["Haritalar, grafikler ve şemalardan kolay öğrenir", "Bilgiyi görsel düzende organize etmeyi sever", "Renk kodlama ve vurgulama kullanır", "Mekânsal düzenleme ve tasarım becerileri güçlüdür"],
    studyTips: ["📊 Zihin haritaları ve kavram haritaları çiz.", "🎨 Renkli kalemler ve fosforlu kalemler kullan.", "📐 Konuları şema, diyagram ve tablo halinde düzenle.", "🗺️ Akış şemaları ve süreç diyagramları oluştur.", "📋 Not alırken oklar, kutucuklar ve semboller kullan."],
    avoid: "Uzun düz metinler ve sesli anlatımlar seni sıkabilir — görselleştir!",
  },
  A: {
    name: "İşitsel (Aural)",
    icon: "👂",
    description: "Sen işitsel bir öğrenicisin! Dinleyerek, tartışarak ve konuşarak en iyi şekilde öğreniyorsun.",
    characteristics: ["Dersleri dinleyerek daha iyi anlar", "Tartışma ve soru-cevapla öğrenir", "Sesli tekrar yaparak ezberler", "Müzik ve ritimlerle bilgiyi hatırlar"],
    studyTips: ["🎧 Ders sesli kayıtlarını dinle veya kendi kayıtlarını yap.", "🗣️ Öğrendiğin konuları birine sesli anlat.", "💬 Çalışma gruplarında tartışarak öğren.", "🎵 Önemli bilgileri kafiyeli veya ritmik cümlelerle ezberle.", "📱 Podcast ve sesli kitaplardan yararlan."],
    avoid: "Sessiz ve uzun okuma seansları seni yorabilir — sesli çalış!",
  },
  R: {
    name: "Okuma/Yazma (Read/Write)",
    icon: "📖",
    description: "Sen okuyarak ve yazarak öğrenen birisin! Yazılı materyaller senin en güçlü öğrenme kaynağın.",
    characteristics: ["Kitap, makale ve ders notlarını okuyarak öğrenir", "Not almayı ve yazarak tekrar yapmayı sever", "Listeler ve yazılı planlar oluşturur", "Sözlükler ve ansiklopedileri kullanır"],
    studyTips: ["📝 Bol bol not al ve notlarını düzenle.", "📋 Öğrendiğin konuları kendi kelimelerinle yaz.", "📚 Ders kitapları ve ek okuma kaynakları kullan.", "🗒️ Listeler, özetler ve tanım kartları (flashcard) hazırla.", "✍️ Sınava hazırlanırken soruları yazarak çalış."],
    avoid: "Sadece dinleme veya izleme yetersiz kalabilir — oku ve yaz!",
  },
  K: {
    name: "Kinestetik (Kinesthetic)",
    icon: "🤸",
    description: "Sen yaparak ve deneyerek öğrenen birisin! Uygulamalı etkinlikler senin en etkili öğrenme yolun.",
    characteristics: ["Yaparak ve deneyerek öğrenir", "Uygulamalı çalışmaları tercih eder", "Gerçek hayat örnekleriyle konuları anlar", "Hareket ederken daha iyi düşünür"],
    studyTips: ["🔬 Laboratuvar çalışmaları ve deneyler yap.", "🚶 Ders çalışırken yürüyerek tekrar et.", "🎭 Konuları canlandırarak veya rol yaparak öğren.", "✋ Model ve maketler yaparak somutlaştır.", "⏱️ Kısa süreli çalış, sık sık mola ver ve hareket et."],
    avoid: "Uzun süre oturup okumak seni yorabilir — hareket et ve uygula!",
  },
};
