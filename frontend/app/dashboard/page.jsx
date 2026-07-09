'use client';


import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, FormField, Card, CardHeader, CardBody, CardFooter,
  Table, Badge, Alert, Modal, PageHeader, Spinner,
} from '@/components/ui';
import { MedicalRecordTable } from '@/src/components/MedicalRecordTable';
import { AppointmentCalendar } from '@/src/components/AppointmentCalendar';
import { useAuth } from '@/src/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mini-emr-backend-tg4r.onrender.com';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout, loading: loadingUser, refreshSession } = useAuth();

  // Helper render pagination
  const renderPagination = (currentPage, totalItems, pageSize, onPageChange) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return null;

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-4)',
        padding: 'var(--space-2)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        width: 'fit-content',
        margin: 'var(--space-4) auto 0 auto'
      }}>
        <Button
          size="sm"
          variant="secondary"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Trước
        </Button>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
          Trang {currentPage} / {totalPages} (Tổng số: {totalItems})
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau
        </Button>
      </div>
    );
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Common UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. DATA STATES
  // Patients
  const [patients, setPatients] = useState([]);
  const [patientsTotal, setPatientsTotal] = useState(0);
  const [patientsPage, setPatientsPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientFormData, setPatientFormData] = useState({
    full_name: '', dob: '', gender: 'MALE', phone: '', email: '', address: '', citizen_id: ''
  });

  // Medical Records
  const [records, setRecords] = useState([]);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const [recordFormData, setRecordFormData] = useState({
    patient_id: '',
    symptoms: '',
    diagnosis: '',
    conclusion: '',
    visit_date: new Date().toISOString().substring(0, 16),
    vital_temperature: '',
    vital_blood_pressure: '',
    vital_heart_rate: '',
    vital_spo2: '',
    vital_weight: '',
    vital_note: '',
    include_prescription: false,
    prescription_notes: '',
    prescription_items: [{ medicine_name: '', duration_days: 5, dosage: '1 viên', frequency: '2 lần / ngày', instruction: 'Sau khi ăn' }]
  });
  const [recordHistory, setRecordHistory] = useState([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editRecordFormData, setEditRecordFormData] = useState({
    symptoms: '', diagnosis: '', conclusion: '', status: 'OPEN'
  });

  // Break Glass
  const [breakGlassModalOpen, setBreakGlassModalOpen] = useState(false);
  const [pendingBreakGlassId, setPendingBreakGlassId] = useState(null);
  const [pendingBreakGlassPatientCode, setPendingBreakGlassPatientCode] = useState('');
  const [breakGlassReason, setBreakGlassReason] = useState('');
  const [breakGlassRequests, setBreakGlassRequests] = useState([]);
  const [breakGlassFormOpen, setBreakGlassFormOpen] = useState(false);
  const [newBreakGlassData, setNewBreakGlassData] = useState({ patient_code: '', reason: '' });

  // Vital Signs
  const [vitals, setVitals] = useState([]);
  const [vitalsPage, setVitalsPage] = useState(1);
  const [vitalsTotal, setVitalsTotal] = useState(0);
  const [vitalFormOpen, setVitalFormOpen] = useState(false);
  const [vitalFormData, setVitalFormData] = useState({
    medical_record_id: '', temperature: '', blood_pressure: '', heart_rate: '', spo2: '', weight: '', note: ''
  });
  const [selectedPatientVitals, setSelectedPatientVitals] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [vitalsFilterType, setVitalsFilterType] = useState('record');
  const [vitalsFilterId, setVitalsFilterId] = useState('');

  // Prescriptions
  const [prescriptionFormOpen, setPrescriptionFormOpen] = useState(false);
  const [prescriptionFormData, setPrescriptionFormData] = useState({
    medical_record_id: '', notes: '', items: [{ medicine_name: '', duration_days: 5, dosage: '1 viên', frequency: '2 lần / ngày', instruction: 'Sau khi ăn' }]
  });

  // Appointments (reused booking tab)
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointmentFormData, setAppointmentFormData] = useState({
    doctor_id: '', appointment_date: '', reason: '', notes: '', patient_id: ''
  });
  const [appointmentNoteModal, setAppointmentNoteModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentNotes, setAppointmentNotes] = useState('');

  // Patient profile settings
  const [patientProfile, setPatientProfile] = useState(null);
  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ full_name: '', username: '', dob: '', gender: 'MALE', phone: '', address: '' });

  // Audit Logs (Admin only)
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsFilter, setLogsFilter] = useState({ action: '', user_id: '' });

  // Users (Admin only)
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    username: '', email: '', password: '', full_name: '', role: 'DOCTOR', citizen_id: ''
  });
  const [editingUser, setEditingUser] = useState(null);

  // Roles (Admin only)
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '', description: '', permissions: []
  });

  // Summary stats widgets
  const [stats, setStats] = useState({
    patients: 0, appointments: 0, logs: 0, records: 0
  });

  // Load user details
  useEffect(() => {
    if (!loadingUser && (!token || !user)) {
      router.push('/');
    }
  }, [token, user, loadingUser, router]);

  // General wrapper for API calls
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const storedToken = localStorage.getItem('access_token') || token;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Session expired
      await logout();
      throw new Error('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
    }

    // Handles PDF downloads
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      return res.blob();
    }

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 403 && (data.code === 'PASSWORD_EXPIRED' || data.must_change_password)) {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...storedUser, must_change_password: true }));
        router.push('/change-password');
        throw new Error(data.message || 'Mật khẩu đã hết hạn. Vui lòng đổi mật khẩu.');
      }
      // Special check for Break Glass exception
      if (res.status === 403 && data.message && data.message.includes('Break Glass')) {
        const errorWithCode = new Error(data.message);
        errorWithCode.statusCode = 403;
        throw errorWithCode;
      }
      const errMsg = (data.errors && Array.isArray(data.errors))
        ? `${data.message}: ${data.errors.join(', ')}`
        : (data.message || 'Có lỗi xảy ra khi gửi yêu cầu.');
      throw new Error(errMsg);
    }

    return data;
  }, [token, router]);

  // Load summary stats on dashboard activation
  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch mock/real counts in parallel to optimize speed
      if (user.role === 'ADMIN') {
        const [patientsData, appointmentsData, logsData] = await Promise.all([
          apiFetch('/api/patients?limit=1'),
          apiFetch('/api/appointments?limit=1'),
          apiFetch('/api/audit-logs?limit=1')
        ]);
        setStats({
          patients: patientsData.data?.total || 0,
          appointments: appointmentsData.data?.total || 0,
          logs: logsData.data?.total || 0,
          records: 0
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, [user, apiFetch]);

  // Clear messages only when activeTab changes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

  // TRIGGER DATA LOADING ON TAB CHANGES
  useEffect(() => {
    if (!user || !token) return;

    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'patients') {
      fetchPatients();
    } else if (activeTab === 'records') {
      fetchRecords();
    } else if (activeTab === 'vitals') {
      fetchVitals();
    } else if (activeTab === 'appointments') {
      fetchAppointments();
      fetchDoctors();
    } else if (activeTab === 'settings') {
      fetchPatientProfile();
    } else if (activeTab === 'logs') {
      fetchAuditLogs();
    } else if (activeTab === 'breakglass') {
      fetchBreakGlassRequests();
    } else if (activeTab === 'users') {
      fetchUsers();
      fetchRoles(); // Load roles for the user form dropdown
    } else if (activeTab === 'roles') {
      fetchRoles();
      fetchPermissions();
    }
  }, [activeTab, user, token]);

  // BACKGROUND POLLING FOR PENDING BREAK GLASS REQUESTS
  useEffect(() => {
    if (!user || !token) return;
    if (user.role === 'ADMIN' || user.role === 'DOCTOR' || user.role === 'NURSE') {
      fetchBreakGlassRequests(false);
      const interval = setInterval(() => {
        fetchBreakGlassRequests(false);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  // Logout handler
  const handleLogout = async () => {
    await logout();
  };

  // ==========================================
  // TAB: PATIENTS
  // ==========================================
  const fetchPatients = async (page = 1, query = '') => {
    setLoading(true);
    try {
      let endpoint = `/api/patients?page=${page}&limit=15`;
      if (query) {
        endpoint = `/api/patients/search?q=${encodeURIComponent(query)}`;
      }
      const res = await apiFetch(endpoint);
      if (query) {
        setPatients(res.data || []);
        setPatientsTotal(res.data?.length || 0);
      } else {
        setPatients(res.data?.patients || []);
        setPatientsTotal(res.data?.total || 0);
      }
      setPatientsPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/patients/me');
      setPatientProfile(res.data);
      setProfileFormData({
        full_name: res.data.full_name || '',
        username: res.data.username || '',
        dob: res.data.dob ? res.data.dob.substring(0, 10) : '',
        gender: res.data.gender || 'MALE',
        phone: res.data.phone || '',
        address: res.data.address || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePatientProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        full_name: profileFormData.full_name,
        username: profileFormData.username,
        dob: profileFormData.dob,
        gender: profileFormData.gender,
        phone: profileFormData.phone,
        address: profileFormData.address,
      };
      const res = await apiFetch('/api/patients/me', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setPatientProfile(res.data);
      // Cập nhật thông tin user trong local state để đồng bộ hiển thị header
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.full_name = res.data.full_name;
      storedUser.username = res.data.username;
      localStorage.setItem('user', JSON.stringify(storedUser));

      if (refreshSession) {
        refreshSession();
      }

      setSuccess('Cập nhật thông tin hồ sơ cá nhân thành công.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePatientSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients(1, searchQuery);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingPatient) {
        await apiFetch(`/api/patients/${editingPatient.id}`, {
          method: 'PUT',
          body: JSON.stringify(patientFormData)
        });
        setSuccess('Cập nhật hồ sơ bệnh nhân thành công.');
      } else {
        await apiFetch('/api/patients', {
          method: 'POST',
          body: JSON.stringify(patientFormData)
        });
        setSuccess('Thêm bệnh nhân mới thành công.');
      }
      setPatientFormOpen(false);
      setEditingPatient(null);
      setPatientFormData({ full_name: '', dob: '', gender: 'MALE', phone: '', email: '', address: '', citizen_id: '' });
      fetchPatients();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditPatient = (pat) => {
    setEditingPatient(pat);
    setPatientFormData({
      full_name: pat.full_name || '',
      dob: pat.dob ? pat.dob.substring(0, 10) : '',
      gender: pat.gender || 'MALE',
      phone: pat.phone || '',
      email: pat.email || '',
      address: pat.address || '',
      citizen_id: pat.citizen_id || ''
    });
    setPatientFormOpen(true);
  };

  const openCreatePatient = () => {
    setEditingPatient(null);
    setPatientFormData({ full_name: '', dob: '', gender: 'MALE', phone: '', email: '', address: '', citizen_id: '' });
    setPatientFormOpen(true);
  };

  const deletePatient = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bệnh nhân này? Toàn bộ bệnh án liên quan cũng sẽ bị ảnh hưởng.')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/patients/${id}`, { method: 'DELETE' });
      setSuccess('Xóa bệnh nhân thành công.');
      fetchPatients();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAutoMergePatients = async () => {
    if (!window.confirm('Hệ thống sẽ tự động tìm và gộp các hồ sơ bệnh nhân bị trùng lặp dựa trên CCCD hoặc (Họ tên + Ngày sinh + Số điện thoại). Thao tác này không thể hoàn tác. Bạn có chắc chắn không?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/patients/auto-merge', { method: 'POST' });
      setSuccess(`Đã quét và gộp thành công ${res.data?.merged_groups || 0} hồ sơ/nhóm trùng lặp.`);
      fetchPatients(1, '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewPatientDetails = async (id) => {
    setError('');
    try {
      const res = await apiFetch(`/api/patients/${id}`);
      setSelectedPatient(res.data);
      setPatientModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // TAB: MEDICAL RECORDS
  // ==========================================
  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/records?page=${page}&limit=15`);
      const recordsList = res.data?.records || [];
      if (user?.role === 'PATIENT') {
        const detailedRecords = await Promise.all(
          recordsList.map(async (rec) => {
            try {
              const detailRes = await apiFetch(`/api/records/${rec.id}`);
              return detailRes.data;
            } catch (err) {
              console.error('Error fetching record details for patient:', err);
              return rec;
            }
          })
        );
        setRecords(detailedRecords);
      } else {
        setRecords(recordsList);
      }
      setRecordsTotal(res.data?.total || 0);
      setRecordsPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // 1. Tạo bệnh án chính
      const recordBody = {
        patient_id: recordFormData.patient_id.toString(),
        symptoms: recordFormData.symptoms,
        diagnosis: recordFormData.diagnosis,
        conclusion: recordFormData.conclusion,
        visit_date: new Date(recordFormData.visit_date).toISOString()
      };

      const recordRes = await apiFetch('/api/records', {
        method: 'POST',
        body: JSON.stringify(recordBody)
      });

      const newRecordId = recordRes.data.id;

      // 2. Tự động ghi sinh hiệu nếu bác sĩ có nhập
      const hasVitals = recordFormData.vital_temperature ||
        recordFormData.vital_blood_pressure ||
        recordFormData.vital_heart_rate ||
        recordFormData.vital_spo2 ||
        recordFormData.vital_weight ||
        recordFormData.vital_note;

      if (hasVitals) {
        const vitalsBody = {
          medical_record_id: newRecordId,
          temperature: recordFormData.vital_temperature ? parseFloat(recordFormData.vital_temperature) : null,
          blood_pressure: recordFormData.vital_blood_pressure ? recordFormData.vital_blood_pressure.trim() : null,
          heart_rate: recordFormData.vital_heart_rate ? parseInt(recordFormData.vital_heart_rate) : null,
          spo2: recordFormData.vital_spo2 ? parseInt(recordFormData.vital_spo2) : null,
          weight: recordFormData.vital_weight ? parseFloat(recordFormData.vital_weight) : null,
          note: recordFormData.vital_note ? recordFormData.vital_note.trim() : null
        };
        await apiFetch('/api/vital-signs', {
          method: 'POST',
          body: JSON.stringify(vitalsBody)
        });
      }

      // 3. Tự động kê đơn thuốc nếu bác sĩ chọn kê đơn và có nhập thuốc
      if (recordFormData.include_prescription) {
        const presItems = recordFormData.prescription_items.filter(it => it.medicine_name.trim() !== '');
        if (presItems.length > 0) {
          const presBody = {
            notes: recordFormData.prescription_notes || 'Đơn thuốc lập cùng bệnh án',
            items: presItems.map(it => ({
              medicine_name: it.medicine_name.trim(),
              duration_days: parseInt(it.duration_days) || 5,
              dosage: it.dosage.trim(),
              frequency: it.frequency.trim(),
              instruction: it.instruction.trim()
            }))
          };
          await apiFetch(`/api/medical-records/${newRecordId}/prescriptions`, {
            method: 'POST',
            body: JSON.stringify(presBody)
          });
        }
      }

      setSuccess('Lập bệnh án mới kèm các chỉ định sinh hiệu & đơn thuốc thành công.');
      setRecordFormOpen(false);

      // Reset form
      setRecordFormData({
        patient_id: '',
        symptoms: '',
        diagnosis: '',
        conclusion: '',
        visit_date: new Date().toISOString().substring(0, 16),
        vital_temperature: '',
        vital_blood_pressure: '',
        vital_heart_rate: '',
        vital_spo2: '',
        vital_weight: '',
        vital_note: '',
        include_prescription: false,
        prescription_notes: '',
        prescription_items: [{ medicine_name: '', duration_days: 5, dosage: '1 viên', frequency: '2 lần / ngày', instruction: 'Sau khi ăn' }]
      });
      fetchRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  const viewRecordDetails = async (recordOrId, overrideReason = '') => {
    const isObject = typeof recordOrId === 'object' && recordOrId !== null;
    const id = isObject ? recordOrId.id : recordOrId;
    setError('');
    try {
      const endpoint = `/api/records/${id}`;
      const res = await apiFetch(endpoint);
      setSelectedRecord(res.data);
      setRecordModalOpen(true);
      setBreakGlassModalOpen(false);
      setBreakGlassReason('');
    } catch (err) {
      if (err.statusCode === 403 && user?.role !== 'PATIENT') {
        setPendingBreakGlassId(id);
        const pCode = isObject ? recordOrId.patients?.patient_code : (selectedRecord?.patients?.patient_code || '');
        setPendingBreakGlassPatientCode(pCode);
        setBreakGlassModalOpen(true);
      } else {
        setError(err.message);
      }
    }
  };

  const handleConfirmBreakGlass = async () => {
    if (!breakGlassReason.trim()) {
      alert('Vui lòng cung cấp lý do truy cập khẩn cấp.');
      return;
    }
    try {
      const body = {
        patient_code: pendingBreakGlassPatientCode,
        reason: breakGlassReason.trim()
      };
      await apiFetch('/api/break-glass', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setSuccess('Yêu cầu Break Glass đã được gửi tới bác sĩ lập bệnh án. Đang chờ phê duyệt.');
      setBreakGlassModalOpen(false);
      setBreakGlassReason('');
      fetchBreakGlassRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditRecord = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/records/${editingRecord.id}`, {
        method: 'PUT',
        body: JSON.stringify(editRecordFormData)
      });
      setSuccess('Cập nhật bệnh án thành công.');
      setEditingRecord(null);
      if (selectedRecord && selectedRecord.id === editingRecord.id) {
        viewRecordDetails(selectedRecord.id);
      }
      fetchRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  const viewRecordHistory = async (id) => {
    try {
      const res = await apiFetch(`/api/records/${id}/history`);
      setRecordHistory(res.data || []);
      setHistoryModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const exportRecordPdf = async (id) => {
    try {
      const record = records.find(r => r.id === id) || (selectedRecord && selectedRecord.id === id ? selectedRecord : null);

      let filename = `BenhAn_${id}.pdf`;
      if (record) {
        const rawName = record.patient?.full_name || record.patients?.full_name || 'BenhNhan';
        const cleanName = rawName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .replace(/[^a-zA-Z0-9]/g, '');

        const rawCode = record.record_code || 'MR-0000';
        const cleanCode = rawCode.replace('REC', 'MR').replace('EMR', 'MR');

        filename = `${cleanCode}_${cleanName}.pdf`;
      }

      const blob = await apiFetch(`/api/records/${id}/pdf`);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Lỗi khi tải file PDF: ' + err.message);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa hoàn toàn bệnh án này?')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/records/${id}`, { method: 'DELETE' });
      setSuccess('Đã xóa bệnh án.');
      fetchRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // TAB: VITAL SIGNS
  // ==========================================
  const fetchVitals = async (page = 1, filterType = vitalsFilterType, filterId = vitalsFilterId) => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '';
      if (user.role === 'PATIENT') {
        const meRes = await apiFetch('/api/patients/me');
        endpoint = `/api/vital-signs/patient/${meRes.data.patient_code}?page=${page}&limit=15`;
      } else {
        if (!filterId) {
          setVitals([]);
          setVitalsTotal(0);
          return;
        }
        if (filterType === 'patient') {
          endpoint = `/api/vital-signs/patient/${filterId.trim()}?page=${page}&limit=10`;
        } else {
          endpoint = `/api/vital-signs/record/${filterId.trim()}`;
        }
      }
      const res = await apiFetch(endpoint);
      const list = res.data?.items || res.data?.vital_signs || (Array.isArray(res.data) ? res.data : []);
      setVitals(list);
      setVitalsTotal(res.data?.total || list.length);
      setVitalsPage(page);
    } catch (err) {
      setError(err.message);
      setVitals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVital = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const body = {
        ...vitalFormData,
        temperature: parseFloat(vitalFormData.temperature),
        heart_rate: parseInt(vitalFormData.heart_rate),
        spo2: parseInt(vitalFormData.spo2),
        weight: parseFloat(vitalFormData.weight),
        medical_record_id: vitalFormData.medical_record_id.toString()
      };
      const res = await apiFetch('/api/vital-signs', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (res.data?.is_abnormal) {
        setSuccess(`Đã lưu sinh hiệu. CẢNH BÁO BẤT THƯỜNG: ${res.data.alerts.join(', ')}`);
      } else {
        setSuccess('Lưu sinh hiệu thành công.');
      }
      setVitalFormOpen(false);
      setVitalFormData({ medical_record_id: '', temperature: '', blood_pressure: '', heart_rate: '', spo2: '', weight: '', note: '' });
      if (selectedRecord) {
        viewRecordDetails(selectedRecord.id);
      }
      if (res.data?.medical_records?.record_code) {
        setVitalsFilterType('record');
        setVitalsFilterId(res.data.medical_records.record_code);
        fetchVitals(1, 'record', res.data.medical_records.record_code);
      } else {
        fetchVitals();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // TAB: PRESCRIPTIONS
  // ==========================================
  const handleAddPrescriptionItem = () => {
    setPrescriptionFormData((prev) => ({
      ...prev,
      items: [...prev.items, { medicine_name: '', duration_days: 5, dosage: '1 viên', frequency: '2 lần / ngày', instruction: 'Sau khi ăn' }]
    }));
  };

  const handleRemovePrescriptionItem = (index) => {
    setPrescriptionFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handlePrescriptionItemChange = (index, field, value) => {
    setPrescriptionFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (prescriptionFormData.items.length === 0) {
      setError('Vui lòng thêm ít nhất một loại thuốc.');
      return;
    }
    try {
      const recordId = prescriptionFormData.medical_record_id;
      const body = {
        notes: prescriptionFormData.notes,
        items: prescriptionFormData.items.map((it) => ({
          ...it,
          duration_days: parseInt(it.duration_days)
        }))
      };
      await apiFetch(`/api/medical-records/${recordId}/prescriptions`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setSuccess('Kê đơn thuốc thành công.');
      setPrescriptionFormOpen(false);
      setPrescriptionFormData({
        medical_record_id: '', notes: '', items: [{ medicine_name: '', duration_days: 5, dosage: '1 viên', frequency: '2 lần / ngày', instruction: 'Sau khi ăn' }]
      });
      if (selectedRecord) {
        viewRecordDetails(selectedRecord.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const printPrescription = async (presId) => {
    try {
      const blob = await apiFetch(`/api/prescriptions/${presId}/print`);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `DonThuoc_${presId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Lỗi khi tải đơn thuốc PDF: ' + err.message);
    }
  };

  // ==========================================
  // TAB: APPOINTMENTS
  // ==========================================
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/appointments');
      setAppointments(res.data.appointments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await apiFetch('/api/appointments/doctors');
      setDoctors(res.data || []);
    } catch (err) {
      console.warn('Cannot load doctors list:', err);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const body = {
        doctor_id: appointmentFormData.doctor_id,
        appointment_date: new Date(appointmentFormData.appointment_date).toISOString(),
        reason: appointmentFormData.reason,
        notes: appointmentFormData.notes,
      };
      if (user.role === 'ADMIN' || user.role === 'RECEPTIONIST') {
        body.patient_id = appointmentFormData.patient_id.toString();
      }
      await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setSuccess('Đặt lịch hẹn khám thành công.');
      setAppointmentFormData({ doctor_id: '', appointment_date: '', reason: '', notes: '', patient_id: '' });
      fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateAppointmentStatus = async (id, status, notes = null) => {
    setError('');
    setSuccess('');
    try {
      // PATIENT can only update own appointments via /me/:id endpoint
      const endpoint = user.role === 'PATIENT'
        ? `/api/appointments/me/${id}`
        : `/api/appointments/${id}`;

      await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });
      setSuccess(`Cập nhật trạng thái lịch hẹn khám sang: ${status}`);
      fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOwnAppointment = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/appointments/me/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      setSuccess('Hủy lịch hẹn thành công.');
      fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  const openAppointmentNoteModal = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentNotes(appointment.notes || '');
    setAppointmentNoteModal(true);
  };

  const handleDoctorCompleteAppointment = async () => {
    setAppointmentNoteModal(false);
    await handleUpdateAppointmentStatus(selectedAppointment.id, 'COMPLETED', appointmentNotes);
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm('Bạn có muốn xóa hoàn toàn lịch hẹn này khỏi hệ thống?')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/appointments/${id}`, { method: 'DELETE' });
      setSuccess('Đã xóa lịch hẹn.');
      fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // TAB: AUDIT LOGS (Admin only)
  // ==========================================
  const fetchAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/audit-logs?page=${page}&limit=15`);
      setAuditLogs(res.data || []);
      setLogsTotal(res.pagination?.total || res.data?.length || 0);
      setLogsPage(page);
    } catch (err) {
      // Safe fallback
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogsCsv = async () => {
    try {
      const res = await fetch(`${API_URL}/api/audit-logs/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `AuditLogs_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Lỗi xuất CSV: ' + err.message);
    }
  };

  // ==========================================
  // TAB: BREAK GLASS REQUESTS (Admin/Doctor/Nurse)
  // ==========================================
  const fetchBreakGlassRequests = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await apiFetch('/api/break-glass');
      setBreakGlassRequests(res.data || []);
    } catch (err) {
      setBreakGlassRequests([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleRequestBreakGlassForm = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const body = {
        patient_id: parseInt(newBreakGlassData.patient_id),
        reason: newBreakGlassData.reason
      };
      await apiFetch('/api/break-glass', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setSuccess('Yêu cầu Break Glass đã được gửi lên hệ thống. Đang chờ Admin phê duyệt.');
      setBreakGlassFormOpen(false);
      setNewBreakGlassData({ patient_id: '', reason: '' });
      fetchBreakGlassRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApproveBreakGlass = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/break-glass/${id}/approve`, { method: 'PATCH' });
      setSuccess('Phê duyệt quyền truy cập khẩn cấp thành công.');
      fetchBreakGlassRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectBreakGlass = async (id) => {
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/break-glass/${id}/reject`, { method: 'PATCH' });
      setSuccess('Đã từ chối yêu cầu truy cập khẩn cấp.');
      fetchBreakGlassRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // TAB: USERS MANAGEMENT (Admin only)
  // ==========================================
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/users?page=${page}&limit=15`);
      setUsers(res.data?.users || res.data || []);
      setUsersTotal(res.data?.total || res.data?.length || 0);
      setUsersPage(page);
    } catch (err) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingUser) {
        await apiFetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            email: userFormData.email,
            full_name: userFormData.full_name,
            role: userFormData.role,
            citizen_id: userFormData.citizen_id
          })
        });
        setSuccess('Cập nhật tài khoản người dùng thành công.');
      } else {
        await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(userFormData)
        });
        setSuccess('Tạo tài khoản mới thành công.');
      }
      setUserFormOpen(false);
      setEditingUser(null);
      setUserFormData({ username: '', email: '', password: '', full_name: '', role: 'DOCTOR', citizen_id: '' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setUserFormData({
      username: u.username || '',
      email: u.email || '',
      password: '', // do not display
      full_name: u.full_name || '',
      role: u.role_ref?.name || u.role || 'DOCTOR',
      citizen_id: u.citizen_id || ''
    });
    setUserFormOpen(true);
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      setSuccess('Đã xóa tài khoản.');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // TAB: ROLES MANAGEMENT (Admin only)
  // ==========================================
  const fetchRoles = async () => {
    try {
      const res = await apiFetch('/api/roles');
      setRoles(res.data || []);
    } catch (err) {
      setError('Lỗi khi tải danh sách vai trò: ' + err.message);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await apiFetch('/api/permissions/sys/permissions');
      setPermissions(res.data || []);
    } catch (err) {
      console.warn('Lỗi khi tải danh sách quyền:', err);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingRole) {
        await apiFetch(`/api/roles/${editingRole.id}`, {
          method: 'PUT',
          body: JSON.stringify(roleFormData)
        });
        setSuccess('Cập nhật vai trò thành công.');
      } else {
        await apiFetch('/api/roles', {
          method: 'POST',
          body: JSON.stringify(roleFormData)
        });
        setSuccess('Tạo vai trò mới thành công.');
      }
      setRoleFormOpen(false);
      setEditingRole(null);
      setRoleFormData({ name: '', description: '', permissions: [] });
      fetchRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditRole = (r) => {
    setEditingRole(r);
    setRoleFormData({
      name: r.name || '',
      description: r.description || '',
      permissions: r.role_permissions ? r.role_permissions.map(rp => rp.permission_id) : []
    });
    setRoleFormOpen(true);
  };

  const deleteRole = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa vai trò này?')) return;
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/roles/${id}`, { method: 'DELETE' });
      setSuccess('Đã xóa vai trò.');
      fetchRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper render appointment status badge
  const renderStatus = (status) => {
    if (status === 'PENDING') return <Badge variant="warning">Chờ duyệt</Badge>;
    if (status === 'CONFIRMED') return <Badge variant="success">Đã duyệt</Badge>;
    if (status === 'CANCELLED') return <Badge variant="danger">Đã hủy</Badge>;
    if (status === 'COMPLETED') return <Badge variant="info">Đã khám</Badge>;
    return <Badge>{status}</Badge>;
  };

  // Render role badge with harmony colors
  const renderRoleBadge = (roleName) => {
    if (roleName === 'ADMIN') return <Badge variant="danger">Quản Trị Viên</Badge>;
    if (roleName === 'DOCTOR') return <Badge variant="primary">Bác Sĩ</Badge>;
    if (roleName === 'NURSE') return <Badge variant="info">Điều Dưỡng</Badge>;
    if (roleName === 'RECEPTIONIST') return <Badge variant="warning">Lễ Tân</Badge>;
    return <Badge variant="neutral">Bệnh Nhân</Badge>;
  };

  // Loading wrapper
  if (loadingUser || !user || !token) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
        <Spinner />
        <span>Đang kiểm tra thông tin phiên làm việc...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <style>{`
        @keyframes pulse-red {
          0% {
            transform: scale(0.9);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            transform: scale(1.1);
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
          }
          100% {
            transform: scale(0.9);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        .blinking-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          margin-left: 8px;
          vertical-align: middle;
          animation: pulse-red 1.2s infinite;
        }
      `}</style>
      {/* ────────────────────────────────────────────────────────
          SIDEBAR NAVIGATION
          ──────────────────────────────────────────────────────── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          EMR PORTAL
        </div>

        <div className="sidebar-user">
          <p className="sidebar-user__name">{user?.full_name}</p>
          <div className="sidebar-user__role">
            {renderRoleBadge(user?.role)}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeTab === 'overview' ? 'nav-item--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Tổng quan
          </div>

          {(user.role === 'ADMIN' || user.role === 'DOCTOR' || user.role === 'NURSE' || user.role === 'RECEPTIONIST') && (
            <div
              className={`nav-item ${activeTab === 'patients' ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab('patients')}
            >
              Hồ sơ Bệnh nhân
            </div>
          )}

          {(user.role === 'ADMIN' || user.role === 'DOCTOR' || user.role === 'NURSE' || user.role === 'PATIENT') && (
            <div
              className={`nav-item ${activeTab === 'records' ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab('records')}
            >
              Bệnh án Điện tử
            </div>
          )}

          {(user.role === 'ADMIN' || user.role === 'DOCTOR' || user.role === 'NURSE' || user.role === 'PATIENT') && (
            <div
              className={`nav-item ${activeTab === 'vitals' ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab('vitals')}
            >
              Chỉ số Sinh hiệu
            </div>
          )}

          {user.role === 'PATIENT' && (
            <div
              className={`nav-item ${activeTab === 'settings' ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Cài đặt hồ sơ
            </div>
          )}

          <div
            className={`nav-item ${activeTab === 'appointments' ? 'nav-item--active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Lịch hẹn khám
          </div>

          {(user.role === 'ADMIN' || user.role === 'DOCTOR' || user.role === 'NURSE') && (
            <div
              className={`nav-item ${activeTab === 'breakglass' ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab('breakglass')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>Truy cập khẩn cấp</span>
              {breakGlassRequests.some(r => r.status === 'PENDING') && (
                <span className="blinking-dot" title="Có yêu cầu truy cập khẩn cấp đang chờ duyệt" />
              )}
            </div>
          )}

          {user.role === 'ADMIN' && (
            <>
              <div
                className={`nav-item ${activeTab === 'logs' ? 'nav-item--active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                Nhật ký Audit Logs
              </div>
              <div
                className={`nav-item ${activeTab === 'users' ? 'nav-item--active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Quản lý người dùng
              </div>
              <div
                className={`nav-item ${activeTab === 'roles' ? 'nav-item--active' : ''}`}
                onClick={() => setActiveTab('roles')}
              >
                Phân quyền & Vai trò
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <Button variant="danger" size="sm" style={{ width: '100%' }} onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────
          MAIN CONTENT AREA
          ──────────────────────────────────────────────────────── */}
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-title-area">
            <h3 style={{ margin: 0, color: 'var(--color-primary-deep)', textTransform: 'capitalize' }}>
              {activeTab === 'overview' ? 'Bảng Điều Khiển' : activeTab}
            </h3>
          </div>
          <div>
            <Badge variant="neutral">IP: 127.0.0.1</Badge>
          </div>
        </header>

        <div className="dashboard-body-area" style={{ position: 'relative', minHeight: '350px' }}>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Spinner />
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Đang tải dữ liệu...</span>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              TAB: OVERVIEW
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div>
              <PageHeader
                title="Bảng Điều Khiển Tổng Quan"
                subtitle="Cổng tra cứu hồ sơ và theo dõi dữ liệu y tế an toàn."
              />

              {user.role === 'ADMIN' && (
                <div className="widgets-grid">
                  <div className="widget-card">
                    <p className="widget-title">Tổng số Bệnh nhân</p>
                    <p className="widget-value">{stats.patients}</p>
                    <p className="widget-desc">Hồ sơ hành chính đã tạo</p>
                  </div>
                  <div className="widget-card widget-card--info">
                    <p className="widget-title">Lịch Hẹn Khám</p>
                    <p className="widget-value">{stats.appointments}</p>
                    <p className="widget-desc">Lịch khám được điều phối</p>
                  </div>
                  <div className="widget-card widget-card--danger">
                    <p className="widget-title">Audit Logs ghi nhận</p>
                    <p className="widget-value">{stats.logs}</p>
                    <p className="widget-desc">Vết kiểm toán hệ thống</p>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader title="Thông Tin Tài Khoản Của Bạn" />
                <CardBody>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Họ và tên</p>
                      <strong style={{ fontSize: 'var(--text-base)' }}>{user.full_name}</strong>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Địa chỉ Email</p>
                      <strong style={{ fontSize: 'var(--text-base)' }}>{user.email}</strong>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Vai trò truy cập</p>
                      <strong style={{ fontSize: 'var(--text-base)' }}>{user.role}</strong>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>ID hệ thống</p>
                      <span className="patient-code">USER-{user.id}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              TAB: PATIENTS
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'patients' && (
            <div>
              <PageHeader
                title="Hồ Sơ Hành Chính Bệnh Nhân"
                subtitle="Tìm kiếm hành chính và quản lý thông tin bệnh nhân."
                actions={
                  (user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {user.role === 'ADMIN' && (
                        <Button variant="secondary" onClick={handleAutoMergePatients}>Tự động gộp dữ liệu lỗi</Button>
                      )}
                      <Button onClick={openCreatePatient}>+ Thêm bệnh nhân</Button>
                    </div>
                  )
                }
              />

              <Card style={{ marginBottom: 'var(--space-4)' }}>
                <CardBody style={{ padding: 'var(--space-3)' }}>
                  <form onSubmit={handlePatientSearchSubmit} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <div style={{ flex: 1 }}>
                      <FormField
                        placeholder="Tìm kiếm theo Tên hoặc Số CCCD/Citizen ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                    <Button type="submit">Tìm kiếm</Button>
                    {searchQuery && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSearchQuery('');
                          fetchPatients(1, '');
                        }}
                      >
                        Xóa lọc
                      </Button>
                    )}
                  </form>
                </CardBody>
              </Card>

              <Card>
                <CardBody style={{ padding: 0 }}>
                  <Table
                    columns={[
                      { key: 'patient_code', label: 'Mã BN', render: (row) => <span className="patient-code">{row.patient_code}</span> },
                      { key: 'full_name', label: 'Họ tên' },
                      {
                        key: 'dob',
                        label: 'Ngày sinh',
                        render: (row) => row.dob ? new Date(row.dob).toLocaleDateString('vi-VN') : 'N/A'
                      },
                      { key: 'gender', label: 'Giới tính', render: (row) => row.gender === 'MALE' ? 'Nam' : row.gender === 'FEMALE' ? 'Nữ' : 'Khác' },
                      { key: 'phone', label: 'Số điện thoại' },
                      { key: 'citizen_id', label: 'Số CCCD' },
                      {
                        key: 'actions',
                        label: 'Thao tác',
                        render: (row) => (
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button size="sm" variant="secondary" onClick={() => viewPatientDetails(row.id)}>Chi tiết</Button>
                            {(user.role === 'ADMIN' || user.role === 'RECEPTIONIST') && (
                              <>
                                <Button size="sm" onClick={() => openEditPatient(row)}>Sửa</Button>
                                {user.role === 'ADMIN' && (
                                  <Button size="sm" variant="danger" onClick={() => deletePatient(row.id)}>Xóa</Button>
                                )}
                              </>
                            )}
                          </div>
                        )
                      }
                    ]}
                    data={patients}
                    emptyText="Không tìm thấy bệnh nhân nào."
                  />
                  {renderPagination(patientsPage, patientsTotal, 15, fetchPatients)}
                </CardBody>
              </Card>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              TAB: MEDICAL RECORDS
              ──────────────────────────────────────────────────────── */}
          {activeTab === 'records' && (
            <div>
              <PageHeader
                title="Hồ Sơ Bệnh Án Điện Tử (EMR)"
                subtitle="Xem danh sách bệnh án điện tử, phiên bản thay đổi lịch sử và chi tiết điều trị."
                actions={
                  user.role === 'DOCTOR' && (
                    <Button onClick={() => setRecordFormOpen(true)}>+ Lập bệnh án mới</Button>
                  )
                }
              />

              {user.role === 'PATIENT' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {records.length === 0 ? (
                    <Card>
                      <CardBody style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-5)' }}>
                        Không tìm thấy hồ sơ bệnh án nào của bạn trên hệ thống.
                      </CardBody>
                    </Card>
                  ) : (
                    records.map((rec) => (
                      <Card key={rec.id} style={{ borderLeft: '4px solid var(--color-primary)' }}>
                        <CardHeader
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                              <div>
                                <span style={{ color: 'var(--color-primary-deep)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>Bệnh án: {rec.record_code}</span>
                                <span style={{ marginLeft: 'var(--space-3)', fontSize: 'var(--text-xs)', background: 'var(--color-primary-light)', color: 'var(--color-primary-deep)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                  ISO 27799 Secured
                                </span>
                              </div>
                              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                                Ngày khám: {new Date(rec.visit_date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          }
                        />
                        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', borderBottom: '1px dashed var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                            <div>
                              <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Mã bệnh nhân</strong>
                              <span>{rec.patients?.patient_code || rec.patient?.patient_code || 'N/A'}</span>
                            </div>
                            <div>
                              <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Bác sĩ phụ trách</strong>
                              <span>{rec.users?.full_name || rec.doctor?.full_name || 'N/A'}</span>
                            </div>
                          </div>

                          <div>
                            <h5 style={{ margin: '0 0 var(--space-1) 0', color: 'var(--color-primary-deep)', fontWeight: 600 }}>Triệu chứng lâm sàng</h5>
                            <p style={{ margin: 0, padding: 'var(--space-2)', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}>
                              {rec.symptoms || 'Không ghi nhận'}
                            </p>
                          </div>

                          <div>
                            <h5 style={{ margin: '0 0 var(--space-1) 0', color: 'var(--color-primary-deep)', fontWeight: 600 }}>Chẩn đoán y khoa</h5>
                            <p style={{ margin: 0, padding: 'var(--space-2)', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                              {rec.diagnosis || 'Không ghi nhận'}
                            </p>
                          </div>

                          <div>
                            <h5 style={{ margin: '0 0 var(--space-1) 0', color: 'var(--color-primary-deep)', fontWeight: 600 }}>Kết luận & Hướng điều trị</h5>
                            <p style={{ margin: 0, padding: 'var(--space-2)', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}>
                              {rec.conclusion || 'Không ghi nhận'}
                            </p>
                          </div>

                          {/* Chỉ số sinh hiệu */}
                          <div style={{ marginTop: 'var(--space-2)' }}>
                            <h5 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-primary-deep)', fontWeight: 600 }}>Chỉ số sinh hiệu đã ghi nhận</h5>
                            {rec.vital_signs && rec.vital_signs.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {rec.vital_signs.map((vt) => (
                                  <div key={vt.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: vt.is_abnormal ? 'var(--color-danger-bg)' : 'var(--color-success-bg)' }}>
                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Nhiệt độ: {vt.temperature}°C</span>
                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Huyết áp: {vt.blood_pressure}</span>
                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Nhịp tim: {vt.heart_rate} bpm</span>
                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>SpO2: {vt.spo2}%</span>
                                    {vt.weight && <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Cân nặng: {vt.weight} kg</span>}
                                    {vt.is_abnormal && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', fontWeight: 700 }}>⚠️ Chỉ số bất thường</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Không có sinh hiệu được ghi nhận.</p>
                            )}
                          </div>

                          {/* Đơn thuốc chỉ định */}
                          <div style={{ marginTop: 'var(--space-2)' }}>
                            <h5 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--color-primary-deep)', fontWeight: 600 }}>Đơn thuốc chỉ định</h5>
                            {rec.prescriptions && rec.prescriptions.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {rec.prescriptions.map((pr) => (
                                  <div key={pr.id} style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--color-border)', paddingBottom: '4px', marginBottom: '6px' }}>
                                      <strong style={{ fontSize: 'var(--text-sm)' }}>Đơn thuốc chỉ định</strong>
                                      <Button size="sm" variant="secondary" onClick={() => printPrescription(pr.id)}>📄 In đơn thuốc</Button>
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--text-sm)' }}>
                                      {pr.prescription_items?.map((item, idx) => (
                                        <li key={idx} style={{ marginBottom: '2px' }}>
                                          <strong>{item.medicine_name}</strong> - {item.dosage}, {item.frequency} x {item.duration_days} ngày <em>({item.instruction})</em>
                                        </li>
                                      ))}
                                    </ul>
                                    {pr.notes && <p style={{ margin: '6px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Ghi chú: {pr.notes}</p>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Chưa có đơn thuốc chỉ định.</p>
                            )}
                          </div>
                        </CardBody>
                        <CardFooter style={{ display: 'flex', justifyContent: 'flex-end', background: '#fbfbf9', borderTop: '1px solid var(--color-border)' }}>
                          <Button onClick={() => exportRecordPdf(rec.id)}>📄 Tải Bệnh Án PDF</Button>
                        </CardFooter>
                      </Card>
                            ))
                  )}
                            {renderPagination(recordsPage, recordsTotal, 15, fetchRecords)}
                          </div>
                          ) : (
                          <>
                            <MedicalRecordTable
                              records={records}
                              onRefresh={fetchRecords}
                              onViewDetails={viewRecordDetails}
                              onEdit={(record) => {
                                setEditingRecord(record);
                                setEditRecordFormData({
                                  symptoms: record.symptoms || '',
                                  diagnosis: record.diagnosis || '',
                                  conclusion: record.conclusion || '',
                                  status: record.status || 'OPEN'
                                });
                              }}
                              onDelete={deleteRecord}
                              onExportPDF={exportRecordPdf}
                              onViewHistory={viewRecordHistory}
                            />
                            {renderPagination(recordsPage, recordsTotal, 15, fetchRecords)}
                          </>
              )}
                        </div>
          )}

                        {/* ────────────────────────────────────────────────────────
              TAB: VITAL SIGNS
              ──────────────────────────────────────────────────────── */}
                        {activeTab === 'vitals' && (
                          <div>
                            <PageHeader
                              title="Nhật Ký Chỉ Số Sinh Hiệu"
                              subtitle="Theo dõi nhiệt độ, huyết áp, nhịp tim và nhịp thở của bệnh nhân."
                              actions={
                                (user.role === 'NURSE' || user.role === 'DOCTOR') && (
                                  <Button onClick={() => setVitalFormOpen(true)}>+ Nhập chỉ số sinh hiệu</Button>
                                )
                              }
                            />

                            {user.role !== 'PATIENT' && (
                              <Card style={{ marginBottom: 'var(--space-4)' }}>
                                <CardBody style={{ padding: 'var(--space-3)' }}>
                                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                      <FormField
                                        label="Tìm kiếm theo"
                                        as="select"
                                        value={vitalsFilterType}
                                        onChange={(e) => {
                                          setVitalsFilterType(e.target.value);
                                          setVitalsFilterId('');
                                        }}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <option value="record">Mã bệnh án (Record Code)</option>
                                        <option value="patient">Mã bệnh nhân (Patient Code)</option>
                                      </FormField>
                                    </div>
                                    <div style={{ flex: 2, minWidth: '200px' }}>
                                      <FormField
                                        label={vitalsFilterType === 'record' ? "Nhập Mã bệnh án" : "Nhập Mã bệnh nhân"}
                                        placeholder={vitalsFilterType === 'record' ? "Ví dụ: BA-0001, BA-0002" : "Ví dụ: BN-0001, BN-0002"}
                                        value={vitalsFilterId}
                                        onChange={(e) => setVitalsFilterId(e.target.value)}
                                        style={{ marginBottom: 0 }}
                                      />
                                    </div>
                                    <Button onClick={() => fetchVitals(1, vitalsFilterType, vitalsFilterId)}>Tìm kiếm</Button>
                                    {vitalsFilterId && (
                                      <Button
                                        variant="secondary"
                                        onClick={() => {
                                          setVitalsFilterId('');
                                          fetchVitals(1, vitalsFilterType, '');
                                        }}
                                      >
                                        Xóa lọc
                                      </Button>
                                    )}
                                  </div>
                                </CardBody>
                              </Card>
                            )}

                            <Card>
                              <CardBody style={{ padding: 0 }}>
                                <Table
                                  columns={[
                                    { key: 'id', label: 'ID' },
                                    { key: 'record_code', label: 'Mã Bệnh Án', render: (row) => row.medical_records?.record_code || 'N/A' },
                                    { key: 'patient_name', label: 'Tên Bệnh Nhân', render: (row) => row.medical_records?.patients?.full_name || 'N/A' },
                                    { key: 'temp', label: 'Nhiệt độ', render: (row) => `${row.temperature}°C` },
                                    { key: 'bp', label: 'Huyết áp', render: (row) => row.blood_pressure },
                                    { key: 'hr', label: 'Nhịp tim', render: (row) => `${row.heart_rate} bpm` },
                                    { key: 'spo2', label: 'SpO2', render: (row) => `${row.spo2}%` },
                                    { key: 'weight', label: 'Cân nặng', render: (row) => `${row.weight} kg` },
                                    {
                                      key: 'alerts',
                                      label: 'Cảnh báo',
                                      render: (row) => (
                                        row.is_abnormal ? (
                                          <Badge variant="danger">Bất thường</Badge>
                                        ) : (
                                          <Badge variant="success">Bình thường</Badge>
                                        )
                                      )
                                    },
                                    { key: 'note', label: 'Ghi chú điều dưỡng' }
                                  ]}
                                  data={vitals}
                                  emptyText={
                                    user.role !== 'PATIENT' && !vitalsFilterId
                                      ? "Vui lòng chọn bộ lọc và nhập ID để tìm kiếm chỉ số sinh hiệu."
                                      : "Không có dữ liệu sinh hiệu nào."
                                  }
                                />
                                {renderPagination(vitalsPage, vitalsTotal, 15, fetchVitals)}
                              </CardBody>
                            </Card>
                          </div>
                        )}

                        {/* ────────────────────────────────────────────────────────
              TAB: APPOINTMENTS
              ──────────────────────────────────────────────────────── */}
                        {activeTab === 'appointments' && (
                          <AppointmentCalendar
                            appointments={appointments}
                            doctors={doctors}
                            onRefresh={fetchAppointments}
                            onAppointmentCompleted={async (medicalRecordId) => {
                              try {
                                const res = await apiFetch(`/api/records/${medicalRecordId}`);
                                if (res && res.data) {
                                  setActiveTab('records');
                                  setEditingRecord(res.data);
                                  setEditRecordFormData({
                                    symptoms: res.data.symptoms || '',
                                    diagnosis: res.data.diagnosis || '',
                                    conclusion: res.data.conclusion || '',
                                    status: res.data.status || 'OPEN'
                                  });
                                }
                              } catch (err) {
                                console.error('Không thể mở hồ sơ bệnh án tự động:', err.message);
                              }
                            }}
                          />
                        )}

                        {activeTab === 'settings' && user.role === 'PATIENT' && (
                          <div>
                            <PageHeader
                              title="Cài đặt hồ sơ cá nhân"
                              subtitle="Cập nhật thông tin hành chính còn thiếu để đảm bảo hồ sơ y tế chính xác."
                            />

                            <Card>
                              <CardBody>
                                <form onSubmit={handleUpdatePatientProfile} style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '640px' }}>
                                  <FormField
                                    label="Tên tài khoản (Username)"
                                    required
                                    value={profileFormData.username}
                                    onChange={(e) => setProfileFormData((prev) => ({ ...prev, username: e.target.value }))}
                                  />
                                  <FormField
                                    label="Họ và tên"
                                    required
                                    value={profileFormData.full_name}
                                    onChange={(e) => setProfileFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                                  />
                                  <FormField
                                    label="Ngày sinh"
                                    type="date"
                                    value={profileFormData.dob}
                                    onChange={(e) => setProfileFormData((prev) => ({ ...prev, dob: e.target.value }))}
                                  />
                                  <FormField
                                    label="Giới tính"
                                    as="select"
                                    value={profileFormData.gender}
                                    onChange={(e) => setProfileFormData((prev) => ({ ...prev, gender: e.target.value }))}
                                  >
                                    <option value="MALE">Nam</option>
                                    <option value="FEMALE">Nữ</option>
                                    <option value="OTHER">Khác</option>
                                  </FormField>
                                  <FormField
                                    label="Số điện thoại"
                                    value={profileFormData.phone}
                                    onChange={(e) => setProfileFormData((prev) => ({ ...prev, phone: e.target.value }))}
                                  />
                                  <FormField
                                    label="Địa chỉ cư trú"
                                    value={profileFormData.address}
                                    onChange={(e) => setProfileFormData((prev) => ({ ...prev, address: e.target.value }))}
                                  />
                                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                    <Button type="submit">Lưu thay đổi</Button>
                                    <Button variant="secondary" type="button" onClick={fetchPatientProfile}>Tải lại</Button>
                                  </div>
                                </form>
                              </CardBody>
                            </Card>

                            <Card style={{ marginTop: 'var(--space-4)' }}>
                              <CardHeader title="Thông tin hiện tại" />
                              <CardBody>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                                  <div>
                                    <p className="text-muted">Họ và tên</p>
                                    <strong>{user.full_name}</strong>
                                  </div>
                                  <div>
                                    <p className="text-muted">Tên tài khoản (Username)</p>
                                    <strong>{user.username}</strong>
                                  </div>
                                  <div>
                                    <p className="text-muted">Email</p>
                                    <strong>{user.email}</strong>
                                  </div>
                                  <div>
                                    <p className="text-muted">Vai trò</p>
                                    <strong>{user.role}</strong>
                                  </div>
                                  <div>
                                    <p className="text-muted">ID hệ thống</p>
                                    <strong className="patient-code">USER-{user.id}</strong>
                                  </div>
                                  {patientProfile && (
                                    <>
                                      <div>
                                        <p className="text-muted">Ngày sinh</p>
                                        <strong>{patientProfile.dob ? new Date(patientProfile.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</strong>
                                      </div>
                                      <div>
                                        <p className="text-muted">Giới tính</p>
                                        <strong>{patientProfile.gender === 'MALE' ? 'Nam' : patientProfile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</strong>
                                      </div>
                                      <div>
                                        <p className="text-muted">Số điện thoại</p>
                                        <strong>{patientProfile.phone || 'Chưa cập nhật'}</strong>
                                      </div>
                                      <div>
                                        <p className="text-muted">Địa chỉ</p>
                                        <strong>{patientProfile.address || 'Chưa cập nhật'}</strong>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </CardBody>
                            </Card>
                          </div>
                        )}

                        {/* ────────────────────────────────────────────────────────
              TAB: BREAK GLASS REQUESTS (Admin/Doctor/Nurse)
              ──────────────────────────────────────────────────────── */}
                        {activeTab === 'breakglass' && (
                          <div>
                            <PageHeader
                              title="Cơ Chế Phá Kính (Break Glass Requests)"
                              subtitle="Theo dõi và phê duyệt các yêu cầu truy cập khẩn cấp hồ sơ bệnh án chuẩn ISO 27799."
                              actions={
                                (user.role === 'DOCTOR' || user.role === 'NURSE') && (
                                  <Button onClick={() => setBreakGlassFormOpen(true)}>Gửi yêu cầu truy cập khẩn cấp</Button>
                                )
                              }
                            />

                            <Card>
                              <CardHeader title="Danh sách các yêu cầu Break Glass trong hệ thống" />
                              <CardBody style={{ padding: 0 }}>
                                <Table
                                  columns={[
                                    { key: 'id', label: 'ID' },
                                    { key: 'patient_code', label: 'Mã bệnh nhân', render: (row) => <span className="patient-code">{row.patient?.patient_code || `BN-${row.patient_id.toString()}`}</span> },
                                    { key: 'requester', label: 'Người yêu cầu', render: (row) => row.requester?.full_name || row.requester_ref?.full_name || 'N/A' },
                                    { key: 'reason', label: 'Lý do khẩn cấp' },
                                    {
                                      key: 'status',
                                      label: 'Trạng thái',
                                      render: (row) => (
                                        <Badge variant={row.status === 'APPROVED' ? 'success' : row.status === 'PENDING' ? 'warning' : 'danger'}>
                                          {row.status}
                                        </Badge>
                                      )
                                    },
                                    {
                                      key: 'expires_at',
                                      label: 'Hết hạn vào',
                                      render: (row) => row.expires_at ? new Date(row.expires_at).toLocaleString('vi-VN') : 'N/A'
                                    },
                                    {
                                      key: 'actions',
                                      label: 'Duyệt / Từ chối',
                                      render: (row) => (
                                        row.status === 'PENDING' && (user.role === 'ADMIN' || user.role === 'DOCTOR') && (
                                          <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                            <Button size="sm" onClick={() => handleApproveBreakGlass(row.id)}>Phê duyệt</Button>
                                            <Button size="sm" variant="danger" onClick={() => handleRejectBreakGlass(row.id)}>Từ chối</Button>
                                          </span>
                                        )
                                      )
                                    }
                                  ]}
                                  data={breakGlassRequests}
                                  emptyText="Chưa có yêu cầu truy cập khẩn cấp nào được ghi nhận."
                                />
                              </CardBody>
                            </Card>
                          </div>
                        )}

                        {/* ────────────────────────────────────────────────────────
              TAB: AUDIT LOGS (Admin only)
              ──────────────────────────────────────────────────────── */}
                        {activeTab === 'logs' && (
                          <div>
                            <PageHeader
                              title="Báo Cáo Nhật Ký Hệ Thống (Audit Logs)"
                              subtitle="Xem danh sách hoạt động và nhật ký hệ thống kiểm toán bảo mật ISO 27799."
                              actions={
                                <Button onClick={exportAuditLogsCsv}>Xuất báo cáo CSV</Button>
                              }
                            />

                            <Card>
                              <CardBody style={{ padding: 0 }}>
                                <Table
                                  columns={[
                                    { key: 'id', label: 'ID' },
                                    {
                                      key: 'user',
                                      label: 'Người dùng',
                                      render: (row) => row.users?.username || (row.user_id ? `ID ${row.user_id.toString()}` : 'Hệ thống')
                                    },
                                    { key: 'action', label: 'Hành động', render: (row) => <Badge variant="neutral">{row.action}</Badge> },
                                    { key: 'entity_type', label: 'Đối tượng' },
                                    { key: 'entity_id', label: 'ID Đối tượng', render: (row) => row.entity_id?.toString() },
                                    { key: 'ip_address', label: 'Địa chỉ IP' },
                                    {
                                      key: 'break_glass',
                                      label: 'Break Glass?',
                                      render: (row) => row.break_glass ? <Badge variant="danger">CÓ</Badge> : 'Không'
                                    },
                                    {
                                      key: 'created_at',
                                      label: 'Thời gian',
                                      render: (row) => new Date(row.created_at).toLocaleString('vi-VN')
                                    }
                                  ]}
                                  data={auditLogs}
                                  emptyText="Chưa ghi nhận nhật ký nào."
                                />
                                {renderPagination(logsPage, logsTotal, 15, fetchAuditLogs)}
                              </CardBody>
                            </Card>
                          </div>
                        )}

                        {/* ────────────────────────────────────────────────────────
              TAB: USERS MANAGEMENT (Admin only)
              ──────────────────────────────────────────────────────── */}
                        {activeTab === 'users' && (
                          <div>
                            <PageHeader
                              title="Quản Lý Tài Khoản Nhân Viên & Bệnh Nhân"
                              subtitle="Thêm tài khoản nhân viên y tế mới và gán vai trò truy cập."
                              actions={
                                <Button onClick={() => setUserFormOpen(true)}>+ Thêm tài khoản mới</Button>
                              }
                            />

                            <Card>
                              <CardBody style={{ padding: 0 }}>
                                <Table
                                  columns={[
                                    { key: 'id', label: 'ID' },
                                    { key: 'username', label: 'Username' },
                                    { key: 'full_name', label: 'Họ tên' },
                                    { key: 'email', label: 'Email' },
                                    { key: 'role', label: 'Vai trò', render: (row) => renderRoleBadge(row.role_ref?.name || row.role) },
                                    {
                                      key: 'status',
                                      label: 'Trạng thái',
                                      render: (row) => (
                                        <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'LOCKED' ? 'danger' : 'warning'}>
                                          {row.status}
                                        </Badge>
                                      )
                                    },
                                    {
                                      key: 'actions',
                                      label: 'Hành động',
                                      render: (row) => (
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                          <Button size="sm" onClick={() => openEditUser(row)}>Sửa</Button>
                                          {row.username !== 'admin_test' && (
                                            <Button size="sm" variant="danger" onClick={() => deleteUser(row.id)}>Xóa</Button>
                                          )}
                                        </div>
                                      )
                                    }
                                  ]}
                                  data={users}
                                  emptyText="Chưa có dữ liệu người dùng."
                                />
                                {renderPagination(usersPage, usersTotal, 15, fetchUsers)}
                              </CardBody>
                            </Card>
                          </div>
                        )}

                        {/* ────────────────────────────────────────────────────────
              TAB: ROLES (Admin only)
              ──────────────────────────────────────────────────────── */}
                        {activeTab === 'roles' && (
                          <div>
                            <PageHeader
                              title="Quản Lý Phân Quyền & Vai Trò"
                              subtitle="Tạo mới vai trò và cấu hình quyền hạn cho hệ thống EMR."
                              actions={
                                <Button onClick={() => {
                                  setEditingRole(null);
                                  setRoleFormData({ name: '', description: '', permissions: [] });
                                  setRoleFormOpen(true);
                                }}>+ Thêm vai trò</Button>
                              }
                            />

                            <Card>
                              <CardBody style={{ padding: 0 }}>
                                <Table
                                  columns={[
                                    { key: 'name', label: 'Tên Vai Trò', render: (row) => <strong>{row.name}</strong> },
                                    { key: 'description', label: 'Mô tả', render: (row) => row.description || 'N/A' },
                                    {
                                      key: 'users_count',
                                      label: 'Số lượng User',
                                      render: (row) => <Badge variant="info">{row._count?.users || 0} user</Badge>
                                    },
                                    {
                                      key: 'actions',
                                      label: 'Thao tác',
                                      render: (row) => (
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                          <Button size="sm" onClick={() => openEditRole(row)}>Chi tiết & Sửa</Button>
                                          {row.name !== 'ADMIN' && (
                                            <Button size="sm" variant="danger" onClick={() => deleteRole(row.id)}>Xóa</Button>
                                          )}
                                        </div>
                                      )
                                    }
                                  ]}
                                  data={roles}
                                  emptyText="Chưa có dữ liệu vai trò."
                                />
                              </CardBody>
                            </Card>
                          </div>
                        )}
                      </div>
      </main>

      {/* ────────────────────────────────────────────────────────
          MODALS
          ──────────────────────────────────────────────────────── */}

              {/* MODAL: PATIENT DETAILS */}
              <Modal
                open={patientModalOpen}
                onClose={() => setPatientModalOpen(false)}
                title="Chi tiết thông tin bệnh nhân"
                footer={<Button onClick={() => setPatientModalOpen(false)}>Đóng</Button>}
              >
                {selectedPatient && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong>Mã Bệnh nhân:</strong> <span className="patient-code">{selectedPatient.patient_code}</span>
                    </div>
                    <div>
                      <strong>Họ và tên:</strong> {selectedPatient.full_name}
                    </div>
                    <div>
                      <strong>Ngày sinh:</strong> {selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString('vi-VN') : 'N/A'}
                    </div>
                    <div>
                      <strong>Giới tính:</strong> {selectedPatient.gender === 'MALE' ? 'Nam' : selectedPatient.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    </div>
                    <div>
                      <strong>Số điện thoại:</strong> {selectedPatient.phone}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedPatient.email || 'N/A'}
                    </div>
                    <div>
                      <strong>Địa chỉ:</strong> {selectedPatient.address || 'N/A'}
                    </div>
                    <div>
                      <strong>Số CCCD:</strong> {selectedPatient.citizen_id || 'N/A'}
                    </div>
                  </div>
                )}
              </Modal>

              {/* MODAL: CREATE/EDIT PATIENT */}
              <Modal
                open={patientFormOpen}
                onClose={() => setPatientFormOpen(false)}
                title={editingPatient ? "Cập nhật thông tin bệnh nhân" : "Thêm bệnh nhân mới"}
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setPatientFormOpen(false)}>Hủy</Button>
                    <Button onClick={handleCreatePatient}>Xác nhận</Button>
                  </>
                }
              >
                <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <FormField
                    label="Họ và tên"
                    required
                    value={patientFormData.full_name}
                    onChange={(e) => setPatientFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                  <FormField
                    label="Ngày sinh"
                    type="date"
                    required
                    value={patientFormData.dob}
                    onChange={(e) => setPatientFormData(prev => ({ ...prev, dob: e.target.value }))}
                  />
                  <FormField
                    label="Giới tính"
                    as="select"
                    value={patientFormData.gender}
                    onChange={(e) => setPatientFormData(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </FormField>
                  <FormField
                    label="Số điện thoại"
                    required
                    value={patientFormData.phone}
                    onChange={(e) => setPatientFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <FormField
                    label="Địa chỉ Email"
                    value={patientFormData.email}
                    onChange={(e) => setPatientFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <FormField
                    label="Địa chỉ cư trú"
                    value={patientFormData.address}
                    onChange={(e) => setPatientFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                  <FormField
                    label="Số CCCD (12 chữ số)"
                    value={patientFormData.citizen_id}
                    onChange={(e) => setPatientFormData(prev => ({ ...prev, citizen_id: e.target.value }))}
                  />
                </form>
              </Modal>

              {/* MODAL: MEDICAL RECORD DETAILS (With nested vitals & prescriptions) */}
              <Modal
                open={recordModalOpen}
                onClose={() => setRecordModalOpen(false)}
                title="Hồ sơ bệnh án chi tiết"
                footer={
                  <>
                    {selectedRecord && user.role === 'DOCTOR' && selectedRecord.status === 'OPEN' && (
                      <Button onClick={() => {
                        setPrescriptionFormData(prev => ({ ...prev, medical_record_id: selectedRecord.id }));
                        setPrescriptionFormOpen(true);
                      }}>Kê đơn thuốc</Button>
                    )}
                    {selectedRecord && (user.role === 'NURSE' || user.role === 'DOCTOR') && (
                      <Button onClick={() => {
                        setVitalFormData(prev => ({ ...prev, medical_record_id: selectedRecord.id }));
                        setVitalFormOpen(true);
                      }}>Ghi sinh hiệu</Button>
                    )}
                    {selectedRecord && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setRecordModalOpen(false);
                          setActiveTab('vitals');
                          setVitalsFilterType('record');
                          setVitalsFilterId(selectedRecord.record_code);
                          fetchVitals(1, 'record', selectedRecord.record_code);
                        }}
                      >
                        Xem sinh hiệu
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => setRecordModalOpen(false)}>Đóng</Button>
                  </>
                }
              >
                {selectedRecord && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                      <div>
                        <strong>Mã bệnh án:</strong> <strong style={{ color: 'var(--color-primary)' }}>{selectedRecord.record_code}</strong>
                      </div>
                      <div>
                        <strong>Mã bệnh nhân:</strong> <span className="patient-code">{selectedRecord.patients?.patient_code}</span>
                      </div>
                      <div>
                        <strong>Họ tên bệnh nhân:</strong> {selectedRecord.patients?.full_name}
                      </div>
                      <div>
                        <strong>Bác sĩ khám:</strong> {selectedRecord.users?.full_name || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-deep)' }}>Triệu chứng / Lâm sàng</h5>
                      <div style={{ background: '#fcfbf7', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        {selectedRecord.symptoms}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-deep)' }}>Chẩn đoán</h5>
                      <div style={{ background: '#fcfbf7', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontWeight: 600 }}>
                        {selectedRecord.diagnosis}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-deep)' }}>Kết luận / Hướng điều trị</h5>
                      <div style={{ background: '#fcfbf7', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        {selectedRecord.conclusion || 'Không có'}
                      </div>
                    </div>

                    {/* NESTED VITAL SIGNS */}
                    <div>
                      <h5 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-deep)' }}>Chỉ số Sinh hiệu đã ghi</h5>
                      {selectedRecord.vital_signs && selectedRecord.vital_signs.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selectedRecord.vital_signs.map((vt) => (
                            <div key={vt.id} style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px', background: vt.is_abnormal ? 'var(--color-danger-bg)' : 'var(--color-success-bg)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                                <strong>Nhiệt độ: {vt.temperature}°C | Huyết áp: {vt.blood_pressure} | Nhịp tim: {vt.heart_rate} bpm | SpO2: {vt.spo2}% | Cân nặng: {vt.weight}kg</strong>
                                <span>{new Date(vt.created_at).toLocaleString('vi-VN')}</span>
                              </div>
                              {vt.note && <div style={{ fontSize: 'var(--text-xs)', marginTop: '4px', color: 'var(--color-text-muted)' }}>Ghi chú: {vt.note}</div>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>Chưa có ghi nhận sinh hiệu cho lượt khám này.</p>
                      )}
                    </div>

                    {/* NESTED PRESCRIPTIONS */}
                    <div>
                      <h5 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-deep)' }}>Đơn thuốc chỉ định</h5>
                      {selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {selectedRecord.prescriptions.map((pr) => (
                            <div key={pr.id} style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '12px', background: '#fcfbf7' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border)', paddingBottom: '6px', marginBottom: '6px' }}>
                                <strong>Đơn thuốc #{pr.id}</strong>
                                <Button size="sm" variant="secondary" onClick={() => printPrescription(pr.id)}>Tải PDF / In</Button>
                              </div>
                              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--text-sm)' }}>
                                {pr.prescription_items?.map((item, idx) => (
                                  <li key={idx} style={{ marginBottom: '4px' }}>
                                    <strong>{item.medicine_name}</strong> - Uống trong {item.duration_days} ngày. Liều lượng: {item.dosage}, Tần suất: {item.frequency}. <em>({item.instruction})</em>
                                  </li>
                                ))}
                              </ul>
                              {pr.notes && <p style={{ margin: '6px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Lời dặn bác sĩ: {pr.notes}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>Bác sĩ chưa kê đơn thuốc cho lượt khám này.</p>
                      )}
                    </div>
                  </div>
                )}
              </Modal>

              {/* MODAL: CREATE MEDICAL RECORD */}
              <Modal
                open={recordFormOpen}
                onClose={() => setRecordFormOpen(false)}
                title="Lập hồ sơ bệnh án mới"
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setRecordFormOpen(false)}>Hủy</Button>
                    <Button onClick={handleCreateRecord}>Tạo bệnh án</Button>
                  </>
                }
              >
                <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <FormField
                    label="ID Bệnh nhân"
                    required
                    placeholder="VD: 1"
                    value={recordFormData.patient_id}
                    onChange={(e) => setRecordFormData(prev => ({ ...prev, patient_id: e.target.value }))}
                  />
                  <FormField
                    label="Triệu chứng lâm sàng"
                    as="textarea"
                    rows={3}
                    placeholder="Mô tả triệu chứng bệnh nhân khai..."
                    value={recordFormData.symptoms}
                    onChange={(e) => setRecordFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                  />
                  <FormField
                    label="Chẩn đoán lâm sàng"
                    required
                    placeholder="Chẩn đoán bệnh..."
                    value={recordFormData.diagnosis}
                    onChange={(e) => setRecordFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  />
                  <FormField
                    label="Kết luận & Lời dặn"
                    as="textarea"
                    rows={3}
                    placeholder="Phương hướng điều trị và lời dặn dò..."
                    value={recordFormData.conclusion}
                    onChange={(e) => setRecordFormData(prev => ({ ...prev, conclusion: e.target.value }))}
                  />
                  <FormField
                    label="Ngày giờ khám"
                    type="datetime-local"
                    value={recordFormData.visit_date}
                    onChange={(e) => setRecordFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                  />

                  {/* CHỈ SỐ SINH HIỆU (TÙY CHỌN) */}
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-deep)', fontSize: '14px', fontWeight: 700 }}>📊 Chỉ số sinh hiệu (Tùy chọn)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <FormField
                        label="Nhiệt độ (°C)"
                        type="number"
                        step="0.1"
                        placeholder="VD: 37.2"
                        value={recordFormData.vital_temperature}
                        onChange={(e) => setRecordFormData(prev => ({ ...prev, vital_temperature: e.target.value }))}
                      />
                      <FormField
                        label="Huyết áp (mmHg)"
                        placeholder="VD: 120/80"
                        value={recordFormData.vital_blood_pressure}
                        onChange={(e) => setRecordFormData(prev => ({ ...prev, vital_blood_pressure: e.target.value }))}
                      />
                      <FormField
                        label="Nhịp tim (bpm)"
                        type="number"
                        placeholder="VD: 80"
                        value={recordFormData.vital_heart_rate}
                        onChange={(e) => setRecordFormData(prev => ({ ...prev, vital_heart_rate: e.target.value }))}
                      />
                      <FormField
                        label="Chỉ số SpO2 (%)"
                        type="number"
                        placeholder="VD: 98"
                        value={recordFormData.vital_spo2}
                        onChange={(e) => setRecordFormData(prev => ({ ...prev, vital_spo2: e.target.value }))}
                      />
                      <FormField
                        label="Cân nặng (kg)"
                        type="number"
                        step="0.1"
                        placeholder="VD: 60.5"
                        value={recordFormData.vital_weight}
                        onChange={(e) => setRecordFormData(prev => ({ ...prev, vital_weight: e.target.value }))}
                      />
                      <FormField
                        label="Ghi chú sinh hiệu"
                        placeholder="Bình thường / Sốt nhẹ..."
                        value={recordFormData.vital_note}
                        onChange={(e) => setRecordFormData(prev => ({ ...prev, vital_note: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* ĐƠN THUỐC CHỈ ĐỊNH */}
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        id="include_prescription"
                        checked={recordFormData.include_prescription}
                        onChange={(e) => setRecordFormData(prev => ({ ...prev, include_prescription: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="include_prescription" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-deep)', cursor: 'pointer' }}>
                        💊 Kê đơn thuốc kèm theo bệnh án
                      </label>
                    </div>

                    {recordFormData.include_prescription && (
                      <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <FormField
                          label="Lời dặn uống thuốc"
                          placeholder="VD: Uống sau khi ăn no, nghỉ ngơi 3 ngày..."
                          value={recordFormData.prescription_notes}
                          onChange={(e) => setRecordFormData(prev => ({ ...prev, prescription_notes: e.target.value }))}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600 }}>Danh sách thuốc chỉ định:</label>
                          {recordFormData.prescription_items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '4px' }}>
                              <div style={{ flex: '2 1 150px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '2px' }}>Tên thuốc</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Nhập tên thuốc..."
                                  value={item.medicine_name}
                                  onChange={(e) => {
                                    const newItems = [...recordFormData.prescription_items];
                                    newItems[idx].medicine_name = e.target.value;
                                    setRecordFormData(prev => ({ ...prev, prescription_items: newItems }));
                                  }}
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                />
                              </div>
                              <div style={{ width: '60px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '2px' }}>Số ngày</label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={item.duration_days}
                                  onChange={(e) => {
                                    const newItems = [...recordFormData.prescription_items];
                                    newItems[idx].duration_days = parseInt(e.target.value) || 0;
                                    setRecordFormData(prev => ({ ...prev, prescription_items: newItems }));
                                  }}
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                />
                              </div>
                              <div style={{ flex: '1 1 80px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '2px' }}>Liều dùng</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="VD: 1 viên"
                                  value={item.dosage}
                                  onChange={(e) => {
                                    const newItems = [...recordFormData.prescription_items];
                                    newItems[idx].dosage = e.target.value;
                                    setRecordFormData(prev => ({ ...prev, prescription_items: newItems }));
                                  }}
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                />
                              </div>
                              <div style={{ flex: '1 1 90px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '2px' }}>Tần suất</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="VD: 2 lần / ngày"
                                  value={item.frequency}
                                  onChange={(e) => {
                                    const newItems = [...recordFormData.prescription_items];
                                    newItems[idx].frequency = e.target.value;
                                    setRecordFormData(prev => ({ ...prev, prescription_items: newItems }));
                                  }}
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                />
                              </div>
                              <div style={{ flex: '1 1 100px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 500, display: 'block', marginBottom: '2px' }}>Hướng dẫn</label>
                                <input
                                  type="text"
                                  placeholder="VD: Sau ăn no"
                                  value={item.instruction}
                                  onChange={(e) => {
                                    const newItems = [...recordFormData.prescription_items];
                                    newItems[idx].instruction = e.target.value;
                                    setRecordFormData(prev => ({ ...prev, prescription_items: newItems }));
                                  }}
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = recordFormData.prescription_items.filter((_, i) => i !== idx);
                                  setRecordFormData(prev => ({ ...prev, prescription_items: newItems }));
                                }}
                                disabled={recordFormData.prescription_items.length === 1}
                                style={{ padding: '6px 10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', height: '30px', fontWeight: 600 }}
                              >
                                Xóa
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setRecordFormData(prev => ({
                                ...prev,
                                prescription_items: [...prev.prescription_items, { medicine_name: '', duration_days: 5, dosage: '1 viên', frequency: '2 lần / ngày', instruction: 'Sau khi ăn' }]
                              }));
                            }}
                            style={{ marginTop: '4px', width: 'fit-content', padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                          >
                            ➕ Thêm thuốc
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </Modal>

              {/* MODAL: EDIT MEDICAL RECORD */}
              {editingRecord && (
                <Modal
                  open={true}
                  onClose={() => setEditingRecord(null)}
                  title="Sửa nội dung bệnh án"
                  footer={
                    <>
                      <Button variant="secondary" onClick={() => setEditingRecord(null)}>Hủy</Button>
                      <Button onClick={handleEditRecord}>Cập nhật bản ghi</Button>
                    </>
                  }
                >
                  <form onSubmit={handleEditRecord} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <FormField
                      label="Triệu chứng lâm sàng"
                      as="textarea"
                      rows={3}
                      value={editRecordFormData.symptoms}
                      onChange={(e) => setEditRecordFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                    />
                    <FormField
                      label="Chẩn đoán lâm sàng"
                      required
                      value={editRecordFormData.diagnosis}
                      onChange={(e) => setEditRecordFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    />
                    <FormField
                      label="Kết luận"
                      as="textarea"
                      rows={3}
                      value={editRecordFormData.conclusion}
                      onChange={(e) => setEditRecordFormData(prev => ({ ...prev, conclusion: e.target.value }))}
                    />
                    <FormField
                      label="Trạng thái hồ sơ bệnh án"
                      as="select"
                      value={editRecordFormData.status}
                      onChange={(e) => setEditRecordFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="OPEN">Mở (OPEN) - Cho phép sửa đổi thêm</option>
                      <option value="CLOSED">Đóng (CLOSED) - Khóa cứng, lưu trữ vĩnh viễn</option>
                    </FormField>
                  </form>
                </Modal>
              )}

              {/* MODAL: BREAK GLASS POPUP REQUEST */}
              <Modal
                open={breakGlassModalOpen}
                onClose={() => {
                  setBreakGlassModalOpen(false);
                  setBreakGlassReason('');
                }}
                title="Yêu cầu truy cập khẩn cấp (Break Glass Request)"
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setBreakGlassModalOpen(false)}>Hủy bỏ</Button>
                    <Button onClick={handleConfirmBreakGlass}>Gửi yêu cầu truy cập</Button>
                  </>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Alert variant="danger">
                    <strong>CẢNH BÁO BẢO MẬT ISO 27799:</strong> Bạn không phải bác sĩ lập bệnh án này.
                    Để xem bệnh án, bạn cần cung cấp lý do khẩn cấp và gửi yêu cầu Break Glass để bác sĩ lập bệnh án phê duyệt.
                  </Alert>
                  <FormField
                    label="Mã Bệnh nhân"
                    readOnly
                    value={pendingBreakGlassPatientCode}
                  />
                  <FormField
                    label="Lý do truy cập khẩn cấp"
                    required
                    as="textarea"
                    rows={4}
                    placeholder="VD: Bệnh nhân hôn mê cần xem lịch sử dị ứng thuốc cấp cứu khẩn cấp..."
                    value={breakGlassReason}
                    onChange={(e) => setBreakGlassReason(e.target.value)}
                  />
                </div>
              </Modal>

              {/* MODAL: SEND BREAK GLASS REQUEST */}
              <Modal
                open={breakGlassFormOpen}
                onClose={() => setBreakGlassFormOpen(false)}
                title="Gửi yêu cầu xin quyền Break Glass"
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setBreakGlassFormOpen(false)}>Hủy</Button>
                    <Button onClick={handleRequestBreakGlassForm}>Gửi yêu cầu</Button>
                  </>
                }
              >
                <form onSubmit={handleRequestBreakGlassForm} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <FormField
                    label="Mã Bệnh nhân cần truy cập"
                    required
                    placeholder="VD: BN-0001, BN-0002"
                    value={newBreakGlassData.patient_code}
                    onChange={(e) => setNewBreakGlassData(prev => ({ ...prev, patient_code: e.target.value }))}
                  />
                  <FormField
                    label="Lý do khẩn cấp cụ thể"
                    required
                    as="textarea"
                    rows={4}
                    placeholder="Lý do xin cấp quyền..."
                    value={newBreakGlassData.reason}
                    onChange={(e) => setNewBreakGlassData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </form>
              </Modal>

              {/* MODAL: MEDICAL RECORD VERSION HISTORY */}
              <Modal
                open={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                title="Lịch sử thay đổi các phiên bản bệnh án (Audit Trail)"
                footer={<Button onClick={() => setHistoryModalOpen(false)}>Đóng</Button>}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {recordHistory.length === 0 ? (
                    <p>Bệnh án này chưa có lượt cập nhật nào (Phiên bản gốc hiện tại).</p>
                  ) : (
                    recordHistory.map((ver) => (
                      <div key={ver.id} style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px', background: '#fcfbf7' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border)', paddingBottom: '4px', marginBottom: '6px', fontSize: 'var(--text-xs)' }}>
                          <strong>Phiên bản #{ver.version}</strong>
                          <span>Ghi nhận: {new Date(ver.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)' }}>
                          <p style={{ margin: '0 0 4px' }}><strong>Triệu chứng:</strong> {ver.symptoms}</p>
                          <p style={{ margin: '0 0 4px' }}><strong>Chẩn đoán:</strong> {ver.diagnosis}</p>
                          <p style={{ margin: '0 0 4px' }}><strong>Kết luận:</strong> {ver.conclusion || 'Không có'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Modal>

              {/* MODAL: RECORD VITAL SIGNS */}
              <Modal
                open={vitalFormOpen}
                onClose={() => setVitalFormOpen(false)}
                title="Ghi nhận chỉ số sinh hiệu cho bệnh án"
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setVitalFormOpen(false)}>Hủy</Button>
                    <Button onClick={handleCreateVital}>Lưu sinh hiệu</Button>
                  </>
                }
              >
                <form onSubmit={handleCreateVital} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <FormField
                    label="ID Bệnh án liên kết"
                    required
                    readOnly={!!selectedRecord}
                    value={vitalFormData.medical_record_id}
                    onChange={(e) => setVitalFormData(prev => ({ ...prev, medical_record_id: e.target.value }))}
                    placeholder="VD: 1, 2"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <FormField
                      label="Nhiệt độ cơ thể (°C)"
                      type="number"
                      step="0.1"
                      required
                      value={vitalFormData.temperature}
                      onChange={(e) => setVitalFormData(prev => ({ ...prev, temperature: e.target.value }))}
                      placeholder="VD: 37.0"
                    />
                    <FormField
                      label="Huyết áp (systolic/diastolic)"
                      required
                      value={vitalFormData.blood_pressure}
                      onChange={(e) => setVitalFormData(prev => ({ ...prev, blood_pressure: e.target.value }))}
                      placeholder="VD: 120/80"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <FormField
                      label="Nhịp tim (bpm)"
                      type="number"
                      required
                      value={vitalFormData.heart_rate}
                      onChange={(e) => setVitalFormData(prev => ({ ...prev, heart_rate: e.target.value }))}
                      placeholder="VD: 80"
                    />
                    <FormField
                      label="Nồng độ SpO2 (%)"
                      type="number"
                      required
                      value={vitalFormData.spo2}
                      onChange={(e) => setVitalFormData(prev => ({ ...prev, spo2: e.target.value }))}
                      placeholder="VD: 98"
                    />
                  </div>
                  <FormField
                    label="Cân nặng (kg)"
                    type="number"
                    step="0.1"
                    value={vitalFormData.weight}
                    onChange={(e) => setVitalFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="VD: 60.5"
                  />
                  <FormField
                    label="Ghi chú lâm sàng của điều dưỡng"
                    as="textarea"
                    rows={2}
                    value={vitalFormData.note}
                    onChange={(e) => setVitalFormData(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Tình trạng tiếp nhận..."
                  />
                </form>
              </Modal>

              {/* MODAL: WRITE PRESCRIPTION */}
              <Modal
                open={prescriptionFormOpen}
                onClose={() => setPrescriptionFormOpen(false)}
                title="Kê đơn thuốc chỉ định điều trị"
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setPrescriptionFormOpen(false)}>Hủy</Button>
                    <Button onClick={handleCreatePrescription}>Xác nhận kê đơn</Button>
                  </>
                }
              >
                <form onSubmit={handleCreatePrescription} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <FormField
                    label="ID Bệnh án liên kết"
                    required
                    readOnly={!!selectedRecord}
                    value={prescriptionFormData.medical_record_id}
                    onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, medical_record_id: e.target.value }))}
                    placeholder="VD: 1, 2"
                  />
                  <FormField
                    label="Lời dặn bác sĩ / Ghi chú đơn thuốc"
                    as="textarea"
                    rows={2}
                    value={prescriptionFormData.notes}
                    onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Lời dặn uống thuốc chi tiết..."
                  />

                  <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '10px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-deep)' }}>Danh mục thuốc chỉ định</strong>
                      <Button type="button" size="sm" onClick={handleAddPrescriptionItem}>+ Thêm loại thuốc</Button>
                    </div>

                    {prescriptionFormData.items.map((item, idx) => (
                      <div key={idx} style={{ background: '#fcfbf7', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px', marginBottom: '8px', position: 'relative' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '6px' }}>
                          <FormField
                            label="Tên biệt dược / Thuốc"
                            required
                            value={item.medicine_name}
                            onChange={(e) => handlePrescriptionItemChange(idx, 'medicine_name', e.target.value)}
                            placeholder="VD: Paracetamol 500mg"
                            style={{ marginBottom: 0 }}
                          />
                          <FormField
                            label="Số ngày"
                            type="number"
                            required
                            value={item.duration_days}
                            onChange={(e) => handlePrescriptionItemChange(idx, 'duration_days', e.target.value)}
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                          <FormField
                            label="Liều lượng"
                            required
                            value={item.dosage}
                            onChange={(e) => handlePrescriptionItemChange(idx, 'dosage', e.target.value)}
                            placeholder="VD: 1 viên"
                            style={{ marginBottom: 0 }}
                          />
                          <FormField
                            label="Tần suất"
                            required
                            value={item.frequency}
                            onChange={(e) => handlePrescriptionItemChange(idx, 'frequency', e.target.value)}
                            placeholder="VD: 2 lần / ngày"
                            style={{ marginBottom: 0 }}
                          />
                          <FormField
                            label="Cách dùng"
                            value={item.instruction}
                            onChange={(e) => handlePrescriptionItemChange(idx, 'instruction', e.target.value)}
                            placeholder="VD: Uống sau khi ăn"
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                        {prescriptionFormData.items.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            style={{ marginTop: '4px', width: '100%' }}
                            onClick={() => handleRemovePrescriptionItem(idx)}
                          >
                            Xóa thuốc này
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </form>
              </Modal>

              {/* MODAL: DOCTOR COMPLETE APPOINTMENT AND ADD NOTES */}
              <Modal
                open={appointmentNoteModal}
                onClose={() => setAppointmentNoteModal(false)}
                title="Nhập kết luận & hoàn thành khám"
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setAppointmentNoteModal(false)}>Hủy</Button>
                    <Button onClick={handleDoctorCompleteAppointment}>Xác nhận hoàn thành</Button>
                  </>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p>Nhập ghi chú lâm sàng sơ bộ cho lượt khám hẹn này:</p>
                  <FormField
                    label="Ghi chú khám lâm sàng"
                    as="textarea"
                    rows={4}
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    placeholder="Nhập ghi chú chẩn đoán sơ bộ..."
                  />
                </div>
              </Modal>

              {/* MODAL: CREATE/EDIT USER */}
              <Modal
                open={userFormOpen}
                onClose={() => setUserFormOpen(false)}
                title={editingUser ? "Cập nhật thông tin tài khoản" : "Tạo tài khoản người dùng mới"}
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setUserFormOpen(false)}>Hủy</Button>
                    <Button onClick={handleCreateUser}>Xác nhận</Button>
                  </>
                }
              >
                <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <FormField
                    label="Username"
                    required
                    readOnly={!!editingUser}
                    value={userFormData.username}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="VD: doctor_test"
                  />
                  <FormField
                    label="Email đăng nhập"
                    required
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="VD: test@hospital.com"
                  />
                  {!editingUser && (
                    <FormField
                      label="Mật khẩu"
                      required
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Nhập mật khẩu..."
                    />
                  )}
                  <FormField
                    label="Họ và tên người dùng"
                    required
                    value={userFormData.full_name}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="VD: BS. Nguyễn Văn A"
                  />
                  <FormField
                    label="Vai trò truy cập hệ thống"
                    required
                    as="select"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="">-- Chọn vai trò --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name} {r.description ? `(${r.description})` : ''}</option>
                    ))}
                  </FormField>
                  <FormField
                    label="Số CCCD"
                    value={userFormData.citizen_id}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, citizen_id: e.target.value }))}
                    placeholder="Số CCCD 12 chữ số"
                  />
                </form>
              </Modal>

              {/* MODAL: CREATE/EDIT ROLE */}
              <Modal
                open={roleFormOpen}
                onClose={() => setRoleFormOpen(false)}
                title={editingRole ? "Cập nhật vai trò & phân quyền" : "Tạo vai trò mới"}
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setRoleFormOpen(false)}>Hủy</Button>
                    <Button onClick={handleCreateRole}>Xác nhận</Button>
                  </>
                }
              >
                <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <FormField
                    label="Tên vai trò (Mã vai trò viết hoa, VD: MANAGER)"
                    required
                    readOnly={!!editingRole && editingRole.name === 'ADMIN'}
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    placeholder="VD: TRUONG_KHOA"
                  />
                  <FormField
                    label="Mô tả vai trò"
                    as="textarea"
                    rows={2}
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả quyền hạn của vai trò này..."
                  />

                  <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '8px', color: 'var(--color-primary-deep)' }}>
                      Cấu hình Quyền hạn (Permissions)
                    </label>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '12px', maxHeight: '40vh', overflowY: 'auto', background: '#fcfbf7' }}>
                      {/* Group permissions by resource */}
                      {Object.entries(
                        permissions.reduce((acc, p) => {
                          if (!acc[p.resource]) acc[p.resource] = [];
                          acc[p.resource].push(p);
                          return acc;
                        }, {})
                      ).map(([resource, perms]) => (
                        <div key={resource} style={{ marginBottom: '16px' }}>
                          <strong style={{ display: 'block', marginBottom: '8px', textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            Resource: {resource}
                          </strong>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                            {perms.map(p => (
                              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={roleFormData.permissions.includes(p.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setRoleFormData(prev => ({ ...prev, permissions: [...prev.permissions, p.id] }));
                                    } else {
                                      setRoleFormData(prev => ({ ...prev, permissions: prev.permissions.filter(id => id !== p.id) }));
                                    }
                                  }}
                                  disabled={!!editingRole && editingRole.name === 'ADMIN'}
                                />
                                {p.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {editingRole && editingRole.name === 'ADMIN' && (
                      <p style={{ margin: '8px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
                        * Không thể chỉnh sửa quyền của vai trò ADMIN mặc định.
                      </p>
                    )}
                  </div>
                </form>
              </Modal>

            </div>
          );
}
