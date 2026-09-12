/**
 * Şemayı ve örnek veriyi lokal MySQL'deki etkinlig veritabanına yükler.
 * Kullanım: cd server && npm run db:setup
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db');

const dosyalar = ['01_schema.sql', '02_seed.sql'];

const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  multipleStatements: true,
});

for (const dosya of dosyalar) {
  const sql = await readFile(path.join(kok, dosya), 'utf8');
  await conn.query(sql);
  console.log(`✓ ${dosya}`);
}

const [[{ adet }]] = await conn.query('SELECT COUNT(*) AS adet FROM etkinlikler');
console.log(`Hazır — ${adet} etkinlik kayıtlı.`);
await conn.end();
