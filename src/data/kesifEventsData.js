// Geliştirme aşamasında kullanılacak sahte (mock) etkinlik verisi.
// Gerçek API bağlandığında bu dosyayı silip aynı şekle sahip veriyi
// backend'den çekmen yeterli olacak.

const eventsData = [
  {
    id: 1,
    title: "İstanbul Teknoloji Fuarı 2025",
    date: "2025-07-12T10:00:00",
    location: "Tüyap Fuar Merkezi, İstanbul",
    category: "Fuar",
    image: "https://picsum.photos/seed/techfuari/600/400",
    description:
      "Yerli ve yabancı teknoloji firmalarının ürünlerini sergilediği yıllık fuar.",
  },
  {
    id: 2,
    title: "48 Saatte Ürün: Kampüs Hackathon",
    date: "2025-07-15T18:00:00",
    location: "Beykent Üniversitesi, İstanbul",
    category: "Hackathon",
    image: "https://picsum.photos/seed/hackathoncamp/600/400",
    description:
      "Takım halinde 48 saat içinde fikirden çalışan ürüne uzanan yarışma.",
  },
  {
    id: 3,
    title: "Bulut Mimarisine Giriş Semineri",
    date: "2025-07-18T14:00:00",
    location: "Kadıköy, İstanbul",
    category: "Seminer",
    image: "https://picsum.photos/seed/cloudseminar/600/400",
    description:
      "Temel bulut kavramları ve sertifikasyon yol haritası üzerine anlatım.",
  },
  {
    id: 4,
    title: "Sıfırdan Web Geliştirme Bootcamp",
    date: "2025-07-20T09:00:00",
    location: "Levent, İstanbul",
    category: "Bootcamp",
    image: "https://picsum.photos/seed/webbootcamp/600/400",
    description: "5 haftalık yoğun, proje odaklı web geliştirme programı.",
  },
  {
    id: 5,
    title: "Ürün Tasarımı Atölyesi",
    date: "2025-07-22T13:00:00",
    location: "Karaköy, İstanbul",
    category: "Atölye",
    image: "https://picsum.photos/seed/productworkshop/600/400",
    description: "Kullanıcı deneyimi ve arayüz tasarımı üzerine uygulamalı çalışma.",
  },
  {
    id: 6,
    title: "Girişimcilik ve Yatırım Konferansı",
    date: "2025-07-25T11:00:00",
    location: "Beşiktaş, İstanbul",
    category: "Konferans",
    image: "https://picsum.photos/seed/startupconf/600/400",
    description: "Erken aşama girişimciler ve yatırımcıları bir araya getiren etkinlik.",
  },
];

export default eventsData;
