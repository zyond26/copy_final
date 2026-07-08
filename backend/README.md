# Backend API - ISO 27799 Final Project

Dự án Backend xây dựng bằng **Node.js, Express, Prisma ORM và PostgreSQL**.

---

## 🚀 Hướng dẫn khởi chạy dự án

**Bước 1: Mở thư mục backend**
Mở Terminal (hoặc CMD) tại thư mục gốc của dự án và chạy lệnh:
```bash
cd backend
```

**Bước 2: Cài đặt thư viện**
```bash
npm install
```

**Bước 3: Chạy Server**
```bash
npm start
```

🎉 **Xong!** Server sẽ khởi chạy. Bạn có thể xem tài liệu toàn bộ API (Swagger) tại:
👉 **http://localhost:3000/api-docs**

---

## 🛠 Hướng dẫn cập nhật Database (Prisma)

Mọi cấu trúc Database nằm ở file `prisma/schema.prisma`. Khi có thay đổi về Database, hãy đảm bảo bạn đang ở trong thư mục `backend` và chạy 1 trong 2 lệnh sau:

- **TH1: Nếu bạn thao tác sửa/tạo bảng trực tiếp trên trang chủ NeonDB:**
  (Lệnh này giúp đồng bộ cấu trúc mới nhất từ web về file code)
  ```bash
  npx prisma db pull
  npx prisma generate
  ```

- **TH2: Nếu bạn chủ động viết code sửa/thêm bảng vào file `schema.prisma`:**
  (Lệnh này giúp đẩy thiết kế bảng từ code lên web)
  ```bash
  npx prisma db push
  ```
