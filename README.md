# KABIRU DMS — Dynamic Module Injection & Sandboxed Iframe LMS

**KABIRU DMS (Dashboard Management System)** adalah prototipe sistem manajemen modul pembelajaran interaktif (minigame, kuis interaktif, simulasi) untuk platform **LMS KABIRU**. Proyek ini dirancang untuk mendukung *Dynamic Module Injection* secara aman menggunakan **Iframe Sandbox** dan **Contract-First Manifest** tanpa perlu mengubah kode inti (*core codebase*) maupun melakukan *redeploy* ulang server utama.

---

## 🎯 Latar Belakang & Tujuan Arsitektur

Pada arsitektur LMS monolitik konvensional, penambahan modul pembelajaran interaktif baru mengharuskan developer mengedit kode sumber utama dan men-deploy ulang aplikasi. Pendekatan tersebut tidak skalabel dan berisiko merusak fitur yang sedang berjalan di produksi.

**KABIRU DMS** menyelesaikan masalah tersebut melalui 4 pilar arsitektur:
1. **Dynamic Module Injection**: Developer/Author dapat menulis kode modul (`index.html`, `styles.css`, `script.js`) langsung melalui **Monaco Editor** di browser dan mempublikasikannya secara instan.
2. **Immutable Versioning & Checksum**: Setiap kali modul disimpan, sistem membuat versi baru yang bersifat *immutable* (tidak menimpa versi lama) disertai validasi ukuran ($\le 200\text{ KB}$) dan *hash* integritas **SHA-256**.
3. **Zero-Trust Sandbox Isolation**: Modul dijalankan di dalam `<iframe sandbox="allow-scripts">` tanpa akses ke DOM induk, `localStorage`, maupun *cookie* sesi utama (`allow-same-origin` sengaja dinonaktifkan), serta didukung pemisahan domain (*Site Isolation*) melalui Middleware.
4. **Contract-First Manifest (`manifest.json`)**: Komunikasi skor dan penyelesaian modul antara iframe dan Host LMS diatur melalui skema kontrak ketat yang divalidasi dengan **Zod**.

---

## 🛠️ Tech Stack

| Layer | Teknologi | Fungsi Utama |
| :--- | :--- | :--- |
| **Runtime & Package Manager** | [Bun](https://bun.sh) | Eksekusi script cepat, manajemen dependensi, dan *seed* database |
| **Framework Fullstack** | [Next.js 16 (App Router)](https://nextjs.org) | Server Components, API Routes, dan Middleware *Site Isolation* |
| **Bahasa & Validasi** | TypeScript & [Zod](https://zod.dev) | *Type-safety* menyeluruh dan validasi skema kontrak `manifest.json` |
| **Database & ORM** | PostgreSQL 16 & [Drizzle ORM](https://orm.drizzle.team) | Penyimpanan relasional untuk versi modul, penempatan materi, dan *audit logs* |
| **Autentikasi** | [Better Auth](https://better-auth.com) | Manajemen sesi aman berbasis *cookie* (`HttpOnly`, `SameSite`) dan *role* pengguna |
| **Code Editor UI** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) | Editor kode 3-tab (`HTML`, `CSS`, `JS`) + *Live Sandbox Preview* di dalam browser |
| **Styling** | Tailwind CSS v4 | Antarmuka pengguna bersih dan fungsional (*utility-focused design*) |

---

## 🗂️ Struktur Direktori Utama

```text
kabiru-dms/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...all]/          # Endpoint autentikasi Better Auth
│   │   │   └── modules/                # REST API CRUD modul, pembuatan versi baru, & publish
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Halaman daftar modul & pembuatan modul baru
│   │   │   └── modules/[id]/page.tsx   # Halaman workspace editor modul & versi
│   │   └── login/page.tsx              # Halaman autentikasi Admin/Developer
│   ├── components/
│   │   └── module-editor.tsx           # Komponen Monaco Editor (HTML/CSS/JS/Manifest) & Live Preview
│   ├── lib/
│   │   ├── auth.ts & auth-client.ts    # Konfigurasi server & client Better Auth
│   │   ├── contract/manifest.ts        # Skema Zod untuk kontrak manifest modul & template default
│   │   ├── db/
│   │   │   ├── index.ts                # Koneksi pool PostgreSQL & Drizzle instance
│   │   │   ├── schema.ts               # Skema tabel database & relasi Drizzle
│   │   │   └── seed.ts                 # Seeder akun Admin default & data materi awal
│   │   └── services/
│   │       └── module-service.ts       # Business logic: versioning, SHA-256 checksum, limit 200KB, audit log
│   └── middleware.ts                   # Penegakan Site Isolation antara domain aplikasi & domain sandbox
├── docker-compose.yml                  # Konfigurasi kontainer PostgreSQL 16 lokal
├── drizzle.config.ts                   # Konfigurasi Drizzle Kit untuk migrasi/push skema
└── package.json
```

---

## 🗄️ Skema Database Inti

- **`user`, `session`, `account`, `verification`**: Tabel autentikasi dan manajemen sesi pengguna.
- **`modules`**: Metadata modul utama (`id`, `slug`, `title`, `description`, `status` [`draft` | `published` | `archived`], `current_version_id`).
- **`module_versions`**: Menyimpan riwayat versi modul yang *immutable* (`version_no`, `manifest` JSONB, `source_html`, `source_css`, `source_js`, `checksum_sha256`).
- **`lessons` & `lesson_modules`**: Tabel pemetaan modul yang di-publish ke dalam materi pembelajaran LMS.
- **`attempts`**: Mencatat skor dan status penyelesaian siswa terhadap versi modul tertentu.
- **`audit_logs`**: Mencatat jejak audit setiap aksi penting (`module_created`, `version_saved`, `published`).

---

## 📜 Kontrak Manifest & SDK Modul (`window.Kabiru`)

Setiap modul wajib memenuhi skema `manifest.json` berikut:
```json
{
  "contractVersion": "1.0",
  "name": "Minigame Klasifikasi Hewan",
  "slug": "minigame-klasifikasi-hewan",
  "version": "1.0.1",
  "maxScore": 100,
  "emits": ["result"]
}
```

Di dalam tab `script.js`, developer modul dapat berkomunikasi dengan Host LMS menggunakan objek global `window.Kabiru`:
```javascript
// 1. Memberi tahu Host LMS bahwa modul telah selesai dimuat dan siap dimainkan
window.Kabiru.ready();

// 2. Mengirimkan skor akhir dan status penyelesaian ke Host LMS
window.Kabiru.finish({
  score: 100,
  completed: true
});
```

---

## 🚀 Cara Menjalankan di Lokal (Development)

### 1. Prasyarat
- [Bun](https://bun.sh) (`>= 1.1`)
- Docker & Docker Compose (untuk database PostgreSQL lokal)

### 2. Instalasi Dependensi
```bash
bun install
```

### 3. Konfigurasi Environment Variable (`.env`)
Buat file `.env` di root proyek:
```env
DATABASE_URL="postgres://kabiru:kabiru_password@localhost:5433/kabiru_dms"
BETTER_AUTH_SECRET="ganti-dengan-secret-minimal-32-karakter-acak"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SANDBOX_HOST="same-origin"
```

### 4. Jalankan Database & Inisialisasi Skema
```bash
# Nyalakan container PostgreSQL di port 5433
sudo docker compose up -d

# Dorong skema Drizzle ke database
bun run db:push

# Jalankan seeder untuk membuat akun Admin awal
bun run db:seed
```
> **Kredensial Login Default (Hasil Seed):**
> - **Email:** `admin@kabiru.test`
> - **Password:** `password123`

### 5. Jalankan Server Development
```bash
bun run dev
```
Buka `http://localhost:3000` di browser.

---

## ☁️ Panduan Deployment ke Render (Production)

1. **Buat Database PostgreSQL di Render** (atau layanan cloud PostgreSQL seperti Neon.tech), lalu salin *Internal/External Database URL*-nya.
2. **Buat Web Service Baru di Render** dan hubungkan ke repository GitHub ini:
   - **Runtime:** `Node` / `Bun`
   - **Build Command:** `bun install && bun run build`
   - **Start Command:** `bun run start`
3. **Tambahkan Environment Variables di Render:**
   - `DATABASE_URL`: *(Connection string PostgreSQL production kamu)*
   - `BETTER_AUTH_SECRET`: *(String acak minimal 32 karakter)*
   - `BETTER_AUTH_URL`: *(URL aplikasi Render kamu, misal `https://kabiru-dms.onrender.com`)*
   - `NEXT_PUBLIC_SANDBOX_HOST`: `same-origin` *(atau domain khusus sandbox jika menggunakan custom domain terpisah)*
4. **Push Skema & Seed ke Database Production:**
   Setelah database aktif, jalankan perintah `bun run db:push` dan `bun run db:seed` menggunakan `DATABASE_URL` production untuk menyiapkan tabel dan akun Admin.
