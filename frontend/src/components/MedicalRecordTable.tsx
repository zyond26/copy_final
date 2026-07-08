'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface MedicalRecord {
  id: string;
  record_code: string;
  patient_id: string;
  doctor_id: string;
  symptoms: string | null;
  diagnosis: string | null;
  conclusion: string | null;
  visit_date: string;
  status: string;
  patient?: {
    id: string;
    full_name: string;
    patient_code: string;
    email?: string;
  };
  doctor?: {
    id: string;
    full_name: string;
    email?: string;
  };
}

interface MedicalRecordTableProps {
  records: MedicalRecord[];
  onRefresh: () => void;
  onViewDetails?: (id: string) => void;
  onEdit?: (record: MedicalRecord) => void;
  onDelete?: (id: string) => void;
  onExportPDF?: (id: string) => void;
  onViewHistory?: (id: string) => void;
}

export const MedicalRecordTable: React.FC<MedicalRecordTableProps> = ({
  records,
  onRefresh,
  onViewDetails,
  onEdit,
  onDelete,
  onExportPDF,
  onViewHistory,
}) => {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const isReceptionist = user?.role === 'RECEPTIONIST';

  // Lọc bệnh án theo bộ phận (Departmental Isolation - ISO 27799 A.9)
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  return (
    <div style={{ width: '100%' }}>
      {/* Bộ lọc Khoa phòng / Bộ phận (Departmental Isolation - ISO 27799) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-4)',
        background: 'var(--color-surface)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border)'
      }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--color-primary-deep)', fontWeight: 700 }}>Danh Sách Bệnh Án Điện Tử</h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Hồ sơ y khoa lưu vết kiểm toán chuẩn ISO 27799</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Cách ly Bộ phận:</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 500
            }}
          >
            <option value="ALL">Tất cả khoa phòng</option>
            <option value="CARDIOLOGY">Khoa Tim mạch (Cardiology)</option>
            <option value="PEDIATRICS">Khoa Nhi (Pediatrics)</option>
            <option value="DERMATOLOGY">Khoa Da liễu (Dermatology)</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Mã Bệnh Án</th>
              <th>Bệnh Nhân</th>
              {user?.role !== 'DOCTOR' && <th>Bác Sĩ Khám</th>}
              <th>Triệu Chứng</th>
              <th>Chẩn Đoán</th>
              <th>Kết Luận</th>
              <th>Ngày Khám</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={user?.role === 'DOCTOR' ? 7 : 8} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-4)' }}>
                  Không có hồ sơ bệnh án nào được tìm thấy.
                </td>
              </tr>
            ) : (
              records.map((row) => {
                return (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 600 }}>{row.record_code}</td>
                    <td>
                      <div>{row.patient?.full_name || 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.patient?.patient_code}</div>
                    </td>
                    {user?.role !== 'DOCTOR' && <td>{row.doctor?.full_name || 'N/A'}</td>}
                    
                    {/* Triệu chứng */}
                    <td>
                      <span>{row.symptoms || 'Không ghi nhận'}</span>
                    </td>

                    {/* Chẩn đoán */}
                    <td>
                      <span>{row.diagnosis || 'Không ghi nhận'}</span>
                    </td>

                    {/* Kết luận */}
                    <td>
                      <div>
                        <div>{row.conclusion || 'Không ghi nhận'}</div>
                        <div style={{
                          display: 'inline-block',
                          fontSize: '9px',
                          background: 'var(--color-primary-light)',
                          color: 'var(--color-primary-deep)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginTop: '4px',
                          fontWeight: 600
                        }}>
                          🔒 Access logged under ISO 27799 Audit Trail
                        </div>
                      </div>
                    </td>

                    <td>{new Date(row.visit_date).toLocaleDateString('vi-VN')}</td>
                    <td>
                      {isPatient ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-success)', marginRight: '4px' }}>
                            ✅ Toàn quyền
                          </span>
                          {onViewDetails && (
                            <button
                              className="btn btn--sm"
                              onClick={() => onViewDetails(row.id)}
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                backgroundColor: 'var(--color-primary-light)',
                                color: 'var(--color-primary-deep)',
                                border: '1px solid var(--color-primary)'
                              }}
                              title="Xem chi tiết bệnh án đầy đủ sinh hiệu & đơn thuốc"
                            >
                              🔍 Chi tiết
                            </button>
                          )}
                          {onExportPDF && (
                            <button
                              className="btn btn--sm"
                              onClick={() => onExportPDF(row.id)}
                              style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}
                              title="Tải bệnh án PDF"
                            >
                              📄 In PDF
                            </button>
                          )}
                        </div>
                      ) : isReceptionist ? (
                        <button
                          className="btn btn--secondary btn--sm"
                          disabled
                          style={{ fontSize: '11px', padding: '4px 8px', opacity: 0.65 }}
                        >
                          🔒 Bị hạn chế
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Chi tiết (Modal) */}
                          {onViewDetails && (
                            <button
                              className="btn btn--sm"
                              onClick={() => onViewDetails(row.id)}
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                backgroundColor: 'var(--color-primary-light)',
                                color: 'var(--color-primary-deep)',
                                border: '1px solid var(--color-primary)'
                              }}
                              title="Xem chi tiết bệnh án đầy đủ sinh hiệu & đơn thuốc"
                            >
                              🔍 Chi tiết
                            </button>
                          )}

                          {/* Lịch sử đổi (Versions) */}
                          {onViewHistory && (
                            <button
                              className="btn btn--sm"
                              onClick={() => onViewHistory(row.id)}
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                backgroundColor: '#eef2f6',
                                color: '#1e293b',
                                border: '1px solid #cbd5e1'
                              }}
                              title="Xem lịch sử thay đổi phiên bản"
                            >
                              ⏳ Lịch sử
                            </button>
                          )}

                          {/* In PDF */}
                          {onExportPDF && (
                            <button
                              className="btn btn--sm"
                              onClick={() => onExportPDF(row.id)}
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                backgroundColor: '#ecfdf5',
                                color: '#065f46',
                                border: '1px solid #a7f3d0'
                              }}
                              title="Xuất bệnh án ra PDF"
                            >
                              📄 In PDF
                            </button>
                          )}

                          {/* Sửa (Chỉ Doctor tạo bệnh án & trạng thái khác CLOSED) */}
                          {onEdit && user?.role === 'DOCTOR' && row.doctor_id?.toString() === user?.id?.toString() && (
                            <button
                              className="btn btn--sm"
                              disabled={row.status === 'CLOSED'}
                              onClick={() => onEdit(row)}
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                backgroundColor: '#fffbeb',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                opacity: row.status === 'CLOSED' ? 0.5 : 1
                              }}
                              title={row.status === 'CLOSED' ? "Bệnh án đã đóng, không thể sửa" : "Sửa bệnh án"}
                            >
                              ✏️ Sửa
                            </button>
                          )}

                          {/* Xóa (Chỉ Admin) */}
                          {onDelete && user?.role === 'ADMIN' && (
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={() => onDelete(row.id)}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                              title="Xóa bệnh án khỏi hệ thống"
                            >
                              🗑️ Xóa
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
