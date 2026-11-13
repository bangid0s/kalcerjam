import type { T } from "./i18n";

// All copy lives here until the CMS (PRD §8) replaces it. {en,id} = translated; plain string = same in both.
// "Lorem" / "TBA" entries are placeholders — swap for real copy.

export const EVENT = {
  start: "2027-07-26T10:00:00+07:00", // WIB
  dates: "26—27.07.2027",
  city: "Semarang, ID",
  regOpen: "2027-04-01",
  regClose: "2027-07-10",
  feeIdr: "Rp200.000",
  feeUsd: "USD 15",
  email: "info@kalcerjam.com",
  instagram: "kalcerjam",
};

export const nav: { path: string; label: T }[] = [
  { path: "/2027", label: { en: "Event", id: "Event" } },
  { path: "/2027/categories", label: { en: "Categories", id: "Kategori" } },
  { path: "/2027/lineup", label: { en: "Lineup", id: "Lineup" } },
  { path: "/2027/rules", label: { en: "Rules", id: "Aturan" } },
  { path: "/live", label: { en: "Live", id: "Live" } },
  { path: "/about", label: { en: "About", id: "Tentang" } },
];

export const navMore: { path: string; label: T }[] = [
  { path: "/sponsors", label: { en: "Sponsors", id: "Sponsor" } },
  { path: "/gallery", label: { en: "Gallery", id: "Galeri" } },
  { path: "/news", label: { en: "News", id: "Berita" } },
  { path: "/travel", label: { en: "Travel", id: "Perjalanan" } },
  { path: "/merch", label: { en: "Merch", id: "Merch" } },
  { path: "/faq", label: { en: "FAQ", id: "FAQ" } },
  { path: "/contact", label: { en: "Contact", id: "Kontak" } },
];

export const ui = {
  register: { en: "Register", id: "Daftar" },
  rsvp: { en: "RSVP free", id: "RSVP gratis" },
  menu: { en: "Menu", id: "Menu" },
  close: { en: "Close", id: "Tutup" },
  presents: { en: "Anak Kalcer presents", id: "Anak Kalcer mempersembahkan" },
  tagline: { en: "Lebaran-nya breaking.", id: "Lebaran-nya breaking." },
  venueSoon: { en: "Venue announced soon", id: "Venue segera diumumkan" },
  countdown: { en: "Until the floor opens", id: "Menuju lantai dibuka" },
  units: { en: ["Days", "Hrs", "Min", "Sec"], id: ["Hari", "Jam", "Mnt", "Dtk"] },
  readMore: { en: "Read more", id: "Selengkapnya" },
  allCategories: { en: "All categories", id: "Semua kategori" },
  free: { en: "Free entry", id: "Masuk gratis" },
  photo: { en: "Photo", id: "Foto" },
  placeholder: { en: "Placeholder", id: "Placeholder" },
  footerLine: { en: "Built by the scene, for the scene.", id: "Dibangun oleh skena, untuk skena." },
  lang: { en: "Bahasa", id: "English" },
};

export type Category = {
  slug: string;
  day: 1 | 2;
  name: string;
  unit: T;
  format: T;
  eligibility: T;
  prize: T;
  slots: T;
  blurb: T;
};

export const categories: Category[] = [
  {
    slug: "7-to-smoke-breaking", day: 1, name: "7 to Smoke — Breaking",
    unit: { en: "Solo", id: "Solo" },
    format: { en: "Prelims → 7 to Smoke", id: "Prelim → 7 to Smoke" },
    eligibility: { en: "Open to all", id: "Terbuka untuk semua" },
    prize: { en: "Cash prize for the King", id: "Hadiah uang untuk sang King" },
    slots: { en: "4 invited + 4 from prelims", id: "4 undangan + 4 dari prelim" },
    blurb: { en: "Win the exchange, stay on. First to seven points takes the crown.", id: "Menang exchange, tetap di lantai. Yang pertama dapat tujuh poin jadi King." },
  },
  {
    slug: "7-to-smoke-openstyle", day: 1, name: "7 to Smoke — Openstyle",
    unit: { en: "Solo", id: "Solo" },
    format: { en: "Prelims → 7 to Smoke", id: "Prelim → 7 to Smoke" },
    eligibility: { en: "Open to all styles", id: "Terbuka untuk semua gaya" },
    prize: { en: "Cash prize for the King", id: "Hadiah uang untuk sang King" },
    slots: { en: "4 invited + 4 from prelims", id: "4 undangan + 4 dari prelim" },
    blurb: { en: "Any style, one floor. Same race to seven.", id: "Gaya apa pun, satu lantai. Balapan yang sama menuju tujuh." },
  },
  {
    slug: "bgirl", day: 1, name: "Bgirl",
    unit: { en: "Solo", id: "Solo" },
    format: { en: "Prelims → Top 16 bracket", id: "Prelim → bracket Top 16" },
    eligibility: { en: "Bgirls", id: "Bgirl" },
    prize: { en: "Lorem prize TBA", id: "Hadiah menyusul" },
    slots: { en: "Open", id: "Terbuka" },
    blurb: { en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", id: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  },
  {
    slug: "kids-u12", day: 1, name: "Kids U-12",
    unit: { en: "Solo", id: "Solo" },
    format: { en: "Prelims → Top 16 bracket", id: "Prelim → bracket Top 16" },
    eligibility: { en: "Under 12 on 26 Jul 2027 · registered by a guardian", id: "Di bawah 12 tahun pada 26 Jul 2027 · didaftarkan wali" },
    prize: { en: "Lorem prize TBA", id: "Hadiah menyusul" },
    slots: { en: "Open", id: "Terbuka" },
    blurb: { en: "The next generation gets the same floor and the same respect.", id: "Generasi berikutnya, lantai yang sama, respek yang sama." },
  },
  {
    slug: "over-35", day: 1, name: "Over 35",
    unit: { en: "Solo", id: "Solo" },
    format: { en: "Prelims → Top 16 bracket", id: "Prelim → bracket Top 16" },
    eligibility: { en: "35 or older on 26 Jul 2027", id: "35 tahun ke atas pada 26 Jul 2027" },
    prize: { en: "Lorem prize TBA", id: "Hadiah menyusul" },
    slots: { en: "Open", id: "Terbuka" },
    blurb: { en: "The OGs never left. Come prove it.", id: "Para OG tidak pernah pergi. Buktikan." },
  },
  {
    slug: "2vs2-breaking", day: 2, name: "2vs2 Breaking",
    unit: { en: "Team of 2", id: "Tim 2 orang" },
    format: { en: "Prelims → Top 16 bracket", id: "Prelim → bracket Top 16" },
    eligibility: { en: "Both dancers registered; partner accepts the invite", id: "Kedua dancer terdaftar; partner menerima undangan" },
    prize: { en: "Trip to 6Kamenz Anniversary, Bangkok", id: "Tiket ke 6Kamenz Anniversary, Bangkok" },
    slots: { en: "Open", id: "Terbuka" },
    blurb: { en: "Bring your partner. Two winners fly to Bangkok.", id: "Bawa partnermu. Dua pemenang terbang ke Bangkok." },
  },
  {
    slug: "toprock", day: 2, name: "Toprock",
    unit: { en: "Solo", id: "Solo" },
    format: { en: "Prelims → Top 16 bracket", id: "Prelim → bracket Top 16" },
    eligibility: { en: "Open to all", id: "Terbuka untuk semua" },
    prize: { en: "Trip to 6Kamenz Anniversary, Bangkok", id: "Tiket ke 6Kamenz Anniversary, Bangkok" },
    slots: { en: "Open", id: "Terbuka" },
    blurb: { en: "Standing up only. Rhythm, character, attack.", id: "Hanya berdiri. Ritme, karakter, serangan." },
  },
  {
    slug: "footwork", day: 2, name: "Footwork",
    unit: { en: "Solo", id: "Solo" },
    format: { en: "Prelims → Top 16 bracket", id: "Prelim → bracket Top 16" },
    eligibility: { en: "Open to all", id: "Terbuka untuk semua" },
    prize: { en: "Trip to 6Kamenz Anniversary, Bangkok", id: "Tiket ke 6Kamenz Anniversary, Bangkok" },
    slots: { en: "Open", id: "Terbuka" },
    blurb: { en: "Down on the floor. Speed, control, foundation.", id: "Di lantai. Kecepatan, kontrol, fondasi." },
  },
];

export const days = [
  { n: 1, date: "26.07", title: { en: "Pre-Party", id: "Pre-Party" } },
  { n: 2, date: "27.07", title: { en: "Main Event", id: "Main Event" } },
];

export const criteria = [
  { k: "Mind", d: { en: "Musicality, ideas, strategy", id: "Musikalitas, ide, strategi" } },
  { k: "Body", d: { en: "Foundation, execution, control", id: "Fondasi, eksekusi, kontrol" } },
  { k: "Soul", d: { en: "Character, flavour, energy", id: "Karakter, flavour, energi" } },
];

export const news = [
  { date: "2026-12-01", tag: { en: "Announcement", id: "Pengumuman" }, title: { en: "Kalcer Jam 2027 is official", id: "Kalcer Jam 2027 resmi digelar" }, body: { en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.", id: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore." } },
  { date: "2027-01-15", tag: { en: "Lineup", id: "Lineup" }, title: { en: "First judge reveal — coming soon", id: "Reveal juri pertama — segera" }, body: { en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud.", id: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud." } },
  { date: "2027-02-01", tag: { en: "Road to Bangkok", id: "Road to Bangkok" }, title: { en: "Four tickets to the 6Kamenz Anniversary", id: "Empat tiket ke 6Kamenz Anniversary" }, body: { en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit.", id: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit." } },
];

export const lineup = [
  { group: { en: "Judges", id: "Juri" }, people: ["TBA", "TBA", "TBA"] },
  { group: { en: "MC", id: "MC" }, people: ["TBA"] },
  { group: { en: "DJ", id: "DJ" }, people: ["TBA"] },
  { group: { en: "Invited — 7 to Smoke", id: "Undangan — 7 to Smoke" }, people: ["TBA", "TBA", "TBA", "TBA"] },
];
export const guestCountries = [
  ["TH", "Thailand"], ["PH", "Philippines"], ["US", "United States"], ["VN", "Vietnam"],
  ["MY", "Malaysia"], ["AU", "Australia"], ["SG", "Singapore"],
] as const;

export const sponsorTiers: { tier: T; count: number }[] = [
  { tier: { en: "Title", id: "Title" }, count: 1 },
  { tier: { en: "Day Partner", id: "Day Partner" }, count: 2 },
  { tier: { en: "Road to Bangkok", id: "Road to Bangkok" }, count: 1 },
  { tier: { en: "Category", id: "Kategori" }, count: 4 },
  { tier: { en: "Supporting", id: "Pendukung" }, count: 6 },
  { tier: { en: "Community & Media", id: "Komunitas & Media" }, count: 8 },
];

export const faq: { group: T; items: { q: T; a: T }[] }[] = [
  {
    group: { en: "Registration", id: "Pendaftaran" },
    items: [
      { q: { en: "When does registration open?", id: "Kapan pendaftaran dibuka?" }, a: { en: "1 April 2027. It closes 10 July 2027. You can create your dancer profile before that.", id: "1 April 2027, ditutup 10 Juli 2027. Profil dancer sudah bisa dibuat sebelumnya." } },
      { q: { en: "How much is the fee?", id: "Berapa biaya pendaftaran?" }, a: { en: "One flat fee per dancer: Rp200.000, or USD 15 for international dancers via PayPal. It covers every category you enter.", id: "Satu biaya per dancer: Rp200.000, atau USD 15 untuk dancer internasional via PayPal. Berlaku untuk semua kategori yang kamu ikuti." } },
      { q: { en: "How does 2vs2 registration work?", id: "Bagaimana daftar 2vs2?" }, a: { en: "The captain registers the team and invites a partner. The team is complete once the partner accepts and both fees are paid.", id: "Kapten mendaftarkan tim dan mengundang partner. Tim lengkap setelah partner menerima dan keduanya sudah bayar." } },
      { q: { en: "Can I get a refund?", id: "Apakah bisa refund?" }, a: { en: "No refunds. You can transfer your spot to another dancer through an admin before 10 July.", id: "Tidak ada refund. Slot bisa dialihkan ke dancer lain lewat admin sebelum 10 Juli." } },
    ],
  },
  {
    group: { en: "Spectators", id: "Penonton" },
    items: [
      { q: { en: "Is entry free?", id: "Apakah masuk gratis?" }, a: { en: "Yes. RSVP for a free QR pass so we know how many people are coming.", id: "Ya. RSVP untuk QR pass gratis supaya kami tahu jumlah penonton." } },
      { q: { en: "Where is the venue?", id: "Di mana venue-nya?" }, a: { en: "A new venue in Semarang, announced soon.", id: "Venue baru di Semarang, segera diumumkan." } },
    ],
  },
  {
    group: { en: "Judging", id: "Penjurian" },
    items: [
      { q: { en: "How are prelims judged?", id: "Bagaimana prelim dinilai?" }, a: { en: "Each judge scores Mind, Body and Soul from 1 to 10. Totals decide the Top 16. After that, battles are called by hand-raise.", id: "Setiap juri menilai Mind, Body dan Soul skala 1–10. Total skor menentukan Top 16. Setelahnya, battle diputuskan dengan angkat tangan." } },
      { q: { en: "Can I see my scores?", id: "Bisakah saya melihat skor saya?" }, a: { en: "Yes, after the event, in your dancer area. The public only sees winners.", id: "Bisa, setelah event, di area dancer. Publik hanya melihat pemenang." } },
    ],
  },
];

export const history = [
  { year: "2025", title: { en: "The first jam", id: "Jam pertama" }, body: { en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Winners, photos and press release go here.", id: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pemenang, foto dan rilis pers di sini." } },
  { year: "2026", title: { en: "Kalcer Jam × 6Kamenz", id: "Kalcer Jam × 6Kamenz" }, body: { en: "31 dancers registered. 7 to Smoke on a paper race-to-7 sheet. Lorem ipsum dolor sit amet.", id: "31 dancer mendaftar. 7 to Smoke dicatat di kertas. Lorem ipsum dolor sit amet." } },
  { year: "2027", title: { en: "Road to Bangkok", id: "Road to Bangkok" }, body: { en: "Two days, eight categories, four tickets to Bangkok.", id: "Dua hari, delapan kategori, empat tiket ke Bangkok." } },
];

export const crew = ["Fird", "Joker", "Senor"];

export const photographers = ["@bonaventurafajar", "@bckzn.official"];
