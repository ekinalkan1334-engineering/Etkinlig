from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bcrypt

app = FastAPI()

# React (Frontend) ile iletişime izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gelen veri kalıbı
class UserRegister(BaseModel):
    adSoyad: str
    email: str
    sifre: str

# Kullanıcıları geçici tutacağımız liste
users_db = []

@app.post("/register")
def register(user: UserRegister):
    # Şifreyi geri döndürülemez şekilde hash'le
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user.sifre.encode('utf-8'), salt)
    
    user_record = {
        "adSoyad": user.adSoyad,
        "email": user.email,
        "sifre": hashed_password.decode('utf-8')
    }
    users_db.append(user_record)
    
    print(f"\n--- YENİ KULLANICI KAYDEDİLDİ ---")
    print(f"Ad: {user.adSoyad}")
    print(f"Email: {user.email}")
    print(f"Güvenli Hash: {user_record['sifre']}\n")
    
    return {"message": "Kayıt başarılı", "status": 200}