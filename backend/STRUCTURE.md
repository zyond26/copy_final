# Cấu trúc thư mục Backend - Hệ thống Mini EMR

Dự án Backend được thiết kế theo kiến trúc **3 lớp (3-tier architecture)** giúp code dễ bảo trì, dễ mở rộng và tuân thủ các chuẩn mực thiết kế hiện đại.

Dưới đây là sơ đồ cấu trúc thư mục chi tiết:

```text
backend/
├── .env                         # Biến môi trường (chứa thông tin nhạy cảm: DB, Cloudinary API keys...)
├── .gitignore                   # Cấu hình các file/thư mục không đẩy lên Git
├── index.js                     # File chạy chính (Entry Point). Nhiệm vụ: mount middleware và routes.
├── package.json                 # Danh sách thư viện và các script (npm start, ...)
├── prisma/                      
│   └── schema.prisma            # File cấu hình cấu trúc cơ sở dữ liệu (ORM Prisma). Định nghĩa các bảng.
├── README.md                    # Hướng dẫn cài đặt và khởi chạy dự án
├── STRUCTURE.md                 # File bạn đang đọc, mô tả cấu trúc dự án
└── src/                         # Thư mục chứa toàn bộ mã nguồn chính của ứng dụng
    │
    ├── config/                  # Các file cấu hình hệ thống
    │   ├── cloudinary.js        # Cấu hình kết nối tới Cloudinary (để upload ảnh/file)
    │   ├── database.js          # Cấu hình Pool kết nối PostgreSQL thuần (nếu cần dùng)
    │   ├── prisma.js            # Khởi tạo Prisma Client để truy vấn database
    │   └── swagger.js           # Cấu hình Swagger UI để tạo tài liệu API tự động
    │
    ├── controllers/             # Tầng Controller (Lớp giao tiếp HTTP)
    │   └── *.controller.js      # Nhận request từ Client, gọi Service xử lý, và trả về Response.
    │
    ├── middlewares/             # Các hàm trung gian chặn giữa Request và Controller
    │   ├── errorHandler.js      # Middleware bắt và xử lý lỗi tập trung (vd: 500, 409 trùng lặp)
    │   └── validate.js          # Middleware factory dùng để kiểm tra dữ liệu đầu vào (Validation)
    │
    ├── routes/                  # Định nghĩa các đường dẫn API (Endpoints)
    │   ├── index.js             # Gom tất cả các routes lại thành một chỗ để `index.js` (gốc) sử dụng
    │   └── *.routes.js          # Định nghĩa các API theo từng chức năng (Kèm theo chú thích Swagger)
    │
    ├── services/                # Tầng Service (Lớp nghiệp vụ cốt lõi)
    │   └── *.service.js         # Chứa các logic tính toán, tương tác trực tiếp với Database qua Prisma
    │
    ├── utils/                   # Các hàm tiện ích dùng chung
    │   ├── generateCode.js      # VD: Hàm tự động sinh mã (mã bệnh nhân, mã hóa đơn...)
    │   └── response.js          # Hàm chuẩn hóa dữ liệu trả về cho Client { status, data }
    │
    └── validators/              # Chứa logic kiểm tra tính hợp lệ của dữ liệu đầu vào
        └── *.validator.js       # Kiểm tra xem API có truyền đủ và đúng định dạng dữ liệu không
```

### Luồng đi của một Request (Ví dụ chung)

1. **Client** gửi request đến một API (VD: `POST /api/resource`).
2. Request đi qua **`routes/*.routes.js`**.
3. Tại đây, request bị chặn bởi **`middlewares/validate.js`** kết hợp với **`validators/*.validator.js`** để kiểm tra tính hợp lệ của dữ liệu.
   - *Nếu lỗi:* Trả về HTTP 400 (Bad Request).
   - *Nếu đúng:* Đi tiếp.
4. Request đến **`controllers/*.controller.js`**.
5. Controller gọi **`services/*.service.js`** để thực hiện logic nghiệp vụ (gọi các hàm tiện ích trong `utils` nếu cần, lưu xuống Database bằng `config/prisma.js`).
6. Service trả kết quả về cho Controller.
7. Controller dùng hàm trong **`utils/response.js`** để đóng gói kết quả và trả về cho Client.
8. (Nếu có lỗi bất ngờ, **`middlewares/errorHandler.js`** sẽ tự động bắt và trả về HTTP 500 hoặc 409).
