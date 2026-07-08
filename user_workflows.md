# Luồng Sử dụng Hệ thống Theo Vai trò (User Workflows)

Tài liệu này hướng dẫn chi tiết cách từng công việc, nhân sự hoặc người bệnh (Role) sẽ tương tác với hệ thống Mini EMR trong thực tế, cùng với các chuỗi API cụ thể để hiện thực hóa luồng công việc đó.

---

## 1. Bệnh nhân (PATIENT)
**Mục tiêu:** Tự đăng ký tài khoản, theo dõi hồ sơ cá nhân, lịch sử khám bệnh và đơn thuốc.

- **Bước 1: Tạo và Xác thực tài khoản**
  - Bệnh nhân đăng ký: `POST /api/auth/register`
  - Bệnh nhân nhận Email và xác thực: `POST /api/auth/verify-email`
- **Bước 2: Đăng nhập hàng ngày**
  - Gọi `POST /api/auth/login` bằng email và mật khẩu.
  - Cài đặt xác thực MFA nếu muốn bảo mật thêm thông qua `POST /api/auth/mfa/setup`.
- **Bước 3: Xem và cập nhật hồ sơ**
  - Tự cập nhật địa chỉ / số điện thoại liên lạc mới: `PUT /api/patients/me`
  - Lấy thông tin cá nhân: `GET /api/patients/me` 
- **Bước 4: Tra cứu sau khi khám**
  - Tra cứu các đợt khám: `GET /api/records/patient/{patientId}`
  - Trích xuất file kết luận bệnh án: `GET /api/records/{id}/pdf`
  - Lấy đơn thuốc để đi mua: `GET /prescriptions/{id}`

---

## 2. Tiết tân / Nhân viên hành chính (RECEPTIONIST)
**Mục tiêu:** Quản lý cơ sở dữ liệu đầu vào, tiếp nhận bệnh nhân tại quầy.

- **Bước 1: Tiếp nhận và định danh người bệnh**
  - Khi bệnh nhân mới đến, tiếp tân tìm kiếm hồ sơ xem đã có chưa: `GET /api/patients/search?q={phone_number_or_CCCD}`
  - Nếu chưa có, tiếp tân tạo hồ sơ cứng mới: `POST /api/patients`
- **Bước 2: Cập nhật thông tin nhanh**
  - Bệnh nhân báo thay đổi địa chỉ khẩn cấp, tiếp tân sửa lại: `PUT /api/patients/{id}`

---

## 3. Điều dưỡng (NURSE)
**Mục tiêu:** Đo lường các thông số sinh hiệu định kỳ và chăm sóc y lệnh.

- **Bước 1: Kiểm tra danh sách bệnh nhân cần đo sinh hiệu**
  - Tìm kiếm người bệnh theo khu vực / giường bệnh: `GET /api/patients`
- **Bước 2: Đo lường và cập nhật Sinh hiệu định kỳ**
  - Ghi nhận huyết áp, mạch, nhiệt độ: `POST /api/vital-signs`
  - Nếu ghi sai số, tiến hành cập nhật lại: `PUT /api/vital-signs/{id}`
  - Đánh giá xu hướng đo liên tục của bệnh nhân: `GET /api/vital-signs/chart/{patientId}` để quyết định có báo bác sĩ trực hay không.
- **Bước 3: Tình huống Cấp cứu (Break Glass)**
  - Nếu bệnh nhân nguy kịch, điều dưỡng cần tài liệu quá khứ khẩn cấp nhưng chưa được bác sĩ ủy quyền: Yêu cầu mở khóa `POST /api/break-glass`.

---

## 4. Bác sĩ (DOCTOR)
**Mục tiêu:** Chẩn đoán, lập hồ sơ khám, kê đơn thuốc và theo dõi diễn biến dài hạn.

- **Bước 1: Đăng nhập an toàn cao**
  - Đăng nhập `POST /api/auth/login`. Bác sĩ là vai trò nhạy cảm, thường hệ thống BẮT BUỘC nhận cấu hình OTP. Phải tiến hành verify qua `POST /api/auth/mfa/verify`.
- **Bước 2: Trực tiếp khám bệnh**
  - Tìm kiếm hồ sơ lịch sử từ các Khoa khác: `GET /api/records/patient/{patientId}`.
  - Sau khi kết luận, tạo Bệnh án mới: `POST /api/records`. (Ghi nhận `symptoms`, `diagnosis`, `conclusion`).
- **Bước 3: Lập Đơn thuốc**
  - Với recordId vừa tạo, lập một hay nhiều liều thuốc cho đợt điều trị này: `POST /medical-records/{recordId}/prescriptions`.
- **Bước 4: Cập nhật Lệnh khám (Bổ sung kết quả)**
  - Xem kết quả xét nghiệm gửi về và sửa lý do chẩn đoán tại `PUT /api/records/{id}`. (Mọi bản cập nhật cũ sẽ được lưu trong bảng **medical_record_versions** phục vụ truy xuất pháp lý ở `GET /api/records/{id}/history`).
- **Bước 5: Vượt rào Truy cập (Break Glass)**
  - Bác sĩ A cần xem khẩn cấp bệnh án trước đây do Bác sĩ B khóa/quản lý để cứu người: Yêu cầu mở `POST /api/break-glass`.

---

## 5. Quản trị viên hệ thống (ADMIN)
**Mục tiêu:** Phân quyền, kiểm tra tuân thủ an toàn thông tin (ISO 27799) và quản lý vận hành lõi.

- **Bước 1: Quản lý nhân sự Y tế**
  - Tuyển nhân sự mới: `POST /api/users` tạo tài khoản.
  - Ủy nhiệm vai trò DOCTOR / NURSE cho tài khoản: `PUT /api/users/{id}/role`.
  - Nếu nhân sự nghỉ việc: `DELETE /api/users/{id}` (hoặc Khóa bằng Update).
- **Bước 2: Theo dõi Audit Log (Kiểm toán)**
  - Xem có bác sĩ nào xem lén hồ sơ của bệnh nhân ngoài quyền hạn hay không (nhật ký READ): `GET /api/audit-logs`.
  - Khai xuất báo cáo Audit mỗi quý: `GET /api/audit-logs/export`.
- **Bước 3: Phê duyệt Break Glass**
  - Xem các yêu cầu mở khóa hệ thống `GET /api/break-glass`.
  - Chấp thuận `PATCH /api/break-glass/{id}/approve` cho phép Bác sĩ/Y tá can thiệp khẩn cấp.
  - Sau khi rủi ro qua đi, ngắt lệnh khẩn cấp nếu cần thiết.
- **Bước 4: Quản lý Hệ thống Phân quyền (RBAC)**
  - Xem danh sách các quyền hạn đang có trong hệ thống: `GET /api/permissions`.
  - Tạo mới các vai trò tùy chỉnh (VD: TRUONG_KHOA) và gán quyền tương ứng: `POST /api/roles`.
  - Chỉnh sửa, cập nhật hoặc xóa vai trò khi không còn sử dụng.
- **Bước 5: Sửa sai cấu trúc cốt lõi**
  - Xóa bỏ một hồ sơ nhập sai hoàn toàn mà các vai trò khác không có quyền: `DELETE /api/patients/{id}` hoặc lệnh xóa sinh hiệu sai vĩnh viễn `DELETE /api/vital-signs/{id}`.
