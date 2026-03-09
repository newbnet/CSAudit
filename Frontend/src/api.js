const API = '/api';

function getToken() {
  return localStorage.getItem('cod-data-token');
}

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function getProjects() {
  const res = await fetch(`${API}/projects`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(name) {
  const res = await fetch(`${API}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create project');
  return data;
}

export async function getAssets(projectId) {
  const url = projectId ? `${API}/assets?projectId=${encodeURIComponent(projectId)}` : `${API}/assets`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch assets');
  return res.json();
}

export async function getScanHistory(projectId) {
  const url = projectId ? `${API}/assets/scan-history?projectId=${encodeURIComponent(projectId)}` : `${API}/assets/scan-history`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch scan history');
  return res.json();
}

export async function updateAsset(id, updates) {
  const res = await fetch(`${API}/assets/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update asset');
  return data;
}

export async function createAsset(asset) {
  const res = await fetch(`${API}/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(asset),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create asset');
  return data;
}

export async function getChecklistKey(type, subType) {
  const sub = subType ? `/${encodeURIComponent(subType)}` : '';
  const res = await fetch(`${API}/assets/checklist-key/${encodeURIComponent(type)}${sub}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch checklist');
  return res.json();
}

export async function uploadNmap(file, projectId) {
  const form = new FormData();
  form.append('file', file);
  form.append('projectId', projectId);
  const res = await fetch(`${API}/upload/nmap`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function getUsers() {
  const res = await fetch(`${API}/users`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(user) {
  const res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(user),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create user');
  return data;
}

export async function updateUser(id, updates) {
  const res = await fetch(`${API}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user');
  return data;
}

export async function uploadNessus(file, projectId) {
  const form = new FormData();
  form.append('file', file);
  form.append('projectId', projectId);
  const res = await fetch(`${API}/upload/nessus`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function uploadOpenvas(file, projectId) {
  const form = new FormData();
  form.append('file', file);
  form.append('projectId', projectId);
  const res = await fetch(`${API}/upload/openvas`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}
