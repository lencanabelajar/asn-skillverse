## 🚀 Cara Kerja (Mode Demo di GitHub Pages)

1. **Daftar Pelatihan** ditampilkan dari `data/training.json`.  
2. **Materi Pelatihan** dibaca langsung dari `/trainings/[id]/materi.md`.  
3. Setelah user menyelesaikan pelatihan:
   - **Badge** ditambahkan ke `localStorage`.
   - Data hasil disimulasikan di `data/badges.json`.
   - Ledger log baru dibuat di `ledger-log.json` (simulasi transparansi).  
4. Semua berjalan 100% di browser — tidak ada backend aktif di tahap ini.

---

## 🧩 Tahapan Pengembangan

| Tahap | Fokus | Status |
|-------|--------|--------|
| 1 | Struktur GitHub Pages & data statis | ✅ Selesai |
| 2 | Simulasi ledger & badge lokal | ⚙️ Dalam pengembangan |
| 3 | Aktivasi backend (Express + SQLite) | 🔜 Berikutnya |
| 4 | Integrasi IPFS untuk metadata badge | 🔜 |
| 5 | Ekspansi NFT (ERC-721) di jaringan uji | 🔜 |

---

## 🔐 Transparansi dan Keamanan
- Ledger transparansi menggunakan hash chaining sederhana.  
- Semua data pelatihan dapat diverifikasi publik melalui repositori ini.  
- Integrasi IPFS disiapkan agar data tidak tergantung pihak ketiga dan tetap terdesentralisasi.  

---

## ⚙️ Teknologi
- **Frontend:** HTML, CSS, JavaScript vanilla  
- **Database (nanti):** SQLite  
- **Desentralisasi:** IPFS  
- **Blockchain Ready:** ERC-721 (NFT Badge), ERC-20 (Point System)  
- **Hosting:** GitHub Pages  

---

## 🧑‍💻 Kontribusi
1. Fork repositori ini  
2. Tambahkan modul pelatihan baru di folder `/trainings/`  
3. Tambahkan entri di `data/training.json`  
4. Ajukan *pull request* untuk review  

---

## 🌱 Lisensi
Proyek ini bersifat **terbuka dan edukatif**.  
Konten pelatihan dapat diadaptasi sesuai kebutuhan pelatihan ASN daerah atau instansi masing-masing.

---

**Dikembangkan oleh:** Hariyanto sebagai developer, Lukas Herianto sebagai partner pemrograman dan Robby Kurniawan J sebagai asisten UX  
📍 Inisiatif terbuka untuk inovasi ASN berbasis teknologi.

