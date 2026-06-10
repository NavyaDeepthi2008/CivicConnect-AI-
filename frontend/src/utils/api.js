const BASE_URL = 'http://localhost:5000/api';

const getHeaders = (token, isFormData = false) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

export const api = {
  // Auth
  register: (data) => fetch(`${BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  login: (data) => fetch(`${BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getMe: (token) => fetch(`${BASE_URL}/auth/me`, { headers: getHeaders(token) }),

  // Issues
  getIssues: (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/issues/?${query}`, { headers: getHeaders(token) });
  },
  getNearby: (token) => fetch(`${BASE_URL}/issues/nearby`, { headers: getHeaders(token) }),
  getIssue: (token, id) => fetch(`${BASE_URL}/issues/${id}`, { headers: getHeaders(token) }),
  createIssue: (token, formData) => fetch(`${BASE_URL}/issues/`, { method: 'POST', headers: getHeaders(token, true), body: formData }),
  checkDuplicate: (token, data) => fetch(`${BASE_URL}/issues/check-duplicate`, { method: 'POST', headers: getHeaders(token), body: JSON.stringify(data) }),
  voteIssue: (token, id) => fetch(`${BASE_URL}/issues/${id}/vote`, { method: 'POST', headers: getHeaders(token) }),
  addComment: (token, id, content) => fetch(`${BASE_URL}/issues/${id}/comment`, { method: 'POST', headers: getHeaders(token), body: JSON.stringify({ content }) }),
  getMyIssues: (token) => fetch(`${BASE_URL}/issues/my-issues`, { headers: getHeaders(token) }),

  // Admin
  getAllIssues: (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/admin/issues?${query}`, { headers: getHeaders(token) });
  },
  updateStatus: (token, id, status) => fetch(`${BASE_URL}/admin/issues/${id}/status`, { method: 'PUT', headers: getHeaders(token), body: JSON.stringify({ status }) }),
  getAdminStats: (token) => fetch(`${BASE_URL}/admin/stats`, { headers: getHeaders(token) }),
  getNotifications: (token) => fetch(`${BASE_URL}/admin/notifications`, { headers: getHeaders(token) }),
  markNotifRead: (token, id) => fetch(`${BASE_URL}/admin/notifications/${id}/read`, { method: 'PUT', headers: getHeaders(token) }),
  getUsers: (token) => fetch(`${BASE_URL}/admin/users`, { headers: getHeaders(token) }),

  // Analytics
  getAnalytics: (token) => fetch(`${BASE_URL}/analytics/overview`, { headers: getHeaders(token) }),
  getAreaRisk: (token) => fetch(`${BASE_URL}/analytics/area-risk`, { headers: getHeaders(token) }),
  getTrends: (token) => fetch(`${BASE_URL}/analytics/trend`, { headers: getHeaders(token) }),

  // AI
  writingAssist: (token, text) => fetch(`${BASE_URL}/ai/writing-assist`, { method: 'POST', headers: getHeaders(token), body: JSON.stringify({ text }) }),
  chatbot: (token, message) => fetch(`${BASE_URL}/ai/chatbot`, { method: 'POST', headers: getHeaders(token), body: JSON.stringify({ message }) }),
  classifyIssue: (token, data) => fetch(`${BASE_URL}/ai/classify`, { method: 'POST', headers: getHeaders(token), body: JSON.stringify(data) }),
};

export const getLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject('Geolocation not supported');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        const addr = data.address || {};
        resolve({
          lat: latitude, lng: longitude,
          area: addr.suburb || addr.neighbourhood || addr.village || addr.town || '',
          city: addr.city || addr.town || addr.municipality || '',
          state: addr.state || ''
        });
      } catch {
        resolve({ lat: latitude, lng: longitude, area: '', city: '', state: '' });
      }
    },
    (err) => reject(err.message),
    { enableHighAccuracy: true, timeout: 10000 }
  );
});
