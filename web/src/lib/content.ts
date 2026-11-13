import type { T } from "./i18n";

// Default copy for every page. The admin dashboard (/admin) saves overrides to Supabase
// (table kj_content, one row per top-level key below); the site deep-merges those rows over
// these defaults, so a missing or empty database still renders a complete site.
// {en,id} = translated; plain string = same in both languages.

const t = (en: string, id: string = en): T => ({ en, id });

export type NavItem = { path: string; label: T };
export type Category = {
  slug: string;
  day: number;
  name: string;
  unit: T;
  format: T;
  eligibility: T;
  prize: T;
  slots: T;
  blurb: T;
};
export type PageMeta = { title: T; description: T };

export const defaults = {
  settings: {
    start: "2027-07-26T10:00:00+07:00", // countdown target, WIB
    startDate: "2027-07-26",
    endDate: "2027-07-27",
    dates: "26—27.07.2027",
    city: "Semarang, ID",
    venueName: "TBA",
    feeIdr: "Rp200.000",
    feeShort: "Rp200K",
    feeUsd: "USD 15",
    email: "info@kalcerjam.com",
    instagram: "kalcerjam",
    rsvpOpen: false,
    siteTitle: "Kalcer Jam 2027 — Semarang",
    siteDescription: "Breaking & openstyle jam in Semarang, 26–27 July 2027. 7 to Smoke, 2vs2, Toprock, Footwork. Winners fly to the 6Kamenz Anniversary in Bangkok.",
    footerCrew: "Anak Kalcer: Fird, Joker, Senor. × 6Kamenz",
    footerCopyright: "© 2027 Kalcer Jam",
    footerRight: "Semarang to Bangkok",
  },

  nav: {
    main: [
      { path: "/2027", label: t("Event") },
      { path: "/2027/categories", label: t("Categories", "Kategori") },
      { path: "/2027/lineup", label: t("Lineup") },
      { path: "/2027/rules", label: t("Rules", "Aturan") },
      { path: "/live", label: t("Live") },
      { path: "/about", label: t("About", "Tentang") },
    ] as NavItem[],
    more: [
      { path: "/sponsors", label: t("Sponsors", "Sponsor") },
      { path: "/gallery", label: t("Gallery", "Galeri") },
      { path: "/news", label: t("News", "Berita") },
      { path: "/travel", label: t("Travel", "Perjalanan") },
      { path: "/merch", label: t("Merch") },
      { path: "/faq", label: t("FAQ") },
      { path: "/contact", label: t("Contact", "Kontak") },
    ] as NavItem[],
  },

  ui: {
    register: t("Register", "Daftar"),
    rsvp: t("RSVP free", "RSVP gratis"),
    menu: t("Menu"),
    close: t("Close", "Tutup"),
    presents: t("Anak Kalcer presents", "Anak Kalcer mempersembahkan"),
    venueSoon: t("Venue announced soon", "Venue segera diumumkan"),
    countdown: t("Until the floor opens", "Menuju lantai dibuka"),
    unitDays: t("Days", "Hari"),
    unitHours: t("Hrs", "Jam"),
    unitMinutes: t("Min", "Mnt"),
    unitSeconds: t("Sec", "Dtk"),
    allCategories: t("All categories", "Semua kategori"),
    free: t("Free entry", "Masuk gratis"),
    day: t("Day", "Hari"),
    soon: t("Soon", "Segera"),
    footerLine: t("Built by the scene, for the scene.", "Dibangun oleh skena, untuk skena."),
  },

  home: {
    howToEnter: t("How to enter", "Cara ikut"),
    steps: [t("Sign up", "Daftar akun"), t("Build your profile", "Isi profil"), t("Pick categories", "Pilih kategori"), t("Pay once", "Bayar sekali"), t("Get your QR pass", "Dapat QR pass")],
    numbersTitle: t("Two days in numbers", "Dua hari dalam angka"),
    numbers: [
      { value: "8", label: t("Categories", "Kategori") },
      { value: "2", label: t("Days", "Hari") },
      { value: "4", label: t("Seats to Bangkok", "Kursi ke Bangkok") },
      { value: "Rp200K", label: t("One fee", "Satu biaya") },
    ],
    datesLabel: t("Dates", "Tanggal"),
    cityLabel: t("City", "Kota"),
    infoLines: [
      t("Venue announced soon.", "Venue segera diumumkan."),
      t("Registration runs 1 April to 10 July 2027.", "Pendaftaran 1 April sampai 10 Juli 2027."),
      t("One fee covers every category: Rp200.000, or USD 15 by PayPal.", "Satu biaya untuk semua kategori: Rp200.000, atau USD 15 via PayPal."),
    ],
    countdownDate: "26.07.27",
    countdownNote: t("Doors 10:00 WIB · placeholder", "Pintu dibuka 10:00 WIB · placeholder"),
    fightTag: t("The fight card", "Susunan battle"),
    fightTitle1: t("Two days.", "Dua hari."),
    fightTitle2: t("Eight floors.", "Delapan kategori."),
    bangkokTag: t("Road to Bangkok"),
    bangkokKicker: t("Boarding pass for the Main Event winners", "Boarding pass untuk pemenang Main Event"),
    bangkokFrom: { code: "SRG", city: "Semarang" },
    bangkokTo: { code: "BKK", city: "Bangkok" },
    bangkokBody: t(
      "Win 2vs2 Breaking, Toprock or Footwork and you fly to the 6Kamenz Anniversary in Bangkok. Four dancers. Four seats.",
      "Juara 2vs2 Breaking, Toprock atau Footwork terbang ke 6Kamenz Anniversary di Bangkok. Empat dancer. Empat kursi.",
    ),
    bangkokStats: [
      { label: t("Seats", "Kursi"), value: "04" },
      { label: t("Gate"), value: "6K" },
      { label: t("Class", "Kelas"), value: "Champ" },
      { label: t("Date", "Tgl"), value: "27.07" },
    ],
    smokeTag: t("7 to Smoke"),
    smokeTitle: t("First to seven wins.", "Siapa dulu tujuh menang."),
    smokeBody: t(
      "Four invited, four from prelims. Win the exchange and you stay on the floor. Lose and you go to the back of the line. Breaking and Openstyle. Cash for the King.",
      "Empat undangan, empat dari prelim. Menang exchange, tetap di lantai. Kalah, kembali ke antrean. Breaking dan Openstyle. Hadiah uang untuk sang King.",
    ),
    smokeCaption: t("Four wins in. The seventh takes the crown.", "Empat kemenangan. Yang ketujuh jadi King."),
    feeKicker: t("One fee. Every category.", "Satu biaya. Semua kategori."),
    feeUsdNote: t("by PayPal for international dancers", "via PayPal untuk dancer internasional"),
    feeRows: [
      { label: t("Registration opens", "Pendaftaran dibuka"), value: t("01.04.27") },
      { label: t("Registration closes", "Pendaftaran ditutup"), value: t("10.07.27") },
      { label: t("Spectators", "Penonton"), value: t("Free entry", "Masuk gratis") },
    ],
    feeCta: t("Create your profile", "Buat profilmu"),
    newsTag: t("Latest", "Terbaru"),
    sponsorsTag: t("Backed by", "Didukung oleh"),
    sponsorsCta: t("Become a sponsor", "Jadi sponsor"),
  },

  event: {
    meta: { title: t("Event"), description: t("Two days in Semarang, 26–27 July 2027: schedule, venue and map.", "Dua hari di Semarang, 26–27 Juli 2027: jadwal, venue dan peta.") } as PageMeta,
    kicker: t("26—27.07.2027 · Semarang"),
    title: t("Two days", "Dua hari"),
    intro: t("Pre-Party on Saturday. Main Event on Sunday. Free for spectators.", "Pre-Party hari Sabtu. Main Event hari Minggu. Gratis untuk penonton."),
    days: [
      {
        n: 1, date: "26.07", title: t("Pre-Party"),
        rundown: [
          { time: "10:00", what: t("Doors · cypher") },
          { time: "11:00", what: t("Prelims") },
          { time: "15:00", what: t("Bgirl · Kids U-12 · Over 35 — Top 16") },
          { time: "19:00", what: t("7 to Smoke — Openstyle") },
          { time: "20:30", what: t("7 to Smoke — Breaking") },
        ],
      },
      {
        n: 2, date: "27.07", title: t("Main Event"),
        rundown: [
          { time: "10:00", what: t("Doors · cypher") },
          { time: "11:00", what: t("Prelims") },
          { time: "15:00", what: t("Top 16 → Semi") },
          { time: "19:00", what: t("Finals") },
          { time: "21:00", what: t("Road to Bangkok — winners announced") },
        ],
      },
    ],
    rundownNote: t("Rundown is a placeholder", "Rundown masih placeholder"),
    venueTag: t("Venue"),
    venueCity: t("Semarang"),
    venueBody: t("Address and capacity are being locked in now.", "Alamat dan kapasitas sedang difinalisasi."),
    venueMapUrl: "",
    travelCta: t("Travel guide", "Panduan perjalanan"),
    categoriesTag: t("Categories", "Kategori"),
  },

  categories: {
    meta: { title: t("Categories", "Kategori"), description: t("Format, eligibility, prizes and slots for every Kalcer Jam 2027 category.", "Format, syarat, hadiah dan slot setiap kategori Kalcer Jam 2027.") } as PageMeta,
    kicker: t("8 categories · 1 fee", "8 kategori · 1 biaya"),
    title: t("Categories", "Kategori"),
    intro: t("Enter as many as you're eligible for. One fee covers all of them.", "Ikut sebanyak yang kamu bisa. Satu biaya untuk semuanya."),
    labelFormat: t("Format"),
    labelUnit: t("Unit"),
    labelWho: t("Who", "Siapa"),
    labelSlots: t("Slots", "Slot"),
    labelPrize: t("Prize", "Hadiah"),
    labelRules: t("Rules", "Aturan"),
    list: [
      {
        slug: "7-to-smoke-breaking", day: 1, name: "7 to Smoke — Breaking",
        unit: t("Solo"), format: t("Prelims → 7 to Smoke", "Prelim → 7 to Smoke"), eligibility: t("Open to all", "Terbuka untuk semua"),
        prize: t("Cash prize for the King", "Hadiah uang untuk sang King"), slots: t("4 invited + 4 from prelims", "4 undangan + 4 dari prelim"),
        blurb: t("Win the exchange, stay on. First to seven points takes the crown.", "Menang exchange, tetap di lantai. Yang pertama dapat tujuh poin jadi King."),
      },
      {
        slug: "7-to-smoke-openstyle", day: 1, name: "7 to Smoke — Openstyle",
        unit: t("Solo"), format: t("Prelims → 7 to Smoke", "Prelim → 7 to Smoke"), eligibility: t("Open to all styles", "Terbuka untuk semua gaya"),
        prize: t("Cash prize for the King", "Hadiah uang untuk sang King"), slots: t("4 invited + 4 from prelims", "4 undangan + 4 dari prelim"),
        blurb: t("Any style, one floor. Same race to seven.", "Gaya apa pun, satu lantai. Balapan yang sama menuju tujuh."),
      },
      {
        slug: "bgirl", day: 1, name: "Bgirl",
        unit: t("Solo"), format: t("Prelims → Top 16 bracket", "Prelim → bracket Top 16"), eligibility: t("Bgirls", "Bgirl"),
        prize: t("Lorem prize TBA", "Hadiah menyusul"), slots: t("Open", "Terbuka"),
        blurb: t("Lorem ipsum dolor sit amet, consectetur adipiscing elit."),
      },
      {
        slug: "kids-u12", day: 1, name: "Kids U-12",
        unit: t("Solo"), format: t("Prelims → Top 16 bracket", "Prelim → bracket Top 16"),
        eligibility: t("Under 12 on 26 Jul 2027 · registered by a guardian", "Di bawah 12 tahun pada 26 Jul 2027 · didaftarkan wali"),
        prize: t("Lorem prize TBA", "Hadiah menyusul"), slots: t("Open", "Terbuka"),
        blurb: t("The next generation gets the same floor and the same respect.", "Generasi berikutnya, lantai yang sama, respek yang sama."),
      },
      {
        slug: "over-35", day: 1, name: "Over 35",
        unit: t("Solo"), format: t("Prelims → Top 16 bracket", "Prelim → bracket Top 16"),
        eligibility: t("35 or older on 26 Jul 2027", "35 tahun ke atas pada 26 Jul 2027"),
        prize: t("Lorem prize TBA", "Hadiah menyusul"), slots: t("Open", "Terbuka"),
        blurb: t("The OGs never left. Come prove it.", "Para OG tidak pernah pergi. Buktikan."),
      },
      {
        slug: "2vs2-breaking", day: 2, name: "2vs2 Breaking",
        unit: t("Team of 2", "Tim 2 orang"), format: t("Prelims → Top 16 bracket", "Prelim → bracket Top 16"),
        eligibility: t("Both dancers registered; partner accepts the invite", "Kedua dancer terdaftar; partner menerima undangan"),
        prize: t("Trip to 6Kamenz Anniversary, Bangkok", "Tiket ke 6Kamenz Anniversary, Bangkok"), slots: t("Open", "Terbuka"),
        blurb: t("Bring your partner. Two winners fly to Bangkok.", "Bawa partnermu. Dua pemenang terbang ke Bangkok."),
      },
      {
        slug: "toprock", day: 2, name: "Toprock",
        unit: t("Solo"), format: t("Prelims → Top 16 bracket", "Prelim → bracket Top 16"), eligibility: t("Open to all", "Terbuka untuk semua"),
        prize: t("Trip to 6Kamenz Anniversary, Bangkok", "Tiket ke 6Kamenz Anniversary, Bangkok"), slots: t("Open", "Terbuka"),
        blurb: t("Standing up only. Rhythm, character, attack.", "Hanya berdiri. Ritme, karakter, serangan."),
      },
      {
        slug: "footwork", day: 2, name: "Footwork",
        unit: t("Solo"), format: t("Prelims → Top 16 bracket", "Prelim → bracket Top 16"), eligibility: t("Open to all", "Terbuka untuk semua"),
        prize: t("Trip to 6Kamenz Anniversary, Bangkok", "Tiket ke 6Kamenz Anniversary, Bangkok"), slots: t("Open", "Terbuka"),
        blurb: t("Down on the floor. Speed, control, foundation.", "Di lantai. Kecepatan, kontrol, fondasi."),
      },
    ] as Category[],
  },

  lineup: {
    meta: { title: t("Lineup"), description: t("Judges, MC, DJ, invited dancers and international guests.", "Juri, MC, DJ, dancer undangan dan tamu internasional.") } as PageMeta,
    kicker: t("Revealed monthly on @kalcerjam", "Diumumkan tiap bulan di @kalcerjam"),
    title: t("Lineup"),
    groups: [
      { group: t("Judges", "Juri"), people: [{ name: "TBA", photo: "", note: t("Soon", "Segera") }, { name: "TBA", photo: "", note: t("Soon", "Segera") }, { name: "TBA", photo: "", note: t("Soon", "Segera") }] },
      { group: t("MC"), people: [{ name: "TBA", photo: "", note: t("Soon", "Segera") }] },
      { group: t("DJ"), people: [{ name: "TBA", photo: "", note: t("Soon", "Segera") }] },
      { group: t("Invited — 7 to Smoke", "Undangan — 7 to Smoke"), people: [{ name: "TBA", photo: "", note: t("Soon", "Segera") }, { name: "TBA", photo: "", note: t("Soon", "Segera") }, { name: "TBA", photo: "", note: t("Soon", "Segera") }, { name: "TBA", photo: "", note: t("Soon", "Segera") }] },
    ],
    guestsTag: t("International guests", "Tamu internasional"),
    guests: [
      { code: "TH", name: "Thailand" }, { code: "PH", name: "Philippines" }, { code: "US", name: "United States" }, { code: "VN", name: "Vietnam" },
      { code: "MY", name: "Malaysia" }, { code: "AU", name: "Australia" }, { code: "SG", name: "Singapore" },
    ],
  },

  rules: {
    meta: { title: t("Rules", "Aturan"), description: t("Battle rules, code of conduct and the no-refund policy.", "Aturan battle, kode etik dan kebijakan tanpa refund.") } as PageMeta,
    kicker: t("Read before you register", "Baca sebelum mendaftar"),
    title: t("The rules", "Aturan"),
    battleTag: t("Battle rules", "Aturan battle"),
    battle: [
      t("Prelims: random pairs, 1 round per side. Every judge scores both sides.", "Prelim: pasangan acak, 1 ronde per sisi. Setiap juri menilai kedua sisi."),
      t("Top 16 seeded by prelim rank: 1 vs 16, 8 vs 9 and so on.", "Top 16 diurutkan dari peringkat prelim: 1 vs 16, 8 vs 9, dan seterusnya."),
      t("From Top 16 to the final, judges call it by hand-raise.", "Dari Top 16 sampai final, juri memutuskan dengan angkat tangan."),
      t("A split call can go to an extra round.", "Keputusan seri bisa lanjut ke extra round."),
      t("Not there when your battle is called? Walkover.", "Tidak hadir saat battle dipanggil? Walkover."),
      t("7 to Smoke: win the exchange, stay on. First to 7 points. If time runs out, most points wins.", "7 to Smoke: menang exchange, tetap di lantai. Pertama dapat 7 poin. Jika waktu habis, poin terbanyak menang."),
    ],
    conductTag: t("Code of conduct", "Kode etik"),
    conduct: [
      t("Respect the circle, the judges, the DJ and each other.", "Hormati lingkaran, juri, DJ dan satu sama lain."),
      t("No intentional contact. Burns yes, violence no.", "Tidak ada kontak sengaja. Burn boleh, kekerasan tidak."),
      t("Lorem ipsum dolor sit amet, consectetur adipiscing elit."),
    ],
    refundTitle: t("No refunds", "Tanpa refund"),
    refundBody: t(
      "Can't make it? Transfer your spot to another dancer through a registration admin before 10 July 2027. Every transfer is logged.",
      "Tidak bisa hadir? Alihkan slotmu ke dancer lain lewat admin pendaftaran sebelum 10 Juli 2027. Setiap pengalihan dicatat.",
    ),
  },

  live: {
    meta: { title: t("Live"), description: t("Now on stage, brackets, 7 to Smoke board and results.", "Sedang tampil, bracket, papan 7 to Smoke dan hasil.") } as PageMeta,
    kicker: t("Preview — goes live 26.07.2027", "Pratinjau — live 26.07.2027"),
    title: t("Live"),
    nowLabel: t("Now on stage", "Sedang tampil"),
    nowRound: "Toprock · Top 8",
    nowA: "Dancer 01",
    nowB: "Dancer 09",
    nextLabel: t("Up next", "Berikutnya"),
    next: [{ a: "Dancer 05", b: "Dancer 04" }, { a: "Dancer 03", b: "Dancer 11" }],
    streamUrl: "",
    streamPlaceholder: t("Stream embed goes here", "Embed stream di sini"),
    bracketsTag: t("Brackets"),
    bracketTitles: ["Toprock", "Footwork"],
    rounds: ["Top 16", "Top 8", "Semi", "Final"],
    smokeTag: t("7 to Smoke"),
    smokeTitles: ["Breaking", "Openstyle"],
    footnote: t("Sample data. Winners only — no scores or vote splits are ever shown here.", "Data contoh. Hanya pemenang — skor dan pembagian suara tidak ditampilkan."),
  },

  about: {
    meta: { title: t("About", "Tentang"), description: t("The story of Kalcer Jam, Anak Kalcer and the 6Kamenz partnership.", "Cerita Kalcer Jam, Anak Kalcer dan kemitraan 6Kamenz.") } as PageMeta,
    kicker: t("Roots, not just competition", "Akar, bukan sekadar kompetisi"),
    title: t("Our story", "Cerita kami"),
    intro: t("Kalcer Jam is the yearly homecoming for breaking in Semarang — the day the whole scene comes back to the circle.", "Kalcer Jam adalah pulang kampung tahunan breaking di Semarang — hari ketika seluruh skena kembali ke lingkaran."),
    tagline: t("Lebaran-nya breaking."),
    paragraphs: [
      t("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Vestibulum id ligula porta felis euismod semper."),
      t("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras mattis consectetur purus sit amet fermentum. Maecenas faucibus mollis interdum."),
    ],
    photo: "",
    photoAlt: t("The circle, 2026", "Lingkaran, 2026"),
    photoCredit: "@bonaventurafajar",
    crewTag: t("Anak Kalcer"),
    crew: [{ name: "Fird", photo: "" }, { name: "Joker", photo: "" }, { name: "Senor", photo: "" }],
    partnerTag: t("× 6Kamenz"),
    partnerMark: "6K",
    partnerBody: t(
      "Our partnership with 6Kamenz connects Semarang to Bangkok. Main Event winners fly to the 6Kamenz Anniversary. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "Kemitraan dengan 6Kamenz menghubungkan Semarang dan Bangkok. Pemenang Main Event terbang ke 6Kamenz Anniversary. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ),
    timelineTag: t("Timeline", "Linimasa"),
    history: [
      { year: "2025", title: t("The first jam", "Jam pertama"), body: t("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Winners, photos and press release go here.", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pemenang, foto dan rilis pers di sini.") },
      { year: "2026", title: t("Kalcer Jam × 6Kamenz"), body: t("31 dancers registered. 7 to Smoke on a paper race-to-7 sheet. Lorem ipsum dolor sit amet.", "31 dancer mendaftar. 7 to Smoke dicatat di kertas. Lorem ipsum dolor sit amet.") },
      { year: "2027", title: t("Road to Bangkok"), body: t("Two days, eight categories, four tickets to Bangkok.", "Dua hari, delapan kategori, empat tiket ke Bangkok.") },
    ],
  },

  sponsors: {
    meta: { title: t("Sponsors", "Sponsor"), description: t("The brands and communities behind Kalcer Jam 2027.", "Brand dan komunitas di balik Kalcer Jam 2027.") } as PageMeta,
    kicker: t("Backing the scene", "Mendukung skena"),
    title: t("Sponsors"),
    tiers: [
      { tier: t("Title"), showOnHome: true, logos: [{ name: "", logo: "", url: "" }] },
      { tier: t("Day Partner"), showOnHome: true, logos: [{ name: "", logo: "", url: "" }, { name: "", logo: "", url: "" }] },
      { tier: t("Road to Bangkok"), showOnHome: true, logos: [{ name: "", logo: "", url: "" }] },
      { tier: t("Category", "Kategori"), showOnHome: true, logos: [{ name: "", logo: "", url: "" }, { name: "", logo: "", url: "" }, { name: "", logo: "", url: "" }, { name: "", logo: "", url: "" }] },
      { tier: t("Supporting", "Pendukung"), showOnHome: false, logos: Array.from({ length: 6 }, () => ({ name: "", logo: "", url: "" })) },
      { tier: t("Community & Media", "Komunitas & Media"), showOnHome: false, logos: Array.from({ length: 8 }, () => ({ name: "", logo: "", url: "" })) },
    ],
    ctaTitle: t("Put your name on the floor.", "Taruh namamu di lantai."),
    ctaBody: t("Logos on the big screen between every battle, on the site and on the merch. Let's talk.", "Logo di layar besar setiap jeda battle, di website dan di merch. Mari bicara."),
    ctaButton: t("Become a sponsor", "Jadi sponsor"),
    ctaEmailSubject: "Sponsorship — Kalcer Jam 2027",
  },

  gallery: {
    meta: { title: t("Gallery", "Galeri"), description: t("Photos and videos from every Kalcer Jam.", "Foto dan video dari setiap Kalcer Jam.") } as PageMeta,
    kicker: t("2025 · 2026 · 2027"),
    title: t("Gallery", "Galeri"),
    shotBy: t("Shot by @bonaventurafajar & @bckzn.official", "Difoto oleh @bonaventurafajar & @bckzn.official"),
    years: [
      {
        year: "2026",
        photos: [
          { image: "", alt: "Kalcer Jam 2026 #1", credit: "@bonaventurafajar", size: "tall" },
          { image: "", alt: "Kalcer Jam 2026 #2", credit: "@bckzn.official", size: "normal" },
          { image: "", alt: "Kalcer Jam 2026 #3", credit: "@bonaventurafajar", size: "normal" },
          { image: "", alt: "Kalcer Jam 2026 #4", credit: "@bckzn.official", size: "wide" },
          { image: "", alt: "Kalcer Jam 2026 #5", credit: "@bonaventurafajar", size: "tall" },
          { image: "", alt: "Kalcer Jam 2026 #6", credit: "@bckzn.official", size: "normal" },
          { image: "", alt: "Kalcer Jam 2026 #7", credit: "@bonaventurafajar", size: "normal" },
          { image: "", alt: "Kalcer Jam 2026 #8", credit: "@bckzn.official", size: "normal" },
          { image: "", alt: "Kalcer Jam 2026 #9", credit: "@bonaventurafajar", size: "wide" },
          { image: "", alt: "Kalcer Jam 2026 #10", credit: "@bckzn.official", size: "normal" },
        ],
      },
      { year: "2025", photos: [] as { image: string; alt: string; credit: string; size: string }[] },
    ],
  },

  news: {
    meta: { title: t("News", "Berita"), description: t("Announcements, lineup reveals and sponsor news.", "Pengumuman, reveal lineup dan kabar sponsor.") } as PageMeta,
    kicker: t("From the crew", "Dari kru"),
    title: t("News", "Berita"),
    posts: [
      { date: "2027-02-01", tag: t("Road to Bangkok"), title: t("Four tickets to the 6Kamenz Anniversary", "Empat tiket ke 6Kamenz Anniversary"), body: t("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit."), image: "" },
      { date: "2027-01-15", tag: t("Lineup"), title: t("First judge reveal — coming soon", "Reveal juri pertama — segera"), body: t("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud."), image: "" },
      { date: "2026-12-01", tag: t("Announcement", "Pengumuman"), title: t("Kalcer Jam 2027 is official", "Kalcer Jam 2027 resmi digelar"), body: t("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore."), image: "" },
    ],
  },

  travel: {
    meta: { title: t("Travel guide", "Panduan perjalanan"), description: t("Getting to Semarang, where to stay, local transport and visa notes.", "Menuju Semarang, penginapan, transportasi lokal dan info visa.") } as PageMeta,
    kicker: t("Semarang, Jawa Tengah"),
    title: t("Get here", "Ke sini"),
    blocks: [
      { title: t("By air", "Pesawat"), body: t("Jenderal Ahmad Yani International Airport (SRG). Lorem ipsum dolor sit amet, consectetur adipiscing elit.", "Bandara Internasional Jenderal Ahmad Yani (SRG). Lorem ipsum dolor sit amet, consectetur adipiscing elit.") },
      { title: t("By train", "Kereta"), body: t("Semarang Tawang and Semarang Poncol stations. Lorem ipsum dolor sit amet.", "Stasiun Semarang Tawang dan Semarang Poncol. Lorem ipsum dolor sit amet.") },
      { title: t("Where to stay", "Penginapan"), body: t("Recommended stays near the venue — list coming once the venue is set.", "Rekomendasi penginapan dekat venue — menyusul setelah venue ditetapkan.") },
      { title: t("Getting around", "Transportasi lokal"), body: t("Ride-hailing apps work across the city. Lorem ipsum dolor sit amet.", "Ojek online tersedia di seluruh kota. Lorem ipsum dolor sit amet.") },
      { title: t("Visa note", "Info visa"), body: t("International dancers: check Indonesia's visa rules for your passport before booking. Lorem ipsum.", "Dancer internasional: cek aturan visa Indonesia untuk paspormu sebelum memesan. Lorem ipsum.") },
    ],
  },

  merch: {
    meta: { title: t("Merch"), description: t("Official Kalcer Jam tees, hoodies and accessories by pre-order.", "Kaos, hoodie dan aksesori resmi Kalcer Jam lewat pre-order.") } as PageMeta,
    kicker: t("Pre-order · dates TBA", "Pre-order · tanggal menyusul"),
    title: t("Merch"),
    intro: t("Event-exclusive designs are only sold at the venue.", "Desain eksklusif event hanya dijual di venue."),
    items: [
      { name: "Tee", price: "Rp—", image: "", badge: t("Soon", "Segera"), url: "" },
      { name: "Hoodie", price: "Rp—", image: "", badge: t(""), url: "" },
      { name: "Cap", price: "Rp—", image: "", badge: t(""), url: "" },
      { name: "Tote", price: "Rp—", image: "", badge: t(""), url: "" },
    ],
  },

  faq: {
    meta: { title: t("FAQ"), description: t("Registration, fees, judging and spectator questions answered.", "Jawaban soal pendaftaran, biaya, penjurian dan penonton.") } as PageMeta,
    kicker: t("Ask before you battle", "Tanya sebelum battle"),
    title: t("FAQ"),
    searchPlaceholder: t("Search questions…", "Cari pertanyaan…"),
    empty: t("Nothing found. DM us @kalcerjam.", "Tidak ketemu. DM kami @kalcerjam."),
    groups: [
      {
        group: t("Registration", "Pendaftaran"),
        items: [
          { q: t("When does registration open?", "Kapan pendaftaran dibuka?"), a: t("1 April 2027. It closes 10 July 2027. You can create your dancer profile before that.", "1 April 2027, ditutup 10 Juli 2027. Profil dancer sudah bisa dibuat sebelumnya.") },
          { q: t("How much is the fee?", "Berapa biaya pendaftaran?"), a: t("One flat fee per dancer: Rp200.000, or USD 15 for international dancers via PayPal. It covers every category you enter.", "Satu biaya per dancer: Rp200.000, atau USD 15 untuk dancer internasional via PayPal. Berlaku untuk semua kategori yang kamu ikuti.") },
          { q: t("How does 2vs2 registration work?", "Bagaimana daftar 2vs2?"), a: t("The captain registers the team and invites a partner. The team is complete once the partner accepts and both fees are paid.", "Kapten mendaftarkan tim dan mengundang partner. Tim lengkap setelah partner menerima dan keduanya sudah bayar.") },
          { q: t("Can I get a refund?", "Apakah bisa refund?"), a: t("No refunds. You can transfer your spot to another dancer through an admin before 10 July.", "Tidak ada refund. Slot bisa dialihkan ke dancer lain lewat admin sebelum 10 Juli.") },
        ],
      },
      {
        group: t("Spectators", "Penonton"),
        items: [
          { q: t("Is entry free?", "Apakah masuk gratis?"), a: t("Yes. RSVP for a free QR pass so we know how many people are coming.", "Ya. RSVP untuk QR pass gratis supaya kami tahu jumlah penonton.") },
          { q: t("Where is the venue?", "Di mana venue-nya?"), a: t("A new venue in Semarang, announced soon.", "Venue baru di Semarang, segera diumumkan.") },
        ],
      },
      {
        group: t("Judging", "Penjurian"),
        items: [
          { q: t("How are prelims judged?", "Bagaimana prelim dinilai?"), a: t("Each judge scores Mind, Body and Soul from 1 to 10. Totals decide the Top 16. After that, battles are called by hand-raise.", "Setiap juri menilai Mind, Body dan Soul skala 1–10. Total skor menentukan Top 16. Setelahnya, battle diputuskan dengan angkat tangan.") },
          { q: t("Can I see my scores?", "Bisakah saya melihat skor saya?"), a: t("Yes, after the event, in your dancer area. The public only sees winners.", "Bisa, setelah event, di area dancer. Publik hanya melihat pemenang.") },
        ],
      },
    ],
  },

  contact: {
    meta: { title: t("Contact", "Kontak"), description: t("Get in touch with the Kalcer Jam crew.", "Hubungi kru Kalcer Jam.") } as PageMeta,
    kicker: t("Holla at us", "Sapa kami"),
    title: t("Contact", "Kontak"),
    emailLabel: t("Email"),
    emailCta: t("Write us", "Kirim email"),
    instagramLabel: t("Instagram"),
    instagramCta: t("DM"),
  },

  register: {
    meta: { title: t("Register", "Daftar"), description: t("Dancer registration opens 1 April 2027. Spectators RSVP free.", "Pendaftaran dancer dibuka 1 April 2027. Penonton RSVP gratis.") } as PageMeta,
    kicker: t("Dancers & spectators", "Dancer & penonton"),
    title: t("Get in", "Gabung"),
    intro: t("Registration runs 1 April — 10 July 2027.", "Pendaftaran 1 April — 10 Juli 2027."),
    dancersTag: t("Dancers", "Dancer"),
    steps: [
      { title: t("Sign up", "Daftar akun"), body: t("Google or an email link. No passwords.", "Google atau link email. Tanpa password.") },
      { title: t("Build your profile", "Isi profil"), body: t("Once. Reused every year. You get a dancer ID like KJ-0042.", "Sekali saja. Dipakai tiap tahun. Kamu dapat ID dancer seperti KJ-0042.") },
      { title: t("Pick categories", "Pilih kategori"), body: t("Only the ones you're eligible for show up.", "Hanya kategori yang sesuai yang muncul.") },
      { title: t("2vs2? Invite your partner", "2vs2? Undang partner"), body: t("They accept from their own account.", "Partner menerima dari akunnya sendiri.") },
      { title: t("Pay once", "Bayar sekali"), body: t("QRIS, e-wallet, virtual account or transfer — Rp200.000. International: USD 15 via PayPal.", "QRIS, e-wallet, virtual account atau transfer — Rp200.000. Internasional: USD 15 via PayPal.") },
      { title: t("Get your QR pass", "Dapat QR pass"), body: t("Show it at the door.", "Tunjukkan di pintu masuk.") },
    ],
    statusLabel: t("Status"),
    statusTitle: t("Opens 01.04.2027", "Dibuka 01.04.2027"),
    statusBody: t("Sign-up and profiles go live soon, so you can get ready before registration opens.", "Akun dan profil segera aktif, jadi kamu bisa bersiap sebelum pendaftaran dibuka."),
    statusButton: t("Create profile — soon", "Buat profil — segera"),
    statusButtonUrl: "",
    statusNote: t("Rp200K. One fee covers every category", "Rp200K. Satu biaya untuk semua kategori"),
    spectatorsTag: t("Spectators", "Penonton"),
    rsvpTitle: t("Watch free.", "Nonton gratis."),
    rsvpBody: t("Entry costs nothing. RSVP so we know how many of you are coming, and get a QR pass by email.", "Masuk gratis. RSVP supaya kami tahu berapa yang datang, dan dapatkan QR pass lewat email."),
    form: {
      name: t("Name", "Nama"),
      email: t("Email"),
      city: t("City", "Kota"),
      party: t("People", "Jumlah orang"),
      news: t("Send me Kalcer Jam news", "Kirimi saya kabar Kalcer Jam"),
      submit: t("Get my free pass", "Ambil pass gratis"),
      closed: t("RSVP opens with registration on 1 April 2027. Follow @kalcerjam so you don't miss it.", "RSVP dibuka bersama pendaftaran pada 1 April 2027. Follow @kalcerjam supaya tidak ketinggalan."),
      success: t("You're on the list. See you on the floor.", "Kamu sudah terdaftar. Sampai jumpa di lantai."),
      error: t("Something went wrong. Try again, or DM us @kalcerjam.", "Ada yang salah. Coba lagi, atau DM kami @kalcerjam."),
    },
  },
};

export type Content = typeof defaults;
export type ContentKey = keyof Content;
export const contentKeys = Object.keys(defaults) as ContentKey[];
