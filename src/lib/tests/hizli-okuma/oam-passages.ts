// ============================================================
// Okuma Analiz Merkezi'nden aktarılan hızlı okuma metinleri
// Sınıf bazlı (1-8) — her sınıf için özel metin + 10 soru
// ============================================================
import type { ReadingPassage } from '../types';

export const OAM_PASSAGES: Record<number, ReadingPassage> = {
  1: {
    id: 'oam_s1', title: 'Bahçedeki Hayvanlar',
    text: "Elif'in evinin bahçesinde hayvanlar vardı. Bir köpek, iki kedi ve üç tavuk yaşardı. Köpeğin adı Karabaş'tı. Kedilerin biri beyaz, diğeri siyahtı. Tavuklar her gün yumurta yapardı. Elif her sabah tavukların yumurtalarını toplardı. Annesi bu yumurtalarla kahvaltı hazırlardı. Karabaş bahçeyi beklerdi. Kediler güneşte uyurdu. Elif hayvanlarını çok severdi.",
    questions: [
      { id:'oam_s1_q1', text:"Elif'in bahçesinde kaç tür hayvan vardı?", options:{a:'2',b:'3',c:'4',d:'5'}, answer:'b' },
      { id:'oam_s1_q2', text:'Köpeğin adı neydi?', options:{a:'Pamuk',b:'Karabaş',c:'Boncuk',d:'Çomar'}, answer:'b' },
      { id:'oam_s1_q3', text:'Bahçede kaç tavuk vardı?', options:{a:'1',b:'2',c:'3',d:'4'}, answer:'c' },
      { id:'oam_s1_q4', text:'Kedilerin rengi neydi?', options:{a:'İkisi beyaz',b:'Beyaz ve siyah',c:'İkisi siyah',d:'Beyaz ve gri'}, answer:'b' },
      { id:'oam_s1_q5', text:'Elif her sabah ne toplardı?', options:{a:'Çiçek',b:'Meyve',c:'Yumurta',d:'Sebze'}, answer:'c' },
      { id:'oam_s1_q6', text:'Annesi yumurtalarla ne hazırlardı?', options:{a:'Akşam yemeği',b:'Öğle yemeği',c:'Kahvaltı',d:'Pasta'}, answer:'c' },
      { id:'oam_s1_q7', text:'Karabaş ne yapardı?', options:{a:'Uyurdu',b:'Bahçeyi beklerdi',c:'Oynardı',d:'Koşardı'}, answer:'b' },
      { id:'oam_s1_q8', text:'Kediler nerede uyurdu?', options:{a:'Evde',b:'Güneşte',c:'Ağaçta',d:'Bahçede'}, answer:'b' },
      { id:'oam_s1_q9', text:'Bahçede kaç kedi vardı?', options:{a:'1',b:'2',c:'3',d:'4'}, answer:'b' },
      { id:'oam_s1_q10', text:'Elif hayvanlarına ne hissediyordu?', options:{a:'Korkardı',b:'Sevmezdi',c:'Çok severdi',d:'İlgilenmezdi'}, answer:'c' },
    ],
  },
  2: {
    id: 'oam_s2', title: 'Yağmurlu Gün',
    text: "Bugün hava çok bulutluydu. Mehmet okula giderken yağmur başladı. Şemsiyesini almayı unutmuştu. Koşarak okulun kapısına ulaştı ama ıslanmıştı. Öğretmeni onu görünce endişelendi. Mehmet'e kuru bir havlu verdi. Mehmet saçlarını kuruladı. Teneffüste arkadaşları bahçeye çıktı ama Mehmet sınıfta kaldı. Pencereden yağmuru seyretti. Yağmur damlalarının cama vuruşunu dinledi. Okul çıkışında güneş açmıştı. Gökyüzünde güzel bir gökkuşağı vardı. Mehmet gökkuşağını görünce çok sevindi. Eve gülerek döndü.",
    questions: [
      { id:'oam_s2_q1', text:'Hava nasıldı?', options:{a:'Güneşli',b:'Bulutlu',c:'Karlı',d:'Rüzgârlı'}, answer:'b' },
      { id:'oam_s2_q2', text:'Mehmet neyi unutmuştu?', options:{a:'Çantasını',b:'Şemsiyesini',c:'Ödevini',d:'Montunu'}, answer:'b' },
      { id:'oam_s2_q3', text:'Öğretmeni ona ne verdi?', options:{a:'Mont',b:'Çay',c:'Havlu',d:'Ekmek'}, answer:'c' },
      { id:'oam_s2_q4', text:'Teneffüste Mehmet ne yaptı?', options:{a:'Bahçeye çıktı',b:'Sınıfta kaldı',c:'Uyudu',d:'Kitap okudu'}, answer:'b' },
      { id:'oam_s2_q5', text:'Mehmet pencereden ne seyretti?', options:{a:'Kuşları',b:'Arabaları',c:'Yağmuru',d:'Arkadaşlarını'}, answer:'c' },
      { id:'oam_s2_q6', text:'Okul çıkışında hava nasıldı?', options:{a:'Yağmurlu',b:'Güneş açmıştı',c:'Bulutlu',d:'Karlı'}, answer:'b' },
      { id:'oam_s2_q7', text:'Gökyüzünde ne vardı?', options:{a:'Bulut',b:'Yıldız',c:'Gökkuşağı',d:'Uçak'}, answer:'c' },
      { id:'oam_s2_q8', text:'Mehmet nereye gidiyordu?', options:{a:'Parka',b:'Okula',c:'Markete',d:'Eve'}, answer:'b' },
      { id:'oam_s2_q9', text:'Mehmet okula nasıl ulaştı?', options:{a:'Yürüyerek',b:'Koşarak',c:'Arabayla',d:'Otobüsle'}, answer:'b' },
      { id:'oam_s2_q10', text:'Mehmet eve nasıl döndü?', options:{a:'Ağlayarak',b:'Koşarak',c:'Gülerek',d:'Üzülerek'}, answer:'c' },
    ],
  },
  3: {
    id: 'oam_s3', title: 'Karıncanın Dersi',
    text: "Küçük Ahmet yazın sıcak bir gününde parkta oturuyordu. Bir dondurma yiyordu ve etrafı seyrediyordu. Birden yerde uzun bir karınca sırasını fark etti. Karıncalar bir ekmek kırıntısını taşımaya çalışıyordu. Kırıntı karıncaların boyutuna göre çok büyüktü. Ama karıncalar pes etmiyordu. Bazıları kırıntıyı iterken, bazıları çekerdi. Birlikte çalışarak kırıntıyı yuvalarına doğru taşıdılar.\n\nAhmet bu manzarayı uzun süre izledi. Karıncaların birlikte çalışmasına hayran kaldı. Eve döndüğünde annesine karıncaları anlattı. Annesi gülümsedi ve dedi ki: Karıncalar bize takım çalışmasının gücünü öğretiyor. Tek başına taşıyamadıkları şeyleri birlikte taşıyabiliyorlar. Ahmet o gün önemli bir ders öğrendi: Birlikte çalışmak, en zor işleri bile kolaylaştırır.",
    questions: [
      { id:'oam_s3_q1', text:'Ahmet neredeydi?', options:{a:'Evde',b:'Okulda',c:'Parkta',d:'Bahçede'}, answer:'c' },
      { id:'oam_s3_q2', text:'Ahmet ne yiyordu?', options:{a:'Sandviç',b:'Dondurma',c:'Simit',d:'Çikolata'}, answer:'b' },
      { id:'oam_s3_q3', text:'Karıncalar ne taşıyordu?', options:{a:'Yaprak',b:'Ekmek kırıntısı',c:'Şeker',d:'Böcek'}, answer:'b' },
      { id:'oam_s3_q4', text:'Kırıntı karıncalara göre nasıldı?', options:{a:'Küçüktü',b:'Çok büyüktü',c:'Hafifti',d:'Tam uygundu'}, answer:'b' },
      { id:'oam_s3_q5', text:'Karıncalar ne yapıyordu?', options:{a:'Pes ettiler',b:'Birlikte çalışıyordu',c:'Kavga ediyordu',d:'Uyuyordu'}, answer:'b' },
      { id:'oam_s3_q6', text:'Kırıntıyı nereye taşıdılar?', options:{a:'Ağaca',b:'Suya',c:'Yuvalarına',d:'Çöpe'}, answer:'c' },
      { id:'oam_s3_q7', text:'Ahmet eve dönünce kime anlattı?', options:{a:'Babasına',b:'Annesine',c:'Kardeşine',d:'Arkadaşına'}, answer:'b' },
      { id:'oam_s3_q8', text:'Annesi ne dedi?', options:{a:'Önemsiz',b:'Takım çalışmasının gücü',c:'Karıncalar zararlı',d:'Parkta oturma'}, answer:'b' },
      { id:'oam_s3_q9', text:'Mevsim neydi?', options:{a:'Kış',b:'İlkbahar',c:'Yaz',d:'Sonbahar'}, answer:'c' },
      { id:'oam_s3_q10', text:'Ahmet o gün ne öğrendi?', options:{a:'Dondurma yemeyi',b:'Birlikte çalışmanın gücünü',c:'Karınca türlerini',d:'Park kurallarını'}, answer:'b' },
    ],
  },
  4: {
    id: 'oam_s4', title: 'Deniz Feneri Bekçisi',
    text: "Yıllar önce küçük bir kıyı kasabasında yaşlı bir deniz feneri bekçisi yaşardı. Adı Hasan Dede'ydi. Her akşam fener kulesine çıkar ve ışığı yakardı. Bu ışık, geceleyin denizde yol alan gemilere rehberlik ederdi. Fırtınalı gecelerde bile Hasan Dede görevini asla ihmal etmezdi.\n\nBir kış gecesi korkunç bir fırtına koptu. Rüzgâr uğulduyordu, dalgalar kayalıklara çarpıyordu. Hasan Dede fenerin ışığının söndüğünü fark etti. Hemen kuleye koştu. Merdivenleri tırmanırken rüzgâr onu sallıyordu ama durmadı. Feneri tekrar yaktığında, uzakta bir geminin ışıklarını gördü. Gemi tehlikeli kayalıklara doğru ilerliyordu. Fenerin ışığı sayesinde kaptan rotasını değiştirdi ve gemi kurtuldu.\n\nErtesi gün geminin kaptanı kasabaya gelip Hasan Dede'yi buldu. Elini sıktı ve teşekkür etti. Hasan Dede mütevazı bir şekilde gülümsedi. O gece yine fenerin yanına çıktı, çünkü denizde her zaman birileri ışığa ihtiyaç duyardı.",
    questions: [
      { id:'oam_s4_q1', text:'Hasan Dede ne iş yapardı?', options:{a:'Balıkçı',b:'Fener bekçisi',c:'Kaptan',d:'Öğretmen'}, answer:'b' },
      { id:'oam_s4_q2', text:'Fenerin görevi neydi?', options:{a:'Kasabayı aydınlatmak',b:'Gemilere rehberlik etmek',c:'Balıkları çekmek',d:'Fırtınayı durdurmak'}, answer:'b' },
      { id:'oam_s4_q3', text:'Fırtına ne zaman koptu?', options:{a:'Yaz gecesi',b:'Kış gecesi',c:'Sonbahar sabahı',d:'İlkbahar akşamı'}, answer:'b' },
      { id:'oam_s4_q4', text:'Fenerin ışığına ne oldu?', options:{a:'Parladı',b:'Söndü',c:'Kırıldı',d:'Zayıfladı'}, answer:'b' },
      { id:'oam_s4_q5', text:'Hasan Dede merdivenleri tırmanırken ne oluyordu?', options:{a:'Yağmur yağıyordu',b:'Rüzgâr onu sallıyordu',c:'Kar yağıyordu',d:'Deprem oluyordu'}, answer:'b' },
      { id:'oam_s4_q6', text:'Gemi nereye ilerliyordu?', options:{a:'Limana',b:'Açık denize',c:'Tehlikeli kayalıklara',d:'Başka bir kasabaya'}, answer:'c' },
      { id:'oam_s4_q7', text:'Kaptan ne yaptı?', options:{a:'Durdu',b:'Rotasını değiştirdi',c:'Geri döndü',d:'Yardım istedi'}, answer:'b' },
      { id:'oam_s4_q8', text:'Ertesi gün kaptan ne yaptı?', options:{a:'Gitti',b:'Teşekkür etti',c:'Şikâyet etti',d:'Hediye gönderdi'}, answer:'b' },
      { id:'oam_s4_q9', text:'Hasan Dede fırtınada ne gösterdi?', options:{a:'Korku',b:'Sorumluluk',c:'Kayıtsızlık',d:'Heyecan'}, answer:'b' },
      { id:'oam_s4_q10', text:'Hikâyenin ana mesajı nedir?', options:{a:'Fırtına tehlikelidir',b:'Görev bilinci önemlidir',c:'Gemiler hızlı gider',d:'Kış soğuktur'}, answer:'b' },
    ],
  },
  5: {
    id: 'oam_s5', title: 'Uzay İstasyonunda Bir Gün',
    text: "Astronot Zeynep, Uluslararası Uzay İstasyonu'nda uyandı. Yer çekimi olmadığı için uyku tulumunun içinde havada süzülüyordu. Saati kontrol etti: sabah altı. Dünya'nın bir tarafı güneş ışığıyla aydınlanıyordu, diğer tarafı karanlıktı. Uzay istasyonu doksan dakikada Dünya'nın etrafında bir tur atıyordu, bu yüzden bir günde on altı kez gün doğumu görebiliyordu.\n\nKahvaltısını hazırladı. Uzayda yemek yemek ilginç bir deneyimdi. Su damlacıkları havada yüzüyordu ve yiyecekleri özel kaplardan sıkarak yiyordu. Kahvaltıdan sonra laboratuvara geçti. Bugünkü görevi bitkilerin uzayda nasıl büyüdüğünü incelemekti. Küçük bir serada domates fideleri yetiştiriyordu. Yer çekimi olmadan köklerin farklı yönlere uzandığını gözlemledi.\n\nÖğleden sonra Dünya ile bağlantı kurdu. Bir okuldaki öğrencilerin sorularını yanıtladı. Çocuklar uzayda nasıl yıkandığını, uyuduğunu ve eğlendiğini merak ediyordu. Zeynep onlara uzayın ne kadar büyüleyici olduğunu anlattı. Akşam pencereden Dünya'yı seyrederken, mavi gezegenin ne kadar güzel ve kırılgan olduğunu bir kez daha hissetti.",
    questions: [
      { id:'oam_s5_q1', text:'Zeynep nerede uyandı?', options:{a:'Evde',b:'Uçakta',c:'Uzay istasyonunda',d:'Okulda'}, answer:'c' },
      { id:'oam_s5_q2', text:'Neden havada süzülüyordu?', options:{a:'Uçuyordu',b:'Yer çekimi yoktu',c:'Rüzgâr vardı',d:'Paraşütü vardı'}, answer:'b' },
      { id:'oam_s5_q3', text:'İstasyon Dünya etrafında ne kadar sürede dönüyor?', options:{a:'60 dakika',b:'90 dakika',c:'120 dakika',d:'24 saat'}, answer:'b' },
      { id:'oam_s5_q4', text:'Bir günde kaç kez gün doğumu görebiliyordu?', options:{a:'1',b:'8',c:'16',d:'24'}, answer:'c' },
      { id:'oam_s5_q5', text:'Uzayda su nasıldı?', options:{a:'Donuyordu',b:'Havada yüzüyordu',c:'Buharlaşıyordu',d:'Kayboluyordu'}, answer:'b' },
      { id:'oam_s5_q6', text:"Zeynep'in laboratuvar görevi neydi?", options:{a:'Tamir',b:'Bitki incelemek',c:'Yemek yapmak',d:'Spor yapmak'}, answer:'b' },
      { id:'oam_s5_q7', text:'Ne yetiştiriyordu?', options:{a:'Çilek',b:'Domates',c:'Patates',d:'Biber'}, answer:'b' },
      { id:'oam_s5_q8', text:'Kökler uzayda nasıl uzanıyordu?', options:{a:'Aşağı doğru',b:'Yukarı doğru',c:'Farklı yönlere',d:'Hiç uzanmıyordu'}, answer:'c' },
      { id:'oam_s5_q9', text:'Öğleden sonra ne yaptı?', options:{a:'Uyudu',b:"Öğrencilerin sorularını yanıtladı",c:'Yürüyüş yaptı',d:'Film izledi'}, answer:'b' },
      { id:'oam_s5_q10', text:"Dünya'yı nasıl tanımladı?", options:{a:'Büyük ve sert',b:'Mavi, güzel ve kırılgan',c:'Küçük ve soğuk',d:'Karanlık ve ürkütücü'}, answer:'b' },
    ],
  },
  6: {
    id: 'oam_s6', title: "Eski Mısır'ın Gizemi",
    text: "Mısır piramitleri, insanlık tarihinin en etkileyici yapılarından biridir. Yaklaşık dört bin beş yüz yıl önce inşa edilen Büyük Giza Piramidi, uzun süre dünyanın en yüksek yapısı olma unvanını korumuştur. Bu devasa yapı, yaklaşık iki milyon üç yüz bin taş bloktan oluşur ve her bir blok ortalama iki buçuk ton ağırlığındadır.\n\nPiramitlerin nasıl inşa edildiği hâlâ tartışmalıdır. Bazı araştırmacılar rampa sistemleri kullanıldığını düşünürken, diğerleri iç rampa teorisini savunur. Kesin olan şu ki, bu yapılar dönemin matematik, astronomi ve mühendislik bilgisinin ne kadar ileri olduğunu göstermektedir. Piramitlerin kenarları neredeyse mükemmel bir şekilde kuzeye hizalanmıştır.\n\nPiramitler sadece birer mezar değildi. Firavunların ahiret hayatı için hazırlanan bu yapılarda yiyecekler, mücevherler, mobilyalar ve hatta hizmetkâr heykelleri bulunurdu. Mısırlılar ölümden sonraki yaşama inandıkları için cesetleri mumyalıyorlardı. Mumyalama süreci yaklaşık yetmiş gün sürerdi ve özel rahipler tarafından gerçekleştirilirdi.\n\nBugün piramitler UNESCO Dünya Mirası Listesinde yer alır ve her yıl milyonlarca turist tarafından ziyaret edilir. Antik Mısır medeniyeti, bize insanın inanç, bilim ve kararlılıkla neler başarabileceğini gösteren muhteşem bir mirastır.",
    questions: [
      { id:'oam_s6_q1', text:'Büyük Giza Piramidi kaç yıl önce inşa edildi?', options:{a:'2500',b:'3500',c:'4500',d:'5500'}, answer:'c' },
      { id:'oam_s6_q2', text:'Piramit kaç taş bloktan oluşur?', options:{a:'1.3 milyon',b:'2.3 milyon',c:'3.3 milyon',d:'4.3 milyon'}, answer:'b' },
      { id:'oam_s6_q3', text:'Her taş blok ortalama kaç ton?', options:{a:'1.5 ton',b:'2.5 ton',c:'3.5 ton',d:'5 ton'}, answer:'b' },
      { id:'oam_s6_q4', text:'Piramitlerin kenarları neye hizalıdır?', options:{a:'Güneye',b:'Kuzeye',c:'Doğuya',d:'Batıya'}, answer:'b' },
      { id:'oam_s6_q5', text:'Piramitler kimin için yapılmıştır?', options:{a:'Halk',b:'Askerler',c:'Firavunlar',d:'Rahipler'}, answer:'c' },
      { id:'oam_s6_q6', text:'Piramitlerin içinde ne bulunurdu?', options:{a:'Sadece mumya',b:'Yiyecek ve mücevher',c:'Hiçbir şey',d:'Silahlar'}, answer:'b' },
      { id:'oam_s6_q7', text:'Mumyalama süreci kaç gün sürerdi?', options:{a:'30 gün',b:'50 gün',c:'70 gün',d:'90 gün'}, answer:'c' },
      { id:'oam_s6_q8', text:'Mumyalama kim tarafından yapılırdı?', options:{a:'Askerler',b:'Özel rahipler',c:'Firavunlar',d:'Halk'}, answer:'b' },
      { id:'oam_s6_q9', text:'Piramitler hangi listede yer alır?', options:{a:'Forbes',b:'UNESCO Dünya Mirası',c:'Guinness',d:'National Geographic'}, answer:'b' },
      { id:'oam_s6_q10', text:'Metnin ana fikri nedir?', options:{a:'Piramitler güzeldir',b:'Mısır medeniyetinin ileri düzeyi',c:'Turizm önemlidir',d:'Mumyalama ilginçtir'}, answer:'b' },
    ],
  },
  7: {
    id: 'oam_s7', title: 'Beyin ve Öğrenme',
    text: "İnsan beyni, evrendeki en karmaşık yapılardan biridir. Yaklaşık yüz milyar sinir hücresinden oluşan beyin, bu hücrelerin arasındaki trilyonlarca bağlantıyla çalışır. Her yeni bilgi öğrendiğimizde, beynimizde yeni sinaptik bağlantılar oluşur. Bu süreç nöroplastisite olarak adlandırılır ve beynimizin yaşam boyu değişip gelişebileceği anlamına gelir.\n\nAraştırmalar, öğrenmenin en etkili yollarının pasif dinleme olmadığını gösteriyor. Aktif öğrenme, yani bilgiyi sorgulamak, tartışmak ve uygulamak, beynin daha güçlü bağlantılar kurmasını sağlar. Bir konuyu başkasına öğretmek, öğrenmenin en etkili yollarından biridir. Buna öğretme etkisi denir.\n\nUyku, öğrenme için kritik öneme sahiptir. Gün içinde öğrendiğimiz bilgiler, uyku sırasında uzun süreli belleğe aktarılır. Yeterli uyumayan öğrencilerin öğrenme kapasitesi önemli ölçüde düşer. Egzersiz de beyin sağlığı için vazgeçilmezdir. Fiziksel aktivite beyne daha fazla kan ve oksijen taşır, bu da yeni sinir hücrelerinin oluşmasını destekler.\n\nStres ise öğrenmenin düşmanıdır. Yüksek stres altında kortizol hormonu salgılanır ve bu hormon bellek oluşumunu engeller. Bu nedenle sınav kaygısı yaşayan öğrenciler, bildikleri şeyleri bile hatırlayamayabilir. Nefes egzersizleri, düzenli çalışma ve olumlu düşünme stresi azaltmaya yardımcı olur.\n\nÖzetle, beynimiz inanılmaz bir öğrenme makinesidir. Onu doğru beslemek, yeterince uyumak, aktif öğrenme yöntemlerini kullanmak ve stresi yönetmek, akademik başarının anahtarlarıdır.",
    questions: [
      { id:'oam_s7_q1', text:'İnsan beyninde kaç sinir hücresi vardır?', options:{a:'1 milyar',b:'10 milyar',c:'100 milyar',d:'1 trilyon'}, answer:'c' },
      { id:'oam_s7_q2', text:'Yeni bağlantılar oluşması sürecine ne denir?', options:{a:'Nöroloji',b:'Nöroplastisite',c:'Nörotransmisyon',d:'Nörojenez'}, answer:'b' },
      { id:'oam_s7_q3', text:'En etkili öğrenme yolu hangisidir?', options:{a:'Pasif dinleme',b:'Aktif öğrenme',c:'Ezber',d:'Video izleme'}, answer:'b' },
      { id:'oam_s7_q4', text:'Öğretme etkisi nedir?', options:{a:'Öğretmen olmak',b:'Başkasına öğreterek öğrenmek',c:'Kitap okumak',d:'Not tutmak'}, answer:'b' },
      { id:'oam_s7_q5', text:'Uyku sırasında bilgi nereye aktarılır?', options:{a:'Kısa süreli bellek',b:'Uzun süreli bellek',c:'Bilinçaltı',d:'Refleks bellek'}, answer:'b' },
      { id:'oam_s7_q6', text:'Egzersiz beyne ne sağlar?', options:{a:'Daha az enerji',b:'Daha fazla kan ve oksijen',c:'Daha az bağlantı',d:'Daha az uyku'}, answer:'b' },
      { id:'oam_s7_q7', text:'Stres altında hangi hormon salgılanır?', options:{a:'Dopamin',b:'Serotonin',c:'Kortizol',d:'Adrenalin'}, answer:'c' },
      { id:'oam_s7_q8', text:'Kortizol ne yapar?', options:{a:'Belleği güçlendirir',b:'Bellek oluşumunu engeller',c:'Uyku düzenler',d:'Mutlu eder'}, answer:'b' },
      { id:'oam_s7_q9', text:'Sınav kaygısı ne yapar?', options:{a:'Daha iyi hatırlatır',b:'Bilinenlerin hatırlanmasını zorlaştırır',c:'Konsantrasyonu artırır',d:'Hiçbir etkisi yok'}, answer:'b' },
      { id:'oam_s7_q10', text:'Akademik başarının anahtarı hangisi DEĞİLDİR?', options:{a:'Yeterli uyku',b:'Aktif öğrenme',c:'Yüksek stres',d:'Egzersiz'}, answer:'c' },
    ],
  },
  8: {
    id: 'oam_s8', title: 'İklim Değişikliği ve Geleceğimiz',
    text: "Dünya'nın ortalama sıcaklığı sanayi devriminden bu yana yaklaşık bir virgül bir derece artmıştır. Bu rakam küçük görünse de etkileri devasa boyutlardadır. Kutup buzulları eriyor, deniz seviyeleri yükseliyor, aşırı hava olayları sıklaşıyor ve ekosistemler bozuluyor. Bilim insanları, bu değişikliklerin büyük ölçüde insan faaliyetlerinden kaynaklandığı konusunda hemfikir.\n\nFosil yakıtların yakılması, ormansızlaşma ve endüstriyel süreçler atmosfere büyük miktarda sera gazı salıyor. Bu gazlar güneşten gelen ısıyı atmosferde hapsederek sera etkisi yaratıyor. Karbondioksit, metan ve diazot monoksit başlıca sera gazlarıdır. Özellikle karbondioksit seviyesi, son sekiz yüz bin yılın en yüksek düzeyine ulaşmıştır.\n\nİklim değişikliğinin etkileri eşit dağılmıyor. Küçük ada devletleri yükselen deniz seviyesi nedeniyle varlık tehlikesiyle karşı karşıya. Afrika ve Güney Asya'daki tarım toplulukları kuraklık ve sel felaketlerinden en çok etkilenen gruplar arasında.\n\nÇözümler hem bireysel hem de küresel düzeyde olmalı. Yenilenebilir enerji kaynaklarına geçiş, enerji verimliliğinin artırılması, sürdürülebilir tarım ve ormancılık uygulamaları ile karbon yakalama teknolojileri mücadelenin temel unsurları. Bireysel olarak ise enerji tasarrufu yapmak, toplu taşıma kullanmak, geri dönüşüme önem vermek ve bilinçli tüketim alışkanlıkları geliştirmek herkesin yapabileceği katkılardır.\n\nParis İklim Anlaşması kapsamında ülkeler, küresel sıcaklık artışını iki derecenin altında tutmayı ve mümkünse bir virgül beş dereceyle sınırlamayı hedefliyor.",
    questions: [
      { id:'oam_s8_q1', text:'Sanayi devriminden bu yana sıcaklık kaç derece arttı?', options:{a:'0.5°C',b:'1.1°C',c:'2.0°C',d:'3.5°C'}, answer:'b' },
      { id:'oam_s8_q2', text:'Sera etkisi nasıl oluşur?', options:{a:'Güneş büyür',b:'Gazlar ısıyı atmosferde hapseder',c:'Okyanuslar ısınır',d:'Buzullar erir'}, answer:'b' },
      { id:'oam_s8_q3', text:'Hangisi sera gazı DEĞİLDİR?', options:{a:'Karbondioksit',b:'Metan',c:'Oksijen',d:'Diazot monoksit'}, answer:'c' },
      { id:'oam_s8_q4', text:'CO2 seviyesi kaç yılın en yükseğinde?', options:{a:'100.000',b:'500.000',c:'800.000',d:'1.000.000'}, answer:'c' },
      { id:'oam_s8_q5', text:'Küçük ada devletlerinin sorunu nedir?', options:{a:'Deprem',b:'Yükselen deniz seviyesi',c:'Volkan',d:'Tsunami'}, answer:'b' },
      { id:'oam_s8_q6', text:'İklim değişikliğine en az katkıda bulunan ülkeler ne yaşıyor?', options:{a:'En az zarar',b:'En çok fayda',c:'En çok zarar',d:'Hiçbir etki yok'}, answer:'c' },
      { id:'oam_s8_q7', text:'Hangisi çözüm önerisi DEĞİLDİR?', options:{a:'Yenilenebilir enerji',b:'Daha fazla fosil yakıt',c:'Geri dönüşüm',d:'Enerji tasarrufu'}, answer:'b' },
      { id:'oam_s8_q8', text:'Paris Anlaşması hedefi nedir?', options:{a:'Sıcaklık artışını 2°C altında tutmak',b:'Tüm fabrikaları kapatmak',c:'Arabaları yasaklamak',d:'Ormanları korumak'}, answer:'a' },
      { id:'oam_s8_q9', text:'Bireysel olarak ne yapabiliriz?', options:{a:'Hiçbir şey',b:'Enerji tasarrufu ve geri dönüşüm',c:'Sadece hükümet çözebilir',d:'Daha fazla tüketim'}, answer:'b' },
      { id:'oam_s8_q10', text:'Metnin temel mesajı nedir?', options:{a:'İklim değişikliği doğal',b:'Bireysel ve küresel çözüm şart',c:'Teknoloji her şeyi çözer',d:'Sorun abartılıyor'}, answer:'b' },
    ],
  },
};

/** Sınıf numarasına göre OAM metnini döndürür (1-8 arası). Yoksa null. */
export function getOamPassage(grade: number): ReadingPassage | null {
  return OAM_PASSAGES[grade] ?? null;
}
