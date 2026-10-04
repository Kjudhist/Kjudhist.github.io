/* ==========================================================================
   i18n: one dictionary, three languages.

   Loaded in <head> without defer so the language is settled before first
   paint. Markup hooks:
     data-i18n="key"                 sets textContent
     data-i18n-attr="attr:key; ..."  sets attributes (alt, aria-label, content)

   The ID and JA strings are first drafts. The pitch and tagline are final;
   everything else should get a read from a native speaker before launch.
   Text in [brackets] is a placeholder in every language.
   ========================================================================== */

(function () {
  'use strict';

  const LANGS = ['en', 'id', 'ja'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'kjg-lang';

  const DICT = {
    en: {
      'common.skip': 'Skip to content',
      'common.back': 'Back to the gate',
      'common.backShort': 'Gate',
      'common.lang': 'Language',
      'common.menu': 'Menu',
      'common.made': 'Made with help from Claude',

      'meta.gate.title': 'Kevin JG · QA Engineer and The Willow Atelier',
      'meta.gate.desc': 'Two doors. One leads to my work as a QA engineer in payments and online banking. The other leads to The Willow Atelier, where I make art.',
      'meta.qa.title': 'Kevin Judhistira Girsang · QA Engineer',
      'meta.qa.desc': 'Product-focused QA engineer at Inteleq (Indivara Group) in Jakarta, testing payment and online banking products.',
      'meta.art.title': 'The Willow Atelier',
      'meta.art.desc': 'Where the lost come to rest. Artwork from The Willow Atelier.',
      'meta.404.title': 'Page not found · Kevin JG',
      'meta.404.desc': 'This page doesn’t exist. Head back to the gate.',

      'gate.intro': 'Choose a door.',
      'gate.doors': 'Doors',
      'gate.qa': 'QA Engineer',
      'gate.art': 'The Willow Atelier',
      'gate.tap': 'Tap to open',
      'gate.again': 'Tap again to enter',

      'qa.nav.label': 'Sections',
      'qa.nav.about': 'About',
      'qa.nav.experience': 'Experience',
      'qa.nav.skills': 'Skills',
      'qa.nav.work': 'Work',
      'qa.nav.contact': 'Contact',

      'qa.hero.place': 'Bekasi, Indonesia',
      'qa.hero.pitch': 'Product-focused QA Engineer',
      'qa.hero.sub': 'Payments · Online Banking · Jakarta',
      'qa.hero.cv': 'Download CV',
      'qa.hero.contact': 'Get in touch',

      'qa.about.title': 'About me',
      'qa.about.p1': 'I’m a QA engineer at Inteleq, part of Indivara Group, in Jakarta. I test payment and online banking products across several projects, including system integration testing.',
      'qa.about.p2': 'I got here through Indivara’s Java development training. Before that, I studied Informatics Engineering at Brawijaya University and ran the Homeband division of my faculty’s sports and arts body.',
      'qa.about.p3': '[A line or two about how you approach testing, and what you care about in a product.]',
      'qa.facts.label': 'At a glance',
      'qa.facts.based': 'Based in',
      'qa.facts.basedValue': 'Bekasi, Indonesia',
      'qa.facts.work': 'Works in',
      'qa.facts.workValue': 'Jakarta · Hybrid',
      'qa.facts.focus': 'Focus',
      'qa.facts.focusValue': 'Payments, online banking',
      'qa.facts.study': 'Studied',
      'qa.facts.studyValue': 'Informatics Engineering, Brawijaya University',

      'qa.exp.title': 'Experience',
      'qa.exp.meta': 'Jakarta · Hybrid',
      'qa.exp.roles': 'Roles at Inteleq, newest first',
      'qa.exp.r1.date': 'Mar 2026 – Present',
      'qa.exp.r1.title': 'Quality Assurance Engineer',
      'qa.exp.r1.type': 'Full-time',
      'qa.exp.r1.p1': 'Quality assurance for payment and online banking products across multiple projects, including System Integration Testing (SIT).',
      'qa.exp.r1.p2': '[Add 1–2 more bullets]',
      'qa.exp.r2.date': 'Nov 2025 – Mar 2026',
      'qa.exp.r2.title': 'Quality Assurance Engineer',
      'qa.exp.r2.type': 'Internship',
      'qa.exp.r2.p1': 'Took part in quality assurance for payment and online banking projects and products, making sure each product delivers what it’s meant to.',
      'qa.exp.r3.date': 'Aug 2025 – Nov 2025',
      'qa.exp.r3.title': 'Java Development Trainee',
      'qa.exp.r3.type': 'Apprenticeship · Batch 16',
      'qa.exp.r3.place': 'Kelapa Gading, Jakarta · On-site',
      'qa.exp.r3.p1': 'Java development training program.',
      'qa.exp.earlier': 'Earlier',
      'qa.exp.ihs.title': 'IT / Zoom Support',
      'qa.exp.ihs.p1': 'IT documentation and website maintenance. Zoom support for live sessions.',
      'qa.org.title': 'Organization',
      'qa.org.role': 'Head of Division',
      'qa.org.p1': 'Led the operations of the Homeband division. Trained Homeband talent and connected them with prospective publishers.',
      'qa.edu.title': 'Education',
      'qa.edu.degree': 'Informatics Engineering (S.Kom)',
      'qa.edu.school': 'Brawijaya University',

      'qa.skills.title': 'Skills & tools',
      'qa.skills.testing': 'Testing',
      'qa.skills.engineering': 'Engineering',
      'qa.skills.design': 'Product & design',
      'qa.skills.working': 'Ways of working',
      'qa.skills.tools': 'Tools',
      'qa.skill.qa': 'Quality assurance',
      'qa.skill.sit': 'System integration testing (SIT)',
      'qa.skill.manual': '[Manual testing]',
      'qa.skill.cases': '[Test case design]',
      'qa.skill.bugs': '[Bug reporting]',
      'qa.skill.auto': '[Automation tool]',
      'qa.skill.ux': 'UX research',
      'qa.skill.proto': 'Prototyping',
      'qa.skill.hcd': 'Human-centered design',
      'qa.skill.team': 'Teamwork',
      'qa.skill.pm': 'Project management',
      'qa.tool.tm': '[Test management tool]',
      'qa.tool.bt': '[Bug tracker]',
      'qa.tool.api': '[API testing tool]',

      'qa.work.title': 'Case studies',
      'qa.work.note': 'Work in payments and banking is usually confidential, so these are anonymized.',
      'qa.work.problem': 'Problem',
      'qa.work.tested': 'What I tested',
      'qa.work.result': 'Result',
      'qa.work.c1': '[A payment platform]',
      'qa.work.c2': '[An online banking feature]',
      'qa.work.c3': '[Project title]',
      'qa.work.phProblem': '[What was at risk, and for whom.]',
      'qa.work.phTested': '[Scope, approach, and the cases that mattered most.]',
      'qa.work.phResult': '[What changed. Only numbers you’re allowed to share.]',

      'qa.cv.title': 'CV',
      'qa.cv.text': 'Everything above, on one page.',
      'qa.cv.button': 'Download CV (PDF)',

      'qa.contact.title': 'Contact',
      'qa.contact.text': 'Email is the easiest way to reach me.',
      'qa.contact.email': 'Email',
      'qa.contact.github': 'GitHub',
      'qa.toArt': 'Outside of work, I make art',

      'art.nav.label': 'Sections',
      'art.nav.works': 'Works',
      'art.nav.about': 'About',
      'art.nav.links': 'Find us',
      'art.tagline': 'Where the lost come to rest.',
      'art.works.title': 'Works',
      'art.works.intro': '[A line about the pieces shown here.]',
      'art.ph.title': '[Title]',
      'art.ph.meta': '[Medium], [Year]',
      'art.alt.1': 'Placeholder artwork: a pale moon over still water at dusk.',
      'art.alt.2': 'Placeholder artwork: willow branches in ink on paper.',
      'art.alt.3': 'Placeholder artwork: layered mountains fading into mist.',
      'art.alt.4': 'Placeholder artwork: an ink circle drawn in one stroke.',
      'art.alt.5': 'Placeholder artwork: a paper lantern glowing in the rain.',
      'art.alt.6': 'Placeholder artwork: reeds bending in the wind under an evening sky.',
      'art.about.title': 'About the atelier',
      'art.about.p1': '[How The Willow Atelier started.]',
      'art.about.p2': '[What you make: mediums, themes, the feeling you’re after.]',
      'art.about.p3': '[Who it’s for.]',
      'art.links.title': 'Find the atelier',
      'art.links.instagram': 'Instagram',
      'art.links.shop': 'Shop',
      'art.links.soon': '[Link coming soon]',

      'nf.title': 'Nothing behind this door.',
      'nf.text': 'The page you’re looking for isn’t here. The link may be old or mistyped.'
    },

    // Draft. Needs a native read.
    id: {
      'common.skip': 'Langsung ke konten',
      'common.back': 'Kembali ke gerbang',
      'common.backShort': 'Gerbang',
      'common.lang': 'Bahasa',
      'common.menu': 'Menu',
      'common.made': 'Dibuat dengan bantuan Claude',

      'meta.gate.title': 'Kevin JG · QA Engineer dan The Willow Atelier',
      'meta.gate.desc': 'Dua pintu. Satu menuju pekerjaan saya sebagai QA engineer di bidang pembayaran dan online banking. Satu lagi menuju The Willow Atelier, tempat saya berkarya seni.',
      'meta.qa.title': 'Kevin Judhistira Girsang · QA Engineer',
      'meta.qa.desc': 'QA engineer berorientasi produk di Inteleq (Indivara Group), Jakarta, yang menguji produk pembayaran dan online banking.',
      'meta.art.title': 'The Willow Atelier',
      'meta.art.desc': 'Tempat yang tersesat menemukan istirahat. Karya seni dari The Willow Atelier.',
      'meta.404.title': 'Halaman tidak ditemukan · Kevin JG',
      'meta.404.desc': 'Halaman ini tidak ada. Silakan kembali ke gerbang.',

      'gate.intro': 'Pilih salah satu pintu.',
      'gate.doors': 'Pintu',
      'gate.qa': 'QA Engineer',
      'gate.art': 'The Willow Atelier',
      'gate.tap': 'Ketuk untuk membuka',
      'gate.again': 'Ketuk lagi untuk masuk',

      'qa.nav.label': 'Bagian',
      'qa.nav.about': 'Tentang',
      'qa.nav.experience': 'Pengalaman',
      'qa.nav.skills': 'Keahlian',
      'qa.nav.work': 'Proyek',
      'qa.nav.contact': 'Kontak',

      'qa.hero.place': 'Bekasi, Indonesia',
      'qa.hero.pitch': 'QA Engineer berorientasi produk',
      'qa.hero.sub': 'Pembayaran · Online Banking · Jakarta',
      'qa.hero.cv': 'Unduh CV',
      'qa.hero.contact': 'Hubungi saya',

      'qa.about.title': 'Tentang saya',
      'qa.about.p1': 'Saya QA engineer di Inteleq, bagian dari Indivara Group, di Jakarta. Saya menguji produk pembayaran dan online banking di beberapa proyek, termasuk system integration testing.',
      'qa.about.p2': 'Saya sampai di sini lewat program pelatihan pengembangan Java dari Indivara. Sebelumnya, saya kuliah Teknik Informatika di Universitas Brawijaya dan memimpin divisi Homeband di badan olahraga dan seni fakultas saya.',
      'qa.about.p3': '[Satu atau dua kalimat tentang cara Anda menguji, dan apa yang Anda pedulikan dalam sebuah produk.]',
      'qa.facts.label': 'Sekilas',
      'qa.facts.based': 'Domisili',
      'qa.facts.basedValue': 'Bekasi, Indonesia',
      'qa.facts.work': 'Bekerja di',
      'qa.facts.workValue': 'Jakarta · Hybrid',
      'qa.facts.focus': 'Fokus',
      'qa.facts.focusValue': 'Pembayaran, online banking',
      'qa.facts.study': 'Pendidikan',
      'qa.facts.studyValue': 'Teknik Informatika, Universitas Brawijaya',

      'qa.exp.title': 'Pengalaman',
      'qa.exp.meta': 'Jakarta · Hybrid',
      'qa.exp.roles': 'Peran di Inteleq, dari yang terbaru',
      'qa.exp.r1.date': 'Mar 2026 – Sekarang',
      'qa.exp.r1.title': 'Quality Assurance Engineer',
      'qa.exp.r1.type': 'Penuh waktu',
      'qa.exp.r1.p1': 'Quality assurance untuk produk pembayaran dan online banking di beberapa proyek, termasuk System Integration Testing (SIT).',
      'qa.exp.r1.p2': '[Tambahkan 1–2 poin lagi]',
      'qa.exp.r2.date': 'Nov 2025 – Mar 2026',
      'qa.exp.r2.title': 'Quality Assurance Engineer',
      'qa.exp.r2.type': 'Magang',
      'qa.exp.r2.p1': 'Terlibat dalam quality assurance untuk proyek dan produk pembayaran serta online banking, memastikan setiap produk berjalan sesuai tujuannya.',
      'qa.exp.r3.date': 'Agu 2025 – Nov 2025',
      'qa.exp.r3.title': 'Java Development Trainee',
      'qa.exp.r3.type': 'Pemagangan · Batch 16',
      'qa.exp.r3.place': 'Kelapa Gading, Jakarta · Di kantor',
      'qa.exp.r3.p1': 'Program pelatihan pengembangan Java.',
      'qa.exp.earlier': 'Sebelumnya',
      'qa.exp.ihs.title': 'Dukungan IT / Zoom',
      'qa.exp.ihs.p1': 'Dokumentasi IT dan pemeliharaan situs web. Dukungan Zoom untuk sesi langsung.',
      'qa.org.title': 'Organisasi',
      'qa.org.role': 'Kepala Divisi',
      'qa.org.p1': 'Memimpin operasional divisi Homeband. Melatih talenta Homeband dan menghubungkan mereka dengan calon publisher.',
      'qa.edu.title': 'Pendidikan',
      'qa.edu.degree': 'Teknik Informatika (S.Kom)',
      'qa.edu.school': 'Universitas Brawijaya',

      'qa.skills.title': 'Keahlian & alat',
      'qa.skills.testing': 'Pengujian',
      'qa.skills.engineering': 'Rekayasa',
      'qa.skills.design': 'Produk & desain',
      'qa.skills.working': 'Cara kerja',
      'qa.skills.tools': 'Alat',
      'qa.skill.qa': 'Quality assurance',
      'qa.skill.sit': 'System integration testing (SIT)',
      'qa.skill.manual': '[Pengujian manual]',
      'qa.skill.cases': '[Desain test case]',
      'qa.skill.bugs': '[Pelaporan bug]',
      'qa.skill.auto': '[Alat otomasi]',
      'qa.skill.ux': 'Riset UX',
      'qa.skill.proto': 'Prototyping',
      'qa.skill.hcd': 'Desain berpusat pada manusia',
      'qa.skill.team': 'Kerja sama tim',
      'qa.skill.pm': 'Manajemen proyek',
      'qa.tool.tm': '[Alat manajemen tes]',
      'qa.tool.bt': '[Pelacak bug]',
      'qa.tool.api': '[Alat pengujian API]',

      'qa.work.title': 'Studi kasus',
      'qa.work.note': 'Pekerjaan di bidang pembayaran dan perbankan biasanya bersifat rahasia, jadi studi kasus ini dianonimkan.',
      'qa.work.problem': 'Masalah',
      'qa.work.tested': 'Yang saya uji',
      'qa.work.result': 'Hasil',
      'qa.work.c1': '[Sebuah platform pembayaran]',
      'qa.work.c2': '[Sebuah fitur online banking]',
      'qa.work.c3': '[Judul proyek]',
      'qa.work.phProblem': '[Apa yang dipertaruhkan, dan bagi siapa.]',
      'qa.work.phTested': '[Cakupan, pendekatan, dan kasus yang paling penting.]',
      'qa.work.phResult': '[Apa yang berubah. Hanya angka yang boleh dibagikan.]',

      'qa.cv.title': 'CV',
      'qa.cv.text': 'Semua yang di atas, dalam satu halaman.',
      'qa.cv.button': 'Unduh CV (PDF)',

      'qa.contact.title': 'Kontak',
      'qa.contact.text': 'Cara termudah menghubungi saya adalah lewat email.',
      'qa.contact.email': 'Email',
      'qa.contact.github': 'GitHub',
      'qa.toArt': 'Di luar pekerjaan, saya berkarya seni',

      'art.nav.label': 'Bagian',
      'art.nav.works': 'Karya',
      'art.nav.about': 'Tentang',
      'art.nav.links': 'Temukan kami',
      'art.tagline': 'Tempat yang tersesat menemukan istirahat.',
      'art.works.title': 'Karya',
      'art.works.intro': '[Satu kalimat tentang karya-karya di sini.]',
      'art.ph.title': '[Judul]',
      'art.ph.meta': '[Media], [Tahun]',
      'art.alt.1': 'Karya placeholder: bulan pucat di atas air yang tenang saat senja.',
      'art.alt.2': 'Karya placeholder: dahan willow dengan tinta di atas kertas.',
      'art.alt.3': 'Karya placeholder: lapisan gunung yang memudar dalam kabut.',
      'art.alt.4': 'Karya placeholder: lingkaran tinta dalam satu sapuan kuas.',
      'art.alt.5': 'Karya placeholder: lentera kertas yang menyala di tengah hujan.',
      'art.alt.6': 'Karya placeholder: ilalang yang merunduk diterpa angin di bawah langit senja.',
      'art.about.title': 'Tentang atelier',
      'art.about.p1': '[Bagaimana The Willow Atelier dimulai.]',
      'art.about.p2': '[Apa yang Anda buat: media, tema, dan rasa yang ingin dihadirkan.]',
      'art.about.p3': '[Untuk siapa karya ini.]',
      'art.links.title': 'Temukan atelier',
      'art.links.instagram': 'Instagram',
      'art.links.shop': 'Toko',
      'art.links.soon': '[Tautan segera hadir]',

      'nf.title': 'Tidak ada apa-apa di balik pintu ini.',
      'nf.text': 'Halaman yang Anda cari tidak ada di sini. Tautannya mungkin sudah lama atau salah ketik.'
    },

    // Draft. Needs a native read.
    ja: {
      'common.skip': '本文へスキップ',
      'common.back': '門へ戻る',
      'common.backShort': '門へ',
      'common.lang': '言語',
      'common.menu': 'メニュー',
      'common.made': 'Claudeの協力で制作',

      'meta.gate.title': 'Kevin JG · QAエンジニアと The Willow Atelier',
      'meta.gate.desc': '二つの扉。ひとつは決済とオンラインバンキングのQAエンジニアとしての仕事へ。もうひとつは、アートをつくる The Willow Atelier へ。',
      'meta.qa.title': 'Kevin Judhistira Girsang · QAエンジニア',
      'meta.qa.desc': 'ジャカルタのInteleq（Indivara Group）で、決済・オンラインバンキング製品をテストするプロダクト志向のQAエンジニア。',
      'meta.art.title': 'The Willow Atelier',
      'meta.art.desc': '迷えるものが、やすらぐ場所。The Willow Atelier の作品。',
      'meta.404.title': 'ページが見つかりません · Kevin JG',
      'meta.404.desc': 'このページは存在しません。門へお戻りください。',

      'gate.intro': '扉をひとつ選んでください。',
      'gate.doors': '扉',
      'gate.qa': 'QAエンジニア',
      'gate.art': 'The Willow Atelier',
      'gate.tap': 'タップして開く',
      'gate.again': 'もう一度タップして入る',

      'qa.nav.label': 'セクション',
      'qa.nav.about': '私について',
      'qa.nav.experience': '経歴',
      'qa.nav.skills': 'スキル',
      'qa.nav.work': '事例',
      'qa.nav.contact': '連絡先',

      'qa.hero.place': 'インドネシア・ブカシ',
      'qa.hero.pitch': 'プロダクト志向のQAエンジニア',
      'qa.hero.sub': '決済 · オンラインバンキング · ジャカルタ',
      'qa.hero.cv': 'CVをダウンロード',
      'qa.hero.contact': '連絡する',

      'qa.about.title': '私について',
      'qa.about.p1': 'ジャカルタのInteleq（Indivara Group）でQAエンジニアをしています。複数のプロジェクトで決済とオンラインバンキングの製品をテストしており、システム結合テストも担当しています。',
      'qa.about.p2': 'IndivaraのJava開発研修を経て、今の仕事に就きました。その前はブラウィジャヤ大学で情報工学を学び、学部のスポーツ・芸術団体でHomeband部門を率いていました。',
      'qa.about.p3': '[テストへの向き合い方や、プロダクトで大切にしていることを一、二文で]',
      'qa.facts.label': 'プロフィール',
      'qa.facts.based': '拠点',
      'qa.facts.basedValue': 'インドネシア・ブカシ',
      'qa.facts.work': '勤務地',
      'qa.facts.workValue': 'ジャカルタ · ハイブリッド',
      'qa.facts.focus': '専門',
      'qa.facts.focusValue': '決済、オンラインバンキング',
      'qa.facts.study': '学歴',
      'qa.facts.studyValue': 'ブラウィジャヤ大学 情報工学',

      'qa.exp.title': '経歴',
      'qa.exp.meta': 'ジャカルタ · ハイブリッド',
      'qa.exp.roles': 'Inteleqでの役職（新しい順）',
      'qa.exp.r1.date': '2026年3月 – 現在',
      'qa.exp.r1.title': '品質保証エンジニア',
      'qa.exp.r1.type': '正社員',
      'qa.exp.r1.p1': '複数のプロジェクトで、決済・オンラインバンキング製品の品質保証を担当。システム結合テスト（SIT）を含む。',
      'qa.exp.r1.p2': '[箇条書きを1〜2項目追加]',
      'qa.exp.r2.date': '2025年11月 – 2026年3月',
      'qa.exp.r2.title': '品質保証エンジニア',
      'qa.exp.r2.type': 'インターン',
      'qa.exp.r2.p1': '決済・オンラインバンキングのプロジェクトと製品の品質保証に参加し、各製品が意図どおりに機能することを確認。',
      'qa.exp.r3.date': '2025年8月 – 2025年11月',
      'qa.exp.r3.title': 'Java開発研修生',
      'qa.exp.r3.type': '見習い · 第16期',
      'qa.exp.r3.place': 'ジャカルタ・クラパガディン · 出社',
      'qa.exp.r3.p1': 'Java開発の研修プログラム。',
      'qa.exp.earlier': 'それ以前',
      'qa.exp.ihs.title': 'IT・Zoomサポート',
      'qa.exp.ihs.p1': 'ITドキュメントの作成とウェブサイトの保守。ライブセッションのZoomサポート。',
      'qa.org.title': '課外活動',
      'qa.org.role': '部門長',
      'qa.org.p1': 'Homeband部門の運営を統括。メンバーを育成し、音楽出版社の候補との橋渡しを担当。',
      'qa.edu.title': '学歴',
      'qa.edu.degree': '情報工学（S.Kom）',
      'qa.edu.school': 'ブラウィジャヤ大学',

      'qa.skills.title': 'スキルとツール',
      'qa.skills.testing': 'テスト',
      'qa.skills.engineering': 'エンジニアリング',
      'qa.skills.design': 'プロダクトとデザイン',
      'qa.skills.working': '働き方',
      'qa.skills.tools': 'ツール',
      'qa.skill.qa': '品質保証',
      'qa.skill.sit': 'システム結合テスト（SIT）',
      'qa.skill.manual': '[手動テスト]',
      'qa.skill.cases': '[テストケース設計]',
      'qa.skill.bugs': '[バグ報告]',
      'qa.skill.auto': '[自動化ツール]',
      'qa.skill.ux': 'UXリサーチ',
      'qa.skill.proto': 'プロトタイピング',
      'qa.skill.hcd': '人間中心設計',
      'qa.skill.team': 'チームワーク',
      'qa.skill.pm': 'プロジェクトマネジメント',
      'qa.tool.tm': '[テスト管理ツール]',
      'qa.tool.bt': '[バグ管理ツール]',
      'qa.tool.api': '[APIテストツール]',

      'qa.work.title': '事例',
      'qa.work.note': '決済・金融の仕事は機密であることが多いため、内容は匿名化しています。',
      'qa.work.problem': '課題',
      'qa.work.tested': 'テストしたこと',
      'qa.work.result': '結果',
      'qa.work.c1': '[ある決済プラットフォーム]',
      'qa.work.c2': '[あるオンラインバンキング機能]',
      'qa.work.c3': '[プロジェクト名]',
      'qa.work.phProblem': '[何が、誰にとってリスクだったか]',
      'qa.work.phTested': '[範囲、アプローチ、特に重要だったケース]',
      'qa.work.phResult': '[何が変わったか。公開できる数字のみ]',

      'qa.cv.title': 'CV',
      'qa.cv.text': 'このページの内容を、一枚にまとめています。',
      'qa.cv.button': 'CVをダウンロード（PDF）',

      'qa.contact.title': '連絡先',
      'qa.contact.text': 'ご連絡はメールがいちばん確実です。',
      'qa.contact.email': 'メール',
      'qa.contact.github': 'GitHub',
      'qa.toArt': '仕事の外では、アートをつくっています',

      'art.nav.label': 'セクション',
      'art.nav.works': '作品',
      'art.nav.about': 'アトリエ',
      'art.nav.links': 'リンク',
      'art.tagline': '迷えるものが、やすらぐ場所。',
      'art.works.title': '作品',
      'art.works.intro': '[ここに並ぶ作品についての一文]',
      'art.ph.title': '[タイトル]',
      'art.ph.meta': '[技法]、[制作年]',
      'art.alt.1': '仮の作品画像：夕暮れの静かな水面に浮かぶ淡い月。',
      'art.alt.2': '仮の作品画像：紙に墨で描いた柳の枝。',
      'art.alt.3': '仮の作品画像：霧の中に重なり、消えていく山々。',
      'art.alt.4': '仮の作品画像：ひと筆で描いた墨の円。',
      'art.alt.5': '仮の作品画像：雨の中に灯る紙の提灯。',
      'art.alt.6': '仮の作品画像：夕空の下、風にしなう葦。',
      'art.about.title': 'アトリエについて',
      'art.about.p1': '[The Willow Atelier のはじまり]',
      'art.about.p2': '[つくっているもの：技法、テーマ、届けたい空気]',
      'art.about.p3': '[誰のための場所か]',
      'art.links.title': 'アトリエを訪ねる',
      'art.links.instagram': 'Instagram',
      'art.links.shop': 'ショップ',
      'art.links.soon': '[リンク準備中]',

      'nf.title': 'この扉の向こうには、何もありません。',
      'nf.text': 'お探しのページは見つかりませんでした。リンクが古いか、入力に誤りがあるかもしれません。'
    }
  };

  let current = DEFAULT_LANG;
  let storageWorks = true;

  function isSupported(lang) {
    return LANGS.indexOf(lang) !== -1;
  }

  function getUrlLang(search) {
    const value = new URLSearchParams(search == null ? window.location.search : search).get('lang');
    const lang = value ? value.toLowerCase() : null;
    return isSupported(lang) ? lang : null;
  }

  function getSavedLang() {
    try {
      const lang = window.localStorage.getItem(STORAGE_KEY);
      return isSupported(lang) ? lang : null;
    } catch (e) {
      storageWorks = false;
      return null;
    }
  }

  function saveLang(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      storageWorks = true;
    } catch (e) {
      storageWorks = false;
    }
  }

  // Walks navigator.languages in the visitor's own order and takes the first
  // one we have. "in" is the old code for Indonesian and still shows up.
  function detectBrowserLang(list) {
    const prefs = list || (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
    for (const raw of prefs) {
      const primary = String(raw || '').toLowerCase().split(/[-_;]/)[0];
      if (primary === 'ja') return 'ja';
      if (primary === 'id' || primary === 'in') return 'id';
      if (primary === 'en') return 'en';
    }
    return null;
  }

  function resolveLang() {
    return getUrlLang() || getSavedLang() || detectBrowserLang() || DEFAULT_LANG;
  }

  function t(key, lang) {
    const table = DICT[lang || current] || DICT[DEFAULT_LANG];
    if (Object.prototype.hasOwnProperty.call(table, key)) return table[key];
    if (Object.prototype.hasOwnProperty.call(DICT[DEFAULT_LANG], key)) return DICT[DEFAULT_LANG][key];
    return null;
  }

  function translateElement(el, lang) {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const text = t(key, lang);
      if (text !== null) el.textContent = text;
    }
    const attrs = el.getAttribute('data-i18n-attr');
    if (attrs) {
      attrs.split(';').forEach(function (pair) {
        const parts = pair.split(':');
        const name = parts[0] && parts[0].trim();
        const attrKey = parts[1] && parts[1].trim();
        if (!name || !attrKey) return;
        const text = t(attrKey, lang);
        if (text !== null) el.setAttribute(name, text);
      });
    }
  }

  function translatePage(lang, root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n], [data-i18n-attr]').forEach(function (el) {
      translateElement(el, lang);
    });
  }

  function updateSwitchers(lang) {
    document.querySelectorAll('[data-lang-option]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-option') === lang));
    });
  }

  // Keep ?lang= in step with the choice, otherwise a reload would undo it.
  function syncUrlLang(lang) {
    if (!getUrlLang() || !window.history || !window.history.replaceState) return;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    try {
      window.history.replaceState(window.history.state, '', url.href);
    } catch (e) {
      // file:// in some browsers refuses replaceState. Nothing to do.
    }
  }

  // Without storage the choice can't follow the visitor to the next page,
  // so carry it in the links instead.
  function carryLangInLinks(lang) {
    if (storageWorks) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
      const href = a.getAttribute('href');
      if (!href || /^(#|mailto:|tel:|https?:|\/\/)/i.test(href)) return;
      const hashIndex = href.indexOf('#');
      const path = hashIndex === -1 ? href : href.slice(0, hashIndex);
      const hash = hashIndex === -1 ? '' : href.slice(hashIndex);
      const clean = path.replace(/([?&])lang=[^&]*&?/, '$1').replace(/[?&]$/, '');
      a.setAttribute('href', clean + (clean.indexOf('?') === -1 ? '?' : '&') + 'lang=' + lang + hash);
    });
  }

  function setDocumentLang(lang) {
    document.documentElement.lang = lang;
  }

  function applyLang(lang, options) {
    const opts = options || {};
    const next = isSupported(lang) ? lang : DEFAULT_LANG;
    current = next;
    setDocumentLang(next);
    try {
      translatePage(next);
      updateSwitchers(next);
    } finally {
      document.documentElement.classList.remove('i18n-pending');
    }
    if (opts.save) saveLang(next);
    if (opts.syncUrl) syncUrlLang(next);
    carryLangInLinks(next);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: next } }));
    return next;
  }

  function bindSwitchers() {
    document.querySelectorAll('[data-lang-option]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyLang(btn.getAttribute('data-lang-option'), { save: true, syncUrl: true });
      });
    });
  }

  function init() {
    bindSwitchers();
    // A ?lang= link counts as a choice, so it sticks for the rest of the visit.
    applyLang(current, { save: Boolean(getUrlLang()) });
  }

  // This is the first script on every page, so it also flags that JS is on.
  // CSS uses .js to hide things that only make sense with scripts (reveals, menu).
  document.documentElement.classList.add('js');

  // Settle the language before the body paints.
  current = resolveLang();
  setDocumentLang(current);
  if (current !== DEFAULT_LANG) {
    document.documentElement.classList.add('i18n-pending');
  }

  window.i18n = {
    LANGS: LANGS,
    DEFAULT_LANG: DEFAULT_LANG,
    STORAGE_KEY: STORAGE_KEY,
    dict: DICT,
    t: t,
    getUrlLang: getUrlLang,
    getSavedLang: getSavedLang,
    saveLang: saveLang,
    detectBrowserLang: detectBrowserLang,
    resolveLang: resolveLang,
    translatePage: translatePage,
    applyLang: applyLang,
    get current() {
      return current;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
