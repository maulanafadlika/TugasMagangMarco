LAPORAN HARIAN MAGANG
Implementasi Fitur PM pada Transaksi Project
Tanggal: 06 April 2026

A. Ringkasan Tugas
Sesuai dokumen tugas magang, pekerjaan yang dilakukan adalah:
1. Menambahkan data PM (Project Manager) pada transaksi Project.
2. Menambahkan input PM (dropdown) untuk proses Add dan Edit Project.
3. Menyediakan sumber data dropdown PM dari tabel users dengan filter group PM.
4. Menambahkan kolom pm_id pada tabel public.pm_project.
5. Melakukan inisialisasi data lama agar pm_id terisi.

B. Perubahan Database (pgAdmin)
Lokasi perubahan: public.pm_project

1) SQL lama
- Tidak ada kolom pm_id di tabel public.pm_project.

2) SQL baru (yang dijalankan)
ALTER TABLE public.pm_project
ADD COLUMN IF NOT EXISTS pm_id character varying(30);

UPDATE public.pm_project
SET pm_id = created_by
WHERE pm_id IS NULL;

3) Verifikasi
SELECT id, created_by, pm_id
FROM public.pm_project
LIMIT 20;

4) Hasil
- Kolom pm_id berhasil ditambahkan.
- Data existing berhasil terisi (pm_id = created_by) untuk data lama.

C. Perubahan Backend (Detail Coding Lama vs Baru)

1) File: src/models/project/index.js
Bagian: method findAll()

Kode lama (inti):
- Query list project hanya menampilkan data project tanpa data PM.
- Belum ada join ke users untuk PM.

Potongan lama:
- p.status_info,
- p.fase,
- d.description AS division
- FROM pm_project p
- LEFT JOIN users u1 ON p.created_by = u1.id
- LEFT JOIN users u2 ON p.updated_by = u2.id

Kode baru (inti):
- Menambahkan field pm_id dan pm_name pada hasil list project.
- Menambahkan join users untuk mengambil nama PM.

Potongan baru:
- p.status_info,
- p.fase,
- d.description AS division,
- p.pm_id,
- upm.name AS pm_name
- FROM pm_project p
- LEFT JOIN users u1 ON p.created_by = u1.id
- LEFT JOIN users u2 ON p.updated_by = u2.id
- LEFT JOIN users upm ON p.pm_id = upm.id

Lokasi fungsi di file:
- src/models/project/index.js (findAll)

2) File: src/models/project/index.js
Bagian: method create(inputRequest)

Kode lama (inti):
- INSERT belum menyimpan pm_id.

Potongan lama:
- INSERT INTO pm_project (..., project_name, division)
- VALUES (..., $13, $14)
- values terakhir: inputRequest.project_name, inputRequest.division

Kode baru (inti):
- INSERT ditambah kolom pm_id.
- Values ditambah inputRequest.pm_id.

Potongan baru:
- INSERT INTO pm_project (..., project_name, division, pm_id)
- VALUES (..., $13, $14, $15)
- values terakhir: inputRequest.project_name, inputRequest.division, inputRequest.pm_id || null

Lokasi fungsi di file:
- src/models/project/index.js (create)

3) File: src/models/project/index.js
Bagian: method update(inputRequest)

Kode lama (inti):
- UPDATE belum mengubah pm_id.

Potongan lama:
- UPDATE pm_project SET ..., project_name = $10, division = $11 WHERE id = $1
- values terakhir: inputRequest.project_name, inputRequest.division

Kode baru (inti):
- UPDATE ditambah field pm_id.
- Values ditambah inputRequest.pm_id.

Potongan baru:
- UPDATE pm_project SET ..., project_name = $10, division = $11, pm_id = $12 WHERE id = $1
- values terakhir: inputRequest.project_name, inputRequest.division, inputRequest.pm_id || null

Lokasi fungsi di file:
- src/models/project/index.js (update)

4) File: src/services/project/index.js
Bagian: method provideStore(bodyRequest, AuthUser)

Kode lama (inti):
- Payload store belum mengirim pm_id.

Potongan lama:
- division: bodyRequest.division

Kode baru (inti):
- Payload store ditambah pm_id.
- Fallback ke created_by jika pm_id belum dipilih.

Potongan baru:
- division: bodyRequest.division,
- pm_id: bodyRequest.pm_id ?? bodyRequest.created_by

Lokasi fungsi di file:
- src/services/project/index.js (provideStore)

5) File: src/services/project/index.js
Bagian: method provideUpdate(bodyRequest, projectId, AuthUser)

Kode lama (inti):
- Payload update belum mengirim pm_id.

Potongan lama:
- division: bodyRequest.division ?? prevData.division,

Kode baru (inti):
- Payload update ditambah pm_id.
- Fallback ke data sebelumnya.

Potongan baru:
- division: bodyRequest.division ?? prevData.division,
- pm_id: bodyRequest.pm_id ?? prevData.pm_id ?? prevData.created_by,

Lokasi fungsi di file:
- src/services/project/index.js (provideUpdate)

6) File: src/utils/validator/project/index.js
Bagian: createProjectObject dan updateProjectObject

Kode lama (inti):
- Belum ada validasi untuk pm_id.

Kode baru (inti):
- Ditambahkan validasi pm_id pada create dan update.

Potongan baru:
- pm_id: Joi.string().allow(null, "")

Lokasi di file:
- src/utils/validator/project/index.js

7) File: src/models/user/index.js
Bagian: method baru findAllPM()

Kode lama:
- Belum ada method khusus untuk mengambil user PM.

Kode baru:
- async findAllPM() dengan query:
  SELECT u.id, u.name, u.group_id
  FROM users u
  WHERE u.group_id LIKE '%PM'
  ORDER BY u.name ASC;

Lokasi di file:
- src/models/user/index.js

8) File: src/services/user/index.js
Bagian: method baru provideGetAllPM()

Kode lama:
- Belum ada service list PM.

Kode baru:
- static async provideGetAllPM() memanggil User.findAllPM() dan memformat data.

Lokasi di file:
- src/services/user/index.js

9) File: src/modules/user/index.js
Bagian: method baru getAllPM(req, res, next)

Kode lama:
- Belum ada handler endpoint PM.

Kode baru:
- static async getAllPM(req, res, next) { ... }

Lokasi di file:
- src/modules/user/index.js

10) File: src/router/user/index.js
Bagian: route baru

Kode lama:
- Belum ada endpoint /api/v1/users/pm

Kode baru:
- router.get("/api/v1/users/pm", [middleware.use("auth")], UserModule.getAllPM);

Lokasi di file:
- src/router/user/index.js

D. Endpoint yang Ditambahkan
1. GET /api/v1/users/pm
   Fungsi: mengambil daftar PM untuk dropdown Add/Edit Project.

E. Hasil Implementasi
1. Database:
- public.pm_project sudah memiliki kolom pm_id.
- Data pm_id pada project existing sudah terisi.

2. Backend:
- List project sudah menyediakan pm_id dan pm_name.
- Store/update project sudah menerima dan menyimpan pm_id.
- API dropdown PM sudah tersedia.

F. Catatan Penting
1. Jika tampilan form Add/Edit/List di website belum berubah, berarti frontend juga perlu update.
2. Backend dan DB tidak otomatis mengubah tampilan UI jika komponen frontend belum ditambahkan.

G. Kesimpulan
Pekerjaan sisi backend dan database telah selesai sesuai requirement tugas magang:
- Tambah kolom PM di database.
- Tambah logic PM pada create/update/list project.
- Tambah endpoint dropdown PM.
Implementasi frontend menjadi langkah lanjutan agar field PM tampil di halaman Add/Edit dan kolom PM tampil di list.
