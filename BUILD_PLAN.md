# koturutin — Ana Yapım Planı (BUILD_PLAN)

> Bu belge, koturutin'i hayata geçirmek için okunacak **ilk** belgedir. Kurucuya (sana) hitap eder:
> uygulamanın ne olduğunu, hangi sırayla ve neden inşa edileceğini, Claude Code + Playbook ile bunu
> pratikte nasıl yürüteceğini bir arada anlatır. Detayları tekrar etmez; özetler ve doğru belgeye yönlendirir.
>
> `docs/SPINE.md`, ürünün **kaynak özeti** (originating brief) — tüm kimlikler, varlık adları ve
> terimler oradan gelir. Ancak AGENTS.md §5 gereği depodaki **yetkili (authoritative) belge zinciri**
> şudur: `README.md` → `docs/PRODUCT_SPEC.md` → `docs/USER_FLOWS.md` → `docs/ARCHITECTURE.md` →
> `docs/DATABASE.md`. Özet ile onaylı bir belge çelişirse onaylı zincir kazanır. Diğer belgeler:
> `docs/IMPLEMENTATION_PLAN.md`, `docs/VALIDATION_PLAN.md`, `docs/DECISIONS.md`, `docs/PROJECT_STATUS.md`.
>
> Ton: net, cesaretlendirici, ama emek ve risk konusunda dürüst. Teknik özel adlar (Expo, React Native,
> Supabase, RLS, Edge Function, Claude Code) İngilizce bırakılmıştır — bunlar terimdir, çeviri değil.

---

## 1. Vizyon ve tek cümlelik konum

koturutin, iki dilli (Türkçe + İngilizce) bir **bağlamsal rutin laboratuvarı** (bağlamsal rutin
rehberi). Yaptığı iş üç adımda özetlenir: insanın gün içindeki **otomatik zincirlerini görünür kılmak**;
**doğru geçiş anında** ona kendine uyan **tek bir küçük davranış deneyi** önermek; ve neyin gerçekten işe
yaradığını kullanıcıyla birlikte öğrenmek — böylece kişi **gerçek hayatta** daha bilinçli seçimler yapsın
ve zamanla uygulamaya **daha az** ihtiyaç duysun.

**Ürün sesiyle konumlanma cümlesi:**

> "Gününün otomatiğe bağlandığı anları fark et; tam o anda sana uyan küçük bir alternatifi dene;
> neyin gerçekten işe yaradığını birlikte öğren."

**Ne DEĞİL (bunlar ihlal edilirse P0/kapsam hatasıdır — SPINE §1):**

- Terapi, tedavi, tanı değil. Serbest metinli bir "yapay zeka terapisti" değil.
- Seri/streak sayan, "yine başaramadın" diyen bir alışkanlık takipçisi değil.
- Hiçbir davranışı (kahve, sigara, podcast, yalnızlık) "kötü" diye etiketlemez. Hangi davranışın kendisine
  pahalıya mal olduğuna **kullanıcı** karar verir; sistem, o davranışın *işlevini* karşılayan daha iyi bir
  seçenek bulmaya yardım eder.

**North Star (kuzey yıldızı) metriği:** *haftalık başarılı bilinçli geçiş* sayısı — yani gerçek hayatta,
hedeflenen bir anda verilen bilinçli bir seçim. Uygulamada geçirilen süre **değil**, streak **değil**
(SPINE §0, §15; `README.md`).

Amaç en sade haliyle şudur: **kullanıcıyı hayatına geri döndürmek**, uygulama içi bağlılığı büyütmek değil.
Ürünün başarısı ekranda değil, gerçek hayatta ölçülür.

---

## 2. İki parçalı strateji: Önce doğrula, sonra inşa et

Bu proje bilerek iki ayrı raya bölünmüştür. **Sırasız yürütülemez.**

### Track A — Önce doğrula (kod yazmadan, ~10 hafta)

Tek bir satır uygulama kodu yazılmadan önce, dört kritik varsayımın **gerçek insanlarla** ve
**niteliksel** olarak doğrulanması gerekir. Bu, bir öneri değil bir **durma koşuludur** (ADR-006,
`docs/DECISIONS.md`; gate `docs/PROJECT_STATUS.md` içinde **HELD** olarak tutulur).

**Dört kritik varsayım (SPINE §14):**

1. **Harita ağır yük olmadan kurulabilir** — kullanıcı 3 gün içinde en az bir tekrar eden zinciri doğru
   bulur ve dili anlar.
2. **Geçiş anı yeterince iyi yakalanabilir** — basit bir saat + kullanıcı seçimi, bildirimi anlamlı bir
   pencereye düşürür (sensör yok, varsayılan konum yok).
3. **Alternatif işlevi karşılar** — kullanıcı önerilen mikro-deneyi ahlak dersi değil, *gerçek bir seçenek*
   olarak görür.
4. **İçgörü doğru hissettirir** — haftalık özet yeni ama inandırıcı bir şey söyler ve yanlış bir çıkarım
   tek dokunuşla düzeltilebilir.

**Neden önce doğrulama?** Çünkü araştırma açıkça şunu söylüyor (SPINE §17): *insanların anlamlı bulmadığı
bir döngüyü, daha büyük bir yapay zeka sistemi düzeltmez.* Yanlış döngüyü mükemmel şekilde inşa etmek, en
pahalı hatadır. Track A, bu döngüyü **ucuza** — mülakatlar, kurucu günlüğü, bir insanın motoru elle
oynadığı concierge pilotu ve tıklanabilir bir prototiple — test eder. Doğrulanacak en küçük hikâye (SPINE
§17): **Anlat → Anla → Onayla → Seç → Hatırlat → Öğren**, tek bir gerçek geçiş üzerinde (eve varış →
balkonda sigara + kahve → "90 saniyelik aile teması, sonra bilinçli seçim").

Tam plan, katılımcı sayıları, protokoller, eşikler ve çıkış kriterleri **`docs/VALIDATION_PLAN.md`**
içindedir. Burada tekrar edilmez.

### Track B — Playbook ile inşa

Track A'nın çıkış kriterleri karşılandığında (ve senin açık onayınla ADR-006 gate'i açıldığında), kurulu
olan **AI App Development Playbook** işletim sistemiyle mobil MVP inşa edilir. Playbook, planlama
belgelerini (Stages 02-07) hazır olarak devraldığı için doğrudan Stage 08 (Foundation) ile başlar.

> **Kural:** Track A bitmeden hiçbir kod ajanının depoya kod yazmasına izin verme. Bu, kurumsal disiplin
> değil, ürünün kendi araştırma bulgusudur.

---

## 3. Playbook nedir ve nasıl çalışır?

Bu depoya, deterministik ve **belge-önce** (document-first) bir yazılım teslim yaşam döngüsü kuruldu. Kısaca:
önce doğru belge onaylanır, ancak ondan sonra kod yazılır; her aşamanın geçmesi gereken bir **kapısı (gate)**
vardır.

### Sabit yaşam döngüsü (01-15, sıra değişmez — `AGENTS.md` §3)

| # | Aşama | Ne üretir |
|---|---|---|
| 01 | IDEA | Test edilebilir ürün fikri |
| 02 | `README.md` | Ürün vaadi, kullanıcı, MVP, hariç tutulanlar |
| 03 | `docs/PRODUCT_SPEC.md` | Her MVP özelliği için kabul kriterleri |
| 04 | `docs/USER_FLOWS.md` | Ekranlar ve kullanıcı yolculukları |
| 05 | `docs/ARCHITECTURE.md` | Sistem sınırları ve teknik tasarım |
| 06 | `docs/DATABASE.md` | Veri modeli, RLS, yetkilendirme |
| 07 | `docs/IMPLEMENTATION_PLAN.md` | Bağımlılık sıralı, küçük, test edilebilir görevler |
| 08 | Faz 0 | Depo/araç zinciri temeli |
| 09 | Faz 1 | Uygulama kabuğu / navigasyon |
| 10 | İlk uçtan uca dikey dilim | Mimarinin gerçekten çalıştığının kanıtı |
| 11 | Denetim #1 (Audit) | Bağımsız inceleme |
| 12 | Çekirdek özellikler | Kalan MVP özellikleri |
| 13 | Denetim #2 (Audit) | İkinci bağımsız inceleme |
| 14 | Mağaza/yayın hazırlığı | Store readiness |
| 15 | Beta hazırlığı | Ölçülebilir değer davranışı |

### Playbook'un dört çalışma ilkesi

1. **Belge-önce kapılar.** Bir aşama, `docs/AI_DEVELOPMENT_PLAYBOOK.md` içindeki kapısı geçmeden bitmiş
   sayılmaz. Kod, 07 gate'i geçmeden yazılmaz.
2. **Sürekli özerklik (continuous autonomy).** Sen bir kez "inşa et / devam et" dedikten sonra ajan,
   aşamalar arasında rutin izin istemeden ilerler. Kapıyı geçmek bir *geçiş noktasıdır*, durma noktası
   değil. Ajan yalnızca açık **durma koşullarında** durur (bkz. Bölüm 4).
3. **Kalite, denetim, güvenlik ve yayın kapıları.** Testler/tipler/lint/build geçmeli; yüksek sonuçlu
   aşamalarda (mimari, DB/RLS yetkilendirme, güvenlik, ilk dikey dilim denetimi, yayın) **bağımsız** bir
   incelemeci geçişi yapılır.
4. **Araştırma-önce.** Sürüme duyarlı her karar (framework sürümleri, mağaza kuralları, gizlilik/güvenlik)
   tahmine değil, **o an geçerli resmî belgelere** dayanır. Sürüm numaraları burada tahmin edilmez; yapım
   anında resmî dokümanlarla doğrulanır (SPINE §19; ADR-003, `docs/DECISIONS.md`).

### Kanonik dosyalar (nerede ne yazar — `AGENTS.md` §5)

- **`AGENTS.md`** — ajanların davranış sözleşmesi (öncelik sırası, durma koşulları, mühendislik kuralları).
- **`docs/AI_DEVELOPMENT_PLAYBOOK.md`** — aşama aşama kapı tanımları.
- **`docs/MODEL_ROUTING.md`** — hangi işin hangi model gücüyle yapılacağı (maliyet-bilinçli).
- **`docs/PROJECT_STATUS.md`** — o anki aşama, kapı durumu, engeller, sıradaki eylem. (Şu an: **07 taslak
  tamam; Stage 08 doğrulama gate'i HELD**.)
- **`.claude/skills/`** — göreve özel beceriler (ör. `architecture-design`, `database-design`,
  `expo-supabase-mobile`, `security-review`, `vertical-slice-delivery`, `store-readiness`). Claude Code bunları
  yerel olarak yükler.
- **`.claude/agents/`** — rol ayrımı için ajan tanımları (`planner`, `implementer`, `orchestrator` ve
  bağımsız incelemeciler: `architecture-reviewer`, `qa-reviewer`, `security-reviewer`, `release-reviewer`,
  `product-reviewer`).

### İyi haber: planlama zaten hazır

koturutin için **Stages 02-07 belgeleri taslak olarak hazırlanmış** durumda: `README.md`,
`docs/PRODUCT_SPEC.md` (F-001…F-014), `docs/USER_FLOWS.md` (ekranlar S-01…S-12), `docs/ARCHITECTURE.md`,
`docs/DATABASE.md` ve `docs/IMPLEMENTATION_PLAN.md`. Ayrıca `docs/VALIDATION_PLAN.md` ve karar kaydı
`docs/DECISIONS.md` (ADR-001…ADR-009) hazır. Yani ürünün "ne" ve "neden"i çözülmüş; sırada "doğrula" ve
sonra "inşa et" var.

---

## 4. Claude Code ile bunu nasıl çalıştıracaksın?

### Tek satırlık işletim reçetesi

Track A (doğrulama) çıkış kriterleri karşılandıktan **sonra**, Claude Code'a vereceğin talimat neredeyse tek
bir cümledir:

> **"`AGENTS.md`'yi oku ve bu depo için yaşam döngüsüne devam et. Kapıları atlama."**

Bu kadar. Playbook'un sürekli özerklik modu sayesinde ajan; `docs/PROJECT_STATUS.md`'yi okur, en erken
tamamlanmamış aşamayı (Stage 08) bulur, işini yapar, kapısını çalıştırır, kapsam içindeki hataları düzeltir,
durumu günceller ve bir sonrakine kendiliğinden geçer. Aşamalar arasında "continue" yazman gerekmez.

### Model yönlendirmesi: Sol/Astra → Claude Code eşlemesi

Playbook'un `docs/MODEL_ROUTING.md` dosyası iki katmanlı bir strateji tanımlar. koturutin bunu Claude
Code'a şöyle eşler (SPINE §19; ADR-009, `docs/DECISIONS.md`):

| Playbook rolü | İş türü | Claude Code karşılığı |
|---|---|---|
| **Sol** (ucuz, rutin) | Planlama, ayrıştırma, dokümantasyon, durum takibi, depo keşfi, **sıradan uygulama (kodlama)** | Varsayılan Claude Code modeli, düşük/orta akıl yürütme çabası |
| **Astra** (güçlü, seyrek) | **Yüksek sonuçlu bağımsız kapı incelemeleri**: mimari, DB/RLS yetkilendirme, güvenlik, ilk dikey dilim denetimi, yayın | Ayrı, **bağımsız** bir incelemeci geçişi olarak daha güçlü model / yüksek akıl yürütme çabası |

İlke: rutin işi ucuza yap, yalnızca **yanlış olursa pahalıya mal olacak** kararları güçlü, bağımsız bir
gözle incele. Kural (`AGENTS.md` §14): incelemeyi gerçekten o model yapmadıysa, "o model inceledi" **denmez**;
tercih edilen incelemeci yoksa en güçlü izinli model kullanılır ve inceleme `FALLBACK` olarak işaretlenir.

### Nerede SEN devreye girmek ZORUNDASIN (durma koşulları — `AGENTS.md` §2)

Ajan aşağıdakileri **kendi başına yapamaz**; bu noktalarda durup senden en küçük eksik kararı/varlığı ister:

- **Kimlik bilgileri ve anahtarlar:** Supabase proje anahtarları, API anahtarları, sırlar (ajan asla
  uydurmaz).
- **Mağaza hesapları ve sertifikalar:** Apple / Google geliştirici hesapları, imzalama sertifikaları.
- **Herhangi bir ürün-kapsam değişikliği:** vaat, MVP kapsamı, iş modeli veya büyük bir kullanıcı gereksinimi.
- **Harcama onayları:** anlamlı dış harcama veya ücretli taahhüt.
- **Kamuya yayın / mağaza gönderimi / prodüksiyona dağıtım.**
- **Maddi olarak sonuç doğuran hukuki/gizlilik kararları:** ör. tıbbi iddiaya kayma (EU tıbbi-cihaz-yazılımı
  niteliği), veya serbest metnin bir modele gönderilmesi gibi bir gizlilik seçimi.

Bunlar tek tek `docs/PROJECT_STATUS.md` içinde de "insan girdisi gereken kararlar" olarak listelidir.

---

## 5. Faz faz yol haritası

Aşağıdaki tablo, ürünün üç aşamasını (SPINE §16) Playbook yaşam döngüsüne ve dahili uygulama fazlarına (0-9,
`AGENTS.md` §16) bağlar. Ne olur, senden ne istenir, hangi kapıyla çıkılır.

### Ürün aşamaları ↔ Playbook

| Ürün aşaması (SPINE §16) | Playbook karşılığı | Ne olur | Senden ne istenir | Çıkış kapısı |
|---|---|---|---|---|
| **Sıfır (Zero)** | Stage 01 + `docs/VALIDATION_PLAN.md` | Mülakatlar, kurucu günlüğü, concierge pilotu, tıklanabilir prototip. **Kod yok, backend yok, LLM yok.** | Zaman, katılımcı bulma, dürüst gözlem; ADR-006 gate'ini açma onayı | Dört kritik varsayımın **niteliksel** onayı (`docs/VALIDATION_PLAN.md` §9) |
| **Bir (One)** | Stages 02-07 (hazır) → 08-13 (inşa) | Mobil MVP: yapısal gün haritası, kural tabanlı kararlar, 30-50 deney, TR+EN | Supabase projesi + anahtarları; ürün-kapsam kararları | 4 haftalık kabul/uyum/güvenlik eşikleri (Kapalı MVP; SPINE §16) |
| **İki (Two)** | 14-15 ve sonrası, araştırma altyapısı | Uyarlama (adaptation), daha iyi zamanlama, sesli anlatım, araştırma altyapısı | Etik kurul onayı; araştırma tasarımı kararları | Etik/bilimsel inceleme altında **ölçülebilir proksimal sonuç** |

### Dahili uygulama fazları (Track B başladıktan sonra — `AGENTS.md` §16)

| Faz | Playbook aşaması | Ne yapılır | Çıkış kapısı |
|---|---|---|---|
| **Faz 0** | Stage 08 | Depo/araç zinciri: iskele, TypeScript strict, linter/formatter, test altyapısı, env örneği, CI temeli, sır hijyeni | install/lint/typecheck/test/build geçer (veya belgeli PARTIAL) |
| **Faz 1** | Stage 09 | Uygulama kabuğu, Expo Router navigasyonu, sağlayıcılar, hata/yükleniyor sınırları | Uygulama açılır, kabuk navigasyonu çalışır, çökme yok |
| **Faz 2** | (Stage 09-10 arası) | Kimlik doğrulama / kullanıcı modeli (Supabase Auth), oturum yaşam döngüsü | Giriş/çıkış çalışır, oturum güvenli |
| **Faz 3 — İLK DİKEY DİLİM** | Stage 10 | **Gerçek uçtan uca çekirdek yol** (aşağıda) | Bir test kişisi en küçük anlamlı ürün eylemini uçtan uca yapabilir; gizli kritik mock yok |
| **Faz 4** | Stage 12 | Kalan çekirdek MVP özellikleri (bağımlılık sırasıyla; güvenlik/test/analitik özelliğiyle birlikte) | Tüm beta MVP kabul kriterleri karşılanır |
| **Faz 5** | — | Sosyal/topluluk özellikleri | **N/A** (SPINE §13 hariç tutulanlar: topluluk feed'i, çift hesapları, sosyal yarış yok) |
| **Faz 6** | (Stage 12 içinde) | Bildirimler (expo-notifications, yerel zamanlama + cihaz üstü kural motoru) ve yerelleştirme (TR+EN, niyet anahtarları) | ≤2 proaktif bildirim/gün, sessiz saat, "şimdi değil" öğrenmesi doğrulanır; her iki dil doğal |
| **Faz 7** | (Stage 12-13) | Güvenlik sertleştirme, gizlilik, kriz/sigara/ilişki-güvenliği akışlarının denetimi | P0/P1 kalmaz; RLS allow/deny testleri geçer |
| **Faz 8** | (Stage 13) | Analitik (gizlilik-dostu, olay-minimal) ve performans | Yanlış-içgörü/gözetim yok; North Star olayları doğru ölçülür |
| **Faz 9** | Stage 14-15 | Mağaza/yayın hazırlığı: Apple/Google kuralları, gizlilik bildirimleri, hesap silme, imzalama, beta | Yeniden üretilebilir yayın adayı; yayın-engelleyici politika/güvenlik sorunu yok |

### İlk gerçek kanıt: ilk dikey dilim (SPINE §17)

Playbook'un en önemli erken kanıtı **ilk dikey dilimdir** — dağınık ekranlarla bir demo değil, mimarinin
gerçekten çalıştığının ispatı (`AGENTS.md` §9). koturutin için bu dilim, doğrulanan altı adımlık hikâyenin
kendisidir:

> **Anlat → Anla → Onayla → Seç → Hatırlat → Öğren** — tek bir gerçek geçiş üzerinde
> (*eve varış → balkonda sigara + kahve → "90 saniyelik aile teması, sonra bilinçli seçim"*).

Somut olarak: gerçek giriş → günü anlat (S-02) → haritayı onayla (S-04) → bir deney seç (S-05) → doğru anda
kural tabanlı hatırlatma (S-06) → sonucu öğren (S-07). Gerçek UI, gerçek veri yolu, gerçek auth/RLS, gerçek
kalıcılık ve yeniden yükleme. Bu dilim, `docs/IMPLEMENTATION_PLAN.md` içinde açıkça işaretlidir ve Astra
seviyesinde bağımsız denetimden (Stage 11) geçer.

---

## 6. Mimari ve veri modeli özeti

Ayrıntı `docs/ARCHITECTURE.md` ve `docs/DATABASE.md` içindedir; burada sadece resmin tamamı verilir.

**İstemci:** Expo + React Native (TypeScript strict), Expo Router ile navigasyon. **Sunucu:** Supabase —
Postgres + Auth + Row Level Security (RLS) + Storage + Edge Functions. Sürüme duyarlı her paket/SDK
sürümü, yapım anında güncel resmî dokümanlarla doğrulanır (tahmin yok — SPINE §19).

Üç mimari ilke, bu ürünün kalbidir:

1. **Yapısal veri önce, yapay zeka sonra.** Ürünün belleği bir sohbet dökümü değil, kullanıcının
   düzelttiği **yapısal bir bağlamsal rutin grafiğidir**. LLM yalnızca sınırlı bir yardımcıdır: anlatıyı aday
   düğümlere ayrıştırır, haftalık kayıtları yargısız dille özetler, kütüphaneden 2-3 seçenek sıralar ve
   metni sadeleştirir — her biri sert sınırlarla (SPINE §9; ADR-002). Model asla bellek, terapist ya da
   kriz kararı vereni değildir.
2. **Kural tabanlı, açıklanabilir karar motoru (v1'de ML yok).** Doğru anı, bildirim bütçesini ve "şimdi
   değil" öğrenmesini cihaz üstünde çalışan, test edilebilir bir kural motoru belirler (SPINE §7;
   `docs/ARCHITECTURE.md` §14). Her içgörü kanıtını gösterir ve tek dokunuşla "bu yanlış" düzeltmesi sunar.
3. **Yerelde-öncelik hassas veri.** Ham hassas kayıtlar ve serbest metin, mümkün olduğunca cihazda tutulur;
   buluta senkronlanan alanlar şifrelenir; "cihazdan ne çıkıyor" açıkça gösterilir (ADR-004).

**Çekirdek varlıklar (SPINE §5; Postgres tabloları snake_case, TS tipleri PascalCase — `docs/DATABASE.md`):**

| Varlık | Nedir |
|---|---|
| **Moment** (`moments`) | Tekrar eden bir geçiş noktası — ad, zaman penceresi, bağlam, doğrulama durumu (`hypothesis`/`confirmed`), öncelik |
| **RoutineEdge** (`routine_edges`) | tetikleyici→davranış bağı — tetikleyici, davranış, anlık fayda (işlev etiketi), gecikmeli maliyet, güven, kanıt sayısı |
| **Experiment** (`experiments`) | Seçilen davranış alternatifi — işlev, süre bandı, zorluk, güvenlik sınıfı, eğer-bu-ise-şu planı, aktif bayrağı (aynı anda **tek** aktif) |
| **Attempt** (`attempts`) | Karar anındaki teklif + yanıt — `offered_at`, geçiş, yanıt (`offered`/`did`/`not_now`/`declined`), sebep |
| **Outcome** (`outcomes`) | Denemenin proksimal sonucu — istek 0-10, enerji, ruh hâli, bağ hissi, serbest not (hassas; yerelde-öncelik/onaylı) |
| **Insight** (`insights`) | Yüzeye çıkan örüntü — metin, kanıt sayısı, güven, kullanıcı onayı |

Her tablo bir kullanıcıya aittir ve **varsayılan olarak özeldir**: sahip-yalnızca RLS (`auth.uid() =
user_id`) her istemciye açık nesnede zorunludur; `service_role` yalnızca sunucu tarafında (güvenilir Edge
Function'larda) kullanılır, asla istemciye sızmaz (`docs/DATABASE.md` RLS matrisi; ADR-004). Ayrıca küratörlü,
salt-okunur `experiment_library` (kullanıcı verisi değil), 3 günlük `observations` ve denetim için
`safety_events` tabloları vardır.

---

## 7. Güvenlik, etik ve mahremiyet — pazarlık dışı

Bunlar özellik değil, **ürünün varlık koşuludur**. Hepsi MVP'de, hepsi **her zaman ücretsiz ve her zaman
görünür** — hiçbiri asla bir ödeme duvarının ardında değildir (SPINE §1.8, §10; ADR-005).

- **KVKK özel nitelikli veri / GDPR Art. 9.** Ruh hâli, sigara, uyku, sağlık durumu ve serbest günlük metni
  özel nitelikli veridir (KVKK daha katı). Kurallar: veri minimizasyonu (varsayılan olarak konum/mikrofon/
  kişiler istenmez — yalnızca özellik başına ayrı izinle); yerelde-öncelik; senkron alanlarda şifreleme;
  kullanıcı tanımlı saklama pencereleri (hem bulut hem cihaz-üstü); tam silme ve dışa aktarım.
- **Rıza modeli (SPINE §21 R2).** Onboarding'de önce **18+ yaş beyanı** ve **zorunlu sağlık verisi
  işleme rızası** (`consent_health_processing`, KVKK/GDPR Art. 9(2)(a)) alınır — bunlar olmadan hiçbir
  gözlem/istek verisi toplanmaz. Ayrıca isteğe bağlı ve varsayılan KAPALI üç rıza vardır: kişiselleştirme
  (yapısal veriyi üçüncü-taraf modele göndermeyi de kapsar), araştırma, ve serbest-metin-modele. Analitik
  ise bunlardan ayrı, opt-in bir bayrakla (`analytics_enabled`) yönetilir ve yalnızca hassas-olmayan olayları
  taşır. Serbest not (`free_note`) sunucu tarafında korunur: rıza kapalıysa cihazdan çıkmaz.
- **Kilit ekranı mahremiyeti.** Bildirim önizlemesinde asla hassas içerik gösterilmez — "sigara iç" ya da
  "eşinle konuş" değil. Kilit ekranı yalnızca nötr bir ifade taşır: *"Bir geçiş anı yaklaşıyor."* Detay,
  ancak uygulama açıldıktan sonra görünür.
- **Kriz akışı kural tabanlıdır.** Açık kendine-zarar/akut-risk ifadelerinde normal koçluk akışı **DURUR**
  ve yerel acil + profesyonel kaynaklara yönlendirilir. Kriz kararı; kural tabanlı + insan-incelemeli +
  test edilmiş metindir — asla tek başına üretken bir modele bırakılmaz (SPINE §10; ADR-005).
- **ALO 171.** Nikotin bağımlılığı "sıradan bir sabah rutini" gibi ele alınmaz. Profesyonel bırakma desteği
  (ALO 171 + aile hekimi + profesyonel yönlendirme) ücretsiz ve görünür kalır; bireysel tıbbi/ilaç tavsiyesi
  verilmez. Bir kayma (**lapse/kayma**) streak sıfırlama değil, öğrenme verisidir.
- **İlişki-güvenliği geçidi.** *Bağ (connection)* deneyi güvenli varsayılmaz; şiddet/kontrol/çatışma
  bağlamında bunun yerine alternatif bir destek yolu sunulur (SPINE §10).
- **Terapi/tanı iddiası yok.** v1 hiçbir terapi/tedavi/tanı/bağımlılık-tedavisi iddiası yapmaz. Kullanım
  tıbbi bir amaca kayarsa, bu bir **hukuki/durma kararıdır**, ajanın türetebileceği bir şey değil.
- **Karanlık desen (dark pattern) yok, seri/streak yok.** Sonsuz streak, kayıp-kaçınma ve diğer bağımlılık
  mekanikleri yasaktır (SPINE §12; ADR-007). Bunlar ürünün amacıyla çelişir.
- **Korelasyon korelasyondur.** Bir örüntü asla nedensellik ya da tanı olarak sunulmaz. Doğru ifade: "bu
  alternatif bazı günlerde işe yarıyor gibi görünüyor." Yasak ifade: "çocuğunla konuşmak sigara isteğini
  azaltıyor" (nedensellik ima eder).

Bu maddeler, doğrulama araştırması sırasında bile geçerlidir (`docs/VALIDATION_PLAN.md` §7): bir test bile
özel nitelikli veri işler.

---

## 8. Etik iş modeli

Model, ürünün amacıyla hizalıdır: bağımlılık değil, gerçek fayda (SPINE §12; ADR-007).

| Her zaman ücretsiz (asla ödeme duvarı yok) | Ücretli (sonra, ödeme-isteği mülakatlarıyla fiyat-test edilir) |
|---|---|
| Bir gün haritası, bir aktif deney, haftalık özet | Birden fazla harita |
| Tüm güvenlik kaynakları (kriz, sigara, ilişki-güvenliği) | Gelişmiş örüntüler |
| Gizlilik ayarları, veri silme/dışa aktarım, hesap silme | Sesli anlatım |
| Temel güvenlik | Zengin deney kütüphanesi, dışa aktarım |

Ücretli katman **sonraya bırakılmıştır** ve fiyatı ancak gerçek kullanıcılarla ödeme-isteği mülakatları
yapıldıktan sonra belirlenir — şimdi tahmin edilmez. Herhangi bir fiyatlandırma/ödeme etkinleştirmesi bir
durma koşuludur (senin onayın gerekir).

---

## 9. Başarı ölçütleri

North Star her şeyi yönetir; alt katmanlar onu destekleyen sinyallerdir (SPINE §15; ADR-007). Kritik nokta:
**ürün sadece çalıştığı için başarılı sayılmaz** — kullanıcıların gerçek hayatta amaçlanan değer davranışını
yapıp yapmadığı ölçülür.

| Katman | Anlamı |
|---|---|
| **North Star** | **Haftalık başarılı bilinçli geçiş** (gerçek hayatta seçim) — uygulama içi süre değil, streak değil |
| **Aktivasyon** | Harita onaylandı + ilk deney planlandı |
| **Proksimal sonuç** | Denemeden hemen sonra istek/enerji/bağ hissindeki anlık değişim |
| **Orta vade (2 & 4 hafta)** | Öz-yeterlik + öncelikli-rutin sıklığı |
| **İyi oluş** | İsteğe bağlı iki haftalık WHO-5 + kullanıcı tanımlı yaşam kalitesi (asla tanı aracı değil) |
| **Güvenlik** | Yanlış-içgörü, hassas-bildirim, istenmeyen-öneri, destek-yönlendirme olayları |
| **Ürün sağlığı** | 2 & 4 haftalık tutundurma, bildirim opt-out, veri silme — **yük/güven sinyali** olarak izlenir, tek başına başarı sayılmaz |

---

## 10. Riskler ve doğrulanması gerekenler

Dürüst olalım: bu, kolay bir kategori değil. Başlıca riskler ve doğrulamanın her birini nasıl karşıladığı:

| Risk | Neden ciddi | Doğrulama nasıl karşılar |
|---|---|---|
| **En yakın rakip: Liven** ve kalabalık pazar (Fabulous, Routinery, Habitica, Finch, Wysa, Daylio…) | "Bir yapay zekamız daha var" farklılaşma değildir | Farklılaşma, kullanıcı-doğrulamalı bağlamsal rutin grafiği + doğru anda tek deney + açıklanabilir öğrenmedir (ADR-001). Prototip testi (Faz 4) bu farkın kullanıcıya *hissedilip* hissedilmediğini ölçer |
| **Ruh sağlığı uygulamalarında tutundurma gerçeği** düşüktür | Kullanıcılar hızla bırakabilir | Ürün zaten "uygulamaya daha az ihtiyaç" hedefler; tutundurma başarı değil yük/güven sinyalidir (ADR-007). Kapalı MVP (Faz 5, gate sonrası) 4 haftalık gerçek tekrarı ölçer |
| **Alternatif işlevi karşılamalı** (A3) | İşlevi karşılamayan öneri "ahlak dersi" gibi hissettirir ve reddedilir | Concierge pilotu (VALIDATION §5): en az yarısı ilk hafta ≥3 mikro-deney yapmalı; prototipte seçenekler "adil bir takas" olarak algılanmalı |
| **Zamanlama doğruluğu** (A2) | Yanlış anda gelen bildirim güveni yıkar | Concierge'de insan, yalnızca kullanıcının belirttiği pencere + saatle nötr bildirim gönderir; bildirim-uyum medyanı ≥4/5 olmalı — sensör/konum olmadan |
| **Bildirim yorgunluğu** | Aşırı bildirim ürünü öldürür | ≤2 proaktif bildirim/gün, sessiz saat, "şimdi değil" öğrenmesi (SPINE §7); algılanan yük medyanı ≤2/5 |
| **Hassas veri / güvenlik akışı hatası** | KVKK/GDPR ihlali veya yanlış klinik yönlendirme geri dönülemez zarardır | Ciddi bir gizlilik olayı veya uygunsuz klinik yönlendirme **sert durmadır** (VALIDATION §4, §7); güvenlik = sıfır ciddi olay |

Bu risklerin dördü doğrudan **dört kritik varsayımdır** ve Track A'nın tek amacı bunları ucuza test etmektir.
Eşikler karşılanmazsa `docs/VALIDATION_PLAN.md` §4'teki "karşılanmazsa şunu değiştir" eylemleri uygulanır;
karşılanamıyorsa **inşa edilmez** — kavram revize edilir veya bir kurucu kapsam kararı kaydedilir.

---

## 11. Şimdi ne yapmalı? (Somut sonraki adımlar)

1. **`docs/VALIDATION_PLAN.md`'yi baştan sona oku.** Track A'nın tamamı — protokoller, eşikler, çıkış
   kriterleri — orada. Bu, kod yazmadan yapacağın ilk gerçek iştir.
2. **Problem mülakatlarına başla** (VALIDATION §2, Faz 1): 10-15 yetişkin. Çıktı: dil/ton, hedef segment,
   **kritik-geçiş listesi**. Paralelde **kurucu günlüğü testini** başlat (Faz 2): kendi rutininde ≥14 gün
   hafif kayıt tut.
3. **Concierge pilotunu kur** (Faz 3): bir insan (sen) motoru elle oynuyor — algoritma yok. 10-15 kişi, 14
   gün. SPINE §17 hikâyesiyle başla (eve varış → balkon). Her teklifin neden kabul/ret edildiğini kaydet.
4. **Tıklanabilir prototiple** (Faz 4) 8 çekirdek ekranı (S-01…S-08) test et: anlaşılırlık ve güven dili.
   Çıktı: her iki dilde akış ve mikrometin düzeltmeleri.
5. **Bir kod ajanının depoya kod yazmasına, doğrulama gate'i geçilene kadar İZİN VERME.**
   `docs/PROJECT_STATUS.md` gate'i **HELD** tutar; bu bilinçli bir durma koşuludur (ADR-006).
6. **Hazır olduğunda Supabase projesini kur** ve anahtarlarını güvenle sakla. Bunlar Stage 08 ve Stage 14'te
   gerekir — şimdi değil. Anahtarları asla istemci koduna veya git'e koyma; ajan da bunları uyduramaz.
7. **Dört kritik varsayım niteliksel olarak onaylandığında** (VALIDATION §9 kontrol listesi + senin açık
   sign-off'un), gate'i aç ve Claude Code'a tek satırı ver:

   > **"`AGENTS.md`'yi oku ve bu depo için yaşam döngüsüne devam et. Kapıları atlama."**

   Ajan buradan Stage 08 (Foundation) ile başlar ve durma koşullarına kadar sürekli özerklikle ilerler.
8. **Durma koşullarına hazır ol** (Bölüm 4): kimlik bilgileri, mağaza hesapları/sertifikaları, kapsam
   değişiklikleri, harcamalar, kamuya yayın ve hukuki/gizlilik kararları senin masanda kalır.

---

> **Son söz.** Bu, dürüst olmak gerekirse aylar süren bir iştir ve zor bir kategoridir. Ama sıralama
> doğru: önce insanların döngüyü anlamlı bulduğunu ucuza kanıtla, sonra Playbook'un disipliniyle onu
> sağlam inşa et. Yanlış şeyi mükemmel yapmaktansa, doğru şeyin en küçük halini sağlam yapmak — koturutin'in
> hem ürün felsefesi hem de yapım stratejisi budur.
