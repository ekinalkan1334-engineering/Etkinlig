import { pool, queryAll, queryOne, withTransaction } from '../../db/pool.js';

const SIRALAMA_SUTUNU = {
  baslangic: 'e.baslangic',
  baslik: 'e.baslik',
  olusturuldu: 'e.olusturuldu',
  basvuru_sayisi: 'basvuru_sayisi',
};

const SECIM = `
  e.id, e.kod, e.baslik, e.tur, e.durum, e.baslangic, e.bitis, e.son_basvuru,
  e.kontenjan, e.basvuruya_acik, e.ilce, e.adres,
  s.id AS sirket_id, s.ad AS sirket_adi,
  c.id AS sehir_id,  c.ad AS sehir_adi,
  COALESCE(b.toplam, 0) AS basvuru_sayisi,
  COALESCE(b.onayli, 0) AS onayli_sayisi
`;

const KAYNAK = `
  FROM etkinlikler e
  JOIN sirketler s ON s.id = e.sirket_id
  JOIN sehirler  c ON c.id = e.sehir_id
  LEFT JOIN (
    SELECT etkinlik_id, COUNT(*) AS toplam, SUM(durum = 'onaylandi') AS onayli
    FROM basvurular GROUP BY etkinlik_id
  ) b ON b.etkinlik_id = e.id
`;

/** Filtreleri tek yerde WHERE'e çevirir — liste ve sayım aynı koşulu kullanır. */
function kosullar(f) {
  const where = [];
  const params = {};
  if (f.arama) { where.push('(e.baslik LIKE :arama OR s.ad LIKE :arama OR e.kod LIKE :arama)'); params.arama = `%${f.arama}%`; }
  if (f.tur) { where.push('e.tur = :tur'); params.tur = f.tur; }
  if (f.durum) { where.push('e.durum = :durum'); params.durum = f.durum; }
  if (f.sehirId) { where.push('e.sehir_id = :sehirId'); params.sehirId = f.sehirId; }
  if (f.sirketId) { where.push('e.sirket_id = :sirketId'); params.sirketId = f.sirketId; }
  if (f.baslangicSonrasi) { where.push('e.baslangic >= :baslangicSonrasi'); params.baslangicSonrasi = `${f.baslangicSonrasi} 00:00:00`; }
  if (f.baslangicOncesi) { where.push('e.baslangic <= :baslangicOncesi'); params.baslangicOncesi = `${f.baslangicOncesi} 23:59:59`; }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

export async function listele(filtre) {
  const { sql: whereSql, params } = kosullar(filtre);
  const sutun = SIRALAMA_SUTUNU[filtre.siralama] ?? 'e.baslangic';
  const yon = filtre.yon === 'desc' ? 'DESC' : 'ASC';
  const limit = Number(filtre.limit);
  const offset = (Number(filtre.sayfa) - 1) * limit;

  const [satirlar, sayim] = await Promise.all([
    queryAll(`SELECT ${SECIM} ${KAYNAK} ${whereSql} ORDER BY ${sutun} ${yon} LIMIT ${limit} OFFSET ${offset}`, params),
    queryOne(`SELECT COUNT(*) AS toplam ${KAYNAK} ${whereSql}`, params),
  ]);
  return { satirlar, toplam: Number(sayim?.toplam ?? 0) };
}

export async function bul(id) {
  const etkinlik = await queryOne(
    `SELECT ${SECIM},
            e.aciklama, e.iletisim_epostasi, e.kapak_gorseli,
            e.sart_ogrenim_duzeyi, e.sart_min_ortalama, e.sart_belge_zorunlu,
            e.otomatik_onay, e.yedek_liste, e.katilim_belgesi,
            e.olusturuldu, e.guncellendi
     ${KAYNAK} WHERE e.id = :id`,
    { id },
  );
  if (!etkinlik) return null;

  const [siniflar, bolumler] = await Promise.all([
    queryAll('SELECT sinif FROM etkinlik_siniflari WHERE etkinlik_id = :id ORDER BY sinif', { id }),
    queryAll(
      `SELECT b.id, b.ad FROM etkinlik_bolumleri eb
       JOIN bolumler b ON b.id = eb.bolum_id
       WHERE eb.etkinlik_id = :id ORDER BY b.ad`,
      { id },
    ),
  ]);
  return { ...etkinlik, siniflar: siniflar.map((s) => s.sinif), bolumler };
}

const SUTUNLAR = {
  baslik: 'baslik', aciklama: 'aciklama', tur: 'tur', sirketId: 'sirket_id',
  iletisimEpostasi: 'iletisim_epostasi', sehirId: 'sehir_id', ilce: 'ilce', adres: 'adres',
  baslangic: 'baslangic', bitis: 'bitis', sonBasvuru: 'son_basvuru', kontenjan: 'kontenjan',
  kapakGorseli: 'kapak_gorseli', sartOgrenimDuzeyi: 'sart_ogrenim_duzeyi',
  sartMinOrtalama: 'sart_min_ortalama', sartBelgeZorunlu: 'sart_belge_zorunlu',
  durum: 'durum', basvuruyaAcik: 'basvuruya_acik', otomatikOnay: 'otomatik_onay',
  yedekListe: 'yedek_liste', katilimBelgesi: 'katilim_belgesi',
  olusturanId: 'olusturan_id',
};

const alanlar = (girdi) => {
  const kolonlar = [];
  const params = {};
  for (const [anahtar, kolon] of Object.entries(SUTUNLAR)) {
    if (girdi[anahtar] !== undefined) {
      kolonlar.push(kolon);
      params[kolon] = girdi[anahtar] ?? null;
    }
  }
  return { kolonlar, params };
};

async function sartlariYaz(conn, etkinlikId, girdi) {
  if (girdi.sartSiniflar !== undefined) {
    await conn.execute('DELETE FROM etkinlik_siniflari WHERE etkinlik_id = ?', [etkinlikId]);
    if (girdi.sartSiniflar.length) {
      await conn.query('INSERT INTO etkinlik_siniflari (etkinlik_id, sinif) VALUES ?', [
        girdi.sartSiniflar.map((s) => [etkinlikId, s]),
      ]);
    }
  }
  if (girdi.sartBolumIdleri !== undefined) {
    await conn.execute('DELETE FROM etkinlik_bolumleri WHERE etkinlik_id = ?', [etkinlikId]);
    if (girdi.sartBolumIdleri.length) {
      await conn.query('INSERT INTO etkinlik_bolumleri (etkinlik_id, bolum_id) VALUES ?', [
        girdi.sartBolumIdleri.map((b) => [etkinlikId, b]),
      ]);
    }
  }
}

export function olustur(girdi, kod) {
  return withTransaction(async (conn) => {
    const { kolonlar, params } = alanlar(girdi);
    kolonlar.push('kod');
    params.kod = kod;
    const isaretler = kolonlar.map((k) => `:${k}`).join(', ');
    const [sonuc] = await conn.query(
      `INSERT INTO etkinlikler (${kolonlar.join(', ')}) VALUES (${isaretler})`,
      params,
    );
    await sartlariYaz(conn, sonuc.insertId, girdi);
    return sonuc.insertId;
  });
}

export function guncelle(id, girdi) {
  return withTransaction(async (conn) => {
    const { kolonlar, params } = alanlar(girdi);
    if (kolonlar.length) {
      const atamalar = kolonlar.map((k) => `${k} = :${k}`).join(', ');
      await conn.query(`UPDATE etkinlikler SET ${atamalar} WHERE id = :id`, { ...params, id });
    }
    await sartlariYaz(conn, id, girdi);
    return true;
  });
}

export async function durumDegistir(id, durum) {
  const [sonuc] = await pool.query('UPDATE etkinlikler SET durum = :durum WHERE id = :id', { id, durum });
  return sonuc.affectedRows > 0;
}

export async function sil(id) {
  const [sonuc] = await pool.query('DELETE FROM etkinlikler WHERE id = :id', { id });
  return sonuc.affectedRows > 0;
}

export async function sonrakiKod(yil) {
  const satir = await queryOne(
    `SELECT kod FROM etkinlikler WHERE kod LIKE :onek ORDER BY kod DESC LIMIT 1`,
    { onek: `ETK-${yil}-%` },
  );
  const sira = satir ? Number(satir.kod.split('-')[2]) + 1 : 1;
  return `ETK-${yil}-${String(sira).padStart(4, '0')}`;
}
