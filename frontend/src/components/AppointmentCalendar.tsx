'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

interface Appointment {
  id: string;
  appointment_code: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  status: string; // PENDING, CONFIRMED, COMPLETED, CANCELLED
  reason: string | null;
  notes: string | null;
  patient?: {
    id: string;
    full_name: string;
    phone?: string;
  };
  doctor?: {
    id: string;
    full_name: string;
  };
}

interface Doctor {
  id: string;
  full_name: string;
  email: string;
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onRefresh: () => void;
  onAppointmentCompleted?: (medicalRecordId: string) => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ appointments, doctors, onRefresh, onAppointmentCompleted }) => {
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';

  // Bộ lọc
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');

  // Form tạo lịch mới (đối với Bệnh nhân hoặc Lễ tân)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    reason: '',
    notes: '',
    patient_id: '', // Chỉ dùng cho Receptionist/Admin đặt lịch hộ
  });

  // Modal ghi chú lâm sàng y tế (đối với Bác sĩ)
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteAppointmentId, setNoteAppointmentId] = useState<string | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Lọc danh sách lịch hẹn khám
  const filteredAppointments = appointments.filter((app) => {
    let doctorMatch = true;
    let patientMatch = true;

    if (['ADMIN', 'RECEPTIONIST'].includes(currentRole)) {
      doctorMatch = selectedDoctorId === 'ALL' || app.doctor_id === selectedDoctorId;
    } else if (currentRole === 'DOCTOR') {
      doctorMatch = app.doctor_id === user?.id;
    }

    if (currentRole === 'PATIENT') {
      patientMatch = true;
    }

    return doctorMatch && patientMatch;
  });

  // Đổi trạng thái lịch hẹn khám (Hủy lịch, Xác nhận, Hoàn thành)
  const handleUpdateStatus = async (id: string, status: string, notes: string | null = null, diagnosis: string | null = null) => {
    setActionError('');
    setActionSuccess('');
    try {
      // PATIENT can only update own appointments via /me/:id endpoint
      const endpoint = currentRole === 'PATIENT' 
        ? `/api/appointments/me/${id}` 
        : `/api/appointments/${id}`;
      
      const res = await axiosInstance.put(endpoint, { status, notes, diagnosis });
      if (res.data.status === 'success') {
        setActionSuccess(`Đã cập nhật trạng thái lịch khám sang: ${status}`);
        onRefresh();
        setShowNoteModal(false);
        setClinicalNotes('');
        setDiagnosis('');
        if (status === 'COMPLETED' && res.data.data?.medical_record_id && onAppointmentCompleted) {
          onAppointmentCompleted(res.data.data.medical_record_id);
        }
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật lịch.');
    }
  };

  // Tạo lịch hẹn khám mới (Kiểm tra xung đột 30p được xử lý ở backend)
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!createFormData.doctor_id) return setActionError('Vui lòng chọn bác sĩ khám.');
    if (!createFormData.appointment_date) return setActionError('Vui lòng chọn thời gian khám.');

    try {
      const body: any = {
        doctor_id: createFormData.doctor_id,
        appointment_date: new Date(createFormData.appointment_date).toISOString(),
        reason: createFormData.reason,
        notes: createFormData.notes,
      };

      if (['RECEPTIONIST', 'ADMIN'].includes(currentRole)) {
        if (!createFormData.patient_id) return setActionError('Bắt buộc điền ID bệnh nhân.');
        body.patient_id = createFormData.patient_id;
      }

      const res = await axiosInstance.post('/api/appointments', body);

      if (res.data.status === 'success') {
        setActionSuccess(`Đặt lịch hẹn khám thành công! Mã: ${res.data.data.appointment_code}`);
        setCreateFormData({ doctor_id: '', appointment_date: '', reason: '', notes: '', patient_id: '' });
        setShowCreateModal(false);
        onRefresh();
      }
    } catch (err: any) {
      let msg = err.response?.data?.message;
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        msg = `${err.response.data.message}: ${err.response.data.errors.join(', ')}`;
      }
      setActionError(msg || err.message || 'Đã trùng lịch hẹn khám của bác sĩ (khoảng cách 30 phút).');
    }
  };

  // Render trạng thái badge của lịch khám
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span style={{ background: '#fdf6e3', color: '#9a6700', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Chờ duyệt</span>;
      case 'CONFIRMED':
        return <span style={{ background: '#ebf7ee', color: '#1a7a3c', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Đã xác nhận</span>;
      case 'COMPLETED':
        return <span style={{ background: '#edf3fa', color: '#2a5d9c', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Đã khám xong</span>;
      case 'CANCELLED':
        return <span style={{ background: '#fdf0ee', color: '#b3362c', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Đã hủy</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Bộ điều khiển đầu trang */}
      <div style={{
        background: 'var(--color-surface)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border)',
        marginBottom: 'var(--space-4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--color-primary-deep)', fontWeight: 700 }}>Lịch Trình Khám Lâm Sàng</h3>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Cơ chế tự động chống trùng lịch khám (trễ 30 phút) theo chuẩn ISO 27799</p>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {/* Ẩn nút Đặt lịch đối với Bác sĩ */}
            {currentRole !== 'DOCTOR' && (
              <button
                className="btn btn--primary btn--sm"
                onClick={() => setShowCreateModal(true)}
              >
                ➕ Đặt Lịch Hẹn Khám
              </button>
            )}
          </div>
        </div>

        {/* Thanh lọc */}
        {['ADMIN', 'RECEPTIONIST'].includes(currentRole) && (
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Lọc Bác sĩ:</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="ALL">Tất cả bác sĩ</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {actionSuccess && <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>{actionSuccess}</div>}
      {actionError && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>{actionError}</div>}

      {/* DANH SÁCH LỊCH HẸN KHÁM */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Mã Lịch</th>
              <th>Giờ Hẹn</th>
              <th>Ngày Hẹn</th>
              <th>Bệnh Nhân</th>
              <th>Bác Sĩ Khám</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-4)' }}>
                  Không có lịch hẹn nào.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.appointment_code}</td>
                  <td>{new Date(app.appointment_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{new Date(app.appointment_date).toLocaleDateString('vi-VN')}</td>
                  <td>{app.patient?.full_name || 'N/A'}</td>
                  <td>{app.doctor?.full_name || 'N/A'}</td>
                  <td>{renderStatusBadge(app.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['RECEPTIONIST', 'ADMIN'].includes(currentRole) && app.status === 'PENDING' && (
                        <button className="btn btn--primary btn--sm" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={() => handleUpdateStatus(app.id, 'CONFIRMED')}>Duyệt</button>
                      )}
                      {currentRole === 'DOCTOR' && app.status === 'CONFIRMED' && (
                        <button className="btn btn--primary btn--sm" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={() => { setNoteAppointmentId(app.id); setClinicalNotes(app.notes || ''); setDiagnosis(''); setShowNoteModal(true); }}>Khám</button>
                      )}
                      {app.status !== 'COMPLETED' && app.status !== 'CANCELLED' && (
                        <button className="btn btn--danger btn--sm" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}>Hủy</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: ĐẶT LỊCH HẸN KHÁM MỚI */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateAppointment} style={{ maxWidth: '500px' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-deep)', fontWeight: 700 }}>Đặt Lịch Hẹn Khám</h3>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              
              {/* Nếu là Lễ tân/Admin, yêu cầu nhập patient_id */}
              {['RECEPTIONIST', 'ADMIN'].includes(currentRole) && (
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>Mã định danh bệnh nhân (Patient ID):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 12"
                    value={createFormData.patient_id}
                    onChange={(e) => setCreateFormData({ ...createFormData, patient_id: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>Bác sĩ khám:</label>
                <select
                  required
                  value={createFormData.doctor_id}
                  onChange={(e) => setCreateFormData({ ...createFormData, doctor_id: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>Thời gian khám (Ngày giờ):</label>
                <input
                  type="datetime-local"
                  required
                  value={createFormData.appointment_date}
                  onChange={(e) => setCreateFormData({ ...createFormData, appointment_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>Lý do khám:</label>
                <textarea
                  placeholder="Triệu chứng lâm sàng sơ bộ..."
                  value={createFormData.reason}
                  onChange={(e) => setCreateFormData({ ...createFormData, reason: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button type="button" className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
              <button type="submit" className="btn btn--primary">Xác nhận đặt lịch</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: BÁC SĨ KHÁM & GHI CHÚ BỆNH ÁN LÂM SÀNG BAN ĐẦU */}
      {showNoteModal && noteAppointmentId && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-deep)', fontWeight: 700 }}>Chẩn đoán & Ghi chú lâm sàng</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowNoteModal(false)}>✕</button>
            </div>

            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '6px' }}>Chẩn đoán y khoa (Diagnosis):</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Nhập chẩn đoán y khoa (ví dụ: Viêm họng cấp, Tăng huyết áp...)..."
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '6px' }}>Kết luận & Hướng điều trị (Conclusion & Notes):</label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Nhập hướng điều trị, ghi chú hoặc lời dặn dò bác sĩ..."
                  rows={4}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button className="btn btn--secondary" onClick={() => setShowNoteModal(false)}>Hủy</button>
              <button className="btn btn--primary" onClick={() => handleUpdateStatus(noteAppointmentId, 'COMPLETED', clinicalNotes, diagnosis)}>
                Hoàn thành buổi khám
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
