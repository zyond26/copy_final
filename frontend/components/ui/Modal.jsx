'use client';

import { CardHeader, CardBody, CardFooter } from './Card';

/**
 * Modal chuẩn. Dùng:
 * <Modal open={open} onClose={...} title="Xác nhận" footer={<Button>OK</Button>}>nội dung</Modal>
 */
export default function Modal({ open, onClose, title, footer, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <CardHeader
          title={title}
          actions={
            <button className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Đóng">
              ✕
            </button>
          }
        />
        <CardBody>{children}</CardBody>
        {footer && <CardFooter>{footer}</CardFooter>}
      </div>
    </div>
  );
}
