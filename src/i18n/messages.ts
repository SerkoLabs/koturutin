/**
 * Bilingual content as language-neutral INTENT KEYS (spine §11, ADR-008). Turkish is authored first
 * (the founder's primary audience); English mirrors the intent, not a word-for-word copy. Safety,
 * crisis and privacy copy must be legal- + clinical-reviewed before beta (TASK-360) — the strings
 * here are the product's working copy, calm and non-shaming, with no morality/causal language.
 */
import type { Language } from '@/domain/types';

export type MessageKey = keyof typeof tr;

export const tr = {
  'app.name': 'koturutin',
  'app.tagline': 'Otomatik anları fark et, küçük bir şey dene, birlikte öğren.',

  // Onboarding — value (S-11)
  'onb.welcome.title': 'Otomatik pilotu fark et',
  'onb.welcome.body':
    'koturutin bir alışkanlık takipçisi ya da bir yapay zekâ terapisti değildir. Günün otomatikleşen bir anını görünür kılar; tam o anda sana uyan tek bir küçük şey denemene yardım eder; neyin işe yaradığını birlikte öğrenirsiniz.',
  'onb.welcome.notWhat': 'Seri yok, suçluluk yok, baskı yok. Amaç uygulamada kalman değil, hayatına dönmen.',
  'onb.welcome.cta': 'Nasıl çalıştığını gör',

  // Onboarding — age + consent (S-11)
  'onb.consent.title': 'Başlamadan önce',
  'onb.consent.age': '18 yaşından büyüğüm.',
  'onb.consent.health.label': 'Sağlık verimin işlenmesine izin veriyorum (gerekli)',
  'onb.consent.health.help':
    'koturutin; ruh hâli, istek ve rutin gibi hassas (özel nitelikli) verileri yalnızca sana bu deneyimi sunmak için işler. Bu izin olmadan döngüyü kullanamayız; dilediğin an geri çekebilirsin.',
  'onb.consent.optionalTitle': 'İsteğe bağlı (varsayılan kapalı)',
  'onb.consent.personalization': 'Kişiselleştirme için yapay zekâ desteği',
  'onb.consent.research': 'Anonim araştırmaya katkı',
  'onb.consent.freeText': 'Serbest notlarımın model tarafından işlenmesi',
  'onb.consent.analytics': 'Hassas olmayan kullanım ölçümü',
  'onb.consent.privacyNote':
    'Hassas ham veriler öncelikle cihazında kalır. Kilit ekranında asla hassas içerik göstermeyiz.',
  'onb.consent.cta': 'Kabul ediyorum, devam',
  'onb.consent.declineNote': 'Sağlık verisi işleme iznini vermezsen döngüyü açamayız; güvenlik kaynaklarına yine ulaşabilirsin.',
  'onb.consent.needAge': 'Devam etmek için 18+ olduğunu ve gerekli izni onayla.',

  // Home / hub (S-01 / S-08)
  'home.title': 'Bugün',
  'home.northstar.label': 'Bu hafta bilinçli geçiş',
  'home.northstar.help': 'Ekranda geçirdiğin süreyi değil, gerçek hayatta yaptığın bilinçli seçimleri sayıyoruz.',
  'home.noMoment.title': 'Bir geçiş anı seç',
  'home.noMoment.body': 'Gününde tekrar eden, otomatikleşen bir anı işaretleyelim.',
  'home.noMoment.cta': 'Geçiş anını kur',
  'home.hasMoment.momentLabel': 'Öncelikli anın',
  'home.hasExperiment.label': 'Aktif denemen',
  'home.selectExperiment.cta': 'Bir deney seç',
  'home.openCard.cta': 'Şimdi dene',
  'home.support.cta': 'Destek ve güvenlik',
  'home.loop.step': 'Döngü',

  // Capture moment (S-02 → S-04)
  'capture.title': 'Geçiş anın',
  'capture.body': 'Örnek: “Eve gelince balkona çıkıp sigara ve kahve içiyorum.” Kendi cümlenle yaz.',
  'capture.name.label': 'Bu ana ne diyorsun?',
  'capture.name.placeholder': 'Eve varış',
  'capture.trigger.label': 'Tetikleyici (ne oluyor?)',
  'capture.trigger.placeholder': 'Eve girince',
  'capture.behavior.label': 'Otomatik davranış',
  'capture.behavior.placeholder': 'Balkonda sigara ve kahve',
  'capture.window.label': 'Genellikle saat kaçta?',
  'capture.window.help': 'Yaklaşık bir saat yeter; doğru anı yakalamak için.',
  'capture.confirm.cta': 'Haritayı onayla',
  'capture.confirm.question': 'Seni doğru anladım mı?',

  // Select experiment (S-05)
  'select.title': 'Tek bir küçük deney',
  'select.body': 'Aynı ihtiyacı daha düşük maliyetle karşılayan bir seçenek dene. Bir seferde yalnızca bir deney.',
  'select.gate.title': 'Önce bir kontrol',
  'select.gate.body':
    'Bu deney bir yakınınla kısa bir temas öneriyor. Bunu güvenli hissediyor musun? Baskı, çatışma ya da güvenlik kaygısı varsa zorlamayız.',
  'select.gate.safe': 'Evet, güvenli',
  'select.gate.unsure': 'Emin değilim',
  'select.gate.unsafe': 'Hayır / güvenli değil',
  'select.plan.if': 'Eğer',
  'select.plan.then': 'O zaman',
  'select.cta': 'Bu deneyi seç',
  'select.chosen': 'Seçildi',

  // Transition card (S-06)
  'card.title': 'Bir geçiş anı',
  'card.body': 'Her zamanki ilk hareketinden önce bunu denemek ister misin?',
  'card.do': 'Şimdi yaptım',
  'card.later': 'Şimdi değil',
  'card.notSuitable': 'Bana uymadı',
  'card.laterNote': 'Sorun değil. Bu an bize ne öğretti, sonra bakarız.',

  // Outcome (S-07)
  'outcome.title': 'Nasıl geçti?',
  'outcome.body': 'Tek dokunuş yeter. Doğru ya da yanlış cevap yok.',
  'outcome.craving': 'İstek',
  'outcome.energy': 'Enerji',
  'outcome.mood': 'Ruh hâli',
  'outcome.connection': 'Bağ hissi',
  'outcome.note.label': 'Kısa not (isteğe bağlı, cihazında kalır)',
  'outcome.note.placeholder': 'Bir şey eklemek istersen…',
  'outcome.save': 'Kaydet',
  'outcome.saved': 'Kaydedildi. Bu, bu haftaki bilinçli geçişlerine eklendi.',

  // Support / safety (S-10)
  'support.title': 'Destek ve güvenlik',
  'support.body': 'Bunlar her zaman ücretsiz ve her zaman burada.',
  'support.crisis.title': 'Zor bir andaysan',
  'support.crisis.body':
    'Kendine zarar verme düşüncesi ya da acil bir risk varsa, lütfen yerel acil servise ulaş. Türkiye’de 112 acil çağrı hattını arayabilirsin.',
  'support.smoking.title': 'Sigara / bağımlılık desteği',
  'support.smoking.body': 'Türkiye’de ALO 171 Sigara Bırakma Danışma Hattı ve aile hekimin ücretsiz destek sunar.',
  'support.relationship.title': 'İlişki güvenliği',
  'support.relationship.body':
    'Bir temas önerisi baskı ya da güvenlik kaygısı yaratıyorsa bunu önermeyiz. Güvende değilsen, güvendiğin bir kişiye ya da yerel destek hatlarına ulaşmayı düşünebilirsin.',
  'support.back': 'Geri dön',

  // Observation check-in (S-03)
  'observe.title': 'Kısa gözlem',
  'observe.body': 'On saniyelik bir yoklama. Reçete yok, sadece fark etme.',
  'observe.context.label': 'Şu an bağlam (kısa)',
  'observe.context.placeholder': 'İşten yeni geldim',
  'observe.behavior.label': 'Ne yapıyorsun?',
  'observe.behavior.placeholder': 'Balkona çıkıyorum',
  'observe.craving': 'İstek',
  'observe.energy': 'Enerji',
  'observe.save': 'Gözlemi kaydet',
  'observe.saved': 'Kaydedildi. Birkaç gözlem, haritanı netleştirir.',
  'home.observe.cta': 'Kısa gözlem ekle',

  // Weekly review (S-08)
  'week.title': 'Bu hafta',
  'week.body': 'Bir yargı değil, birlikte bir bakış. Korelasyon gösteririz, nedensellik değil.',
  'week.chose': 'Beş benzer anın gibi düşün: bu hafta {m} teklifin {n} tanesinde seçtiğin alternatifi yaptın.',
  'week.connection': 'Yaptığın anlarda bağ hissi ortalaması: {v}/10.',
  'week.craving': 'Yaptığın anlarda istek ortalaması: {v}/10.',
  'week.none': 'Bu hafta henüz bir deneme yok. Hazır olduğunda küçük bir an dene.',
  'week.next': 'Sıradaki küçük adımı sen seçersin; sistem sana dayatmaz.',
  'home.week.cta': 'Haftayı gör',

  // Settings & privacy (S-09)
  'settings.title': 'Ayarlar ve gizlilik',
  'settings.language': 'Dil',
  'settings.language.tr': 'Türkçe',
  'settings.language.en': 'English',
  'settings.consents.title': 'İzinler',
  'settings.health.on': 'Sağlık verisi işleme izni: açık',
  'settings.health.withdraw': 'Sağlık verisi iznini geri çek (döngü durur)',
  'settings.export': 'Verimi dışa aktar',
  'settings.export.title': 'koturutin veri dışa aktarımı',
  'settings.deleteMemory': 'Yapay zekâ hafızasını sil',
  'settings.deleteMemory.done': 'Yapay zekâ hafızası temizlendi.',
  'settings.deleteAccount': 'Hesabımı ve tüm verimi sil',
  'settings.deleteAccount.help': 'Bu işlem cihazındaki tüm verini kalıcı olarak siler ve başa döner.',
  'settings.deleteAccount.confirm': 'Evet, her şeyi sil',
  'settings.back': 'Geri',
  'home.settings.cta': 'Ayarlar ve gizlilik',

  // Generic
  'common.continue': 'Devam',
  'common.back': 'Geri',
  'common.notNow': 'Şimdi değil',
  'common.localOnly': 'Yalnızca bu cihazda',
  'common.cancel': 'Vazgeç',
} as const;

export const en: Record<MessageKey, string> = {
  'app.name': 'koturutin',
  'app.tagline': 'Notice the automatic moments, try one small thing, learn together.',

  'onb.welcome.title': 'Notice the autopilot',
  'onb.welcome.body':
    'koturutin is not a habit tracker or an AI therapist. It makes one automatic moment of your day visible, helps you try a single small alternative that fits you at that moment, and learns with you what works.',
  'onb.welcome.notWhat': 'No streaks, no guilt, no pressure. The goal is not to keep you in the app, but to return you to your life.',
  'onb.welcome.cta': 'See how it works',

  'onb.consent.title': 'Before we begin',
  'onb.consent.age': 'I am 18 or older.',
  'onb.consent.health.label': 'I consent to processing my health data (required)',
  'onb.consent.health.help':
    'koturutin processes sensitive (special-category) data such as mood, craving and routines only to give you this experience. Without this consent we cannot run the loop; you can withdraw it any time.',
  'onb.consent.optionalTitle': 'Optional (off by default)',
  'onb.consent.personalization': 'AI assistance for personalization',
  'onb.consent.research': 'Contribute to anonymous research',
  'onb.consent.freeText': 'Let a model process my free-text notes',
  'onb.consent.analytics': 'Non-sensitive usage measurement',
  'onb.consent.privacyNote': 'Raw sensitive data stays on your device first. We never show sensitive content on the lock screen.',
  'onb.consent.cta': 'I agree, continue',
  'onb.consent.declineNote': 'Without the health-data consent we cannot open the loop; you can still reach safety resources.',
  'onb.consent.needAge': 'To continue, confirm you are 18+ and grant the required consent.',

  'home.title': 'Today',
  'home.northstar.label': 'Conscious transitions this week',
  'home.northstar.help': 'We count the conscious choices you make in real life, not time spent in the app.',
  'home.noMoment.title': 'Choose a transition moment',
  'home.noMoment.body': 'Let’s mark one repeating, automatic moment in your day.',
  'home.noMoment.cta': 'Set up your moment',
  'home.hasMoment.momentLabel': 'Your priority moment',
  'home.hasExperiment.label': 'Your active experiment',
  'home.selectExperiment.cta': 'Choose an experiment',
  'home.openCard.cta': 'Try it now',
  'home.support.cta': 'Support & safety',
  'home.loop.step': 'Loop',

  'capture.title': 'Your transition moment',
  'capture.body': 'For example: “When I get home I go to the balcony for a cigarette and coffee.” Use your own words.',
  'capture.name.label': 'What do you call this moment?',
  'capture.name.placeholder': 'Arriving home',
  'capture.trigger.label': 'Trigger (what happens?)',
  'capture.trigger.placeholder': 'When I walk in',
  'capture.behavior.label': 'Automatic behavior',
  'capture.behavior.placeholder': 'Cigarette and coffee on the balcony',
  'capture.window.label': 'Around what time, usually?',
  'capture.window.help': 'A rough hour is enough — to catch the right moment.',
  'capture.confirm.cta': 'Confirm the map',
  'capture.confirm.question': 'Did I understand you right?',

  'select.title': 'One small experiment',
  'select.body': 'Try an option that serves the same need at a lower cost. Only one experiment at a time.',
  'select.gate.title': 'A quick check first',
  'select.gate.body':
    'This experiment suggests a short moment of contact with someone close. Does that feel safe? If there is pressure, conflict or a safety concern, we won’t push it.',
  'select.gate.safe': 'Yes, it’s safe',
  'select.gate.unsure': 'Not sure',
  'select.gate.unsafe': 'No / not safe',
  'select.plan.if': 'If',
  'select.plan.then': 'Then',
  'select.cta': 'Choose this experiment',
  'select.chosen': 'Chosen',

  'card.title': 'A transition moment',
  'card.body': 'Want to try this before your usual first move?',
  'card.do': 'I did it',
  'card.later': 'Not now',
  'card.notSuitable': 'Didn’t fit me',
  'card.laterNote': 'That’s okay. We’ll look at what this moment taught us later.',

  'outcome.title': 'How did it go?',
  'outcome.body': 'One tap is enough. There’s no right or wrong answer.',
  'outcome.craving': 'Craving',
  'outcome.energy': 'Energy',
  'outcome.mood': 'Mood',
  'outcome.connection': 'Sense of connection',
  'outcome.note.label': 'Short note (optional, stays on your device)',
  'outcome.note.placeholder': 'Add something if you like…',
  'outcome.save': 'Save',
  'outcome.saved': 'Saved. This was added to your conscious transitions this week.',

  'support.title': 'Support & safety',
  'support.body': 'These are always free and always here.',
  'support.crisis.title': 'If you’re in a hard moment',
  'support.crisis.body':
    'If you’re thinking about harming yourself or there’s an urgent risk, please reach your local emergency services. In Türkiye you can call 112.',
  'support.smoking.title': 'Smoking / dependence support',
  'support.smoking.body': 'In Türkiye, the ALO 171 tobacco-cessation line and your family physician offer free support.',
  'support.relationship.title': 'Relationship safety',
  'support.relationship.body':
    'If a contact suggestion creates pressure or a safety concern, we won’t suggest it. If you’re not safe, consider reaching someone you trust or a local support line.',
  'support.back': 'Go back',

  'observe.title': 'Quick observation',
  'observe.body': 'A ten-second check-in. No prescription, just noticing.',
  'observe.context.label': 'Context right now (short)',
  'observe.context.placeholder': 'Just got home from work',
  'observe.behavior.label': 'What are you doing?',
  'observe.behavior.placeholder': 'Heading to the balcony',
  'observe.craving': 'Craving',
  'observe.energy': 'Energy',
  'observe.save': 'Save observation',
  'observe.saved': 'Saved. A few observations sharpen your map.',
  'home.observe.cta': 'Add a quick observation',

  'week.title': 'This week',
  'week.body': 'Not a verdict — a look together. We show correlation, never causation.',
  'week.chose': 'Think of it like five similar moments: this week you did your alternative in {n} of {m} offers.',
  'week.connection': 'Average sense of connection on the moments you did: {v}/10.',
  'week.craving': 'Average craving on the moments you did: {v}/10.',
  'week.none': 'No attempts yet this week. Try a small moment when you\'re ready.',
  'week.next': 'You choose the next small step; the system never imposes it.',
  'home.week.cta': 'See the week',

  'settings.title': 'Settings & privacy',
  'settings.language': 'Language',
  'settings.language.tr': 'Türkçe',
  'settings.language.en': 'English',
  'settings.consents.title': 'Consents',
  'settings.health.on': 'Health-data processing consent: on',
  'settings.health.withdraw': 'Withdraw health-data consent (stops the loop)',
  'settings.export': 'Export my data',
  'settings.export.title': 'koturutin data export',
  'settings.deleteMemory': 'Delete AI memory',
  'settings.deleteMemory.done': 'AI memory cleared.',
  'settings.deleteAccount': 'Delete my account and all data',
  'settings.deleteAccount.help': 'This permanently deletes all data on your device and returns to the start.',
  'settings.deleteAccount.confirm': 'Yes, delete everything',
  'settings.back': 'Back',
  'home.settings.cta': 'Settings & privacy',

  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.notNow': 'Not now',
  'common.localOnly': 'On this device only',
  'common.cancel': 'Cancel',
};

export const catalogs: Record<Language, Record<MessageKey, string>> = { tr, en };
