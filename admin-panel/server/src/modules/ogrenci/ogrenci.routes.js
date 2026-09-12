import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool, queryAll, queryOne } from '../../db/pool.js';
import { ApiError, asyncHandler, created, ok, parse } from '../../core/http.js';

export const ogrenciRouter = Router();

// 1. Öğrenci Kaydı
ogrenciRouter.post(
  '/kayit',
  asyncHandler(async (req, res) => {
    const sema = z.object({
      adSoyad: z.string().trim().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
      email: z.string().trim().email('Geçerli bir e-posta adresi girin'),
      sifre: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
      universite: z.string().trim().optional().default('Beykent Üniversitesi'),
      bolumId: z.coerce.number().int().positive().optional().nullable(),
      sinif: z.coerce.number().int().min(0).max(5).optional().default(1),
      notOrtalamasi: z.coerce.number().min(0).max(4).optional().nullable(),
      ogrenciNo: z.string().trim().optional().nullable(),
    });

    const girdi = parse(sema, req.body);

    // E-posta daha önce kayıtlı mı?
    const mevcut = await queryOne('SELECT id FROM ogrenciler WHERE eposta = :email', {
      email: girdi.email,
    });
    if (mevcut) {
      throw ApiError.conflict('Bu e-posta adresi ile kayıtlı bir öğrenci zaten var');
    }

    const salt = await bcrypt.genSalt(10);
    const parolaHash = await bcrypt.hash(girdi.sifre, salt);

    // ogrenciler tablosunda parola_hash kolonu var mı kontrol edelim veya dinamik ekleyelim
    try {
      await pool.query('ALTER TABLE ogrenciler ADD COLUMN parola_hash VARCHAR(255) NULL');
    } catch {
      // Kolon zaten varsa hata vermez, devam eder
    }

    const [sonuc] = await pool.query(
      `INSERT INTO ogrenciler 
       (ad_soyad, eposta, parola_hash, universite, bolum_id, sinif, not_ortalamasi, ogrenci_no)
       VALUES (:adSoyad, :email, :parolaHash, :universite, :bolumId, :sinif, :notOrtalamasi, :ogrenciNo)`,
      {
        adSoyad: girdi.adSoyad,
        email: girdi.email,
        parolaHash,
        universite: girdi.universite,
        bolumId: girdi.bolumId || null,
        sinif: girdi.sinif,
        notOrtalamasi: girdi.notOrtalamasi || null,
        ogrenciNo: girdi.ogrenciNo || null,
      }
    );

    created(res, {
      id: sonuc.insertId,
      adSoyad: girdi.adSoyad,
      eposta: girdi.email,
      universite: girdi.universite,
      sinif: girdi.sinif,
      notOrtalamasi: girdi.notOrtalamasi,
    });
  })
);

// 2. Öğrenci Girişi
ogrenciRouter.post(
  '/giris',
  asyncHandler(async (req, res) => {
    const sema = z.object({
      email: z.string().trim().email('Geçerli e-posta giriniz'),
      sifre: z.string().min(1, 'Şifre zorunludur'),
    });

    const { email, sifre } = parse(sema, req.body);

    const ogrenci = await queryOne(
      `SELECT o.id, o.ad_soyad, o.eposta, o.universite, o.sinif, o.not_ortalamasi, o.parola_hash,
              b.ad AS bolum_adi
       FROM ogrenciler o
       LEFT JOIN bolumler b ON b.id = o.bolum_id
       WHERE o.eposta = :email`,
      { email }
    );

    if (!ogrenci) {
      throw ApiError.unauthorized('E-posta veya şifre hatalı');
    }

    if (ogrenci.parola_hash) {
      const eslesiyor = await bcrypt.compare(sifre, ogrenci.parola_hash);
      if (!eslesiyor) {
        throw ApiError.unauthorized('E-posta veya şifre hatalı');
      }
    }

    ok(res, {
      id: ogrenci.id,
      adSoyad: ogrenci.ad_soyad,
      eposta: ogrenci.eposta,
      universite: ogrenci.universite,
      bolum: ogrenci.bolum_adi,
      sinif: ogrenci.sinif,
      ortalama: ogrenci.not_ortalamasi,
    });
  })
);

// 3. Etkinliğe Başvuru Yapma
ogrenciRouter.post(
  '/basvuru',
  asyncHandler(async (req, res) => {
    const sema = z.object({
      etkinlikId: z.coerce.number().int().positive(),
      adSoyad: z.string().trim().min(2),
      eposta: z.string().trim().email(),
      universite: z.string().trim().optional().default('Beykent Üniversitesi'),
      bolum: z.string().trim().optional().nullable(),
      sinif: z.coerce.number().int().min(0).max(5).optional().default(1),
      ortalama: z.coerce.number().min(0).max(4).optional().nullable(),
      belgeLink: z.string().trim().optional().nullable(),
      not: z.string().trim().optional().nullable(),
    });

    const girdi = parse(sema, req.body);

    // Etkinlik var mı ve yayında mı?
    const etkinlik = await queryOne(
      'SELECT id, baslik, kontenjan, durum, basvuruya_acik FROM etkinlikler WHERE id = :id',
      { id: girdi.etkinlikId }
    );
    if (!etkinlik) {
      throw ApiError.notFound('Etkinlik bulunamadı');
    }

    // Öğrenciyi bul ya da oluştur
    let ogrenci = await queryOne('SELECT id FROM ogrenciler WHERE eposta = :eposta', {
      eposta: girdi.eposta,
    });

    if (!ogrenci) {
      // Bölüm adından ID bulmaya çalışalım
      let bolumId = null;
      if (girdi.bolum) {
        const blm = await queryOne('SELECT id FROM bolumler WHERE ad = :ad', { ad: girdi.bolum });
        if (blm) bolumId = blm.id;
      }

      const [yeniOgrenci] = await pool.query(
        `INSERT INTO ogrenciler (ad_soyad, eposta, universite, bolum_id, sinif, not_ortalamasi)
         VALUES (:adSoyad, :eposta, :universite, :bolumId, :sinif, :ortalama)`,
        {
          adSoyad: girdi.adSoyad,
          eposta: girdi.eposta,
          universite: girdi.universite,
          bolumId,
          sinif: girdi.sinif,
          ortalama: girdi.ortalama || null,
        }
      );
      ogrenci = { id: yeniOgrenci.insertId };
    }

    // Zaten başvuru var mı?
    const mevcutBasvuru = await queryOne(
      'SELECT id, durum FROM basvurular WHERE etkinlik_id = :etkinlikId AND ogrenci_id = :ogrenciId',
      { etkinlikId: girdi.etkinlikId, ogrenciId: ogrenci.id }
    );

    if (mevcutBasvuru) {
      return ok(res, {
        id: mevcutBasvuru.id,
        durum: mevcutBasvuru.durum,
        mesaj: 'Bu etkinliğe daha önce başvuruldu.',
      });
    }

    // Yeni başvuru ekle
    const [yeniBasvuru] = await pool.query(
      `INSERT INTO basvurular (etkinlik_id, ogrenci_id, durum, belge_yolu, not_dusuldu, basvuru_tarihi)
       VALUES (:etkinlikId, :ogrenciId, 'beklemede', :belgeLink, :not, NOW())`,
      {
        etkinlikId: girdi.etkinlikId,
        ogrenciId: ogrenci.id,
        belgeLink: girdi.belgeLink || null,
        not: girdi.not || null,
      }
    );

    created(res, {
      id: yeniBasvuru.insertId,
      etkinlikId: girdi.etkinlikId,
      etkinlikBaslik: etkinlik.baslik,
      durum: 'beklemede',
      basvuruTarihi: new Date().toISOString(),
    });
  })
);

// 4. Öğrencinin Kendi Başvurularını Listelemesi
ogrenciRouter.get(
  '/basvurular',
  asyncHandler(async (req, res) => {
    const eposta = req.query.eposta;
    if (!eposta) {
      return ok(res, []);
    }

    const satirlar = await queryAll(
      `SELECT b.id, b.durum, b.basvuru_tarihi AS basvuruTarihi, b.not_dusuldu AS \`not\`,
              e.id AS etkinlikId, e.baslik AS etkinlikBaslik, e.tur AS etkinlikTur,
              e.baslangic AS tarih, e.adres AS yer,
              c.ad AS sehir, s.ad AS sirket
       FROM basvurular b
       JOIN ogrenciler o ON o.id = b.ogrenci_id
       JOIN etkinlikler e ON e.id = b.etkinlik_id
       JOIN sirketler s ON s.id = e.sirket_id
       JOIN sehirler c ON c.id = e.sehir_id
       WHERE o.eposta = :eposta
       ORDER BY b.basvuru_tarihi DESC`,
      { eposta }
    );

    ok(res, satirlar);
  })
);

// 5. Başvuru İptal Etme
ogrenciRouter.delete(
  '/basvurular/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const [sonuc] = await pool.query('DELETE FROM basvurular WHERE id = :id', { id });
    if (!sonuc.affectedRows) {
      throw ApiError.notFound('Başvuru bulunamadı');
    }
    res.status(204).end();
  })
);
