# PLEA ASHES v4

Static storefront + Admin Product Management.

## Run
Open `index.html` directly in a modern browser, or serve the folder with any static server.

## Admin
Click **Admin** in the header.

Features:
- Add product
- Edit product
- Delete product
- Product search
- Product/category filters
- Stock management
- Product statistics
- JSON export/import
- Reset demo catalog
- LocalStorage persistence
- Storefront/cart synchronized with admin data

This is a front-end demo. Authentication, database, payment gateway, and server-side authorization are not included.


## Upload Foto Langsung dari Komputer/HP

Versi ini mendukung pemilihan foto langsung dari perangkat melalui kolom upload foto di Admin Product Management.

- Format: JPG, PNG, WEBP, dan format gambar lain yang didukung browser.
- Batas ukuran: 3 MB per foto.
- Foto dikonversi menjadi data lokal dan disimpan bersama data produk di browser.
- Tidak perlu memasukkan URL foto untuk penggunaan lokal.
- Karena masih menggunakan LocalStorage, foto dan perubahan produk hanya tersimpan di browser/perangkat yang digunakan. Jika browser dihapus datanya atau dibuka di perangkat lain, data tidak otomatis ikut.
