import 'dotenv/config';

const num = (v, fallback) => (v === undefined || v === '' ? fallback : Number(v));

const uretim = process.env.NODE_ENV === 'production';

const jwtGizli = process.env.JWT_SECRET ?? '';
if (uretim && jwtGizli.length < 32) {
  throw new Error('JWT_SECRET üretimde en az 32 karakter olmalı — .env dosyasını doldurun.');
}

export const env = {
  uretim,
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwt: {
    gizli: jwtGizli || 'gelistirme-icin-gecici-anahtar-degistirin',
    sure: process.env.JWT_EXPIRES ?? '8h',
    cerezOmruMs: num(process.env.JWT_COOKIE_MS, 8 * 60 * 60 * 1000),
  },
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: num(process.env.DB_PORT, 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'etkinlig',
    connectionLimit: num(process.env.DB_CONNECTION_LIMIT, 10),
  },
};
