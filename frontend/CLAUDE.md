# QUY TẮC GIAO DIỆN – Mini EMR Frontend

File này dành cho AI (Claude, Copilot, Cursor...) và dev khi code giao diện.
**Mục tiêu: mọi trang do bất kỳ ai code đều trông giống nhau.**

## Quy tắc bắt buộc

1. **CHỈ import component từ `@/components/ui`** — KHÔNG tự viết button, input, card, table, modal mới:
   ```jsx
   import { Button, FormField, Card, CardHeader, CardBody, Table, StatusBadge, Alert, Modal, PageHeader, Spinner } from '@/components/ui';
   ```

2. **KHÔNG hardcode màu, cỡ chữ, khoảng cách.** Nếu cần style inline, dùng biến CSS trong `app/globals.css`:
   - Màu: `var(--color-primary)`, `var(--color-primary-deep)`, `var(--color-danger)`, `var(--color-text-muted)`...
   - Khoảng cách: `var(--space-1)` đến `var(--space-6)`
   - KHÔNG cài thêm thư viện UI (MUI, AntD, Bootstrap, Tailwind...).
   - **Font**: toàn hệ thống dùng Be Vietnam Pro (đã khai báo qua `next/font` trong `app/layout.jsx`). KHÔNG import font khác, KHÔNG đổi `font-family`.

   **Định hướng thẩm mỹ** (khi buộc phải tự style thứ chưa có sẵn): "lâm sàng nhưng ấm áp" — xanh rêu y tế trên nền giấy ngà, bo góc lớn, bóng mềm; KHÔNG dùng màu tím/gradient sặc sỡ, KHÔNG nền trắng tinh + xám lạnh. Các nét nhận diện (ruy băng gradient đầu trang, thanh accent trước tiêu đề card, chấm tròn trong badge) đã nằm sẵn trong CSS — không tự chế lại, không xóa.

3. **Bố cục trang chuẩn** — mọi page theo khung này:
   ```jsx
   <div className="page">
     <PageHeader title="Tên trang" subtitle="Mô tả ngắn" actions={<Button>Hành động chính</Button>} />
     <Card>
       <CardHeader title="Tiêu đề khối" />
       <CardBody>...nội dung...</CardBody>
     </Card>
   </div>
   ```

4. **Form**: dùng `FormField` cho mọi ô nhập (có sẵn label, lỗi đỏ, gợi ý). Nút submit dùng `Button`, đặt trong `CardFooter`.

5. **Bảng dữ liệu**: dùng `Table` với props `columns`/`data`. Trạng thái user/bệnh án hiển thị bằng `StatusBadge` (tự map ACTIVE/PENDING/LOCKED sang màu).

6. **Mã bệnh nhân** phải hiển thị trên mọi màn hình liên quan bệnh nhân (yêu cầu ISO 27799), dùng class có sẵn:
   ```jsx
   <span className="patient-code">{row.patient_code}</span>
   ```

7. **Thông báo**: thành công/lỗi dùng `Alert` (variant: success/warning/danger/info). Xác nhận xóa dùng `Modal` với nút `danger`.

8. **Ngôn ngữ giao diện: tiếng Việt.**

## Tham khảo nhanh

- Xem demo tất cả component: chạy `npm run dev` → mở `http://localhost:3001` (trang style guide, code tại `app/page.jsx` — copy mẫu từ đây).
- Backend API chạy ở `http://localhost:3000` (xem `backend/`), gọi qua biến môi trường `NEXT_PUBLIC_API_URL`.
- Muốn thêm component mới dùng chung? Thêm vào `components/ui/`, export trong `components/ui/index.js`, thêm demo vào `app/page.jsx` — KHÔNG viết riêng trong page.
