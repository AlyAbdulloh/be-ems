# Panduan Penggunaan Base Template NestJS (Multi-Database & Prisma)

Dokumentasi ini menjelaskan cara setup project, menjalankan database migration/seeder (opsional), serta cara kerja dan penambahan koneksi database baru dalam arsitektur **Multi-Database** menggunakan **NestJS** dan **Prisma ORM**.

---

## 📋 Daftar Isi
1. [Prasyarat](#-prasyarat)
2. [Langkah Setup Template](#-langkah-setup-template)
3. [Struktur Proyek](#-struktur-proyek)
4. [Konfigurasi Multi-Database](#-konfigurasi-multi-database)
5. [Langkah Menambahkan Database Baru](#-langkah-menambahkan-database-baru)
6. [Database Migrations & Seeder (Opsional)](#-database-migrations--seeder-opsional)
7. [Menjalankan Aplikasi](#-menjalankan-aplikasi)

---

## 🛠 Prasyarat

Sebelum memulai, pastikan perangkat Anda telah terinstall:
- **Node.js** (v20.0.0 atau lebih baru)
- **NPM** (v10.0.0 atau lebih baru)
- **MySQL Server** (bisa menggunakan Local MySQL Server, XAMPP, Laragon, atau Docker)

---

## 🚀 Langkah Setup Template

Ikuti langkah-langkah berikut untuk menjalankan template pertama kali:

### 1. Install Dependencies
Jalankan perintah berikut di root folder project untuk mengunduh semua package yang dibutuhkan:
```bash
npm install
```

### 2. Konfigurasi Environment Variables (`.env`)
Salin atau buat file `.env` di root project, lalu sesuaikan konfigurasi database dan JWT Anda.

Contoh konfigurasi `.env`:
```env
PORT=3000
JWT_SECRET="danain_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="1d"

# URL Database (MySQL)
DANAIN_DATABASE_URL="mysql://username:password@localhost:3306/danain_db"
```
> [!IMPORTANT]
> Pastikan database bernama `danain_db` sudah dibuat di MySQL Server Anda sebelum melanjutkan ke tahap migrasi.
---

## 📁 Struktur Proyek

Berikut adalah struktur folder dan file utama pada boilerplate ini:

```text
├── prisma/
│   ├── danain/
│   │   └── schema.prisma         # Schema khusus database Danain
│   └── seed.ts                   # Script seed data default (opsional)
├── src/
│   ├── auth/                     # Logika register/login autentikasi & JWT
│   │   ├── dto/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── common/                   # Decorator, guard, filter, dan interceptor bersama (shared)
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── interceptors/
│   │       ├── logging.interceptor.ts
│   │       └── transform.interceptor.ts
│   ├── modules/                  # Modul fitur aplikasi
│   │   ├── health/               # Modul health check
│   │   │   ├── health.controller.ts
│   │   │   └── health.module.ts
│   │   └── users/                # Modul manajemen user
│   │       ├── dto/
│   │       ├── users.controller.ts
│   │       ├── users.module.ts
│   │       └── users.service.ts
│   ├── prisma/                   # Layanan koneksi database Prisma
│   │   ├── danain/
│   │   │   └── danain-prisma.service.ts
│   │   └── prisma.module.ts      # Module utama pembungkus koneksi database
│   ├── main.ts                   # Entrypoint Utama Aplikasi
│   └── app.module.ts             # Root AppModule
└── test/                         # Unit & E2E testing
```

---

## 🗄 Konfigurasi Multi-Database

Project ini mendukung koneksi ke lebih dari satu database. Untuk mencegah terjadinya tabrakan (*naming collision*) pada tipe data dan kelas yang dihasilkan oleh Prisma Client, generator diatur untuk menyimpan *output* client ke folder internal yang berbeda.

### Struktur Folder Prisma & Database:
```text
├── prisma/
│   ├── danain/
│   │   └── schema.prisma         # Schema khusus database Danain
│   └── seed.ts                   # Script seed data default (opsional)
└── src/
    └── prisma/
        ├── danain/
        │   └── danain-prisma.service.ts   # Service koneksi Prisma database Danain
        └── prisma.module.ts      # Module utama pembungkus koneksi database
```

Dalam [schema.prisma](file:///Users/achmadalyabdulloh/Project-portofolio/Duitin/danain-api/prisma/danain/schema.prisma) milik database `danain`, output diatur khusus ke `@internal/prisma/danain`:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../node_modules/@internal/prisma/danain"
}
```

Hal ini membuat kita harus mengimpor `PrismaClient` database Danain dari path tersebut:
```typescript
import { PrismaClient } from '@internal/prisma/danain';
```

---

## ➕ Langkah Menambahkan Database Baru

Jika Anda ingin menambahkan database kedua (misalnya database `billing` untuk mencatat transaksi keuangan), ikuti langkah-langkah berikut:

### Langkah 1: Tambahkan Environment Variable Baru
Edit file [`.env`](file:///Users/achmadalyabdulloh/Project-portofolio/Duitin/danain-api/.env) dan tambahkan URL database baru:
```env
BILLING_DATABASE_URL="mysql://username:password@localhost:3306/billing_db"
```

### Langkah 2: Buat Folder Schema Baru
Buat folder `prisma/billing` dan file `schema.prisma` di dalamnya:
```text
prisma/
└── billing/
    └── schema.prisma
```

Isi file `prisma/billing/schema.prisma` dengan konfigurasi output kustom:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../node_modules/@internal/prisma/billing"
}

datasource db {
  provider = "mysql"
  url      = env("BILLING_DATABASE_URL")
}

model Transaction {
  id        Int      @id @default(autoincrement())
  amount    Decimal
  status    String
  createdAt DateTime @default(now())

  @@map("transactions")
}
```
> [!WARNING]
> Pastikan path `output` berbeda untuk setiap database agar tidak menimpa satu sama lain. Contoh: `../../node_modules/@internal/prisma/billing`.

### Langkah 3: Tambahkan Script di `package.json`
Tambahkan perintah untuk migrate, generate, dan seed (jika ada) khusus untuk database baru pada file [`package.json`](file:///Users/achmadalyabdulloh/Project-portofolio/Duitin/danain-api/package.json):
```json
"scripts": {
  ...
  "prisma:generate:billing": "prisma generate --schema=./prisma/billing/schema.prisma",
  "prisma:migrate:billing": "prisma migrate dev --schema=./prisma/billing/schema.prisma",
  "prisma:seed:billing": "prisma db seed --schema=./prisma/billing/schema.prisma"
}
```

### Langkah 4: Buat Service NestJS untuk Database Baru
Buat file service di `src/prisma/billing/billing-prisma.service.ts` untuk mengelola koneksi database billing:
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@internal/prisma/billing';

@Injectable()
export class BillingPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Langkah 5: Daftarkan Service Baru di `PrismaModule`
Edit file [`src/prisma/prisma.module.ts`](file:///Users/achmadalyabdulloh/Project-portofolio/Duitin/danain-api/src/prisma/prisma.module.ts):
```typescript
import { Module } from '@nestjs/common';
import { DanainPrismaService } from './danain/danain-prisma.service';
import { BillingPrismaService } from './billing/billing-prisma.service'; // Import service baru

@Module({
  providers: [DanainPrismaService, BillingPrismaService],
  exports: [DanainPrismaService, BillingPrismaService], // Eksport agar modul lain bisa menggunakan
})
export class PrismaModule { }
```

Sekarang Anda bisa menyuntikkan (*inject*) `BillingPrismaService` ke service manapun untuk melakukan query ke database `billing_db`.

---

## 🗃 Database Migrations & Seeder (Opsional)

Setiap database diatur secara mandiri. Berikut adalah daftar perintah CLI yang dapat Anda jalankan.

### 1. Database Danain (Utama)
* **Generate Client Types**:
  ```bash
  npm run prisma:generate:danain
  ```
* **Run Database Migration** (Sinkronisasi schema ke database):
  ```bash
  npm run prisma:migrate:danain
  ```
* **Run Database Seeder (Opsional)**:
  Seeder digunakan untuk mengisi data awal ke database (seperti akun administrator default `admin@danain.com` dengan password `admin123`). Menjalankan seeder ini bersifat **opsional**.
  ```bash
  npm run prisma:seed:danain
  ```

### 2. Database Billing (Jika ditambahkan)
* **Generate Client Types**:
  ```bash
  npm run prisma:generate:billing
  ```
* **Run Database Migration**:
  ```bash
  npm run prisma:migrate:billing
  ```

---

## 🚀 Menjalankan Aplikasi

Setelah setup database selesai (generate client & migrate), Anda dapat menjalankan server NestJS:

```bash
# Mode development dengan hot reload (watch mode)
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

### Akses API & Dokumentasi Swagger:
Setelah aplikasi berjalan di port `3000` (atau sesuai konfigurasi `.env`), Anda dapat mengakses dokumentasi API interaktif pada URL berikut:
- **Swagger OpenAPI Docs**: [http://localhost:3000/api/docs] (http://localhost:3000/api/docs)
