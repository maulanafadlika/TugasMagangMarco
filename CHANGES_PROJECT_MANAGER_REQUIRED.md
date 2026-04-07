**PERUBAHAN: Project Manager Wajib Diisi Saat Add Project**

Implementasi validasi sehingga user tidak bisa menambahkan project tanpa mengisi Project Manager.

---

***FILE 1: src/utils/validator/project/index.js (Baris 34-37)***

Lama:
```javascript
pm_id: Joi.string().allow(null, "").messages({
  "string.base": "pm_id value must be a string",
}),
```

Baru:
```javascript
pm_id: Joi.string().trim().required().messages({
  "string.base": "pm_id value must be a string",
  "any.required": "pm_id field is required",
  "string.empty": "pm_id field value cannot be empty",
}),
```

Perubahan: Menambah `.trim().required()` agar pm_id wajib diisi dan tidak boleh kosong.

---

***FILE 2: src/services/project/index.js (Baris 38-57)***

Lama:
```javascript
pm_id: bodyRequest.pm_id ?? bodyRequest.created_by
```

Baru:
```javascript
if (!bodyRequest.pm_id || String(bodyRequest.pm_id).trim() === "") {
  throw new CustomError("pm_id field is required", 400);
}
pm_id: bodyRequest.pm_id
```

Perubahan: Menambah validasi di service layer dan menghapus fallback otomatis ke created_by.

---

***ALUR VALIDASI***

Request → Joi Validator (required) → Service Layer (double-check) → Database

Jika pm_id kosong di mana saja → Error 400 "pm_id field is required"

---

***CONTOH RESPONSE***

❌ Error (tanpa pm_id):
```json
{ "status": false, "errors": ["pm_id field is required"] }
```

✅ Success (dengan pm_id):
```json
{ "status": true, "message": "success create new data" }
```
