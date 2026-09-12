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
  rol           ENUM('admin','moderator') NOT NULL DEFAULT 'moderator',
  aktif         TINYINT(1)   NOT NULL DEFAULT 1,
  son_giris     DATETIME     NULL,
  olusturuldu   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kullanicilar_eposta (eposta)
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
