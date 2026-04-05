import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getProjects,
  getInvitations,
  createInvitation,
  deleteInvitation,
  getAuthMethods,
} from '../api';
import { DashboardShell, dashTouchLink } from '../components/DashboardShell';

export default function UserManagement() {
  const { user: me } = useAuth();
  const isOwner = me?.role === 'owner';
  const location = useLocation();
  const backTo =
    location.pathname.startsWith('/auditor') ? '/auditor' : isOwner ? '/owner' : '/auditor';
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'end-user', projectIds: [] });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'end-user', projectIds: [] });
  const [lastInviteUrl, setLastInviteUrl] = useState('');
  const [authMethods, setAuthMethods] = useState(null);

  const refreshInvites = () => getInvitations().then(setInvitations).catch(console.error);

  useEffect(() => {
    getAuthMethods().then(setAuthMethods).catch(() => setAuthMethods({ passwordLogin: true }));
  }, []);

  const editableProjects = useMemo(() => {
    if (!projects.length) return [];
    if (isOwner) return projects;
    return projects.filter((p) => p.myAccess === 'owner' || p.myAccess === 'edit');
  }, [projects, isOwner]);

  const assignableProjects = useMemo(() => {
    if (isOwner) return projects;
    return editableProjects;
  }, [isOwner, projects, editableProjects]);

  useEffect(() => {
    Promise.all([getUsers(), getProjects(), getInvitations()])
      .then(([u, p, inv]) => {
        setUsers(u);
        setProjects(p);
        setInvitations(inv);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => getUsers().then(setUsers);

  const passwordOptional = authMethods && !authMethods.passwordLogin;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!form.email?.trim()) {
      setError('Email required');
      return;
    }
    if (!passwordOptional && !form.password) {
      setError('Email and password required');
      return;
    }
    try {
      await createUser({
        email: form.email.trim(),
        ...(form.password?.trim() ? { password: form.password } : {}),
        name: form.name.trim() || undefined,
        role: form.role,
        projectIds: form.role === 'end-user' ? form.projectIds : undefined,
      });
      setMessage('User created');
      setForm({ email: '', password: '', name: '', role: 'end-user', projectIds: [] });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!editing) return;
    try {
      const updates = {};
      if (form.password) updates.password = form.password;
      if (form.name !== undefined) updates.name = form.name;
      if (editing.role !== 'owner') {
        if (form.role !== undefined) updates.role = form.role;
        if (form.role === 'end-user' && form.projectIds !== undefined) updates.projectIds = form.projectIds;
        if (form.role === 'pending') updates.projectIds = [];
      }
      await updateUser(editing.id, updates);
      setMessage('User updated');
      setEditing(null);
      setForm({ email: '', password: '', name: '', role: 'end-user', projectIds: [] });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({
      email: u.email,
      password: '',
      name: u.name || '',
      role: u.role,
      projectIds: u.role === 'auditor' ? [] : u.projectIds || [],
    });
  };

  const canRemoveUser = (u) => u.id !== me?.id && u.role !== 'owner';

  const handleRemoveUser = async (u) => {
    if (!canRemoveUser(u)) return;
    const ok = window.confirm(
      `Remove account for ${u.email}?\n\nThey will no longer be able to sign in. This cannot be undone.`
    );
    if (!ok) return;
    setError('');
    setMessage('');
    try {
      await deleteUser(u.id);
      if (editing?.id === u.id) {
        setEditing(null);
        setForm({ email: '', password: '', name: '', role: 'end-user', projectIds: [] });
      }
      setMessage('Account removed');
      refresh();
    } catch (err) {
      setError(err.message || 'Failed to remove account');
    }
  };

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLastInviteUrl('');
    if (!inviteForm.email?.trim()) {
      setError('Invitation email required');
      return;
    }
    try {
      const res = await createInvitation({
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        projectIds: inviteForm.role === 'end-user' ? inviteForm.projectIds : undefined,
      });
      setLastInviteUrl(res.inviteUrl);
      setMessage('Invitation created. Copy the link and send it to the user.');
      setInviteForm({ email: '', role: 'end-user', projectIds: [] });
      refreshInvites();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleInviteProject = (id) => {
    setInviteForm((f) => ({
      ...f,
      projectIds: f.projectIds.includes(id) ? f.projectIds.filter((x) => x !== id) : [...f.projectIds, id],
    }));
  };

  const roleLabel = (r) =>
    r === 'owner'
      ? 'Platform owner'
      : r === 'auditor'
        ? 'Auditor'
        : r === 'pending'
          ? 'Pending'
          : 'End user';

  const toggleProject = (id) => {
    setForm((f) => ({
      ...f,
      projectIds: f.projectIds.includes(id) ? f.projectIds.filter((x) => x !== id) : [...f.projectIds, id],
    }));
  };

  return (
    <DashboardShell
      eyebrow="COD-DATA"
      title="Users & invitations"
      actions={
        <Link to={backTo} className={dashTouchLink}>
          ← Back
        </Link>
      }
    >
      <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-6">User management</h2>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold mb-4">Create user</h3>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Password{passwordOptional ? ' (optional — Google sign-in)' : ' *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                  placeholder={passwordOptional ? 'Leave blank for Google only' : '••••••••'}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                  placeholder="Display name"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                >
                  <option value="end-user">End user</option>
                  {isOwner && <option value="auditor">Auditor</option>}
                  <option value="pending">Pending (no access)</option>
                </select>
              </div>
              {form.role === 'end-user' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Assign projects</label>
                  {assignableProjects.length === 0 ? (
                    <p className="text-amber-400 text-sm">
                      {isOwner
                        ? 'No projects yet. Auditors create customer projects from the auditor dashboard.'
                        : 'Create a project or get edit access to assign users.'}
                    </p>
                  ) : (
                  <div className="flex flex-wrap gap-2">
                    {assignableProjects.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.projectIds.includes(p.id)}
                          onChange={() => toggleProject(p.id)}
                          className="rounded border-slate-600 text-emerald-500"
                        />
                        <span className="text-sm">{p.name}</span>
                      </label>
                    ))}
                  </div>
                  )}
                </div>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-emerald-500 text-slate-900 font-medium hover:bg-emerald-400"
              >
                Create user
              </button>
            </form>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4">Invite by link</h3>
            <p className="text-slate-500 text-sm mb-4 max-w-xl">
              Creates a one-time registration link (7 days). End users must be scoped to projects you can edit.
              {isOwner && ' As platform owner you can also invite new auditors.'}
            </p>
            <form onSubmit={handleCreateInvite} className="space-y-4 max-w-md mb-6">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role after registration</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value, projectIds: [] }))}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                >
                  <option value="end-user">End user</option>
                  {isOwner && <option value="auditor">Auditor</option>}
                </select>
              </div>
              {inviteForm.role === 'end-user' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Projects</label>
                  {assignableProjects.length === 0 ? (
                    <p className="text-amber-400 text-sm">No projects you can assign.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {assignableProjects.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inviteForm.projectIds.includes(p.id)}
                            onChange={() => toggleInviteProject(p.id)}
                            className="rounded border-slate-600 text-emerald-500"
                          />
                          <span className="text-sm">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-amber-500/90 text-slate-900 font-medium hover:bg-amber-400"
              >
                Generate invitation link
              </button>
            </form>
            {lastInviteUrl && (
              <div className="mb-6 p-4 rounded-lg border border-emerald-500/40 bg-slate-800/80 max-w-2xl">
                <p className="text-sm text-slate-400 mb-2">Invitation URL</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <code className="text-xs text-emerald-300 break-all flex-1">{lastInviteUrl}</code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(lastInviteUrl)}
                    className="shrink-0 px-3 py-1 rounded bg-slate-700 text-sm hover:bg-slate-600"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            {invitations.length > 0 && (
              <div className="space-y-2 mb-8">
                <h4 className="text-sm font-medium text-slate-400">Unused invitations</h4>
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/50 text-sm"
                  >
                    <span className="min-w-0 break-words">
                      {inv.email} · {roleLabel(inv.role)}
                      {inv.expiresAt && (
                        <span className="text-slate-500"> · expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteInvitation(inv.id).then(refreshInvites)}
                      className="self-start sm:self-auto min-h-[44px] sm:min-h-0 px-2 text-red-400 hover:text-red-300"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-4">Users</h3>
            <p className="text-slate-500 text-sm mb-4 max-w-xl">
              Remove an account to revoke sign-in (email/password or Google). Auditors who still own projects must
              have those projects reassigned or deleted first.
            </p>
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-slate-800 bg-slate-900/50"
                >
                  <div className="min-w-0">
                    <h4 className="font-medium text-slate-200 break-words">{u.email}</h4>
                    <p className="text-sm text-slate-500">
                      {u.name || '-'} · {roleLabel(u.role)}
                      {u.projectIds?.length ? ` · ${u.projectIds.length} project(s)` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleEdit(u)}
                      disabled={u.role === 'owner' && !isOwner}
                      className="min-h-[44px] sm:min-h-0 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Edit
                    </button>
                    {canRemoveUser(u) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(u)}
                        className="min-h-[44px] sm:min-h-0 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-950/40 text-sm"
                      >
                        Remove account
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {editing && (
            <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 pb-[env(safe-area-inset-bottom,0px)]">
              <div className="bg-slate-900 rounded-t-2xl sm:rounded-xl border border-slate-800 max-w-md w-full max-h-[90dvh] sm:max-h-[85dvh] flex flex-col shadow-xl">
                <div className="p-4 sm:p-6 border-b border-slate-800 shrink-0 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-100 pr-2 break-words">Edit user</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({ email: '', password: '', name: '', role: 'end-user', projectIds: [] });
                    }}
                    className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <p className="px-4 sm:px-6 pt-3 text-sm text-slate-500 truncate" title={editing.email}>
                  {editing.email}
                </p>
                <form onSubmit={handleUpdate} className="space-y-4 p-4 sm:p-6 pt-3 overflow-y-auto flex-1 min-h-0">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">New password (leave blank to keep)</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                    />
                  </div>
                  {editing.role === 'owner' ? (
                    <p className="text-sm text-slate-400">Platform owner — role is fixed.</p>
                  ) : (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                    >
                      <option value="end-user">End user</option>
                      {isOwner && <option value="auditor">Auditor</option>}
                      <option value="pending">Pending (no access)</option>
                    </select>
                  </div>
                  )}
                  {form.role === 'end-user' && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Assign projects</label>
                      {assignableProjects.length === 0 ? (
                        <p className="text-amber-400 text-sm">No projects available.</p>
                      ) : (
                      <div className="flex flex-wrap gap-2">
                        {assignableProjects.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.projectIds.includes(p.id)}
                              onChange={() => toggleProject(p.id)}
                              className="rounded border-slate-600 text-emerald-500"
                            />
                            <span className="text-sm">{p.name}</span>
                          </label>
                        ))}
                      </div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 pb-[env(safe-area-inset-bottom,0px)]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(null);
                        setForm({ email: '', password: '', name: '', role: 'end-user', projectIds: [] });
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 font-medium hover:bg-emerald-400"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {message && <p className="text-emerald-400 text-sm">{message}</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}
    </DashboardShell>
  );
}
