# CHƯƠNG 3: PHÂN TÍCH, THIẾT KẾ VÀ TRIỂN KHAI GIẢI PHÁP

## 3.1. Mở đầu chương

Chương này trình bày chi tiết quá trình phân tích yêu cầu, thiết kế hệ thống và triển khai giải pháp cho hệ thống Mini EMR. Dựa trên cơ sở lý thuyết đã trình bày tại Chương 2, chương 3 tập trung vào việc chuyển đổi các yêu cầu nghiệp vụ thành các mô hình thiết kế cụ thể, bao gồm: biểu đồ use case, thiết kế cơ sở dữ liệu, thiết kế API, kiến trúc hệ thống và triển khai các điều khiển bảo mật theo ISO 27799.

## 3.2. Phân tích yêu cầu

### 3.2.1. Yêu cầu chức năng

Hệ thống Mini EMR được xây dựng để đáp ứng các yêu cầu chức năng chính sau đây, được phân theo từng nhóm nghiệp vụ:

#### a) Quản lý bệnh nhân

| Mã | Yêu cầu | Mô tả |
|----|---------|-------|
| BP-01 | Thêm bệnh nhân mới | Lễ tân/Admin nhập thông tin hành chính của bệnh nhân (họ tên, ngày sinh, giới tính, địa chỉ, số điện thoại) |
| BP-02 | Xem danh sách bệnh nhân | Người dùng có quyền xem danh sách bệnh nhân theo phân quyền |
| BP-03 | Cập nhật thông tin bệnh nhân | Cập nhật thông tin hành chính khi có thay đổi |
| BP-04 | Tìm kiếm bệnh nhân | Tìm kiếm theo tên, số điện thoại, mã bệnh nhân |
| BP-05 | Xóa bệnh nhân | Admin có thể xóa (hoặc vô hiệu hóa) bệnh nhân |
| BP-06 | Xem và cập nhật hồ sơ cá nhân | Bệnh nhân xem và cập nhật các thông tin y tế hành chính của chính mình |
| BP-07 | Gộp hồ sơ trùng lặp | Hệ thống tự động quét (qua CCCD hoặc Tên+Ngày sinh+SĐT), gộp dữ liệu sang hồ sơ gốc và xóa hồ sơ phụ liệu |

#### b) Quản lý bệnh án

| Mã | Yêu cầu | Mô tả |
|----|---------|-------|
| BA-01 | Tạo bệnh án | Bác sĩ tạo bệ án mới cho bệnh nhân, ghi nhận triệu chứng, chẩn đoán |
| BA-02 | Xem bệnh án | Bác sĩ/Điều dưỡng/Bệnh nhân xem bệnh án theo phân quyền |
| BA-03 | Cập nhật bệnh án | Bác sĩ cập nhật nội dung bệnh án sau mỗi lần khám |
| BA-04 | Xem lịch sử bệnh án | Xem các phiên bản cũ của bệnh án (audit trail) |
| BA-05 | In bệnh án | Xuất bệnh án ra PDF để in hoặc lưu trữ |

#### c) Quản lý đơn thuốc

| Mã | Yêu cầu | Mô tả |
|----|---------|-------|
| DT-01 | Kê đơn thuốc | Bác sĩ thêm các thuốc vào đơn, ghi rõ liều lượng, cách dùng, số ngày |
| DT-02 | Xem đơn thuốc | Bệnh nhân xem đơn thuốc của mình |
| DT-03 | Cập nhật đơn thuốc | Bác sĩ sửa đơn thuốc nếu cần |
| DT-04 | In đơn thuốc | Xuất đơn thuốc ra PDF |

#### d) Quản lý sinh hiệu

| Mã | Yêu cầu | Mô tả |
|----|---------|-------|
| SH-01 | Ghi nhận sinh hiệu | Điều dưỡng ghi nhiệt độ, huyết áp, nhịp tim, nhịp thở, SpO2 |
| SH-02 | Xem biểu đồ sinh hiệu | Hiển thị biểu đồ xu hướng sinh hiệu theo thời gian |
| SH-03 | Cảnh báo bất thường | Tự động cảnh báo khi sinh hiệu vượt ngưỡng cho phép |

#### e) Quản lý người dùng và phân quyền

| Mã | Yêu cầu | Mô tả |
|----|---------|-------|
| ND-01 | Đăng ký tài khoản | Admin tạo tài khoản cho nhân viên y tế; Bệnh nhân đăng ký và xác thực qua email |
| ND-02 | Đăng nhập | Xác thực bằng mật khẩu + MFA (OTP) |
| ND-03 | Phân quyền | Gán vai trò (bác sĩ, điều dưỡng, lễ tân, bệnh nhân, admin) |
| ND-04 | Đổi mật khẩu | Người dùng tự đổi mật khẩu; bắt buộc đổi khi quá 3 tháng chưa thay đổi |
| ND-05 | Quên mật khẩu | Khôi phục mật khẩu qua email |
| ND-06 | Quản lý vai trò (Role) | Admin có thể tạo mới, cập nhật, hoặc xóa các vai trò và cấu hình quyền hạn cho hệ thống |

#### f) Ghi nhật ký hệ thống (Audit Log)

| Mã | Yêu cầu | Mô tả |
|----|---------|-------|
| AL-01 | Ghi log tự động | Mọi thao tác CREATE, READ, UPDATE, DELETE đều được ghi lại |
| AL-02 | Xem lịch sử truy cập | Admin xem ai đã truy cập bệnh án nào, khi nào |
| AL-03 | Báo cáo log | Xuất báo cáo log theo khoảng thời gian |

### 3.2.2. Yêu cầu phi chức năng

#### a) Yêu cầu bảo mật (theo ISO 27799)

| Mã | Yêu cầu | Mức độ |
|----|---------|--------|
| BM-01 | Mã hóa dữ liệu nhạy cảm | Bắt buộc |
| BM-02 | Phân quyền truy cập RBAC | Bắt buộc |
| BM-03 | Xác thực đa yếu tố (MFA) | Bắt buộc |
| BM-04 | Ghi nhật ký hệ thống (Audit Log) | Bắt buộc |
| BM-05 | Hiển thị mã bệnh nhân trên mọi output | Bắt buộc |
| BM-06 | Cơ chế Break Glass (truy cập khẩn cấp) | Khuyến nghị |
| BM-07 | Tự động đăng xuất sau 15 phút không hoạt động | Bắt buộc |
| BM-08 | Đổi mật khẩu định kỳ (tối đa 3 tháng/lần) | Bắt buộc |

#### b) Yêu cầu hiệu năng

| Mã | Yêu cầu | Chỉ tiêu |
|----|---------|----------|
| HP-01 | Thời gian tải trang | ≤ 2 giây |
| HP-02 | Thời gian phản hồi API | ≤ 500ms (95% request) |
| HP-03 | Hỗ trợ đồng thời | Tối thiểu 50 người dùng đồng thời |
| HP-04 | Thời gian xác thực MFA | ≤ 10 giây (kể cả gửi email) |

#### c) Yêu cầu khả dụng

| Mã | Yêu cầu | Chỉ tiêu |
|----|---------|----------|
| KD-01 | Thời gian hoạt động (uptime) | ≥ 99.5% |
| KD-02 | Sao lưu dữ liệu | Hàng ngày |
| KD-03 | Phục hồi sau sự cố | ≤ 4 giờ |

#### d) Yêu cầu về tính toàn vẹn

| Mã | Yêu cầu | Mô tả |
|----|---------|-------|
| TV-01 | Không mất mát dữ liệu | Đảm bảo giao dịch ACID |
| TV-02 | Chống sửa đổi trái phép | Audit log không thể sửa/xóa |

## 3.3. Biểu đồ Use Case

### 3.3.1. Biểu đồ tổng quát

Hệ thống Mini EMR có 5 tác nhân (actors) chính:

- **Administrator (Quản trị viên)**
- **Bác sĩ (Doctor)**
- **Điều dưỡng (Nurse)**
- **Lễ tân (Receptionist)**
- **Bệnh nhân (Patient)**

**Hình 3.1 – Biểu đồ use case tổng quát của hệ thống**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HỆ THỐNG MINI EMR                                 │
│                                                                             │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │ Admin   │    │ Bác sĩ       │    │ Điều dưỡng  │    │ Lễ tân      │    │
│  └────┬────┘    └──────┬───────┘    └──────┬──────┘    └──────┬──────┘    │
│       │                │                   │                  │           │
│  ┌────┴────────────────┴───────────────────┴──────────────────┴────┐      │
│  │                         <<extends>>                               │      │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │      │
│  │  │ Xác thực    │◄───│   Đăng nhập │───►│   MFA OTP   │          │      │
│  │  │ (MFA)       │    └─────────────┘    └─────────────┘          │      │
│  │  └─────────────┘                                                │      │
│  │                                                                 │      │
│  │  ┌─────────────────────────────────────────────────────────┐   │      │
│  │  │                    QUẢN LÝ BỆNH NHÂN                     │   │      │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │      │
│  │  │  │Thêm BN   │ │Sửa BN    │ │Xóa BN    │ │Tìm kiếm  │   │   │      │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │      │
│  │  └─────────────────────────────────────────────────────────┘   │      │
│  │                                                                 │      │
│  │  ┌─────────────────────────────────────────────────────────┐   │      │
│  │  │                    QUẢN LÝ BỆNH ÁN                       │   │      │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │      │
│  │  │  │Tạo BA    │ │Xem BA    │ │Sửa BA    │ │In BA     │   │   │      │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │      │
│  │  └─────────────────────────────────────────────────────────┘   │      │
│  │                                                                 │      │
│  │  ┌─────────────────────────────────────────────────────────┐   │      │
│  │  │                    QUẢN LÝ ĐƠN THUỐC                     │   │      │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │      │
│  │  │  │Kê đơn    │ │Xem đơn   │ │Sửa đơn   │ │In đơn    │   │   │      │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │      │
│  │  └─────────────────────────────────────────────────────────┘   │      │
│  │                                                                 │      │
│  │  ┌─────────────────────────────────────────────────────────┐   │      │
│  │  │                    QUẢN LÝ SINH HIỆU                     │   │      │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │      │
│  │  │  │Ghi SH    │ │Xem SH    │ │Biểu đồ   │ │Cảnh báo  │   │   │      │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │      │
│  │  └─────────────────────────────────────────────────────────┘   │      │
│  │                                                                 │      │
│  │  ┌─────────────────────────────────────────────────────────┐   │      │
│  │  │                  QUẢN LÝ NGƯỜI DÙNG                      │   │      │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │      │
│  │  │  │Tạo user  │ │Phân quyền│ │Khóa user │ │Xem log   │   │   │      │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │      │
│  │  └─────────────────────────────────────────────────────────┘   │      │
│  │                                                                 │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│                                    ▲                                      │
│                                    │                                      │
│                             ┌──────┴──────┐                               │
│                             │ Bệnh nhân   │                               │
│                             └─────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3.2. Biểu đồ use case chi tiết theo từng vai trò

#### a) Use case của Bác sĩ

**Hình 3.2 – Use case của Bác sĩ**

```
┌─────────────────────────────────────────────────────────────────┐
│                         BÁC SĨ (Doctor)                         │
│                                                                 │
│   ┌─────────────────┐     ┌─────────────────┐                  │
│   │ Xem danh sách   │     │ Tìm kiếm bệnh   │                  │
│   │ bệnh nhân       │     │ nhân            │                  │
│   └────────┬────────┘     └────────┬────────┘                  │
│            │                       │                            │
│            └───────────┬───────────┘                            │
│                        ▼                                        │
│            ┌─────────────────────┐                              │
│            │   Xem bệnh án BN    │                              │
│            └──────────┬──────────┘                              │
│                       │                                         │
│         ┌─────────────┼─────────────┐                           │
│         ▼             ▼             ▼                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                  │
│  │ Tạo bệnh   │ │ Cập nhật   │ │ Xem lịch   │                  │
│  │ án mới     │ │ bệnh án    │ │ sử điều trị│                  │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘                  │
│        │              │              │                          │
│        └──────────────┼──────────────┘                          │
│                       ▼                                         │
│            ┌─────────────────────┐                              │
│            │    Kê đơn thuốc     │                              │
│            └──────────┬──────────┘                              │
│                       │                                         │
│            ┌──────────┴──────────┐                              │
│            ▼                     ▼                              │
│     ┌────────────┐        ┌────────────┐                        │
│     │ In bệnh án │        │ In đơn     │                        │
│     │ (PDF)      │        │ thuốc (PDF)│                        │
│     └────────────┘        └────────────┘                        │
│                                                                 │
│     ┌─────────────────────────────────────────┐                │
│     │          <<include>>                     │                │
│     │  Mọi thao tác đều được ghi Audit Log    │                │
│     └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

#### b) Use case của Điều dưỡng

| STT | Use Case | Mô tả |
|-----|----------|-------|
| 1 | Xem danh sách bệnh nhân | Xem danh sách bệnh nhân đang điều trị |
| 2 | Tìm kiếm bệnh nhân | Tìm theo tên, mã BN |
| 3 | Xem bệnh án | Xem thông tin bệnh án (chỉ đọc) |
| 4 | Ghi sinh hiệu | Ghi nhiệt độ, huyết áp, nhịp tim, SpO2 |
| 5 | Xem biểu đồ sinh hiệu | Xem biểu đồ xu hướng theo thời gian |
| 6 | Xem đơn thuốc | Xem đơn thuốc của bệnh nhân (chỉ đọc) |

#### c) Use case của Lễ tân

| STT | Use Case | Mô tả |
|-----|----------|-------|
| 1 | Thêm bệnh nhân mới | Nhập thông tin hành chính |
| 2 | Cập nhật thông tin BN | Sửa thông tin liên lạc |
| 3 | Xem danh sách bệnh nhân | Xem toàn bộ danh sách |
| 4 | Tìm kiếm bệnh nhân | Tìm theo tên/SĐT |
| 5 | Xem lịch hẹn (mở rộng) | Xem lịch khám của bệnh nhân |
| 6 | Gộp hồ sơ trùng lặp | Xử lý các hồ sơ bệnh nhân tạo trùng lặp |

#### d) Use case của Bệnh nhân

| STT | Use Case | Mô tả |
|-----|----------|-------|
| 1 | Đăng nhập | Bằng tài khoản được cấp |
| 2 | Xem bệnh án của mình | Chỉ xem, không sửa |
| 3 | Xem đơn thuốc | Xem đơn thuốc đã được kê |
| 4 | Xem sinh hiệu | Xem lịch sử sinh hiệu của mình |
| 5 | Đổi mật khẩu | Tự đổi mật khẩu cá nhân; bắt buộc đổi khi hết hạn 3 tháng |

#### e) Use case của Administrator

| STT | Use Case | Mô tả |
|-----|----------|-------|
| 1 | Quản lý người dùng | Tạo, sửa, khóa, xóa tài khoản |
| 2 | Phân quyền người dùng | Gán vai trò (doctor, nurse, receptionist, patient) |
| 3 | Xem Audit Log | Xem toàn bộ lịch sử thao tác hệ thống |
| 4 | Xuất báo cáo log | Xuất log ra file (CSV/Excel) |
| 5 | Sao lưu dữ liệu | Kích hoạt sao lưu thủ công |
| 6 | Cấu hình hệ thống | Cấu hình MFA, session timeout |
| 7 | Gộp hồ sơ trùng lặp | Xử lý làm sạch và gộp các hồ sơ bệnh nhân |
| 8 | Quản lý Vai trò & Phân quyền | Tạo, sửa, xóa các vai trò tùy chỉnh và gán quyền hạn hệ thống (RBAC) |

## 3.4. Thiết kế cơ sở dữ liệu

### 3.4.1. Sơ đồ thực thể - quan hệ (ERD)

**Hình 3.3 – Sơ đồ ERD của hệ thống Mini EMR**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    ERD - Mini EMR                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                           │
│  │   users     │     │   roles     │     │permissions  │                           │
│  ├─────────────┤     ├─────────────┤     ├─────────────┤                           │
│  │ id (PK)     │────►│ id (PK)     │     │ id (PK)     │                           │
│  │ email       │     │ name        │     │ name        │                           │
│  │ password    │     │ description │     │ resource    │                           │
│  │ full_name   │     └─────────────┘     │ action      │                           │
│  │ role_id(FK) │            │            └─────────────┘                           │
│  │ mfa_secret  │            │                    │                                 │
│  │ is_active   │            │                    │                                 │
│  │ created_at  │     ┌──────┴──────┐     ┌───────┴───────┐                         │
│  └─────────────┘     │ role_perms  │     │ user_perms   │                         │
│                      ├─────────────┤     ├──────────────┤                         │
│                      │ role_id(FK) │     │ user_id(FK)  │                         │
│                      │ perm_id(FK) │     │ perm_id(FK)  │                         │
│                      └─────────────┘     └──────────────┘                         │
│                                                                                     │
│  ┌─────────────┐                                                                   │
│  │  patients   │                                                                   │
│  ├─────────────┤                                                                   │
│  │ id (PK)     │◄────────┐                                                         │
│  │ user_id(FK) │         │                                                         │
│  │ first_name  │         │                                                         │
│  │ last_name   │         │                                                         │
│  │ dob         │         │                                                         │
│  │ gender      │         │                                                         │
│  │ phone       │         │                                                         │
│  │ address     │         │                                                         │
│  │ created_at  │         │                                                         │
│  └─────────────┘         │                                                         │
│         │                │                                                         │
│         │                │                                                         │
│         ▼                │                                                         │
│  ┌─────────────────┐     │     ┌─────────────────┐                                 │
│  │ medical_records │     │     │  prescriptions  │                                 │
│  ├─────────────────┤     │     ├─────────────────┤                                 │
│  │ id (PK)         │     │     │ id (PK)         │                                 │
│  │ patient_id(FK)  │─────┼────►│ record_id(FK)   │                                 │
│  │ doctor_id(FK)   │     │     │ medicine_name   │                                 │
│  │ visit_date      │     │     │ dosage          │                                 │
│  │ symptoms        │     │     │ frequency       │                                 │
│  │ diagnosis       │     │     │ duration        │                                 │
│  │ note            │     │     │ note            │                                 │
│  │ status          │     │     └─────────────────┘                                 │
│  └─────────────────┘     │                                                         │
│         │                │                                                         │
│         │                │                                                         │
│         ▼                │                                                         │
│  ┌─────────────────┐     │     ┌─────────────────┐                                 │
│  │   vital_signs   │     │     │   audit_logs    │                                 │
│  ├─────────────────┤     │     ├─────────────────┤                                 │
│  │ id (PK)         │     │     │ id (PK)         │                                 │
│  │ patient_id(FK)  │─────┘     │ user_id(FK)     │                                 │
│  │ nurse_id(FK)    │           │ action          │                                 │
│  │ recorded_at     │           │ resource        │                                 │
│  │ temperature     │           │ resource_id     │                                 │
│  │ blood_pressure  │           │ old_value       │                                 │
│  │ heart_rate      │           │ new_value       │                                 │
│  │ respiration     │           │ ip_address      │                                 │
│  │ spo2            │           │ user_agent      │                                 │
│  │ note            │           │ created_at      │                                 │
│  └─────────────────┘           └─────────────────┘                                 │
│                                                                                     │
│  ┌─────────────────┐           ┌─────────────────┐                                 │
│  │  break_glass    │           │  mfa_codes      │                                 │
│  ├─────────────────┤           ├─────────────────┤                                 │
│  │ id (PK)         │           │ id (PK)         │                                 │
│  │ user_id(FK)     │           │ user_id(FK)     │                                 │
│  │ patient_id(FK)  │           │ code            │                                 │
│  │ access_reason   │           │ expires_at      │                                 │
│  │ accessed_at     │           │ is_used         │                                 │
│  │ approved_by(FK) │           │ created_at      │                                 │
│  └─────────────────┘           └─────────────────┘                                 │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.4.2. Chi tiết các bảng dữ liệu

#### a) Bảng `users` (Người dùng)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | BIGINT | PRIMARY KEY, AUTO INCREMENT | Mã định danh duy nhất |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Tên đăng nhập |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email đăng nhập |
| password_hash | VARCHAR | NOT NULL | Mật khẩu đã mã hóa (bcrypt, 12 vòng salt) |
| full_name | VARCHAR(100) | NOT NULL | Họ và tên |
| citizen_id | VARCHAR(20) | UNIQUE, NULL | Số CCCD/CMND |
| role_id | INTEGER | FOREIGN KEY → roles.id | Vai trò của người dùng (chuẩn hóa qua bảng roles) |
| status | VARCHAR(20) | DEFAULT 'PENDING' | Trạng thái: PENDING / ACTIVE / LOCKED |
| mfa_enabled | BOOLEAN | DEFAULT TRUE | Bật/tắt xác thực đa yếu tố (MFA) |
| failed_login_attempts | INTEGER | DEFAULT 0 | Số lần đăng nhập sai liên tiếp (chống brute force) |
| locked_until | TIMESTAMP | NULL | Thời điểm hết khóa tạm thời (chống brute force) |
| password_changed_at | TIMESTAMP | DEFAULT NOW() | Thời điểm đặt/đổi mật khẩu gần nhất (phục vụ kiểm tra hết hạn 3 tháng) |
| created_at | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |

#### b) Bảng `roles` (Vai trò)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | INTEGER | PRIMARY KEY | Mã vai trò (1:Admin,2:Doctor,3:Nurse,4:Receptionist,5:Patient) |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Tên vai trò |
| description | VARCHAR(255) | NULL | Mô tả vai trò |

#### c) Bảng `permissions` (Quyền)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | INTEGER | PRIMARY KEY | Mã quyền |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Tên quyền (vd: patient:create) |
| resource | VARCHAR(50) | NOT NULL | Tài nguyên (patient, record, user...) |
| action | VARCHAR(30) | NOT NULL | Hành động (create, read, update, delete, list, manage...) |

#### c-bis) Bảng `role_permissions` (Gán quyền cho vai trò)

Bảng nối thể hiện quan hệ nhiều-nhiều giữa `roles` và `permissions`. Mỗi vai trò được cấp một tập permission; middleware đọc bảng này để quyết định cho phép/từ chối mỗi request (có cache trong bộ nhớ).

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| role_id | INTEGER | FOREIGN KEY → roles.id, PK kép | Vai trò |
| permission_id | INTEGER | FOREIGN KEY → permissions.id, PK kép | Quyền được cấp |

#### d) Bảng `patients` (Bệnh nhân)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | UUID | PRIMARY KEY | Mã bệnh nhân (hiển thị trên mọi output) |
| user_id | UUID | FOREIGN KEY → users.id | Liên kết tài khoản đăng nhập |
| first_name | VARCHAR(100) | NOT NULL | Tên |
| last_name | VARCHAR(100) | NOT NULL | Họ |
| dob | DATE | NOT NULL | Ngày sinh |
| gender | VARCHAR(10) | NOT NULL | Giới tính (MALE/FEMALE/OTHER) |
| phone | VARCHAR(20) | NOT NULL | Số điện thoại |
| address | TEXT | NULL | Địa chỉ |
| blood_type | VARCHAR(5) | NULL | Nhóm máu |
| allergies | TEXT | NULL | Dị ứng |
| created_at | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |

#### e) Bảng `medical_records` (Bệnh án)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | UUID | PRIMARY KEY | Mã bệnh án |
| patient_id | UUID | FOREIGN KEY → patients.id | Bệnh nhân |
| doctor_id | UUID | FOREIGN KEY → users.id | Bác sĩ điều trị |
| visit_date | DATE | NOT NULL | Ngày khám |
| symptoms | TEXT | NULL | Triệu chứng |
| diagnosis | TEXT | NOT NULL | Chẩn đoán |
| note | TEXT | NULL | Ghi chú bổ sung |
| status | VARCHAR(20) | DEFAULT 'ACTIVE' | Trạng thái (ACTIVE/CLOSED) |
| created_at | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |

#### f) Bảng `prescriptions` (Đơn thuốc)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | UUID | PRIMARY KEY | Mã đơn thuốc |
| record_id | UUID | FOREIGN KEY → medical_records.id | Bệnh án liên quan |
| medicine_name | VARCHAR(255) | NOT NULL | Tên thuốc |
| dosage | VARCHAR(100) | NOT NULL | Liều lượng (vd: 500mg) |
| frequency | VARCHAR(100) | NOT NULL | Tần suất (vd: 2 lần/ngày) |
| duration | INTEGER | NOT NULL | Số ngày dùng |
| note | TEXT | NULL | Ghi chú |
| created_at | TIMESTAMP | DEFAULT NOW() | Thời gian kê đơn |

#### g) Bảng `vital_signs` (Sinh hiệu)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | UUID | PRIMARY KEY | Mã sinh hiệu |
| patient_id | UUID | FOREIGN KEY → patients.id | Bệnh nhân |
| nurse_id | UUID | FOREIGN KEY → users.id | Điều dưỡng ghi nhận |
| recorded_at | TIMESTAMP | DEFAULT NOW() | Thời gian ghi |
| temperature | DECIMAL(4,1) | NULL | Nhiệt độ (°C) |
| blood_pressure_systolic | INTEGER | NULL | Huyết áp tâm thu |
| blood_pressure_diastolic | INTEGER | NULL | Huyết áp tâm trương |
| heart_rate | INTEGER | NULL | Nhịp tim (bpm) |
| respiration | INTEGER | NULL | Nhịp thở (lần/phút) |
| spo2 | INTEGER | NULL | SpO2 (%) |
| note | TEXT | NULL | Ghi chú |

#### h) Bảng `audit_logs` (Nhật ký hệ thống)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | BIGSERIAL | PRIMARY KEY | Mã log |
| user_id | UUID | FOREIGN KEY → users.id | Người thực hiện |
| action | VARCHAR(20) | NOT NULL | CREATE/READ/UPDATE/DELETE/LOGIN |
| resource | VARCHAR(50) | NOT NULL | Tài nguyên (patient, record...) |
| resource_id | VARCHAR(255) | NULL | ID của tài nguyên |
| old_value | JSONB | NULL | Giá trị cũ |
| new_value | JSONB | NULL | Giá trị mới |
| ip_address | INET | NOT NULL | IP thực hiện |
| user_agent | TEXT | NULL | Trình duyệt/thiết bị |
| created_at | TIMESTAMP | DEFAULT NOW() | Thời gian ghi |

#### i) Bảng `break_glass` (Truy cập khẩn cấp)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | UUID | PRIMARY KEY | Mã yêu cầu |
| user_id | UUID | FOREIGN KEY → users.id | Người yêu cầu |
| patient_id | UUID | FOREIGN KEY → patients.id | Bệnh nhân được truy cập |
| access_reason | TEXT | NOT NULL | Lý do truy cập khẩn cấp |
| accessed_at | TIMESTAMP | DEFAULT NOW() | Thời gian truy cập |
| approved_by | UUID | FOREIGN KEY → users.id | Người phê duyệt (thường là admin) |

#### j) Bảng `appointments` (Lịch hẹn khám bệnh)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|--------|-------------|-----------|-------|
| id | BIGINT | PRIMARY KEY, AUTO INCREMENT | Mã lịch hẹn nội bộ |
| appointment_code | VARCHAR(20) | UNIQUE, NOT NULL | Mã lịch hẹn (APP-YYYY-NNNN) |
| patient_id | BIGINT | FOREIGN KEY → patients.id | Bệnh nhân đặt lịch |
| doctor_id | BIGINT | FOREIGN KEY → users.id | Bác sĩ khám (vai trò DOCTOR) |
| appointment_date | TIMESTAMP | NOT NULL | Ngày giờ hẹn khám |
| status | VARCHAR(20) | DEFAULT 'PENDING' | Trạng thái: PENDING/CONFIRMED/CANCELLED/COMPLETED |
| reason | TEXT | NULL | Lý do khám ban đầu |
| notes | TEXT | NULL | Ghi chú điều trị / khám lâm sàng của bác sĩ |
| created_at | TIMESTAMP | DEFAULT NOW() | Thời điểm đặt lịch |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thời điểm cập nhật |


==> muốn test chức năng đặt lịch giao diện UI thì chạy cả frontend và backend : npm run dev ; truy cập http://localhost:3001/appointments

### 3.4.3. Mối quan hệ giữa các bảng

| Quan hệ | Kiểu | Mô tả |
|---------|------|-------|
| users → roles | N-1 | Mỗi user có một role |
| roles → permissions | N-N | Mỗi role có nhiều quyền (qua role_permissions) |
| users → patients | 1-1 | Mỗi bệnh nhân có một tài khoản user |
| patients → medical_records | 1-N | Một bệnh nhân có nhiều bệnh án |
| users (doctor) → medical_records | 1-N | Một bác sĩ có nhiều bệnh án |
| medical_records → prescriptions | 1-N | Một bệnh án có nhiều thuốc |
| patients → vital_signs | 1-N | Một bệnh nhân có nhiều sinh hiệu |
| users → audit_logs | 1-N | Một user có nhiều log |
| users → break_glass | 1-N | Một user có thể có nhiều yêu cầu break glass |
| patients → appointments | 1-N | Một bệnh nhân có nhiều lịch hẹn khám |
| users (doctor) → appointments | 1-N | Một bác sĩ có nhiều lịch hẹn khám |

## 3.5. Thiết kế API

### 3.5.1. Nguyên tắc thiết kế API

- Tuân thủ kiến trúc **RESTful**
- Sử dụng **HTTP methods** chuẩn: GET, POST, PUT, PATCH, DELETE
- Response format: **JSON**
- Mã trạng thái HTTP chuẩn: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error)
- Xác thực: **Bearer Token (JWT)** cho tất cả các endpoint trừ login/register
- Ghi **audit log** tự động cho các thao tác thay đổi dữ liệu

### 3.5.2. Danh sách API endpoints

#### a) Nhóm Authentication (`/api/auth`)

| Method | Endpoint | Mô tả | Xác thực |
|--------|----------|-------|----------|
| POST | `/api/auth/register` | Bệnh nhân đăng ký tài khoản | Không |
| POST | `/api/auth/verify-email` | Xác thực email đăng ký | Không |
| POST | `/api/auth/login` | Đăng nhập, nhận JWT | Không |
| POST | `/api/auth/mfa/verify` | Xác thực mã OTP | JWT (temporary) |
| POST | `/api/auth/mfa/setup` | Thiết lập MFA | JWT |
| POST | `/api/auth/mfa/disable` | Tắt MFA | JWT |
| POST | `/api/auth/logout` | Đăng xuất | JWT |
| POST | `/api/auth/change-password` | Đổi mật khẩu | JWT |
| POST | `/api/auth/forgot-password` | Quên mật khẩu | Không |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu | Không |

#### b) Nhóm Patients (`/api/patients`)

| Method | Endpoint | Mô tả | Quyền yêu cầu |
|--------|----------|-------|---------------|
| GET | `/api/patients` | Lấy danh sách bệnh nhân | Admin, Doctor, Nurse, Receptionist |
| GET | `/api/patients/{id}` | Lấy chi tiết bệnh nhân | Admin, Doctor, Nurse, Receptionist |
| POST | `/api/patients` | Tạo bệnh nhân mới | Admin, Receptionist |
| PUT | `/api/patients/{id}` | Cập nhật bệnh nhân | Admin, Receptionist |
| DELETE | `/api/patients/{id}` | Xóa bệnh nhân | Admin |
| GET | `/api/patients/search` | Tìm kiếm bệnh nhân | Admin, Doctor, Nurse, Receptionist |
| GET | `/api/patients/me` | Lấy thông tin hồ sơ cá nhân | Patient |
| PUT | `/api/patients/me` | Cập nhật hồ sơ cá nhân | Patient |
| POST | `/api/patients/auto-merge` | Quét và gộp tự động các hồ sơ bệnh nhân bị trùng lặp | Admin, Receptionist |

#### c) Nhóm Medical Records (`/api/records`)

| Method | Endpoint | Mô tả | Quyền yêu cầu |
|--------|----------|-------|---------------|
| GET | `/api/records` | Lấy danh sách bệnh án | Admin, Doctor, Nurse |
| GET | `/api/records/{id}` | Lấy chi tiết bệnh án | Admin, Doctor, Nurse, Patient (bệnh án của mình) |
| GET | `/api/records/patient/{patientId}` | Lấy bệnh án theo bệnh nhân | Admin, Doctor, Nurse, Patient (chính mình) |
| POST | `/api/records` | Tạo bệnh án mới | Doctor |
| PUT | `/api/records/{id}` | Cập nhật bệnh án | Doctor (chỉ bác sĩ tạo) |
| DELETE | `/api/records/{id}` | Xóa bệnh án | Admin |

#### d) Nhóm Prescriptions (`/api/prescriptions`)

| Method | Endpoint                               | Mô tả                      | Quyền yêu cầu                 |
| ------ | -------------------------------------- | -------------------------- | ----------------------------- |
| GET    | `/api/prescriptions/record/{recordId}` | Lấy đơn thuốc theo bệnh án | Admin, Doctor, Nurse, Patient |
| POST   | `/api/prescriptions`                   | Tạo đơn thuốc              | Doctor                        |
| PUT    | `/api/prescriptions/{id}`              | Cập nhật đơn thuốc         | Doctor                        |
| DELETE | `/api/prescriptions/{id}`              | Xóa đơn thuốc              | Doctor, Admin                 |

#### e) Nhóm Vital Signs (`/api/vital-signs`)

| Method | Endpoint | Mô tả | Quyền yêu cầu |
|--------|----------|-------|---------------|
| GET | `/api/vital-signs/patient/{patientId}` | Lấy sinh hiệu theo bệnh nhân | Admin, Doctor, Nurse, Patient |
| POST | `/api/vital-signs` | Ghi nhận sinh hiệu | Nurse |
| PUT | `/api/vital-signs/{id}` | Cập nhật sinh hiệu | Nurse |
| DELETE | `/api/vital-signs/{id}` | Xóa sinh hiệu | Admin |

#### f) Nhóm Users (`/api/users`)

| Method | Endpoint | Mô tả | Quyền yêu cầu |
|--------|----------|-------|---------------|
| GET | `/api/users` | Lấy danh sách người dùng | Admin |
| GET | `/api/users/{id}` | Lấy chi tiết người dùng | Admin |
| POST | `/api/users` | Tạo người dùng mới | Admin |
| PUT | `/api/users/{id}` | Cập nhật người dùng | Admin |
| DELETE | `/api/users/{id}` | Xóa người dùng | Admin |
| PUT | `/api/users/{id}/role` | Gán vai trò cho user | Admin |

#### g) Nhóm Audit Logs (`/api/logs`)

| Method | Endpoint | Mô tả | Quyền yêu cầu |
|--------|----------|-------|---------------|
| GET | `/api/logs` | Lấy danh sách audit log | Admin |
| GET | `/api/logs/user/{userId}` | Lấy log theo người dùng | Admin |
| GET | `/api/logs/resource/{resource}/{resourceId}` | Lấy log theo tài nguyên | Admin |
| GET | `/api/logs/export` | Xuất log ra file | Admin |

#### h) Nhóm Break Glass (`/api/break-glass`)

| Method | Endpoint | Mô tả | Quyền yêu cầu |
|--------|----------|-------|---------------|
| POST | `/api/break-glass/request` | Yêu cầu truy cập khẩn cấp | Doctor, Nurse |
| GET | `/api/break-glass/pending` | Xem yêu cầu đang chờ | Admin |
| PUT | `/api/break-glass/approve/{id}` | Phê duyệt yêu cầu | Admin |
| POST | `/api/break-glass/access/{patientId}` | Truy cập khẩn cấp | Doctor, Nurse (sau khi được phê duyệt) |

#### i) Nhóm Appointments (`/api/appointments`)

| Method | Endpoint | Mô tả | Quyền yêu cầu |
|--------|----------|-------|---------------|
| POST | `/api/appointments` | Tạo lịch hẹn khám mới | Patient, Receptionist, Admin |
| GET | `/api/appointments` | Xem danh sách lịch hẹn (Phân trang & Lọc) | Admin, Doctor, Nurse, Receptionist, Patient (chỉ xem của mình) |
| GET | `/api/appointments/doctors` | Lấy danh sách bác sĩ hoạt động | Patient, Receptionist, Admin |
| GET | `/api/appointments/{id}` | Lấy chi tiết lịch hẹn khám bệnh | Admin, Doctor (lịch được xếp), Nurse, Receptionist, Patient (chính mình) |
| PUT | `/api/appointments/{id}` | Cập nhật lịch hẹn / đổi trạng thái | Doctor (cập nhật ghi chú/khám xong), Receptionist, Admin |
| PUT | `/api/appointments/me/{id}` | Bệnh nhân tự hủy hoặc dời ngày khám | Patient (lịch của mình khi còn PENDING) |
| DELETE | `/api/appointments/{id}` | Xóa lịch hẹn khám khỏi hệ thống | Admin |

#### j) Nhóm Roles & Permissions (`/api/roles`, `/api/permissions`)

| Method | Endpoint | Mô tả | Quyền yêu cầu |
|--------|----------|-------|---------------|
| GET | `/api/permissions` | Lấy danh sách toàn bộ quyền hạn (permissions) | Admin (`role:manage`) |
| GET | `/api/roles` | Lấy danh sách tất cả các vai trò và quyền hạn | Admin (`role:manage`) |
| POST | `/api/roles` | Tạo một vai trò mới (kèm `permissions`) | Admin (`role:manage`) |
| PUT | `/api/roles/{id}` | Cập nhật thông tin và quyền hạn của vai trò | Admin (`role:manage`) |
| DELETE | `/api/roles/{id}` | Xóa vai trò tùy chỉnh | Admin (`role:manage`) |

#### k) Nhóm Đồng bộ thời gian (`/api/system-time`)

| Method | Endpoint | Mô tả | Quyền yêu cầu |
|--------|----------|-------|---------------|
| GET | `/api/system-time` | Lấy thông tin thời gian đồng bộ và độ lệch offset hiện tại của hệ thống. | Không |
| GET | `/api/system-time?sync=true` | Yêu cầu hệ thống thực hiện đồng bộ lại ngay lập tức với Time API. | Không |

### 3.5.3. Ví dụ chi tiết một số API

#### Ví dụ 1: Đăng nhập (có MFA)

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "doctor@example.com",
    "password": "securepassword123"
}
```

**Response (lần đầu - yêu cầu MFA):**
```json
{
    "status": "success",
    "data": {
        "requires_mfa": true,
        "temporary_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "message": "Please verify OTP sent to your email"
    }
}
```

**Request xác thực MFA:**
```http
POST /api/auth/mfa/verify
Authorization: Bearer {temporary_token}
Content-Type: application/json

{
    "otp_code": "123456"
}
```

**Response thành công:**
```json
{
    "status": "success",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires_in": 3600,
        "must_change_password": false,
        "password_expires_at": "2026-09-20T08:30:00.000Z",
        "password_max_age_days": 90,
        "days_until_password_expiry": 45,
        "user": {
            "id": "uuid-1234",
            "email": "doctor@example.com",
            "full_name": "Nguyễn Văn A",
            "role": "doctor",
            "must_change_password": false,
            "password_expires_at": "2026-09-20T08:30:00.000Z"
        }
    }
}
```

#### Ví dụ 2: Lấy danh sách bệnh nhân

**Request:**
```http
GET /api/patients?page=1&limit=20&search=Nguyễn
Authorization: Bearer {access_token}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "items": [
            {
                "id": "pat-001",
                "patient_code": "EMR-2025-0001",
                "full_name": "Nguyễn Thị B",
                "dob": "1990-05-15",
                "gender": "FEMALE",
                "phone": "0912345678",
                "last_visit": "2025-01-15"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 45,
            "total_pages": 3
        }
    }
}
```

#### Ví dụ 3: Tạo bệnh án mới

**Request:**
```http
POST /api/records
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "patient_id": "pat-001",
    "symptoms": "Sốt cao 39°C, ho khan, đau họng",
    "diagnosis": "Viêm họng cấp",
    "note": "Bệnh nhân mới phát bệnh 2 ngày"
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "id": "rec-12345",
        "patient_id": "pat-001",
        "doctor_id": "doc-001",
        "visit_date": "2025-01-20",
        "symptoms": "Sốt cao 39°C, ho khan, đau họng",
        "diagnosis": "Viêm họng cấp",
        "status": "ACTIVE",
        "created_at": "2025-01-20T08:30:00Z"
    }
}
```

#### Ví dụ 4: Lấy thời gian đồng bộ hệ thống

**Request:**
```http
GET /api/system-time
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "synchronized": true,
        "time": "2026-07-03T11:44:40.000Z",
        "localTime": "2026-07-03T11:44:39.950Z",
        "offsetMs": 50
    }
}
```

### 3.5.4. Mã lỗi HTTP sử dụng

| Mã lỗi | Ý nghĩa | Khi nào xảy ra |
|--------|---------|----------------|
| 200 | OK | Thành công |
| 201 | Created | Tạo mới thành công |
| 400 | Bad Request | Dữ liệu gửi lên không hợp lệ |
| 401 | Unauthorized | Chưa đăng nhập hoặc token hết hạn |
| 403 | Forbidden | Không có quyền truy cập; hoặc mật khẩu đã hết hạn (`code: PASSWORD_EXPIRED`, `must_change_password: true`) |
| 404 | Not Found | Tài nguyên không tồn tại |
| 409 | Conflict | Dữ liệu bị trùng (email đã tồn tại) |
| 429 | Too Many Requests | Gửi quá nhiều request (rate limit) |
| 500 | Internal Server Error | Lỗi server không xác định |

## 3.6. Thiết kế kiến trúc hệ thống

### 3.6.1. Kiến trúc tổng thể

**Hình 3.4 – Kiến trúc tổng thể hệ thống Mini EMR**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT TIER (Browser)                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                           NextJS Frontend                                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │    │
│  │  │ Login    │ │Dashboard│ │Patients  │ │Records   │ │Reports   │         │    │
│  │  │ Page     │ │Page     │ │Page      │ │Page      │ │Page      │         │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │    │
│  │  │                    React Context / State Management              │     │    │
│  │  │                    (Auth, Toast, Loading)                        │     │    │
│  │  └──────────────────────────────────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │    │
│  │  │                    HTTP Client (Axios)                           │     │    │
│  │  │                    + JWT Interceptor                             │     │    │
│  │  └──────────────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                              │                                      │
│                                              │ HTTPS/REST                           │
│                                              ▼                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                               APPLICATION TIER                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                           Express Backend                                    │    │
│  │                                                                              │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐    │    │
│  │  │                        Middleware                                  │    │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │    │
│  │  │  │ Logger   │ │Auth      │ │Rate Limit│ │CORS      │              │    │    │
│  │  │  │Middleware│ │Guard     │ │Guard     │ │Middleware│              │    │    │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │    │    │
│  │  └────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐    │    │
│  │  │                         Modules                                     │    │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │    │
│  │  │  │   Auth   │ │ Patients │ │ Records  │ │  Users   │ │   Logs   │ │    │    │
│  │  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │ │    │    │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │    │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │    │
│  │  │  │   MFA    │ │Rx        │ │ Audit    │ │ Break    │              │    │    │
│  │  │  │  Module  │ │Module    │ │  Module  │ │ Glass    │              │    │    │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │    │    │
│  │  └────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  │  ┌────────────────────────────────────────────────────────────────────┐    │    │
│  │  │                         Services                                    │    │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │    │
│  │  │  │   JWT    │ │  Bcrypt  │ │  Email   │ │  OTP     │              │    │    │
│  │  │  │ Service  │ │ Service  │ │ Service  │ │ Generator│              │    │    │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │    │    │
│  │  └────────────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                              │                                      │
│                                              │ Prisma ORM                           │
│                                              ▼                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                DATA TIER                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                      PostgreSQL + NeonDB (Cloud)                            │    │
│  │                                                                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │    │
│  │  │  users   │ │ patients │ │ records  │ │prescripts│ │audit_logs│         │    │
│  │  │  table   │ │  table   │ │  table   │ │  table   │ │  table   │         │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │    │
│  │  │vital_    │ │ roles    │ │ perms    │ │break_    │                       │    │
│  │  │signs     │ │ table    │ │ table    │ │glass     │                       │    │
│  │  │ table    │ │          │ │          │ │ table    │                       │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.6.2. Luồng xác thực MFA chi tiết

**Hình 3.5 – Luồng xác thực MFA**

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │     │ Backend │     │  Email  │     │  JWT    │     │  DB     │
│(Browser)│     │(Express)│     │ Service │     │ Service │     │(NeonDB) │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ 1. POST /auth/login           │               │               │
     │  (email, password)            │               │               │
     │──────────────►│               │               │               │
     │               │               │               │               │
     │               │ 2. Check user & password      │               │
     │               │───────────────────────────────────────────────►│
     │               │               │               │               │
     │               │ 3. User exists, pwd OK?       │               │
     │               │◄───────────────────────────────────────────────│
     │               │               │               │               │
     │               │ 4. Generate temporary JWT     │               │
     │               │ (valid 5 min, scope=mfa)      │               │
     │               │──────────────►│               │               │
     │               │               │               │               │
     │               │ 5. Generate OTP (6 digits)    │               │
     │               │──────────────►│               │               │
     │               │               │               │               │
     │               │               │ 6. Save OTP to DB              │
     │               │               │──────────────►│               │
     │               │               │               │               │
     │               │               │ 7. Send OTP email             │
     │               │               │──────────────►│               │
     │               │               │               │               │
     │ 8. Response: requires_mfa      │               │               │
     │    + temporary_token           │               │               │
     │◄──────────────│               │               │               │
     │               │               │               │               │
     │ 9. POST /auth/mfa/verify       │               │               │
     │  (otp_code)                    │               │               │
     │  Bearer: {temp_token}          │               │               │
     │──────────────►│               │               │               │
     │               │               │               │               │
     │               │ 10. Verify OTP                 │               │
     │               │───────────────────────────────────────────────►│
     │               │               │               │               │
     │               │ 11. OTP valid?                 │               │
     │               │◄───────────────────────────────────────────────│
     │               │               │               │               │
     │               │ 12. Generate final JWT         │               │
     │               │ (full access, role-based)      │               │
     │               │──────────────►│               │               │
     │               │               │               │               │
     │               │ 13. Delete used OTP            │               │
     │               │───────────────────────────────────────────────►│
     │               │               │               │               │
     │               │ 14. Record login to audit_log  │               │
     │               │───────────────────────────────────────────────►│
     │               │               │               │               │
     │ 15. Response: access_token     │               │               │
     │    + user info                 │               │               │
     │◄──────────────│               │               │               │
     │               │               │               │               │
     │ 16. Access protected APIs      │               │               │
     │  Bearer: {access_token}        │               │               │
     │──────────────►│               │               │               │
     │               │               │               │               │
     │               │ 17. Validate JWT               │               │
     │               │──────────────►│               │               │
     │               │               │               │               │
     │               │ 18. Check permissions (RBAC)   │               │
     │               │──────────────►│               │               │
     │               │               │               │               │
     │ 19. Response: requested data   │               │               │
     │◄──────────────│               │               │               │
     │               │               │               │               │
```

### 3.6.3. Luồng ghi Audit Log

**Hình 3.6 – Luồng ghi Audit Log**

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │     │ Guard/  │     │ Audit   │     │  DB     │
│         │     │Service  │     │Service  │     │         │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ 1. API Request│               │               │
     │  (Create patient)             │               │
     │──────────────►│               │               │
     │               │               │               │
     │               │ 2. Extract user context      │
     │               │  (user_id, role, IP)         │
     │               │               │               │
     │               │ 3. Execute business logic    │
     │               │               │               │
     │               │ 4. Before save, capture      │
     │               │    old_value (null for create)│
     │               │               │               │
     │               │ 5. Save new data             │
     │               │──────────────────────────────►│
     │               │               │               │
     │               │ 6. After save, capture       │
     │               │    new_value                 │
     │               │               │               │
     │               │ 7. Send to AuditService      │
     │               │──────────────►│               │
     │               │               │               │
     │               │               │ 8. Store audit log         │
     │               │               │──────────────►│
     │               │               │               │
     │ 9. Response   │               │               │
     │◄──────────────│               │               │
     │               │               │               │
     │               │               │               │
     │ (Async - không ảnh hưởng performance)         │
     │               │               │               │
```

## 3.7. Triển khai các điều khiển (Controls) theo ISO 27799

### 3.7.1. Bảng ánh xạ ISO 27799 Controls với tính năng hệ thống

| Control ISO 27799                           | Mô tả                         | Triển khai trong hệ thống                                         |
| ------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| **9.1.2** - Access control policy           | Chính sách kiểm soát truy cập | RBAC với 5 vai trò: Admin, Doctor, Nurse, Receptionist, Patient   |
| **9.4.2** - Secure log-on procedures        | Thủ tục đăng nhập an toàn     | Mật khẩu + MFA (OTP), giới hạn số lần đăng nhập sai, CAPTCHA      |
| **9.4.3** - Password management             | Quản lý mật khẩu              | Bcrypt hash (12 vòng salt), chính sách mật khẩu mạnh (8–15 ký tự, có chữ, chữ hoa, số và ký tự đặc biệt), cấm đặt lại trùng mật khẩu cũ, **bắt buộc đổi mật khẩu mỗi 3 tháng** (`password_changed_at`, middleware `enforcePasswordFresh`) |
| **9.4.5** - Session timeout                 | Thời gian chờ phiên làm việc  | Tự động đăng xuất sau 15 phút không hoạt động                     |
| **9.6.1** - Information access restriction  | Giới hạn truy cập thông tin   | Phân quyền chi tiết theo resource (patient, record, prescription) |
| **9.7.1** - Audit logging                   | Ghi nhật ký hệ thống          | Bảng `audit_logs` ghi đầy đủ ai, khi nào, làm gì, từ IP nào       |
| **9.8.1** - User registration               | Đăng ký người dùng            | Chỉ Admin mới có quyền tạo tài khoản                              |
| **9.8.2** - Privilege management            | Quản lý đặc quyền             | Gán vai trò, không ai có quyền tuyệt đối ngoài Admin              |
| **12.4.1** - Event logging                  | Ghi lại sự kiện               | Ghi log cho tất cả thao tác CREATE, READ, UPDATE, DELETE, LOGIN   |
| **12.4.3** - Administrator logs             | Log của quản trị viên         | Admin cũng bị ghi log, không ngoại lệ                             |
| **12.4.4** - Clock synchronization          | Đồng bộ hóa thời gian         | Đồng bộ hóa đồng hồ hệ thống (Server) thông qua dịch vụ thời gian nội bộ (Time API) tại `http://localhost:8000/api/time` nhằm đảm bảo tính chính xác và toàn vẹn của thời gian ghi nhận trong nhật ký hệ thống (Audit Trail) |
| **13.2.1** - Information transfer           | Chuyển giao thông tin         | Mọi output đều hiển thị mã bệnh nhân (patient_code)               |
| **16.1.5** - Response to security incidents | Ứng phó sự cố                 | Break glass mechanism cho truy cập khẩn cấp                       |

### 3.7.2. Triển khai RBAC (Role-Based Access Control)

Phân quyền được **chuẩn hóa trong cơ sở dữ liệu** qua ba bảng `roles`, `permissions`, `role_permissions`. Mỗi tài khoản tham chiếu vai trò bằng `users.role_id`. Khi một request đến, middleware `authorize('<resource>:<action>')` nạp tập permission của vai trò từ DB (có cache 60 giây) và cho phép nếu vai trò sở hữu quyền tương ứng — thay vì so sánh cứng tên vai trò trong mã nguồn. Nhờ vậy có thể thêm/bớt quyền của một vai trò mà không cần sửa code route.

**Bảng ma trận quyền truy cập** (được seed vào `role_permissions`):

| Resource | Action | Admin | Doctor | Nurse | Receptionist | Patient |
|----------|--------|-------|--------|-------|--------------|---------|
| **Patients** | CREATE | ✓ | ✗ | ✗ | ✓ | ✗ |
| | READ | ✓ | ✓ | ✓ | ✓ | ✓ (own) |
| | UPDATE | ✓ | ✗ | ✗ | ✓ | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Medical Records** | CREATE | ✗ | ✓ | ✗ | ✗ | ✗ |
| | READ | ✓ | ✓ | ✓ | ✗ | ✓ (own) |
| | UPDATE | ✗ | ✓ (own) | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Prescriptions** | CREATE | ✗ | ✓ | ✗ | ✗ | ✗ |
| | READ | ✓ | ✓ | ✓ | ✗ | ✓ (own) |
| | UPDATE | ✗ | ✓ (own) | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Vital Signs** | CREATE | ✗ | ✗ | ✓ | ✗ | ✗ |
| | READ | ✓ | ✓ | ✓ | ✗ | ✓ (own) |
| | UPDATE | ✗ | ✗ | ✓ (own) | ✗ | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Users** | CREATE | ✓ | ✗ | ✗ | ✗ | ✗ |
| | READ | ✓ | ✗ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✗ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Audit Logs** | READ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Break Glass** | REQUEST | ✗ | ✓ | ✓ | ✗ | ✗ |
| | APPROVE | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Appointments** | CREATE | ✓ | ✗ | ✗ | ✓ | ✓ |
| | READ | ✓ | ✓ | ✓ | ✓ | ✓ (own) |
| | UPDATE | ✓ | ✓ (own) | ✗ | ✓ | ✓ (own) |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |

### 3.7.3. Triển khai MFA (Multi-Factor Authentication)

**Cách thức hoạt động:**

1. Người dùng đăng nhập bằng email và mật khẩu.
2. Hệ thống kiểm tra thông tin, nếu đúng → tạo temporary JWT (hiệu lực 5 phút).
3. Hệ thống sinh mã OTP 6 chữ số, lưu vào bảng `mfa_codes`, gửi qua email.
4. Người dùng nhập mã OTP, hệ thống xác thực.
5. Nếu đúng → tạo access_token chính thức (hiệu lực 1 giờ) và refresh_token (7 ngày).

**Cấu trúc bảng `mfa_codes`:**
- `code`: mã OTP (hash để bảo mật)
- `expires_at`: thời gian hết hạn (5 phút)
- `is_used`: đánh dấu đã sử dụng (chỉ dùng 1 lần)

### 3.7.4. Triển khai Audit Logging

**Nguyên tắc ghi log:**
- Mọi thao tác thay đổi dữ liệu (CREATE, UPDATE, DELETE) đều được ghi.
- Thao tác READ cũng được ghi đối với dữ liệu nhạy cảm (bệnh án, bệnh nhân).
- Log không thể bị sửa hoặc xóa (chỉ admin có quyền xem).
- Log được lưu trong bảng riêng `audit_logs`.

**Cấu trúc log:**

```json
{
    "id": 12345,
    "user_id": "uuid-doctor-001",
    "action": "UPDATE",
    "resource": "medical_record",
    "resource_id": "rec-67890",
    "old_value": {
        "diagnosis": "Viêm họng cấp"
    },
    "new_value": {
        "diagnosis": "Viêm họng cấp + viêm amidan"
    },
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2025-01-20T08:35:00Z"
}
```

### 3.7.5. Triển khai Break Glass (Truy cập khẩn cấp)

**Kịch bản sử dụng:** Khi bác sĩ hoặc điều dưỡng cần truy cập bệnh án của bệnh nhân trong trường hợp khẩn cấp (cấp cứu, quên mật khẩu, tài khoản bị khóa).

**Quy trình:**
1. Người dùng gửi yêu cầu truy cập khẩn cấp qua API `/api/break-glass/request`, cung cấp lý do.
2. Hệ thống tạo bản ghi trong bảng `break_glass`, trạng thái `PENDING`.
3. Admin nhận thông báo và phê duyệt (hoặc từ chối).
4. Sau khi được phê duyệt, người dùng được cấp quyền truy cập đặc biệt trong 30 phút.
5. Mọi thao tác trong thời gian break glass đều được ghi log đặc biệt.

### 3.7.6. Hiển thị mã bệnh nhân trên mọi output

Theo ISO 27799, mọi đầu ra (output) liên quan đến bệnh nhân phải hiển thị mã bệnh nhân để đảm bảo tính toàn vẹn và tránh nhầm lẫn.

**Áp dụng:**
- Trên màn hình danh sách bệnh nhân: hiển thị cột `patient_code`
- Trên màn hình chi tiết bệnh án: hiển thị `patient_code` ở header
- Trên PDF bệnh án: in `patient_code` ở góc trên cùng bên phải
- Trên đơn thuốc: in `patient_code` kèm tên bệnh nhân

**Cấu trúc mã bệnh nhân:** `EMR-YYYY-XXXXX` (vd: EMR-2025-00001)

### 3.7.7. Chính sách mật khẩu (Password Policy)

Theo điều khoản **9.4.3 – Password management** của ISO 27799, hệ thống áp dụng chính sách mật khẩu mạnh nhằm giảm thiểu rủi ro bị dò đoán hoặc tấn công vét cạn (brute-force). Chính sách được kiểm tra ở tầng validator của backend và áp dụng cho tất cả các luồng nhập/đổi mật khẩu: đăng ký tài khoản, đổi mật khẩu và đặt lại mật khẩu (quên mật khẩu).

**Quy tắc độ mạnh mật khẩu:**

| Tiêu chí | Yêu cầu |
|----------|---------|
| Độ dài | Từ 8 đến 15 ký tự |
| Chữ cái | Phải chứa ít nhất một chữ cái (a–z, A–Z) |
| Chữ hoa | Phải chứa ít nhất một chữ hoa (A–Z) |
| Chữ số | Phải chứa ít nhất một chữ số (0–9) |
| Ký tự đặc biệt | Phải chứa ít nhất một ký tự đặc biệt (vd: `!`, `@`, `#`, `$`...) |

**Các ràng buộc bổ sung khi đổi / đặt lại mật khẩu:**

- Khi **đổi mật khẩu** (`/api/auth/change-password`): bắt buộc nhập đúng mật khẩu hiện tại; mật khẩu mới không được trùng với mật khẩu hiện tại.
- Khi **đặt lại mật khẩu** qua OTP (`/api/auth/reset-password`): hệ thống so khớp mật khẩu mới với mật khẩu cũ đang lưu (qua `bcrypt.compare`) và **từ chối nếu trùng** (trả lỗi HTTP 400), đảm bảo tính nhất quán giữa hai luồng.

**Thời hạn mật khẩu (đổi định kỳ):**

Theo yêu cầu **9.4.3 – Password management**, mật khẩu phải được thay đổi định kỳ để giảm rủi ro lộ lọt lâu dài. Hệ thống áp dụng chu kỳ **3 tháng (90 ngày)** kể từ lần đặt/đổi mật khẩu gần nhất.

| Tiêu chí | Yêu cầu |
|----------|---------|
| Chu kỳ tối đa | 90 ngày (3 tháng), cấu hình qua biến môi trường `PASSWORD_MAX_AGE_DAYS` |
| Trường lưu trữ | `users.password_changed_at` — cập nhật khi đăng ký, Admin tạo user, đổi mật khẩu hoặc reset mật khẩu |
| Fallback | Nếu `password_changed_at` là NULL (tài khoản cũ), dùng `created_at` làm mốc tính hạn |
| Kiểm tra khi đăng nhập | Response trả `must_change_password`, `password_expires_at`, `days_until_password_expiry` |
| Chặn truy cập API | Middleware `enforcePasswordFresh` trả HTTP 403 (`code: PASSWORD_EXPIRED`) khi mật khẩu quá hạn; **ngoại lệ**: `/api/auth/change-password`, `/api/auth/logout` |
| Giao diện người dùng | Trang `/change-password` — bắt buộc đổi mật khẩu trước khi vào dashboard |

**Luồng xử lý khi mật khẩu hết hạn:**

1. Người dùng đăng nhập thành công (kể cả sau MFA) → nhận JWT kèm `must_change_password: true`.
2. Frontend chuyển hướng sang `/change-password` thay vì dashboard.
3. Mọi request API khác (patients, records, …) bị middleware `enforcePasswordFresh` từ chối với mã 403.
4. Sau khi đổi mật khẩu thành công → `password_changed_at` được cập nhật, `must_change_password` trở về `false`, người dùng truy cập hệ thống bình thường.

**Lưu trữ an toàn:** mật khẩu không bao giờ được lưu ở dạng rõ. Hệ thống sử dụng thuật toán băm **bcrypt** với 12 vòng salt (`SALT_ROUNDS = 12`) trước khi ghi vào trường `password_hash`.

**Ví dụ minh họa kết quả kiểm tra:**

| Mật khẩu | Kết quả | Lý do |
|----------|---------|-------|
| `12345678` | ❌ Không hợp lệ | Thiếu chữ cái và ký tự đặc biệt |
| `abc123!@` | ❌ Không hợp lệ | Thiếu chữ hoa |
| `Ab1!` | ❌ Không hợp lệ | Quá ngắn (< 8 ký tự) |
| `Abcdefg12345678!` | ❌ Không hợp lệ | Quá dài (> 15 ký tự) |
| `Abc123!@` | ✅ Hợp lệ | Đủ độ dài, có chữ, chữ hoa, số và ký tự đặc biệt |

### 3.7.7. Triển khai Đồng bộ hóa Thời gian (Clock Synchronization - ISO 27799 Control 12.4.4 / 8.17)

**Mục tiêu bảo mật:** Đảm bảo tất cả các nhật ký hệ thống (Audit Logs), phiên đăng nhập (JWT), mã xác thực (OTP), thời gian khóa tài khoản (lockout), và thời gian truy cập khẩn cấp (Break Glass) đều sử dụng một nguồn thời gian thống nhất và chính xác. Tránh trường hợp sai lệch đồng hồ nội bộ của máy chủ (clock drift) hoặc người quản trị can thiệp thay đổi thời gian hệ thống để làm sai lệch nhật ký kiểm toán.

**Giải pháp triển khai:**
1. **Dịch vụ thời gian chuẩn (Time API):** Hệ thống tích hợp một API thời gian nội bộ tin cậy chạy tại địa chỉ `http://localhost:8000/api/time`. API này trả về cấu trúc thời gian chuẩn hóa dưới dạng JSON bao gồm trường `timestamp` (Unix epoch tính bằng giây).
2. **Cơ chế đồng bộ hóa thông minh (Time utility):** Tại backend, module [time.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/utils/time.js) sẽ tự động gửi yêu cầu đến Time API khi khởi chạy hệ thống và định kỳ mỗi 15 phút.
   - **Tính toán sai lệch (Time Offset):** Hệ thống đo lường độ lệch (offset) giữa thời gian nhận từ API chuẩn và thời gian của đồng hồ nội bộ máy chủ: 
     $$\text{Offset} = \text{Time}_{\text{API}} - \text{Time}_{\text{Local}}$$
   - **Tính thời gian thực (getCurrentTime):** Khi bất kỳ dịch vụ nào yêu cầu thời gian hiện tại, thay vì gọi trực tiếp `new Date()`, hệ thống sẽ gọi hàm `getCurrentTime()` để lấy thời gian đã hiệu chỉnh:
     $$\text{CurrentTime} = \text{Date.now()} + \text{Offset}$$
     Giải pháp này giúp triệt tiêu độ trễ mạng của các cuộc gọi HTTP liên tiếp và phòng tránh việc bị chặn (Rate Limit) từ Time API.
3. **Cơ chế dự phòng (Fallback):** Trong trường hợp dịch vụ thời gian chuẩn bị gián đoạn kết nối, hệ thống sẽ tự động chuyển sang sử dụng thời gian của máy chủ làm dự phòng (`offset = 0`), đảm bảo hệ thống y tế hoạt động liên tục không gián đoạn.
4. **Áp dụng đồng bộ:** Hàm `getCurrentTime()` được áp dụng thống nhất trong toàn bộ logic nghiệp vụ nhạy cảm:
   - Ghi thời gian `created_at` chính xác cho bảng `audit_logs` tại [prisma.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/config/prisma.js).
   - Đăng ký, đăng nhập, khóa tài khoản, kích hoạt tài khoản và thay đổi/đặt lại mật khẩu trong [auth.service.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/services/auth.service.js) và [user.service.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/services/user.service.js).
   - Kiểm tra thời hạn hiệu lực của mật khẩu trong [passwordPolicy.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/utils/passwordPolicy.js).
   - Kiểm toán thời hạn OTP trong [otp.service.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/services/otp.service.js).
   - Ghi nhận thời gian khởi tạo và cập nhật của bệnh án trong [record.service.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/services/record.service.js).
   - Xác định thời hạn truy cập khẩn cấp Break Glass trong [breakGlass.controller.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/controllers/breakGlass.controller.js) và middleware kiểm soát truy cập [breakGlass.middleware.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/middlewares/breakGlass.middleware.js).
   - Kiểm tra tính hợp lệ trong tương lai của các lịch hẹn khám tại [appointment.validator.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/validators/appointment.validator.js) và cập nhật trạng thái lịch hẹn khám tại [appointment.service.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/services/appointment.service.js).
   - Xác định mốc thời gian lọc sinh hiệu trong [vital-signs.service.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/services/vital-signs.service.js).
   - Ghi nhận thời gian ký đơn thuốc chính xác xuất ra tệp PDF trong [prescription.controller.js](file:///d:/code/DATN/ISO_27799_Final_Project_CMCu/backend/src/controllers/prescription.controller.js).

## 3.8. Kết luận chương 3

Chương 3 đã trình bày chi tiết quá trình phân tích và thiết kế hệ thống Mini EMR, bao gồm:

1. **Phân tích yêu cầu**: Xác định 23 yêu cầu chức năng và 15 yêu cầu phi chức năng, đặc biệt là các yêu cầu bảo mật theo ISO 27799 (bao gồm đổi mật khẩu định kỳ 3 tháng/lần).

2. **Biểu đồ Use Case**: Xây dựng biểu đồ tổng thể và chi tiết cho 5 vai trò: Admin, Doctor, Nurse, Receptionist, Patient.

3. **Thiết kế cơ sở dữ liệu**: Thiết kế 11 bảng với đầy đủ các trường, khóa chính, khóa ngoại và mối quan hệ.

4. **Thiết kế API**: Xây dựng 8 nhóm API với hơn 40 endpoints, tuân thủ RESTful, kèm theo ví dụ và mã lỗi.

5. **Thiết kế kiến trúc hệ thống**: Kiến trúc 3 lớp (Client, Application, Data) với luồng xác thực MFA và luồng ghi audit log chi tiết.

6. **Triển khai các control ISO 27799**: Áp dụng RBAC, MFA, chính sách mật khẩu mạnh kèm hết hạn 3 tháng, Audit Log, Break Glass và hiển thị mã bệnh nhân trên mọi output.

