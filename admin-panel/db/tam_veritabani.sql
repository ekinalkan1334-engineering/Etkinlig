-- etkinlig — şema
-- Kullanım: mysql -u root -p etkinlig < db/01_schema.sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS basvurular;
DROP TABLE IF EXISTS etkinlik_bolumleri;
DROP TABLE IF EXISTS etkinlik_siniflari;
DROP TABLE IF EXISTS etkinlikler;
DROP TABLE IF EXISTS ogrenciler;
DROP TABLE IF EXISTS bolumler;
DROP TABLE IF EXISTS sehirler;
DROP TABLE IF EXISTS sirketler;
DROP TABLE IF EXISTS kullanicilar;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------- Lookup tabloları ----------
CREATE TABLE sehirler (
  id            SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ad            VARCHAR(64)  NOT NULL,
  plaka_kodu    CHAR(2)      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sehirler_ad (ad),
  UNIQUE KEY uq_sehirler_plaka (plaka_kodu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE bolumler (
  id            SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ad            VARCHAR(120) NOT NULL,
  fakulte       VARCHAR(120) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bolumler_ad (ad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE sirketler (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ad            VARCHAR(160) NOT NULL,
  eposta        VARCHAR(160) NULL,
  telefon       VARCHAR(32)  NULL,
  web_sitesi    VARCHAR(200) NULL,
  olusturuldu   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sirketler_ad (ad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE kullanicilar (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ad_soyad      VARCHAR(120) NOT NULL,
  eposta        VARCHAR(160) NOT NULL,
  parola_hash   VARCHAR(255) NOT NULL,
  rol           VARCHAR(32)  NOT NULL DEFAULT 'moderator',
  sirket_id     INT UNSIGNED NULL,
  aktif         TINYINT(1)   NOT NULL DEFAULT 1,
  son_giris     DATETIME     NULL,
  olusturuldu   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kullanicilar_eposta (eposta),
  KEY ix_kullanicilar_sirket (sirket_id),
  CONSTRAINT fk_kullanicilar_sirket FOREIGN KEY (sirket_id) REFERENCES sirketler(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;


CREATE TABLE ogrenciler (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ad_soyad        VARCHAR(120) NOT NULL,
  eposta          VARCHAR(160) NOT NULL,
  ogrenci_no      VARCHAR(32)  NULL,
  universite      VARCHAR(160) NULL,
  bolum_id        SMALLINT UNSIGNED NULL,
  ogrenim_duzeyi  ENUM('on_lisans','lisans','yuksek_lisans','doktora') NOT NULL DEFAULT 'lisans',
  sinif           TINYINT UNSIGNED NOT NULL DEFAULT 1,  -- 0 = hazırlık, 5 = mezun
  not_ortalamasi  DECIMAL(3,2) NULL,
  olusturuldu     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ogrenciler_eposta (eposta),
  KEY ix_ogrenciler_bolum (bolum_id),
  CONSTRAINT fk_ogrenciler_bolum FOREIGN KEY (bolum_id) REFERENCES bolumler(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ---------- Ana tablo ----------
CREATE TABLE etkinlikler (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kod                 VARCHAR(24)  NOT NULL,                -- ETK-2026-0142
  baslik              VARCHAR(200) NOT NULL,
  aciklama            TEXT         NULL,
  tur                 ENUM('konferans','sunum','hackathon') NOT NULL,
  sirket_id           INT UNSIGNED NOT NULL,
  iletisim_epostasi   VARCHAR(160) NULL,
  sehir_id            SMALLINT UNSIGNED NOT NULL,
  ilce                VARCHAR(80)  NULL,
  adres               VARCHAR(300) NULL,
  baslangic           DATETIME     NOT NULL,
  bitis               DATETIME     NULL,
  son_basvuru         DATE         NULL,
  kontenjan           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  kapak_gorseli       VARCHAR(300) NULL,
  -- ön katılım şartları
  sart_ogrenim_duzeyi ENUM('on_lisans','lisans','yuksek_lisans','doktora') NULL,
  sart_min_ortalama   DECIMAL(3,2) NULL,
  sart_belge_zorunlu  TINYINT(1)   NOT NULL DEFAULT 0,
  -- yayın ayarları
  durum               ENUM('taslak','yayinda','doldu','iptal','tamamlandi') NOT NULL DEFAULT 'taslak',
  basvuruya_acik      TINYINT(1)   NOT NULL DEFAULT 1,
  otomatik_onay       TINYINT(1)   NOT NULL DEFAULT 0,
  yedek_liste         TINYINT(1)   NOT NULL DEFAULT 1,
  katilim_belgesi     TINYINT(1)   NOT NULL DEFAULT 1,
  olusturan_id        INT UNSIGNED NULL,
  olusturuldu         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  guncellendi         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_etkinlikler_kod (kod),
  KEY ix_etkinlikler_tur (tur),
  KEY ix_etkinlikler_durum (durum),
  KEY ix_etkinlikler_baslangic (baslangic),
  KEY ix_etkinlikler_sehir (sehir_id),
  KEY ix_etkinlikler_sirket (sirket_id),
  CONSTRAINT fk_etkinlikler_sirket   FOREIGN KEY (sirket_id)    REFERENCES sirketler(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_etkinlikler_sehir    FOREIGN KEY (sehir_id)     REFERENCES sehirler(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_etkinlikler_kullanici FOREIGN KEY (olusturan_id) REFERENCES kullanicilar(id) ON DELETE SET NULL,
  CONSTRAINT ck_etkinlikler_tarih CHECK (bitis IS NULL OR bitis >= baslangic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ---------- Şart detayları (n-n) ----------
CREATE TABLE etkinlik_bolumleri (
  etkinlik_id   INT UNSIGNED NOT NULL,
  bolum_id      SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (etkinlik_id, bolum_id),
  KEY ix_eb_bolum (bolum_id),
  CONSTRAINT fk_eb_etkinlik FOREIGN KEY (etkinlik_id) REFERENCES etkinlikler(id) ON DELETE CASCADE,
  CONSTRAINT fk_eb_bolum    FOREIGN KEY (bolum_id)    REFERENCES bolumler(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE etkinlik_siniflari (
  etkinlik_id   INT UNSIGNED NOT NULL,
  sinif         TINYINT UNSIGNED NOT NULL,  -- 0 hazırlık … 4 = 4. sınıf, 5 = mezun
  PRIMARY KEY (etkinlik_id, sinif),
  CONSTRAINT fk_es_etkinlik FOREIGN KEY (etkinlik_id) REFERENCES etkinlikler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ---------- Başvurular ----------
CREATE TABLE basvurular (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  etkinlik_id   INT UNSIGNED NOT NULL,
  ogrenci_id    INT UNSIGNED NOT NULL,
  durum         ENUM('beklemede','onaylandi','reddedildi','yedek','iptal') NOT NULL DEFAULT 'beklemede',
  belge_yolu    VARCHAR(300) NULL,
  not_dusuldu   VARCHAR(255) NULL,
  basvuru_tarihi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  karar_tarihi   DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_basvuru (etkinlik_id, ogrenci_id),
  KEY ix_basvuru_durum (durum),
  CONSTRAINT fk_basvuru_etkinlik FOREIGN KEY (etkinlik_id) REFERENCES etkinlikler(id) ON DELETE CASCADE,
  CONSTRAINT fk_basvuru_ogrenci  FOREIGN KEY (ogrenci_id)  REFERENCES ogrenciler(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ---------- Liste ekranının okuduğu görünüm ----------
CREATE OR REPLACE VIEW v_etkinlik_ozet AS
SELECT
  e.id, e.kod, e.baslik, e.tur, e.durum, e.baslangic, e.bitis, e.son_basvuru,
  e.kontenjan, e.basvuruya_acik,
  s.id AS sirket_id, s.ad AS sirket_adi,
  c.id AS sehir_id,  c.ad AS sehir_adi,
  COALESCE(b.toplam, 0)  AS basvuru_sayisi,
  COALESCE(b.onayli, 0)  AS onayli_sayisi
FROM etkinlikler e
JOIN sirketler s ON s.id = e.sirket_id
JOIN sehirler  c ON c.id = e.sehir_id
LEFT JOIN (
  SELECT etkinlik_id,
         COUNT(*) AS toplam,
         SUM(durum = 'onaylandi') AS onayli
  FROM basvurular
  GROUP BY etkinlik_id
) b ON b.etkinlik_id = e.id;
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

-- Varsayılan yöneticiler — tüm hesapların parolası: Admin1234!
-- İlk girişten sonra Kullanıcılar ekranından parolayı değiştirin.
INSERT INTO kullanicilar (ad_soyad, eposta, parola_hash, rol, sirket_id, aktif) VALUES
  ('M. Emir Ata',       'admin@etkinlig.local',       '$2b$10$y7NgDUAqsIWIAUzkEm4urOFDKc3lnHY4CQM5NNElkKEWr6t6VH1VS','admin',       NULL, 1),
  ('Deniz Aksoy',      'deniz@technobridge.com.tr',  '$2b$10$y7NgDUAqsIWIAUzkEm4urOFDKc3lnHY4CQM5NNElkKEWr6t6VH1VS','sirket_admin',1,    1),
  ('Selin Korkmaz',    'selin@papara.com',           '$2b$10$y7NgDUAqsIWIAUzkEm4urOFDKc3lnHY4CQM5NNElkKEWr6t6VH1VS','sirket_admin',2,    1),
  ('Kaan Erdem',       'kaan@aselsan.com.tr',         '$2b$10$y7NgDUAqsIWIAUzkEm4urOFDKc3lnHY4CQM5NNElkKEWr6t6VH1VS','sirket_admin',3,    1),
  ('Yıldız Yönetici',  'yildiz@yildiztek.com.tr',    '$2b$10$y7NgDUAqsIWIAUzkEm4urOFDKc3lnHY4CQM5NNElkKEWr6t6VH1VS','sirket_admin',4,    1),
  ('STM Yönetici',     'stm@stm.com.tr',             '$2b$10$y7NgDUAqsIWIAUzkEm4urOFDKc3lnHY4CQM5NNElkKEWr6t6VH1VS','sirket_admin',5,    1),
  ('Trendyol Yönetici','trendyol@trendyol.com',       '$2b$10$y7NgDUAqsIWIAUzkEm4urOFDKc3lnHY4CQM5NNElkKEWr6t6VH1VS','sirket_admin',6,    1);

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
