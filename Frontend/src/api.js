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

export async function refreshSession() {
  const res = await fetch(`${API}/auth/session`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Session refresh failed');
  return data;
}

/** Sign-in / registration policy from the server (includes Google-only mode). */
export async function getAuthMethods() {
  const res = await fetch(`${API}/auth/google/enabled`, { cache: 'no-store' });
  if (!res.ok) {
    return {
      googleOAuth: false,
      passwordLogin: true,
      selfServicePasswordRegister: true,
    };
  }
  const data = await res.json();
  return {
    googleOAuth: Boolean(data.googleOAuth),
    passwordLogin: data.passwordLogin !== false,
    selfServicePasswordRegister: data.selfServicePasswordRegister !== false,
  };
}

export async function getGoogleOAuthEnabled() {
  const m = await getAuthMethods();
  return m.googleOAuth;
}

export async function completeGoogleOAuth(nonce) {
  const res = await fetch(`${API}/auth/google/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google sign-in failed');
  return data;
}

export async function registerAccount({ email, password, name, inviteToken }) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name,
      ...(inviteToken ? { inviteToken } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function getInvitePreview(token) {
  if (!token) return { valid: false };
  const res = await fetch(`${API}/auth/invite-preview?token=${encodeURIComponent(token)}`);
  if (!res.ok) return { valid: false };
  return res.json();
}

export async function getInvitations() {
  const res = await fetch(`${API}/invitations`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to load invitations');
  return res.json();
}

export async function createInvitation({ email, role, projectIds }) {
  const res = await fetch(`${API}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ email, role, projectIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create invitation');
  return data;
}

export async function deleteInvitation(id) {
  const res = await fetch(`${API}/invitations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to delete invitation');
}

export async function getProjects(options = {}) {
  const q = options.mine ? '?mine=1' : '';
  const res = await fetch(`${API}/projects${q}`, {
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

export async function updateProject(projectId, body) {
  const res = await fetch(`${API}/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update project');
  return data;
}

export async function getProjectGrants(projectId) {
  const res = await fetch(`${API}/projects/${encodeURIComponent(projectId)}/grants`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load guest access');
  return data;
}

export async function addProjectGrant(projectId, { auditorEmail, access }) {
  const res = await fetch(`${API}/projects/${encodeURIComponent(projectId)}/grants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ auditorEmail, access }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add guest auditor');
  return data;
}

export async function removeProjectGrant(projectId, grantId) {
  const res = await fetch(
    `${API}/projects/${encodeURIComponent(projectId)}/grants/${encodeURIComponent(grantId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to remove grant');
  }
}

export async function getAssetTypeCatalog() {
  const res = await fetch(`${API}/asset-types`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load asset types');
  return data;
}

export async function createCustomAssetType(payload) {
  const res = await fetch(`${API}/asset-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create type');
  return data;
}

export async function setAssetTypeCommunityShare(templateId, visibleToCommunity) {
  const res = await fetch(`${API}/asset-types/${encodeURIComponent(templateId)}/share`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ visibleToCommunity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update sharing');
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

export async function deleteUser(id) {
  const res = await fetch(`${API}/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to delete user');
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
