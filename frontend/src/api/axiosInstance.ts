import axios from 'axios';

//const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = 'https://mini-emr-backend-tg4r.onrender.com';
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});



// Interceptor cho Request: Tự động đính kèm Token JWT từ localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') {
      return config;
    }

    if (!config.headers) {
      config.headers = {} as any;
    }
    const hasAuthHeader =
      config.headers['Authorization'] ||
      config.headers['authorization'] ||
      (typeof config.headers.get === 'function' && config.headers.get('Authorization'));

    if (!hasAuthHeader) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response: Xử lý tập trung các lỗi bảo mật (401, 403) theo chuẩn ISO 27799
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const data = error.response ? error.response.data : {};

    if (status === 401) {
      // Token hết hạn hoặc không hợp lệ -> Đăng xuất và điều hướng về trang chủ
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    } else if (status === 403) {
      // Xử lý Bắt buộc Đổi mật khẩu hết hạn
      if (data.code === 'PASSWORD_EXPIRED' || data.must_change_password) {
        if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            localStorage.setItem('user', JSON.stringify({ ...user, must_change_password: true }));
          }
          window.location.href = '/change-password';
        }
      }

      // Xử lý lỗi BOLA / IDOR hoặc truy cập trái phép khác
      console.error('[Security Event Tripped] Unauthorized resource access blocked.', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
