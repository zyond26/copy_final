# Mini EMR API Documentation

Tài liệu này hệ thống hóa toàn bộ các Endpoints (API) hiện đang được triển khai thực tế trong mã nguồn của nền tảng Backend Mini EMR.

### Cấu trúc Xác thực (Authentication & Authorization)
Hầu hết các API yêu cầu xác thực thông qua JWT Bearer Token. 
- Middleware xác thực: `authenticate`
- Middleware phân quyền: `authorize('ROLE1', 'ROLE2',...)`

---

## 1. Authentication (Xác thực & MFA)
**Base Path:** `/api/auth`

| Method | Endpoint | Yêu cầu quyền | Chức năng |
|--------|----------|---------------|-----------|
| `POST` | `/register` | Public | Đăng ký tài khoản (Bệnh nhân) |
| `POST` | `/verify-email` | Public | Xác thực Email đăng ký |
| `POST` | `/login` | Public | Đăng nhập hệ thống |
| `POST` | `/mfa/verify` | Requires Auth | Xác thực mã OTP |
| `POST` | `/mfa/setup` | Requires Auth | Cài đặt MFA |
| `POST` | `/mfa/disable` | Requires Auth | Tắt MFA |
| `POST` | `/change-password` | Requires Auth | Đổi mật khẩu |

---

## 2. Users Management (Quản lý User)
**Base Path:** `/api/users`  
_Lưu ý: Toàn bộ module này đều yêu cầu đăng nhập và phân quyền `ADMIN`._

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| `GET` | `/` | Lấy danh sách toàn bộ Users |
| `GET` | `/:id` | Lấy thông tin User theo ID |
| `POST` | `/` | Tạo người dùng mới (dành cho Admin) |
| `PUT` | `/:id` | Cập nhật thông tin User |
| `DELETE` | `/:id` | Xóa User |
| `PUT` | `/:id/role` | Cấp / Sửa quyền (Role) cho User |

---

## 3. Patients (Quản lý Bệnh nhân)
**Base Path:** `/api/patients`  
_Yêu cầu Token (`authenticate`)_

| Method | Endpoint | Yêu cầu quyền | Chức năng |
|--------|----------|---------------|-----------|
| `POST` | `/` | ADMIN, RECEPTIONIST | Cập nhật hồ sơ bệnh nhân mới |
| `GET` | `/` | ADMIN, DOCTOR, NURSE, RECEPTIONIST | Lấy danh sách bệnh nhân |
| `GET` | `/search` | ADMIN, DOCTOR, NURSE, RECEPTIONIST | Tìm kiếm bệnh nhân theo tiêu chí |
| `GET` | `/:id` | ADMIN, DOCTOR, NURSE, RECEPTIONIST | Lấy chi tiết bệnh nhân theo ID |
| `PUT` | `/:id` | ADMIN, RECEPTIONIST | Cập nhật hồ sơ bệnh nhân |
| `DELETE` | `/:id` | ADMIN | Xóa bệnh nhân |
| `GET` | `/me` | PATIENT | Lấy hồ sơ cá nhân của mình |
| `PUT` | `/me` | PATIENT | Tự cập nhật hồ sơ cá nhân |

---

## 4. Medical Records (Quản lý Bệnh án)
**Base Path:** `/api/records`  
_Yêu cầu Token (`authenticate`)_

| Method | Endpoint | Yêu cầu quyền | Chức năng |
|--------|----------|---------------|-----------|
| `POST` | `/` | DOCTOR | Tạo bệnh án mới |
| `GET` | `/` | ADMIN, DOCTOR, NURSE | Lấy danh sách bệnh án |
| `GET` | `/patient/:patientId` | ADMIN, DOCTOR, NURSE, PATIENT | Lấy CÁC bệnh án của một Bệnh nhân |
| `GET` | `/:id` | ADMIN, DOCTOR, NURSE, PATIENT | Lấy CHI TIẾT bệnh án theo ID |
| `PUT` | `/:id` | DOCTOR | Cập nhật bệnh án |
| `GET` | `/:id/history` | ADMIN, DOCTOR, NURSE, PATIENT | Xem lịch sử các phiên bản sửa đổi |
| `GET` | `/:id/pdf` | ADMIN, DOCTOR, NURSE, PATIENT | In bệnh án (Xuất file PDF) |
| `DELETE` | `/:id` | ADMIN | Xóa bệnh án |

---

## 5. Prescriptions (Quản lý Đơn thuốc)
**Base Path:** `/api/` (Được route trực tiếp từ index)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| `POST` | `/medical-records/:recordId/prescriptions` | Tạo đơn thuốc theo bệnh án chỉ định |
| `GET` | `/prescriptions/:id` | Lấy thông tin đơn thuốc qua ID |
| `PUT` | `/prescriptions/:id` | Cập nhật đơn thuốc |
| `GET` | `/prescriptions/:id/print` | In đơn thuốc ra file PDF |

---

## 6. Vital Signs (Quản lý Sinh hiệu)
**Base Path:** `/api/vital-signs`  
_Yêu cầu Token (`authenticate`)_

| Method | Endpoint | Yêu cầu quyền | Chức năng |
|--------|----------|---------------|-----------|
| `POST` | `/` | NURSE | Ghi nhận đo lường sinh hiệu mới |
| `GET` | `/:id` | ADMIN, DOCTOR, NURSE, PATIENT | Lấy chi tiết lần nhập theo ID |
| `PUT` | `/:id` | NURSE, ADMIN | Cập nhật thông số |
| `DELETE` | `/:id` | ADMIN | Xóa ghi nhận |
| `GET` | `/patient/:patientId` | ADMIN, DOCTOR, NURSE, PATIENT | Lấy danh sách sinh hiệu bệnh nhân |
| `GET` | `/chart/:patientId` | ADMIN, DOCTOR, NURSE, PATIENT | Lấy dữ liệu dạng biểu đồ |
| `GET` | `/record/:recordId` | ADMIN, DOCTOR, NURSE, PATIENT | Lấy các sinh hiệu của riêng bệnh án |

---

## 7. Audit Logs (Nhật ký Hệ thống)
**Base Path:** `/api/audit-logs`  
_Yêu cầu Token (`authenticate`) & cấp quyền `ADMIN`._

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| `GET` | `/` | Xem toàn bộ nhật ký chỉnh sửa |
| `GET` | `/summary` | Thống kê số lượng / tóm tắt log |
| `GET` | `/export` | Xuất log file |

---

## 8. Break Glass (Truy cập Khẩn cấp)
**Base Path:** `/api/break-glass`  
_Yêu cầu Token (`authenticate`)_

| Method | Endpoint | Yêu cầu quyền | Chức năng |
|--------|----------|---------------|-----------|
| `POST` | `/` | DOCTOR, NURSE | Yêu cầu truy cập khẩn cấp trên hồ sơ |
| `GET` | `/` | ADMIN | Xem danh sách các yêu cầu truy cập |
| `PATCH` | `/:id/approve` | ADMIN | Phê duyệt yêu cầu khẩn cấp |
| `PATCH` | `/:id/reject` | ADMIN | Từ chối yêu cầu khẩn cấp |
| `GET` | `/access/:patientId`| Bất kỳ ai | Khởi động truy cập khẩn cấp (sau khi duyệt) |

---

## 9. Roles & Permissions (Quản lý Phân quyền)
**Base Path:** `/api/roles` và `/api/permissions`  
_Yêu cầu Token (`authenticate`) & cấp quyền `role:manage` (thường dành cho `ADMIN`)._

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| `GET` | `/api/permissions` | Lấy danh sách toàn bộ quyền hạn (permissions) có trong hệ thống |
| `GET` | `/api/roles` | Lấy danh sách tất cả các vai trò và quyền hạn của chúng |
| `POST` | `/api/roles` | Tạo một vai trò mới (cùng với danh sách permission_id) |
| `PUT` | `/api/roles/:id` | Cập nhật thông tin và quyền hạn của vai trò |
| `DELETE` | `/api/roles/:id` | Xóa vai trò (không áp dụng cho các vai trò mặc định của hệ thống) |
