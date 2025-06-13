Dokumentasi command **(query dan mutation)** dari masing-masing service di sistem **Alpha Library System**:

---

## 📘 **User Service**

### 1. Melihat Semua Anggota

```graphql
query {
  members {
    id
    name
    phone_number
  }
}
```

### 2. Registrasi Anggota Baru

```graphql
mutation {
  registerMember(
    name: "Nama"
    phone: "081234567891"
  ) {
    id
    name
    phone_number
  }
}
```

### 3. Melihat Detail Anggota

```graphql
query {
  member(id: 1) {
    id
    name
    phone_number
  }
}
```

### 4. Melihat Riwayat Peminjaman Anggota

```graphql
query {
  member(id: 1) {
    id
    name
    borrowings {
      id
      book_id
      tanggal_peminjaman
      status
    }
  }
}
```

### 5. Mengubah Data Anggota

```graphql
mutation {
  updateMember(
    id: 1,
    name: "Nama Baru",
    phone: "08123456789"
  ) {
    id
    name
    phone_number
  }
}
```

---

## 📚 **Book Service**

### 1. Melihat Semua Buku

```graphql
query {
  books {
    id
    title
    author
    year
    jumlah
  }
}
```

### 2. Melihat Detail Buku

```graphql
query {
  book(id: 1) {
    id
    title
    author
    year
    jumlah
  }
}
```

### 3. Menambahkan Buku Baru

```graphql
mutation {
  createBook(
    title: "Buku Baru"
    author: "Penulis"
    year: 2024
    jumlah: 5
  ) {
    id
    title
    author
    year
    jumlah
  }
}
```

---

## 📦 **Borrowing Service**

### 1. Melihat Semua Peminjaman

```graphql
query {
  borrowings {
    id
    member_id
    book_id
    tanggal_peminjaman
    tanggal_jatuh_tempo
    tanggal_pengembalian
    status
    denda
  }
}
```

### 2. Meminjam Buku

```graphql
mutation {
  borrowBook(
    memberId: 1
    bookId: 2
    tanggal_peminjaman: "2024-06-11"
  ) {
    id
    member_id
    book_id
    tanggal_peminjaman
    tanggal_jatuh_tempo
    status
    denda
  }
}
```

### 3. Mengembalikan Buku

```graphql
mutation {
  returnBook(
    loanId: 1
  ) {
    id
    member_id
    book_id
    tanggal_peminjaman
    tanggal_jatuh_tempo
    tanggal_pengembalian
    status
    denda
  }
}
```

### 4. Melihat Top 5 Buku yang Paling Banyak Dipinjam

```graphql
query {
  topBorrowedBooks {
    book_id
    total_peminjaman
  }
}
```

---

## ⭐ **Review Service**

### 1. Melihat Semua Review

```graphql
query {
  reviews {
    id
    member_id
    book_id
    rating
    comment
  }
}
```

### 2. Menambahkan Review Baru

```graphql
mutation {
  addReview(
    memberId: 1,
    bookId: 2,
    rating: 5,
    comment: "Buku ini sangat menarik!"
  ) {
    id
    member_id
    book_id
    rating
    comment
  }
}

# 🏛️ Library Microservices System

This project is a **GraphQL-based Library Management System** that is built using microservice architecture. It consists of the following services:

* `user_service` ([http://localhost:5000](http://localhost:5000))
* `book_service` ([http://127.0.0.1:5001](http://127.0.0.1:5001))
* `borrowing_service` ([http://localhost:5002](http://localhost:5002))
* `review_service` ([http://localhost:5003](http://localhost:5003))
* `payment_service` ([http://localhost:9210](http://localhost:9210))

---

## 📚 Deskripsi Masing-Masing Service

1. User Service

Melayani proses manajemen pengguna, termasuk pendaftaran anggota perpustakaan dan manajemen informasi dasar pengguna.

2. Book Service

Mengelola data buku seperti judul, penulis, tahun terbit, dan jumlah buku yang tersedia di perpustakaan.

3. Borrowing Service

Melayani proses peminjaman dan pengembalian buku, serta menghitung denda jika pengembalian terlambat.

4. Review Service

Melayani fitur ulasan dari pengguna terhadap buku-buku yang telah mereka baca.

5. Payment Service

Menyediakan layanan simulasi pembayaran untuk denda peminjaman buku.

---

⚙️ Teknologi yang Digunakan

| Komponen          | Teknologi         |
| ----------------- | ----------------- |
| Backend Framework | Flask             |
| API               | GraphQL (Ariadne) |
| Database          | SQLite            |
| Frontend          | HTML              |
| API Client        | Postman           |

---

🔗 GraphQL Commands & Mutations

✉️ User Service

**All Members**

```graphql
query {
  members {
    id
    name
    phone_number
  }
}
```

* **Register Member**

```graphql
mutation {
  registerMember(name: "Nama", phone: "081234567891") {
    id
    name
    phone_number
  }
}
```

* **Detail Member**

```graphql
query {
  member(id: 1) {
    id
    name
    phone_number
  }
}
```

* **View Borrowing History**

```graphql
query {
  member(id: 1) {
    id
    name
    borrowings {
      id
      book_id
      tanggal_peminjaman
      status
    }
  }
}
```

* **Update Member**

```graphql
mutation {
  updateMember(id: 1, name: "Nama Baru", phone: "08123456789") {
    id
    name
    phone_number
  }
}
```

### 📚 Book Service

* **All Books**

```graphql
query {
  books {
    id
    title
    author
    year
    jumlah
  }
}
```

* **Detail Book**

```graphql
query {
  book(id: 1) {
    id
    title
    author
    year
    jumlah
  }
}
```

* **Create Book**

```graphql
mutation {
  createBook(title: "Buku Baru", author: "Penulis", year: 2024, jumlah: 5) {
    id
    title
    author
    year
    jumlah
  }
}
```

### 📅 Borrowing Service

* **All Borrowings**

```graphql
query {
  borrowings {
    id
    member_id
    book_id
    tanggal_peminjaman
    tanggal_jatuh_tempo
    tanggal_pengembalian
    status
    denda
  }
}
```

* **Borrow Book**

```graphql
mutation {
  borrowBook(memberId: 1, bookId: 2, tanggal_peminjaman: "2024-06-11") {
    id
    member_id
    book_id
    tanggal_peminjaman
    tanggal_jatuh_tempo
    status
    denda
  }
}
```

* **Return Book**

```graphql
mutation {
  returnBook(loanId: 1) {
    id
    member_id
    book_id
    tanggal_peminjaman
    tanggal_jatuh_tempo
    tanggal_pengembalian
    status
    denda
  }
}
```

* **Top 5 Borrowed Books**

```graphql
query {
  topBorrowedBooks {
    book_id
    total_peminjaman
  }
}
```

### 🔍 Review Service

* **All Reviews**

```graphql
query {
  reviews {
    id
    member_id
    book_id
    rating
    comment
  }
}
```

* **Add Review**

```graphql
mutation {
  addReview(memberId: 1, bookId: 2, rating: 5, comment: "Buku ini sangat menarik!") {
    id
    member_id
    book_id
    rating
    comment
  }
}
```

---

## 📊 Contoh Response GraphQL

**Lihat semua member:**

```json
{
  "data": {
    "members": [
      { "id": "2", "name": "Hafizhah Farah Fadhia", "phone_number": "085324145954" },
      { "id": "3", "name": "Putri", "phone_number": "085214569874" },
      { "id": "4", "name": "Raja", "phone_number": "085214569875" },
      { "id": "5", "name": "Elsa Tria", "phone_number": "081278945612" },
      { "id": "6", "name": "Ceria Indah", "phone_number": "081278945613" },
      { "id": "7", "name": "Dhimas Faza", "phone_number": "081278945614" }
    ]
  }
}
```

**Register Member:**

```json
{
  "data": {
    "registerMember": {
      "id": "8",
      "name": "Nama",
      "phone_number": "081234567891"
    }
  }
}
```

**View Borrowing History:**

```json
{
  "data": {
    "member": {
      "id": "1",
      "name": "John Doe",
      "borrowings": [
        {
          "id": "1",
          "book_id": 2,
          "tanggal_peminjaman": "2024-06-11",
          "status": "dikembalikan"
        }
      ]
    }
  }
}
```

**Top 5 Borrowed Books:**

```json
{
  "data": {
    "topBorrowedBooks": [
      { "book_id": 2, "total_peminjaman": 2 }
    ]
  }
}
```

Dan banyak lagi response lainnya yang bisa kamu tambahkan sesuai kebutuhan.

---

## 🚀 Cara Menjalankan

Pastikan semua service dijalankan secara paralel. Kamu dapat menggunakan tool seperti `foreman`, `tmux`, atau `docker-compose` untuk mengatur manajemen service.

---

## 💾 Postman Collection

Gunakan file berikut untuk mengimpor ke Postman:
**[library-microservices-postman.json](./library-microservices-postman.json)**


