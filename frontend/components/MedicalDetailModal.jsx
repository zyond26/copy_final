'use client';

import Modal from './ui/Modal';

export default function MedicalDetailModal({
  isOpen,
  onClose,
  medicalInfo,
}) {
  if (!medicalInfo) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`${medicalInfo.icon} ${medicalInfo.title}`}
      footer={
        <button className="btn btn--secondary" onClick={onClose}>
          Đóng
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Risk Level */}
        {medicalInfo.riskLevel && (
          <div style={{
            background: medicalInfo.riskLevel === 'HIGH' ? 'var(--color-danger-bg)' : medicalInfo.riskLevel === 'MEDIUM' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
            color: medicalInfo.riskLevel === 'HIGH' ? 'var(--color-danger)' : medicalInfo.riskLevel === 'MEDIUM' ? 'var(--color-warning)' : 'var(--color-success)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)'
          }}>
            Mức độ rủi ro: {medicalInfo.riskLevel === 'HIGH' ? 'Nguy cơ cao' : medicalInfo.riskLevel === 'MEDIUM' ? 'Rủi ro trung bình' : 'Thấp'}
          </div>
        )}

        {/* Full Description */}
        <div>
          <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-primary-deep)', fontWeight: 700, fontSize: 'var(--text-base)' }}>Thông tin y khoa chi tiết</h4>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
            {medicalInfo.description}
          </p>
        </div>

        {/* Symptoms */}
        {medicalInfo.symptoms && medicalInfo.symptoms.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-primary-deep)', fontWeight: 700, fontSize: 'var(--text-base)' }}>Dấu hiệu & Triệu chứng phát hiện</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              {medicalInfo.symptoms.map((symptom, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {symptom}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prevention */}
        {medicalInfo.prevention && medicalInfo.prevention.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-primary-deep)', fontWeight: 700, fontSize: 'var(--text-base)' }}>Biện pháp phòng ngừa chủ động</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              {medicalInfo.prevention.map((item, index) => (
                <li key={index} style={{ marginBottom: '4px', color: 'var(--color-success)' }}>
                  ✓ {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Treatment */}
        {medicalInfo.treatment && (
          <div>
            <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-primary-deep)', fontWeight: 700, fontSize: 'var(--text-base)' }}>Hướng dẫn điều trị lâm sàng</h4>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
              {medicalInfo.treatment}
            </p>
          </div>
        )}

        {/* When to See Doctor */}
        {medicalInfo.whenToSeeDoctor && (
          <div style={{
            background: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <h4 style={{ margin: '0 0 var(--space-1) 0', fontWeight: 700, fontSize: 'var(--text-sm)' }}>Khi nào cần gặp bác sĩ?</h4>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
              {medicalInfo.whenToSeeDoctor}
            </p>
          </div>
        )}

        {/* Source & Citation */}
        {(medicalInfo.source || medicalInfo.citation) && (
          <div style={{
            background: '#fcfbf7',
            border: '1px dashed var(--color-border)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {medicalInfo.source && (
              <div>
                <strong>📍 Nguồn dẫn chứng y khoa:</strong> {medicalInfo.source}
              </div>
            )}
            {medicalInfo.citation && (
              <div>
                <strong>🔗 Tài liệu tham khảo gốc:</strong>{' '}
                <a
                  href={medicalInfo.citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-primary-deep)', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}
                >
                  {medicalInfo.citation}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {medicalInfo.tags && medicalInfo.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            {medicalInfo.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  fontSize: 'var(--text-xs)',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary-deep)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
