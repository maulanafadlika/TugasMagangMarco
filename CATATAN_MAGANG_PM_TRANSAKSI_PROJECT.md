Catatan Magang Frontend
Tanggal: 2026-04-06
Topik: Penambahan Project Manager pada transaksi Project dan penambahan menu baru di bawah menu Project

Ringkasan pekerjaan
1. Menambahkan field Project Manager pada form Add/Edit transaksi Project.
2. Mengambil data dropdown Project Manager dari endpoint API users PM.
3. Mengirim pm_id saat submit create/edit transaksi Project.
4. Menampilkan data Project Manager di tabel Project List.
5. Menambahkan menu baru Project Manager di bawah parent menu Project pada sidebar.
6. Menambahkan route khusus project-manager agar menu baru dapat dibuka.

Catatan coding lama dan coding baru

A. File: src/pages/dashboard/projects.jsx

A1. Struktur kolom tabel transaksi
- Coding lama:
  Tidak ada kolom Project Manager pada TABLE_HEAD.
- Coding baru:
  Menambahkan kolom Project Manager pada TABLE_HEAD.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:11

A2. State form transaksi
- Coding lama:
  formData belum memiliki properti pm_id.
- Coding baru:
  formData ditambah properti pm_id untuk menampung pilihan PM.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:19

A3. Inisialisasi data halaman
- Coding lama:
  useEffect awal belum memanggil fetch data PM.
- Coding baru:
  Menambahkan pemanggilan fetchPmUsers() saat halaman dimuat.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:48

A4. Sumber dropdown Project Manager
- Coding lama:
  Belum ada fungsi fetch khusus untuk endpoint PM.
- Coding baru:
  Menambahkan fungsi fetchPmUsers() dengan endpoint /api/v1/users/pm.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:116
  src/pages/dashboard/projects.jsx:118

A5. Payload submit transaksi
- Coding lama:
  pm_id belum masuk payload create/edit.
- Coding baru:
  pm_id ikut dibawa dalam data form saat submit.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:230

A6. Reset form setelah submit/add
- Coding lama:
  reset form tidak memasukkan pm_id.
- Coding baru:
  reset form sudah menyertakan pm_id kosong agar state konsisten.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:283
  src/pages/dashboard/projects.jsx:307

A7. Pengisian data saat edit
- Coding lama:
  edit form belum memetakan pm_id dengan aman dari variasi response backend.
- Coding baru:
  menambahkan resolver getPmIdValue(project) agar pm_id bisa dibaca dari beberapa format field backend.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:339
  src/pages/dashboard/projects.jsx:409

A8. Resolver nama PM untuk list
- Coding lama:
  tampilan nama PM bergantung pada satu nama field saja.
- Coding baru:
  menambahkan getPmNameFromRow(row) agar nama PM bisa dibaca dari beberapa kemungkinan key backend, termasuk fallback dari pm_id.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:427
  src/pages/dashboard/projects.jsx:567

A9. Search dan sorting kolom PM
- Coding lama:
  search dan sorting belum mempertimbangkan resolver PM.
- Coding baru:
  search memasukkan hasil nama PM ter-resolve, sorting juga membaca nama PM dari resolver.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:447
  src/pages/dashboard/projects.jsx:456
  src/pages/dashboard/projects.jsx:457

A10. Field Project Manager di form Add/Edit
- Coding lama:
  field dropdown Project Manager belum ada.
- Coding baru:
  menambahkan MaterialSelect Project Manager di bawah Status Info, terikat ke formData.pm_id.
- Letak coding baru:
  src/pages/dashboard/projects.jsx:900
  src/pages/dashboard/projects.jsx:901
  src/pages/dashboard/projects.jsx:902
  src/pages/dashboard/projects.jsx:903

B. File: src/layouts/dashboard.jsx

B1. Penambahan halaman tujuan menu baru
- Coding lama:
  componentList belum memiliki key project-manager.
- Coding baru:
  componentList ditambah key project-manager mengarah ke komponen ProjectManager.
- Letak coding baru:
  src/layouts/dashboard.jsx:46

B2. Penambahan icon khusus menu baru
- Coding lama:
  iconList belum memiliki key project-manager.
- Coding baru:
  iconList ditambah key project-manager dengan icon berbeda.
- Letak coding baru:
  src/layouts/dashboard.jsx:77

B3. Inject submenu Project Manager di bawah parent Project
- Coding lama:
  child menu Project bergantung murni dari cookie/menu backend, belum ada fallback inject frontend.
- Coding baru:
  jika parent menu adalah project dan child project-manager belum ada, frontend akan menambahkan submenu Project Manager secara otomatis.
- Letak coding baru:
  src/layouts/dashboard.jsx:178
  src/layouts/dashboard.jsx:179
  src/layouts/dashboard.jsx:182
  src/layouts/dashboard.jsx:183

B4. Import komponen halaman ProjectManager
- Coding lama:
  belum ada import komponen ini.
- Coding baru:
  menambahkan import ProjectManager dari file halaman baru.
- Letak coding baru:
  src/layouts/dashboard.jsx:36

C. File baru: src/pages/dashboard/project-manager.jsx

C1. Halaman khusus menu Project Manager
- Coding lama:
  file ini belum ada.
- Coding baru:
  membuat komponen ProjectManager sebagai halaman khusus, sementara ini me-render komponen Projects agar fungsional langsung.
- Letak coding baru:
  src/pages/dashboard/project-manager.jsx:2
  src/pages/dashboard/project-manager.jsx:4
  src/pages/dashboard/project-manager.jsx:5
  src/pages/dashboard/project-manager.jsx:8
  src/pages/dashboard/project-manager.jsx:10

D. File: src/pages/dashboard/index.js

D1. Export halaman baru
- Coding lama:
  belum mengekspor halaman project-manager.
- Coding baru:
  menambahkan export untuk project-manager.
- Letak coding baru:
  src/pages/dashboard/index.js:8

Hasil akhir implementasi
1. Field Project Manager pada transaksi Project sudah tersedia di form Add/Edit dan tetap berada di bawah Status Info.
2. Data PM pada transaksi dapat disimpan melalui pm_id.
3. Data PM dapat ditampilkan pada tabel transaksi Project List.
4. Menu baru Project Manager sudah muncul sebagai submenu di bawah parent menu Project.
5. Menu baru Project Manager sudah memiliki route dan halaman khusus.

Catatan validasi
1. Build frontend berhasil tanpa error setelah seluruh perubahan.