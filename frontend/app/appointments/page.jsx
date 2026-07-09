'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Button, FormField, Card, CardHeader, CardBody, CardFooter,
  Table, Badge, Alert, Modal, PageHeader, Spinner,
} from '@/components/ui';

const API_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://mini-emr-backend-tg4r.onrender.com';

export default function AppointmentsPage() {
  const [role, setRole] = useState(''); // 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN'
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  
  // Data lists
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Booking Form State
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    reason: '',
    notes: '',
    patient_id: '', // only receptionist/admin
  });
  
  // Modal state for Doctor adding notes
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');

  // Switch role and log in
  const handleRoleSwitch = async (selectedRole) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setAppointments([]);
    
    let email = '';
    const password = 'Password123!';
    
    if (selectedRole === 'PATIENT') email = 'patient@example.com';
    else if (selectedRole === 'DOCTOR') email = 'doctor@example.com';
    else email = 'admin@example.com'; // ADMIN & RECEPTIONIST use admin credentials

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        const { access_token, user: loggedUser } = data.data;
        setToken(access_token);
        setUser(loggedUser);
        setRole(selectedRole); // set the simulated role
        
        // Save to state & localstorage
        localStorage.setItem('sim_token', access_token);
        localStorage.setItem('sim_role', selectedRole);
      } else {
        setError(data.message || 'Đăng nhập giả lập thất bại. Hãy chắc chắn bạn đã seed cơ sở dữ liệu.');
      }
    } catch (err) {
      setError('Không thể kết nối đến Backend API.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    setApiLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAppointments(data.data.appointments);
      } else {
        setError(data.message || 'Không thể lấy danh sách lịch hẹn.');
      }
    } catch (err) {
      setError('Lỗi kết nối khi tải danh sách lịch hẹn.');
    } finally {
      setApiLoading(false);
    }
  }, [token]);

  // Fetch doctors list for booking form
  const fetchDoctors = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/appointments/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDoctors(data.data);
      }
    } catch (err) {
      console.error('Không thể tải danh sách bác sĩ:', err);
    }
  }, [token]);

  // Load initial data when token/role changes
  useEffect(() => {
    if (token) {
      fetchAppointments();
      if (role === 'PATIENT' || role === 'RECEPTIONIST' || role === 'ADMIN') {
        fetchDoctors();
      }
    }
  }, [token, role, fetchAppointments, fetchDoctors]);

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit booking
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    // Validations
    if (!formData.doctor_id) return setError('Vui lòng chọn bác sĩ.');
    if (!formData.appointment_date) return setError('Vui lòng chọn ngày giờ hẹn.');
    if ((role === 'RECEPTIONIST' || role === 'ADMIN') && !formData.patient_id) {
      return setError('Vui lòng điền ID Bệnh nhân.');
    }

    try {
      const body = {
        doctor_id: formData.doctor_id,
        appointment_date: new Date(formData.appointment_date).toISOString(),
        reason: formData.reason,
        notes: formData.notes,
      };
      
      if (role === 'RECEPTIONIST' || role === 'ADMIN') {
        body.patient_id = formData.patient_id;
      }

      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.status === 'success') {
        setSuccessMsg(`Đặt lịch thành công! Mã lịch hẹn: ${data.data.appointment_code}`);
        setFormData({ doctor_id: '', appointment_date: '', reason: '', notes: '', patient_id: '' });
        fetchAppointments();
      } else {
        const errMsg = (data.errors && Array.isArray(data.errors))
          ? `${data.message}: ${data.errors.join(', ')}`
          : (data.message || 'Không thể đặt lịch.');
        setError(errMsg);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi yêu cầu đặt lịch.');
    }
  };

  // Update status (Receptionist / Admin / Doctor)
  const handleUpdateStatus = async (id, status, notes = null) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg(`Đã cập nhật trạng thái lịch hẹn sang: ${status}`);
        fetchAppointments();
      } else {
        setError(data.message || 'Cập nhật trạng thái thất bại.');
      }
    } catch (err) {
      setError('Lỗi kết nối khi cập nhật.');
    }
  };

  // Cancel own appointment (Patient)
  const handleCancelOwn = async (id) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/appointments/me/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg('Hủy lịch hẹn thành công.');
        fetchAppointments();
      } else {
        setError(data.message || 'Không thể hủy lịch.');
      }
    } catch (err) {
      setError('Lỗi kết nối.');
    }
  };

  // Delete appointment (Admin)
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này không?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg('Đã xóa hoàn toàn lịch hẹn khỏi hệ thống.');
        fetchAppointments();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối.');
    }
  };

  // Open note modal for Doctor
  const openNoteModal = (appointment) => {
    setSelectedAppointment(appointment);
    setDoctorNotes(appointment.notes || '');
    setNoteModalOpen(true);
  };

  // Doctor completes visit
  const handleDoctorComplete = async () => {
    setNoteModalOpen(false);
    await handleUpdateStatus(selectedAppointment.id, 'COMPLETED', doctorNotes);
  };

  // Helper render status badge
  const renderStatus = (status) => {
    if (status === 'PENDING') return <Badge variant="warning">Chờ duyệt</Badge>;
    if (status === 'CONFIRMED') return <Badge variant="success">Đã duyệt</Badge>;
    if (status === 'CANCELLED') return <Badge variant="danger">Đã hủy</Badge>;
    if (status === 'COMPLETED') return <Badge variant="info">Đã khám</Badge>;
    return <Badge>{status}</Badge>;
  };

  // Table Columns config by Role
  const getColumns = () => {
    const baseCols = [
      { key: 'appointment_code', label: 'Mã lịch hẹn', render: (row) => <strong style={{ color: 'var(--color-primary)' }}>{row.appointment_code}</strong> },
      {
        key: 'appointment_date',
        label: 'Ngày hẹn',
        render: (row) => new Date(row.appointment_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
      },
      { key: 'reason', label: 'Lý do khám' },
      { key: 'status', label: 'Trạng thái', render: (row) => renderStatus(row.status) },
    ];

    if (role === 'PATIENT') {
      return [
        ...baseCols.slice(0, 1),
        { key: 'doctor', label: 'Bác sĩ', render: (row) => row.doctor?.full_name || 'N/A' },
        ...baseCols.slice(1),
        {
          key: 'actions',
          label: 'Hành động',
          render: (row) => (
            row.status === 'PENDING' && (
              <Button size="sm" variant="danger" onClick={() => handleCancelOwn(row.id)}>
                Hủy lịch
              </Button>
            )
          ),
        },
      ];
    }

    if (role === 'DOCTOR') {
      return [
        ...baseCols.slice(0, 1),
        { key: 'patient_code', label: 'Mã BN', render: (row) => <span className="patient-code">{row.patient?.patient_code}</span> },
        { key: 'patient_name', label: 'Họ tên', render: (row) => row.patient?.full_name },
        ...baseCols.slice(1, 3),
        { key: 'notes', label: 'Ghi chú lâm sàng' },
        baseCols[3], // status
        {
          key: 'actions',
          label: 'Khám / Cập nhật',
          render: (row) => (
            row.status !== 'COMPLETED' && row.status !== 'CANCELLED' && (
              <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button size="sm" onClick={() => openNoteModal(row)}>
                  Ghi chú & Xong
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(row.id, 'CANCELLED')}>
                  Hủy khám
                </Button>
              </span>
            )
          ),
        },
      ];
    }

    // Receptionist / Admin columns
    return [
      ...baseCols.slice(0, 1),
      { key: 'patient_code', label: 'Mã BN', render: (row) => <span className="patient-code">{row.patient?.patient_code}</span> },
      { key: 'patient_name', label: 'Họ tên', render: (row) => row.patient?.full_name },
      { key: 'doctor', label: 'Bác sĩ', render: (row) => row.doctor?.full_name },
      ...baseCols.slice(1, 3),
      baseCols[3], // status
      {
        key: 'actions',
        label: 'Điều phối lịch hẹn',
        render: (row) => (
          <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {row.status === 'PENDING' && (
              <Button size="sm" onClick={() => handleUpdateStatus(row.id, 'CONFIRMED')}>
                Duyệt lịch
              </Button>
            )}
            {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
              <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(row.id, 'CANCELLED')}>
                Hủy lịch
              </Button>
            )}
            {role === 'ADMIN' && (
              <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
                Xóa
              </Button>
            )}
          </span>
        ),
      },
    ];
  };

  return (
    <div className="page">
      <PageHeader
        title="Quản Lý Lịch Hẹn Khám Bệnh"
        subtitle="Hệ thống đặt lịch điều phối bệnh nhân. Tuân thủ an toàn thông tin y tế ISO 27799."
      />

      {/* GIẢ LẬP VAI TRÒ ĐỂ KIỂM THỬ */}
      <Card style={{ marginBottom: 'var(--space-5)', background: 'var(--color-primary-light)' }}>
        <CardHeader title="Trình kiểm thử giả lập vai trò (RBAC Simulator)" />
        <CardBody style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
            Chọn vai trò đăng nhập để kiểm thử luồng nghiệp vụ & bảo mật tương ứng:
          </span>
          <Button variant={role === 'PATIENT' ? 'primary' : 'secondary'} onClick={() => handleRoleSwitch('PATIENT')} disabled={loading}>
            Bệnh nhân
          </Button>
          <Button variant={role === 'DOCTOR' ? 'primary' : 'secondary'} onClick={() => handleRoleSwitch('DOCTOR')} disabled={loading}>
            Bác sĩ
          </Button>
          <Button variant={role === 'RECEPTIONIST' ? 'primary' : 'secondary'} onClick={() => handleRoleSwitch('RECEPTIONIST')} disabled={loading}>
            Lễ tân
          </Button>
          <Button variant={role === 'ADMIN' ? 'primary' : 'secondary'} onClick={() => handleRoleSwitch('ADMIN')} disabled={loading}>
            Quản trị viên (Admin)
          </Button>
          {loading && <Spinner />}
        </CardBody>
      </Card>

      {/* THÔNG BÁO */}
      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {!role ? (
        <Alert variant="info">Vui lòng chọn một vai trò giả lập ở trên để kết nối hệ thống.</Alert>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: (role === 'PATIENT' || role === 'RECEPTIONIST' || role === 'ADMIN') ? '1fr 2fr' : '1fr', gap: 'var(--space-5)' }}>
          
          {/* CỘT 1: FORM ĐẶT LỊCH (Bệnh nhân / Lễ tân / Admin) */}
          {(role === 'PATIENT' || role === 'RECEPTIONIST' || role === 'ADMIN') && (
            <Card>
              <CardHeader title={role === 'PATIENT' ? "Đặt lịch khám mới" : "Đặt hộ lịch khám"} />
              <form onSubmit={handleCreateAppointment}>
                <CardBody>
                  {/* Trạng thái Lễ tân đặt hộ bắt buộc điền ID bệnh nhân hành chính */}
                  {(role === 'RECEPTIONIST' || role === 'ADMIN') && (
                    <FormField
                      label="ID hồ sơ Bệnh nhân"
                      required
                      name="patient_id"
                      value={formData.patient_id}
                      onChange={handleInputChange}
                      placeholder="VD: 1, 2"
                      hint="Nhập ID số của bệnh nhân có sẵn trong hệ thống (Hồ sơ hành chính)"
                    />
                  )}

                  <FormField
                    label="Chọn Bác sĩ khám"
                    required
                    as="select"
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.full_name} ({doc.email})
                      </option>
                    ))}
                  </FormField>

                  <FormField
                    label="Ngày giờ hẹn khám"
                    required
                    type="datetime-local"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleInputChange}
                  />

                  <FormField
                    label="Lý do khám / Triệu chứng lâm sàng"
                    as="textarea"
                    rows={3}
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="VD: Sốt cao, nhức đầu liên tục..."
                  />

                  <FormField
                    label="Ghi chú thêm"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Không bắt buộc"
                  />
                </CardBody>
                <CardFooter>
                  <Button type="submit">Xác nhận đặt lịch</Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* CỘT 2: DANH SÁCH LỊCH HẸN KHÁM */}
          <Card>
            <CardHeader
              title={
                role === 'PATIENT' ? 'Lịch hẹn của tôi' :
                role === 'DOCTOR' ? 'Danh sách ca khám được xếp' : 'Danh sách lịch khám toàn viện'
              }
              actions={
                <Button size="sm" variant="secondary" onClick={fetchAppointments} disabled={apiLoading}>
                  {apiLoading ? <Spinner /> : 'Làm mới'}
                </Button>
              }
            />
            <CardBody style={{ padding: 0 }}>
              <Table
                columns={getColumns()}
                data={appointments}
                emptyText="Chưa có lịch hẹn khám nào được ghi nhận."
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* MODAL GHI CHÚ BÁC SĨ & HOÀN THÀNH KHÁM */}
      <Modal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Ghi chú khám & Hoàn thành ca khám"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteModalOpen(false)}>Hủy</Button>
            <Button onClick={handleDoctorComplete}>Lưu Ghi Chú & Hoàn Thành</Button>
          </>
        }
      >
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <p>Điền chẩn đoán lâm sàng sơ bộ hoặc ghi chú hướng dẫn điều trị tiếp theo cho bệnh nhân:</p>
          <FormField
            label="Ghi chú khám lâm sàng"
            as="textarea"
            rows={4}
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="VD: Cho làm xét nghiệm máu, kê đơn giảm sốt..."
          />
        </div>
      </Modal>
    </div>
  );
}
