-- etkinlig — öğrenci hesapları, başvuru kilidi ve yorumlar
-- Kullanım: mysql -u root -p etkinlig < db/03_ogrenci_ve_yorum.sql
-- (PHP API bu değişiklikleri açılışta kendisi de uygular; bu dosya lokal kurulum içindir.)
SET NAMES utf8mb4;

-- Öğrenciye gerçek hesap: parola, aktiflik, son giriş
ALTER TABLE ogrenciler
  ADD COLUMN parola_hash VARCHAR(255) NULL AFTER eposta,
  ADD COLUMN aktif       TINYINT(1) NOT NULL DEFAULT 1 AFTER not_ortalamasi,
  ADD COLUMN son_giris   DATETIME NULL AFTER aktif;

-- Aynı öğrenci aynı etkinliğe iki kez başvuramaz.
-- (01_schema.sql'de zaten var; eski kurulumlar için güvence.)
-- ALTER TABLE basvurular ADD UNIQUE KEY uq_basvuru (etkinlik_id, ogrenci_id);

-- Etkinlik altındaki sosyal bölüm
CREATE TABLE IF NOT EXISTS yorumlar (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  etkinlik_id  INT UNSIGNED NOT NULL,
  ogrenci_id   INT UNSIGNED NOT NULL,
  metin        VARCHAR(1000) NOT NULL,
  olusturuldu  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_yorum_etkinlik (etkinlik_id, olusturuldu),
  CONSTRAINT fk_yorum_etkinlik FOREIGN KEY (etkinlik_id) REFERENCES etkinlikler(id) ON DELETE CASCADE,
  CONSTRAINT fk_yorum_ogrenci  FOREIGN KEY (ogrenci_id)  REFERENCES ogrenciler(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Örnek öğrencilere parola ver: Ogrenci1234!
UPDATE ogrenciler
SET parola_hash = '$2y$10$UMSu/16mBbqPV7j1uF/V8OiD0RcioShn2Z4JJx1S4zyhT0BbQsk9e'
WHERE parola_hash IS NULL;
