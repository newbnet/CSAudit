import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, createUser, updateUser, getProjects } from '../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'end-user', projectIds: [] });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([getUsers(), getProjects()])
      .then(([u, p]) => {
        setUsers(u);
        setProjects(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => getUsers().then(setUsers);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!form.email?.trim() || !form.password) {
      setError('Email and password required');
      return;
    }
    try {
      await createUser({
        email: form.email.trim(),
        password: form.password,
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
      if (form.role !== undefined) updates.role = form.role;
      if (form.role === 'end-user' && form.projectIds !== undefined) updates.projectIds = form.projectIds;
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
      projectIds: u.projectIds || [],
    });
  };

  const toggleProject = (id) => {
    setForm((f) => ({
      ...f,
      projectIds: f.projectIds.includes(id) ? f.projectIds.filter((x) => x !== id) : [...f.projectIds, id],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/auditor" className="text-slate-500 hover:text-emerald-400 text-sm">← Back</Link>
          <h1 className="text-xl font-bold text-emerald-400">COD-DATA · Users</h1>
        </div>
      </header>
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">User Management</h2>

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
                <label className="block text-sm text-slate-400 mb-1">Password *</label>
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
                  <option value="auditor">Auditor</option>
                </select>
              </div>
              {form.role === 'end-user' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Assign projects</label>
                  {projects.length === 0 ? (
                    <p className="text-amber-400 text-sm">Create projects first in the Auditor dashboard.</p>
                  ) : (
                  <div className="flex flex-wrap gap-2">
                    {projects.map((p) => (
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
            <h3 className="text-lg font-semibold mb-4">Users</h3>
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50"
                >
                  <div>
                    <h4 className="font-medium">{u.email}</h4>
                    <p className="text-sm text-slate-500">
                      {u.name || '-'} · {u.role}
                      {u.projectIds?.length ? ` · ${u.projectIds.length} project(s)` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEdit(u)}
                    className="px-3 py-1 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </section>

          {editing && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Edit user: {editing.email}</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
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
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100"
                    >
                      <option value="end-user">End user</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </div>
                  {form.role === 'end-user' && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Assign projects</label>
                      {projects.length === 0 ? (
                        <p className="text-amber-400 text-sm">No projects available.</p>
                      ) : (
                      <div className="flex flex-wrap gap-2">
                        {projects.map((p) => (
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
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md bg-emerald-500 text-slate-900 font-medium hover:bg-emerald-400"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditing(null); setForm({ email: '', password: '', name: '', role: 'end-user', projectIds: [] }); }}
                      className="px-4 py-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600"
                    >
                      Cancel
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
      </div>
    </div>
  );
}
