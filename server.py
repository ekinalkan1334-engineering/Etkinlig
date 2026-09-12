import os
import sqlite3
import bcrypt
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="EtkinLig API", version="2.0.0")

# React (Frontend) ile iletişime izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MySQL Bağlantı Ayarları
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "etkinlig")

# MySQL Sürücüsünü Yükleme
mysql = None
driver_name = None

try:
    import pymysql
    pymysql.install_as_MySQLdb()
    import MySQLdb as mysql
    driver_name = "pymysql"
except ImportError:
    try:
        import mysql.connector as mysql
        driver_name = "mysql.connector"
    except ImportError:
        pass


def get_mysql_conn():
    """MySQL veritabanına bağlanır."""
    if mysql is None:
        return None
    try:
        conn_init = mysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
        )
        cur_init = conn_init.cursor()
        cur_init.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci")
        conn_init.commit()
        cur_init.close()
        conn_init.close()

        conn = mysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
        )
        return conn
    except Exception as e:
        print(f"[!] MySQL Bağlantı Denemesi: {e}")
        return None


def get_sqlite_conn():
    """Python yerleşik SQLite veritabanı bağlantısı (MySQL hazır olana kadar kesintisiz çalışır)."""
    db_path = os.path.join(os.path.dirname(__file__), "etkinlig.db")
    conn = sqlite3.connect(db_path, check_same_thread=False)
    return conn


def init_db():
    """Veritabanı tablolarını hazırlar."""
    # 1. MySQL dene
    conn = get_mysql_conn()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("""
            CREATE TABLE IF NOT EXISTS ogrenciler (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                ad_soyad VARCHAR(120) NOT NULL,
                eposta VARCHAR(160) NOT NULL UNIQUE,
                parola_hash VARCHAR(255) NULL,
                universite VARCHAR(160) DEFAULT 'Beykent Üniversitesi',
                sinif TINYINT UNSIGNED DEFAULT 1,
                not_ortalamasi DECIMAL(3,2) NULL,
                olusturuldu DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;
            """)
            try:
                cur.execute("ALTER TABLE ogrenciler ADD COLUMN parola_hash VARCHAR(255) NULL")
            except Exception:
                pass
            cur.execute("""
            CREATE TABLE IF NOT EXISTS basvurular (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                etkinlik_id INT UNSIGNED NOT NULL,
                ogrenci_id INT UNSIGNED NOT NULL,
                durum ENUM('beklemede','onaylandi','reddedildi','yedek','iptal') DEFAULT 'beklemede',
                belge_yolu VARCHAR(300) NULL,
                not_dusuldu VARCHAR(255) NULL,
                basvuru_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;
            """)
            conn.commit()
            cur.close()
            conn.close()
            print("[✓] MySQL 'etkinlig' veritabanı bağlandı ve tablolar hazır.")
            return "mysql"
        except Exception as e:
            print(f"[!] MySQL tablo hatası: {e}")

    # 2. SQLite yedekleme
    sq_conn = get_sqlite_conn()
    sq_cur = sq_conn.cursor()
    sq_cur.execute("""
    CREATE TABLE IF NOT EXISTS ogrenciler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad_soyad TEXT NOT NULL,
        eposta TEXT NOT NULL UNIQUE,
        parola_hash TEXT,
        universite TEXT DEFAULT 'Beykent Üniversitesi',
        sinif INTEGER DEFAULT 1,
        not_ortalamasi REAL,
        olusturuldu DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    sq_cur.execute("""
    CREATE TABLE IF NOT EXISTS basvurular (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        etkinlik_id INTEGER NOT NULL,
        ogrenci_id INTEGER NOT NULL,
        durum TEXT DEFAULT 'beklemede',
        belge_yolu TEXT,
        not_dusuldu TEXT,
        basvuru_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    sq_conn.commit()
    sq_cur.close()
    sq_conn.close()
    print("[✓] Yerel veritabanı (SQLite etkinlig.db) hazır.")
    return "sqlite"


ACTIVE_DB = init_db()


class UserRegister(BaseModel):
    adSoyad: str
    email: str
    sifre: str
    universite: Optional[str] = "Beykent Üniversitesi"
    sinif: Optional[int] = 3
    notOrtalamasi: Optional[float] = 3.20

class UserLogin(BaseModel):
    email: str
    sifre: str

class EventApplication(BaseModel):
    etkinlikId: int
    adSoyad: str
    eposta: str
    universite: Optional[str] = "Beykent Üniversitesi"
    bolum: Optional[str] = "Bilgisayar Mühendisliği"
    sinif: Optional[int] = 3
    ortalama: Optional[float] = 3.20
    belgeLink: Optional[str] = None
    not_: Optional[str] = None


@app.get("/api/saglik")
@app.get("/health")
def healthcheck():
    mysql_conn = get_mysql_conn()
    has_mysql = mysql_conn is not None
    if mysql_conn:
        mysql_conn.close()
    return {
        "api": True,
        "database": "MySQL" if has_mysql else "SQLite",
        "connected": True,
        "mysql_connected": has_mysql,
        "active_storage": "MySQL (etkinlig)" if has_mysql else "SQLite (etkinlig.db)"
    }


@app.post("/register")
@app.post("/api/ogrenci/kayit")
def register(user: UserRegister):
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user.sifre.encode("utf-8"), salt).decode("utf-8")

    # 1. MySQL dene
    mysql_conn = get_mysql_conn()
    if mysql_conn:
        try:
            cur = mysql_conn.cursor()
            cur.execute("SELECT id FROM ogrenciler WHERE eposta = %s", (user.email,))
            if cur.fetchone():
                cur.close()
                mysql_conn.close()
                raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")

            cur.execute(
                """
                INSERT INTO ogrenciler (ad_soyad, eposta, parola_hash, universite, sinif, not_ortalamasi)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user.adSoyad, user.email, hashed_password, user.universite, user.sinif, user.notOrtalamasi),
            )
            mysql_conn.commit()
            insert_id = cur.lastrowid
            cur.close()
            mysql_conn.close()

            print(f"\n[✓] Kullanıcı MySQL ({DB_NAME}.ogrenciler) tablosuna kaydedildi:")
            print(f"ID: {insert_id} | Ad: {user.adSoyad} | Email: {user.email}\n")
            return {
                "message": "Kayıt başarılı, MySQL veritabanına kaydedildi.",
                "status": 200,
                "data": {"id": insert_id, "adSoyad": user.adSoyad, "eposta": user.email},
            }
        except HTTPException:
            raise
        except Exception as e:
            print(f"[!] MySQL hata: {e}")

    # 2. SQLite yedek kaydet
    sq_conn = get_sqlite_conn()
    sq_cur = sq_conn.cursor()
    sq_cur.execute("SELECT id FROM ogrenciler WHERE eposta = ?", (user.email,))
    if sq_cur.fetchone():
        sq_cur.close()
        sq_conn.close()
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")

    sq_cur.execute(
        """
        INSERT INTO ogrenciler (ad_soyad, eposta, parola_hash, universite, sinif, not_ortalamasi)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user.adSoyad, user.email, hashed_password, user.universite, user.sinif, user.notOrtalamasi),
    )
    sq_conn.commit()
    insert_id = sq_cur.lastrowid
    sq_cur.close()
    sq_conn.close()

    print(f"\n[✓] Kullanıcı veritabanına (SQLite etkinlig.db) kaydedildi:")
    print(f"ID: {insert_id} | Ad: {user.adSoyad} | Email: {user.email}\n")

    return {
        "message": "Kayıt başarılı, veritabanına kaydedildi.",
        "status": 200,
        "data": {"id": insert_id, "adSoyad": user.adSoyad, "eposta": user.email},
    }


@app.post("/login")
@app.post("/api/ogrenci/giris")
def login(creds: UserLogin):
    mysql_conn = get_mysql_conn()
    if mysql_conn:
        try:
            cur = mysql_conn.cursor()
            cur.execute("SELECT id, ad_soyad, eposta, parola_hash, universite, sinif FROM ogrenciler WHERE eposta = %s", (creds.email,))
            row = cur.fetchone()
            cur.close()
            mysql_conn.close()

            if row:
                user_id, ad_soyad, eposta, parola_hash, universite, sinif = row
                if parola_hash and bcrypt.checkpw(creds.sifre.encode("utf-8"), parola_hash.encode("utf-8")):
                    return {
                        "message": "Giriş başarılı.",
                        "data": {"id": user_id, "adSoyad": ad_soyad, "eposta": eposta, "universite": universite, "sinif": sinif},
                    }
        except Exception:
            pass

    sq_conn = get_sqlite_conn()
    sq_cur = sq_conn.cursor()
    sq_cur.execute("SELECT id, ad_soyad, eposta, parola_hash, universite, sinif FROM ogrenciler WHERE eposta = ?", (creds.email,))
    row = sq_cur.fetchone()
    sq_cur.close()
    sq_conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")

    user_id, ad_soyad, eposta, parola_hash, universite, sinif = row
    if parola_hash and not bcrypt.checkpw(creds.sifre.encode("utf-8"), parola_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")

    return {
        "message": "Giriş başarılı.",
        "data": {"id": user_id, "adSoyad": ad_soyad, "eposta": eposta, "universite": universite, "sinif": sinif},
    }


@app.post("/api/ogrenci/basvuru")
@app.post("/apply")
def apply_to_event(app_data: EventApplication):
    mysql_conn = get_mysql_conn()
    if mysql_conn:
        try:
            cur = mysql_conn.cursor()
            cur.execute("SELECT id FROM ogrenciler WHERE eposta = %s", (app_data.eposta,))
            ogrenci = cur.fetchone()
            if not ogrenci:
                cur.execute(
                    "INSERT INTO ogrenciler (ad_soyad, eposta, universite) VALUES (%s, %s, %s)",
                    (app_data.adSoyad, app_data.eposta, app_data.universite),
                )
                ogrenci_id = cur.lastrowid
            else:
                ogrenci_id = ogrenci[0]

            cur.execute(
                "INSERT INTO basvurular (etkinlik_id, ogrenci_id, durum, belge_yolu, not_dusuldu, basvuru_tarihi) VALUES (%s, %s, 'beklemede', %s, %s, NOW())",
                (app_data.etkinlikId, ogrenci_id, app_data.belgeLink, app_data.not_),
            )
            mysql_conn.commit()
            b_id = cur.lastrowid
            cur.close()
            mysql_conn.close()
            return {"message": "Başvuru MySQL'e kaydedildi.", "data": {"id": b_id, "durum": "beklemede"}}
        except Exception as e:
            print(f"[!] MySQL başvuru hatası: {e}")

    sq_conn = get_sqlite_conn()
    sq_cur = sq_conn.cursor()
    sq_cur.execute("SELECT id FROM ogrenciler WHERE eposta = ?", (app_data.eposta,))
    ogrenci = sq_cur.fetchone()
    if not ogrenci:
        sq_cur.execute(
            "INSERT INTO ogrenciler (ad_soyad, eposta, universite) VALUES (?, ?, ?)",
            (app_data.adSoyad, app_data.eposta, app_data.universite),
        )
        ogrenci_id = sq_cur.lastrowid
    else:
        ogrenci_id = ogrenci[0]

    sq_cur.execute(
        "INSERT INTO basvurular (etkinlik_id, ogrenci_id, durum, belge_yolu, not_dusuldu) VALUES (?, ?, 'beklemede', ?, ?)",
        (app_data.etkinlikId, ogrenci_id, app_data.belgeLink, app_data.not_),
    )
    sq_conn.commit()
    b_id = sq_cur.lastrowid
    sq_cur.close()
    sq_conn.close()

    return {"message": "Başvuru veritabanına kaydedildi.", "data": {"id": b_id, "durum": "beklemede"}}


@app.get("/api/ogrenci/basvurular")
@app.get("/applications")
def get_applications(eposta: str = Query(...)):
    mysql_conn = get_mysql_conn()
    if mysql_conn:
        try:
            cur = mysql_conn.cursor()
            cur.execute(
                """
                SELECT b.id, b.durum, b.basvuru_tarihi, b.not_dusuldu, b.etkinlik_id
                FROM basvurular b
                JOIN ogrenciler o ON o.id = b.ogrenci_id
                WHERE o.eposta = %s
                ORDER BY b.basvuru_tarihi DESC
                """,
                (eposta,),
            )
            rows = cur.fetchall()
            cur.close()
            mysql_conn.close()
            return [{"id": r[0], "durum": r[1], "basvuruTarihi": str(r[2]), "not": r[3], "etkinlikId": r[4]} for r in rows]
        except Exception:
            pass

    sq_conn = get_sqlite_conn()
    sq_cur = sq_conn.cursor()
    sq_cur.execute(
        """
        SELECT b.id, b.durum, b.basvuru_tarihi, b.not_dusuldu, b.etkinlik_id
        FROM basvurular b
        JOIN ogrenciler o ON o.id = b.ogrenci_id
        WHERE o.eposta = ?
        ORDER BY b.basvuru_tarihi DESC
        """,
        (eposta,),
    )
    rows = sq_cur.fetchall()
    sq_cur.close()
    sq_conn.close()

    return [{"id": r[0], "durum": r[1], "basvuruTarihi": str(r[2]), "not": r[3], "etkinlikId": r[4]} for r in rows]


if __name__ == "__main__":
    try:
        import uvicorn
        print("\n[✓] EtkinLig API başlatılıyor: http://127.0.0.1:8000")
        print("[*] Durum: http://127.0.0.1:8000/api/saglik\n")
        uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
    except ImportError:
        print("[!] 'uvicorn' kütüphanesi bulunamadı. Yüklemek için: pip3 install uvicorn")