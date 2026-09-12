# EtkinLig - Üniversite & Öğrenci Etkinlik Platformu

**EtkinLig**, üniversite öğrencilerinin hackathonlardan, seminerlerden, teknoloji fuarlarından ve kariyer etkinliklerinden anında haberdar olmasını sağlayan modern bir etkinlik keşif ve yönetim platformudur.

---

## 🚀 Proje Hakkında
Üniversite hayatı boyunca duyuruların farklı sosyal medya kanallarında veya dağınık gruplarda kaybolması problemini çözmek için geliştirilmiştir. Kullanıcıların aradıkları etkinliklere hızlıca ulaşmasını ve yöneticilerin bu etkinlikleri kolayca yönetebilmesini hedefler.

## 🛠️ Kullanılan Teknolojiler ve Mimari
* **Frontend:** React (Vite tabanlı modern arayüz)
* **Backend:** FastAPI (Python) ve Express / Node.js entegrasyonu
* **Güvenlik:** Kullanıcı şifrelerinin güvenliği için `bcrypt` ile hashleme altyapısı
* **Veritabanı & Admin:** MySQL veritabanı desteği ve özel admin paneli alt modülleri

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için sırasıyla şu adımları izleyebilirsiniz:

```bash
npm install
npm run db:setup
npm run dev
python server.py
npm install
npm run db:setup
npm run dev
python server.py
---
```
# EtkinLig - University & Student Event Platform

**EtkinLig** is a modern event discovery and management platform designed to ensure university students are instantly informed about hackathons, seminars, tech fairs, and career events.

---

## 🚀 About the Project
It was developed to solve the problem of event announcements getting lost across different social media channels or scattered groups during university life. It enables users to quickly find the events they are looking for and allows administrators to easily manage these events.

## 🛠️ Technologies and Architecture
* **Frontend:** React (Vite-based modern interface)
* **Backend:** FastAPI (Python) and Express / Node.js integration
* **Security:** Password hashing infrastructure using `bcrypt` for user security
* **Database & Admin:** MySQL database support and custom admin panel submodules

## ⚙️ Installation and Setup

To run the project on your local environment, follow these steps in order:

```bash
npm install
npm run db:setup
npm run dev
python server.py
```
