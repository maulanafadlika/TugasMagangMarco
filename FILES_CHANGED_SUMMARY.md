RINGKASAN FILE YANG DIUBAH - TASK INTERNSHIP

Tanggal: 7 April 2026
Task: Implementasi Project Manager Field di Backend

---

FILE YANG DIUBAH (BACKEND):

1. src/models/project/index.js
   - Tambah field pm_id dan pm_name di SELECT clause
   - Tambah LEFT JOIN users untuk PM
   - Tambah pm_id parameter di method create() dan update()

2. src/models/user/index.js
   - Tambah method findAllPM() untuk query users dengan group_id LIKE '%PM'

3. src/services/project/index.js
   - Update provideStore() untuk handle pm_id
   - Tambah validasi pm_id tidak boleh kosong (double-check)
   - Hapus fallback otomatis ke created_by
   - Update provideUpdate() dengan pm_id logic

4. src/services/user/index.js
   - Tambah method provideGetAllPM() untuk return formatted PM list

5. src/modules/project/index.js
   - Route handler project store/update/delete (bagian dari implementation)

6. src/modules/user/index.js
   - Tambah handler getAllPM() untuk endpoint /api/v1/users/pm

7. src/router/project/index.js
   - Route POST /api/v1/projects/store dengan middleware validator

8. src/router/user/index.js
   - Tambah route GET /api/v1/users/pm untuk dropdown Project Manager

9. src/utils/validator/project/index.js
   - Perubahan PENTING: pm_id sekarang .required() pada create project
   - Tambah .trim() untuk validasi yang lebih ketat
   - Error messages ditambah untuk guidance yang lebih baik

---

FILE REPORT/DOKUMENTASI:

1. Laporan_Harian_Magang_PM.docx
2. Laporan_Harian_Magang_PM_v2.docx
3. Laporan_Harian_Magang_PM_Lengkap.docx
4. Laporan_Harian_Magang_PM_Lengkap.md
5. Laporan_Harian_Magang_PM_Lengkap.txt
6. CHANGES_PROJECT_MANAGER_REQUIRED.md - Dokumentasi perubahan detail kode

---

FILE YANG BELUM DIUBAH (MASIH PENDING):

- Frontend (React/Vue) - Belum ada perubahan untuk UI
  * Perlu tambah PM dropdown di form Add/Edit Project
  * Perlu tambah PM column di Project List table
  * Perlu connect ke endpoint /api/v1/users/pm untuk dropdown data

- Database Migration
  * Belum execute SQL untuk ALTER TABLE public.pm_project ADD COLUMN pm_id
  * SQL yang diperlukan bisa dilihat di Laporan/CHANGES document

---

ENDPOINTS YANG DIBUAT:

GET /api/v1/users/pm
  - Untuk ambil daftar Project Manager sebagai dropdown option
  - Response: Array of {id, name}

POST /api/v1/projects/store
  - Field pm_id sekarang REQUIRED
  - Tidak bisa dilewat atau kosong

PUT /api/v1/projects/:id/edit
  - Field pm_id optional (bisa keep existing atau update)

---

TOTAL PERUBAHAN:
- 9 file backend Java/Node.js dimodifikasi
- 5 file laporan/report dibuat
- 1 file dokumentasi detail dibuat
- 1 endpoint baru (GET /api/v1/users/pm)
- 2 endpoint existing diupdate (POST store, PUT edit)
