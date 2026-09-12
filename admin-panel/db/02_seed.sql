-- etkinlig — örnek veri (tasarım mockup'ındaki içerikle aynı)
-- Kullanım: mysql -u root -p etkinlig < db/02_seed.sql
SET NAMES utf8mb4;

INSERT INTO sehirler (ad, plaka_kodu) VALUES
  ('Adana','01'),('Adıyaman','02'),('Afyonkarahisar','03'),('Ağrı','04'),
  ('Amasya','05'),('Ankara','06'),('Antalya','07'),('Artvin','08'),
  ('Aydın','09'),('Balıkesir','10'),('Bilecik','11'),('Bingöl','12'),
  ('Bitlis','13'),('Bolu','14'),('Burdur','15'),('Bursa','16'),
  ('Çanakkale','17'),('Çankırı','18'),('Çorum','19'),('Denizli','20'),
  ('Diyarbakır','21'),('Edirne','22'),('Elazığ','23'),('Erzincan','24'),
  ('Erzurum','25'),('Eskişehir','26'),('Gaziantep','27'),('Giresun','28'),
  ('Gümüşhane','29'),('Hakkari','30'),('Hatay','31'),('Isparta','32'),
  ('Mersin','33'),('İstanbul','34'),('İzmir','35'),('Kars','36'),
  ('Kastamonu','37'),('Kayseri','38'),('Kırklareli','39'),('Kırşehir','40'),
  ('Kocaeli','41'),('Konya','42'),('Kütahya','43'),('Malatya','44'),
  ('Manisa','45'),('Kahramanmaraş','46'),('Mardin','47'),('Muğla','48'),
  ('Muş','49'),('Nevşehir','50'),('Niğde','51'),('Ordu','52'),
  ('Rize','53'),('Sakarya','54'),('Samsun','55'),('Siirt','56'),
  ('Sinop','57'),('Sivas','58'),('Tekirdağ','59'),('Tokat','60'),
  ('Trabzon','61'),('Tunceli','62'),('Şanlıurfa','63'),('Uşak','64'),
  ('Van','65'),('Yozgat','66'),('Zonguldak','67'),('Aksaray','68'),
  ('Bayburt','69'),('Karaman','70'),('Kırıkkale','71'),('Batman','72'),
  ('Şırnak','73'),('Bartın','74'),('Ardahan','75'),('Iğdır','76'),
  ('Yalova','77'),('Karabük','78'),('Kilis','79'),('Osmaniye','80'),
  ('Düzce','81');

INSERT INTO bolumler (ad, fakulte) VALUES
  ('Bilgisayar Mühendisliği','Mühendislik Fakültesi'),
  ('Yazılım Mühendisliği','Mühendislik Fakültesi'),
  ('Elektrik-Elektronik Mühendisliği','Mühendislik Fakültesi'),
  ('Endüstri Mühendisliği','Mühendislik Fakültesi'),
  ('Makine Mühendisliği','Mühendislik Fakültesi'),
  ('Yönetim Bilişim Sistemleri','İİBF'),
  ('İstatistik','Fen Fakültesi'),
  ('Matematik','Fen Fakültesi');

INSERT INTO sirketler (ad, eposta, web_sitesi) VALUES
  ('TechnoBridge Yazılım A.Ş.','etkinlik@technobridge.com.tr','technobridge.com.tr'),
  ('Papara Elektronik Para','kampus@papara.com','papara.com'),
  ('ASELSAN','kariyer@aselsan.com.tr','aselsan.com.tr'),
  ('Yıldız Teknoloji Hizmetleri','info@yildiztek.com.tr',NULL),
  ('STM Savunma Teknolojileri','etkinlik@stm.com.tr','stm.com.tr'),
  ('Trendyol Group','campus@trendyol.com','trendyol.com');

-- Varsayılan yönetici — giriş: admin@etkinlig.local / Admin1234!
-- İlk girişten sonra Kullanıcılar ekranından parolayı değiştirin.
INSERT INTO kullanicilar (ad_soyad, eposta, parola_hash, rol, aktif) VALUES
  ('M. Emir Ata','admin@etkinlig.local','$2b$10$y7NgDUAqsIWIAUzkEm4urOFDKc3lnHY4CQM5NNElkKEWr6t6VH1VS','admin',1);

INSERT INTO ogrenciler (ad_soyad, eposta, ogrenci_no, universite, bolum_id, ogrenim_duzeyi, sinif, not_ortalamasi) VALUES
  ('Zeynep Kaya','zeynep.kaya@ogr.edu.tr','20210101','Çankırı Karatekin Üniversitesi',1,'lisans',4,3.21),
  ('Burak Demir','burak.demir@ogr.edu.tr','20220233','Gazi Üniversitesi',3,'lisans',3,2.84),
  ('Elif Şahin','elif.sahin@ogr.edu.tr','20220117','Hacettepe Üniversitesi',2,'lisans',3,3.55),
  ('Mert Aydın','mert.aydin@ogr.edu.tr','20210408','ODTÜ',4,'lisans',4,2.97),
  ('Ceren Yıldız','ceren.yildiz@ogr.edu.tr','20230512','Ankara Üniversitesi',5,'lisans',2,1.86);

-- Etkinlikler
INSERT INTO etkinlikler
  (kod, baslik, aciklama, tur, sirket_id, iletisim_epostasi, sehir_id, ilce, adres,
   baslangic, bitis, son_basvuru, kontenjan,
   sart_ogrenim_duzeyi, sart_min_ortalama, sart_belge_zorunlu,
   durum, basvuruya_acik, otomatik_onay, yedek_liste, katilim_belgesi, olusturan_id)
VALUES
  ('ETK-2026-0142','Yapay Zeka ve Endüstri 4.0 Konferansı',
   'Endüstriyel üretimde yapay zekâ uygulamalarını konu alan tam günlük konferans. Sabah oturumunda görüntü işleme tabanlı kalite kontrol, öğleden sonra kestirimci bakım ve dijital ikiz senaryoları ele alınacak. Katılımcılara katılım belgesi verilecektir.',
   'konferans', 1, 'etkinlik@technobridge.com.tr', 2, 'Çankaya',
   'ODTÜ Kültür ve Kongre Merkezi, Kemal Kurdaş Salonu',
   '2026-09-24 14:00:00','2026-09-24 18:30:00','2026-09-20', 250,
   'lisans', 2.00, 1, 'yayinda', 1, 0, 1, 1, 1),

  ('ETK-2026-0143','48 Saatlik Fintech Hackathonu',
   'Ödeme sistemleri ve dolandırıcılık tespiti temalı, takım bazlı 48 saatlik yarışma. İlk üç takıma para ödülü ve staj görüşmesi hakkı verilir.',
   'hackathon', 2, 'kampus@papara.com', 8, 'Maslak',
   'Papara Kampüs, Maslak',
   '2026-10-03 09:00:00','2026-10-05 18:00:00','2026-09-28', 250,
   'lisans', NULL, 0, 'doldu', 0, 0, 1, 1, 1),

  ('ETK-2026-0144','Gömülü Sistemlerde Kariyer',
   'Savunma sanayiinde gömülü yazılım geliştirici olarak çalışmanın gerektirdikleri, örnek projeler ve işe alım süreci üzerine tek oturumluk sunum.',
   'sunum', 3, 'kariyer@aselsan.com.tr', 2, 'Yenimahalle',
   'ASELSAN Macunköy Yerleşkesi Konferans Salonu',
   '2026-09-18 11:00:00','2026-09-18 12:30:00','2026-09-16', 120,
   'lisans', NULL, 1, 'yayinda', 1, 1, 0, 1, 1),

  ('ETK-2026-0145','Bulut Mimarisi Atölyesi',
   'Container tabanlı mimarilerde ölçeklendirme, gözlemlenebilirlik ve maliyet yönetimi üzerine uygulamalı atölye.',
   'konferans', 4, 'info@yildiztek.com.tr', 9, 'Konak',
   'İzmir Ticaret Odası Meclis Salonu',
   '2026-10-01 10:30:00','2026-10-01 16:00:00','2026-09-26', 150,
   'lisans', 2.50, 0, 'yayinda', 1, 0, 1, 1, 1),

  ('ETK-2026-0146','Siber Güvenlik Farkındalık Sunumu',
   'Kurumsal ağlarda sızma testi temelleri ve öğrenciler için siber güvenlik kariyer yol haritası.',
   'sunum', 5, 'etkinlik@stm.com.tr', 2, 'Çankaya',
   'STM Genel Müdürlük, Toplantı Salonu A',
   '2026-09-27 15:30:00','2026-09-27 17:00:00','2026-09-24', 200,
   'lisans', NULL, 0, 'taslak', 0, 0, 1, 0, 1),

  ('ETK-2026-0147','Mobil Uygulama Geliştirme Kampı',
   'Üç günlük mobil geliştirme kampı: ürün fikri, prototip ve mağaza yayını süreci.',
   'hackathon', 6, 'campus@trendyol.com', 8, 'Ataşehir',
   'Trendyol Teknoloji Merkezi',
   '2026-10-11 08:30:00','2026-10-13 18:00:00','2026-10-05', 180,
   'lisans', 2.00, 1, 'yayinda', 1, 0, 1, 1, 1);

-- Şart: sınıflar
INSERT INTO etkinlik_siniflari (etkinlik_id, sinif) VALUES
  (1,3),(1,4),
  (2,2),(2,3),(2,4),
  (3,3),(3,4),
  (4,2),(4,3),(4,4),
  (5,1),(5,2),(5,3),(5,4),
  (6,1),(6,2),(6,3),(6,4);

-- Şart: bölümler
INSERT INTO etkinlik_bolumleri (etkinlik_id, bolum_id) VALUES
  (1,1),(1,2),(1,3),(1,4),
  (2,1),(2,2),(2,6),
  (3,1),(3,3),
  (4,1),(4,2),
  (5,1),(5,2),(5,3),
  (6,1),(6,2);

-- Başvurular
INSERT INTO basvurular (etkinlik_id, ogrenci_id, durum, basvuru_tarihi, karar_tarihi) VALUES
  (1,1,'onaylandi', '2026-09-11 09:14:00','2026-09-11 10:00:00'),
  (1,2,'onaylandi', '2026-09-11 10:02:00','2026-09-11 11:20:00'),
  (1,3,'beklemede', '2026-09-11 13:47:00', NULL),
  (1,4,'beklemede', '2026-09-12 08:20:00', NULL),
  (1,5,'reddedildi','2026-09-12 09:05:00','2026-09-12 09:40:00'),
  (3,1,'onaylandi', '2026-09-09 12:00:00','2026-09-09 13:10:00'),
  (4,3,'beklemede', '2026-09-10 15:30:00', NULL),
  (6,4,'onaylandi', '2026-09-12 07:55:00','2026-09-12 08:30:00');
