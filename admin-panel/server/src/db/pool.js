import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

export const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  queueLimit: 0,
  namedPlaceholders: true,
  // DATE/DATETIME'ı string olarak döndür: JSON'a çevrilirken UTC kaymasını önler.
  dateStrings: true,
  charset: 'utf8mb4_turkish_ci',
});

/** Tek satır döndüren sorgu. */
export async function queryOne(sql, params = {}) {
  const [rows] = await pool.query(sql, params);
  return rows[0] ?? null;
}

/** Çok satır döndüren sorgu. */
export async function queryAll(sql, params = {}) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** INSERT/UPDATE/DELETE — etkilenen satır ve insertId. */
export async function execute(sql, params = {}) {
  const [result] = await pool.execute(sql, params);
  return result;
}

/**
 * Tek DRY transaction sarmalayıcı: her yazma servisi bunu kullanır,
 * commit/rollback tekrarı hiçbir modülde yazılmaz.
 */
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function healthcheck() {
  const row = await queryOne('SELECT 1 AS ok');
  return row?.ok === 1;
}
