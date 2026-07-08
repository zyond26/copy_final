/**
 * Badge trạng thái. Tự map status của hệ thống sang màu:
 * ACTIVE → xanh, PENDING → vàng, LOCKED → đỏ, còn lại → xám.
 */
const STATUS_MAP = {
  ACTIVE: { variant: 'success', label: 'Hoạt động' },
  PENDING: { variant: 'warning', label: 'Chờ xác thực' },
  LOCKED: { variant: 'danger', label: 'Đã khóa' },
  CLOSED: { variant: 'neutral', label: 'Đã đóng' },
};

export default function Badge({ variant = 'neutral', children }) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { variant: 'neutral', label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
