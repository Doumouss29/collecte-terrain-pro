const configuredApiUrl = import.meta.env.VITE_LOCAL_API_URL;
const API_URL = configuredApiUrl === undefined ? '' : configuredApiUrl.replace(/\/$/, '');

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, body, credentials: 'include' });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorBody;
    throw error;
  }
  return response.json();
}

function entityClient(entity) {
  return {
    list: (sort = '-created_date', limit) => {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      return request(`/api/entities/${entity}?${params.toString()}`);
    },
    filter: (filter = {}, sort = '-created_date', limit) => {
      const params = new URLSearchParams();
      params.set('filter', JSON.stringify(filter || {}));
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      return request(`/api/entities/${entity}?${params.toString()}`);
    },
    create: (data) => request(`/api/entities/${entity}`, { method: 'POST', body: data }),
    update: (id, data) => request(`/api/entities/${entity}/${id}`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/api/entities/${entity}/${id}`, { method: 'DELETE' }),
  };
}

const entityNames = [
  'Organisation',
  'Collecte',
  'ConvocationParcelle',
  'ParcelleOverride',
  'Invitation',
  'User',
  'CadastreCommunal',
];

export const base44 = {
  entities: Object.fromEntries(entityNames.map((name) => [name, entityClient(name)])),
  auth: {
    me: () => request('/api/auth/me'),
    login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
    updateMe: (data) => request('/api/auth/me', { method: 'PATCH', body: data }),
    logout: async () => {
      await request('/api/auth/logout', { method: 'POST' }).catch(() => null);
      window.location.href = '/';
    },
    redirectToLogin: () => { window.location.href = '/'; },
  },
  users: {
    inviteUser: (email, role = 'user') => request('/api/users/invite', { method: 'POST', body: { email, role } }),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return request('/api/upload', { method: 'POST', body: formData });
      },
    },
  },
  functions: {
    invoke: (name, data) => request(`/api/functions/${name}`, { method: 'POST', body: data }),
  },
  appLogs: {
    logUserInApp: (pageName) => request('/api/app-logs', { method: 'POST', body: { pageName } }).catch(() => null),
  },
};
