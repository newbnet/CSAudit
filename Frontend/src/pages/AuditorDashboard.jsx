import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAssets,
  getProjects,
  createProject,
  getProjectGrants,
  addProjectGrant,
  removeProjectGrant,
} from '../api';
import AssetForm from '../components/AssetForm';
import UploadComponent from '../components/UploadComponent';
import AssetList from '../components/AssetList';
import { DashboardShell, dashTouchLink, dashTouchButton } from '../components/DashboardShell';

export default function AuditorDashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assets');
  const [editingAsset, setEditingAsset] = useState(null);
  const [grants, setGrants] = useState([]);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantAccess, setGrantAccess] = useState('view');
  const [grantMsg, setGrantMsg] = useState('');
  const [grantErr, setGrantErr] = useState('');
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectErr, setNewProjectErr] = useState('');
  const [newProjectSaving, setNewProjectSaving] = useState(false);

  useEffect(() => {
    const opts = user?.role === 'owner' ? { mine: true } : {};
    getProjects(opts)
      .then((list) => {
        setProjects(list);
        setProjectId((prev) => (prev ? prev : list[0]?.id || ''));
      })
      .catch(console.error);
  }, [user?.role]);

  const selectedProject = projects.find((p) => p.id === projectId);
  const projectReadOnly = selectedProject?.myAccess === 'view';
  const canManageGrants =
    selectedProject && (selectedProject.myAccess === 'owner' || selectedProject.myAccess === 'edit');

  useEffect(() => {
    if (!projectId || !canManageGrants) {
      setGrants([]);
      return;
    }
    getProjectGrants(projectId)
      .then(setGrants)
      .catch(() => setGrants([]));
  }, [projectId, canManageGrants]);

  useEffect(() => {
    if (!projectId) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getAssets(projectId)
      .then(setAssets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const refreshAssets = () => {
    if (projectId) getAssets(projectId).then(setAssets);
  };

  const refreshGrants = () => {
    if (projectId && canManageGrants) getProjectGrants(projectId).then(setGrants).catch(() => {});
  };

  const handleAddGrant = async (e) => {
    e.preventDefault();
    setGrantErr('');
    setGrantMsg('');
    if (!grantEmail.trim()) return;
    try {
      await addProjectGrant(projectId, { auditorEmail: grantEmail.trim(), access: grantAccess });
      setGrantMsg('Access updated');
      setGrantEmail('');
      refreshGrants();
    } catch (err) {
      setGrantErr(err.message || 'Failed');
    }
  };

  const openNewProjectModal = () => {
    setNewProjectName('');
    setNewProjectErr('');
    setNewProjectOpen(true);
  };

  const closeNewProjectModal = () => {
    if (newProjectSaving) return;
    setNewProjectOpen(false);
  };

  const submitNewProject = async (e) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) {
      setNewProjectErr('Enter a project name');
      return;
    }
    setNewProjectErr('');
    setNewProjectSaving(true);
    try {
      const p = await createProject(name);
      setProjects((prev) => [...prev, { ...p, myAccess: p.myAccess || 'owner' }]);
      setProjectId(p.id);
      setNewProjectOpen(false);
      setNewProjectName('');
    } catch (err) {
      setNewProjectErr(err.message || 'Could not create project');
    } finally {
      setNewProjectSaving(false);
    }
  };

  useEffect(() => {
    if (!newProjectOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !newProjectSaving) setNewProjectOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newProjectOpen, newProjectSaving]);

  const tabBtn = (id, label) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={activeTab === id}
      onClick={() => {
        if (id === 'assets') setEditingAsset(null);
        setActiveTab(id);
      }}
      className={`shrink-0 whitespace-nowrap min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-3 text-sm border-b-2 transition-colors rounded-t-md sm:rounded-none ${
        activeTab === id
          ? 'border-emerald-500 text-emerald-400 bg-slate-900/40 sm:bg-transparent'
          : 'border-transparent text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <DashboardShell
        eyebrow={user?.role === 'owner' ? 'Owner' : 'Auditor'}
        title={user?.role === 'owner' ? 'My audit projects' : 'Auditor workspace'}
        actions={
          <>
            <Link to={user?.role === 'owner' ? '/owner/users' : '/auditor/users'} className={dashTouchLink}>
              Users
            </Link>
            <button type="button" onClick={logout} className={dashTouchLink}>
              Sign out
            </button>
          </>
        }
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-wrap items-stretch sm:items-center gap-2 min-w-0">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="min-h-[44px] flex-1 min-w-0 sm:flex-none sm:min-h-0 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
              >
                {projects.length === 0 ? (
                  <option value="" disabled>
                    No projects yet
                  </option>
                ) : (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.myAccess === 'view' ? ' (view-only)' : p.myAccess === 'edit' ? ' (guest editor)' : ''}
                    </option>
                  ))
                )}
              </select>
              <button type="button" onClick={openNewProjectModal} className={dashTouchButton}>
                + New project
              </button>
            </div>
            <span className="text-slate-500 text-sm truncate">{user?.email}</span>
          </div>
        }
        tabBar={
          <div className="border-t border-slate-800/90 bg-slate-950/95">
            <div className="max-w-5xl mx-auto px-2 sm:px-6">
              <div
                role="tablist"
                aria-label="Workspace sections"
                className="flex gap-1 overflow-x-auto tabs-scroll scrollbar-pad py-1"
              >
                {tabBtn('assets', editingAsset ? 'Edit asset' : 'Add asset')}
                {tabBtn('upload', 'Upload scans')}
                {tabBtn('list', `Assets (${assets.length})`)}
                {canManageGrants && tabBtn('sharing', 'Guest auditors')}
              </div>
            </div>
          </div>
        }
      >
        {projectId && projectReadOnly && (
          <div className="mb-4 p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-sm text-cyan-100/95">
            <strong className="text-cyan-300">View-only</strong> — you can review this customer project. Uploads, new
            assets, and edits are disabled. Ask the project owner for <em>edit</em> access if you need to contribute.
          </div>
        )}

        {activeTab === 'assets' && (
          <AssetForm
            projectId={projectId}
            projects={projects}
            asset={editingAsset}
            readOnly={projectReadOnly}
            onSuccess={() => {
              refreshAssets();
              setEditingAsset(null);
            }}
            onCancel={() => setEditingAsset(null)}
          />
        )}
        {activeTab === 'upload' && (
          <UploadComponent
            projectId={projectId}
            projects={projects}
            readOnly={projectReadOnly}
            onProjectChange={setProjectId}
            onSuccess={refreshAssets}
          />
        )}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : assets.length === 0 ? (
              <p className="text-slate-500">No assets yet. Add one or upload scan results.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm">{assets.length} assets · Tap a row for details</p>
                </div>
                <AssetList
                  assets={assets}
                  readOnly={projectReadOnly}
                  onEdit={
                    projectReadOnly
                      ? undefined
                      : (a) => {
                          setEditingAsset(a);
                          setActiveTab('assets');
                        }
                  }
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'sharing' && canManageGrants && (
          <div className="space-y-6 max-w-lg">
            <p className="text-slate-400 text-sm">
              Invite other <strong className="text-slate-300">auditors</strong> (already created by the platform owner)
              to help on this project. Use <strong className="text-slate-300">view</strong> for read-only collaboration
              (e.g. extra pentesters) or <strong className="text-slate-300">edit</strong> to allow changes. Customer
              data stays in this project; only access is shared.
            </p>
            <form onSubmit={handleAddGrant} className="space-y-3 p-4 rounded-lg border border-slate-800 bg-slate-900/50">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Auditor email</label>
                <input
                  type="email"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Access</label>
                <select
                  value={grantAccess}
                  onChange={(e) => setGrantAccess(e.target.value)}
                  className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
                >
                  <option value="view">View only</option>
                  <option value="edit">Edit (upload &amp; modify assets)</option>
                </select>
              </div>
              {grantErr && <p className="text-red-400 text-sm">{grantErr}</p>}
              {grantMsg && <p className="text-emerald-400 text-sm">{grantMsg}</p>}
              <button
                type="submit"
                className="min-h-[44px] sm:min-h-0 px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-medium hover:bg-emerald-400 w-full sm:w-auto"
              >
                Grant / update access
              </button>
            </form>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Current guest auditors</h3>
              {grants.length === 0 ? (
                <p className="text-slate-500 text-sm">None yet.</p>
              ) : (
                <ul className="space-y-2">
                  {grants.map((g) => (
                    <li
                      key={g.id}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/50 text-sm"
                    >
                      <span className="min-w-0 break-words">
                        {g.auditorEmail || g.auditorUserId}{' '}
                        <span className="text-slate-500">· {g.access}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          removeProjectGrant(projectId, g.id)
                            .then(() => refreshGrants())
                            .catch((err) => setGrantErr(err.message))
                        }
                        className="self-start sm:self-auto text-red-400 hover:text-red-300 text-sm min-h-[44px] sm:min-h-0 px-2 -ml-2 sm:ml-0"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DashboardShell>

      {newProjectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 pb-[env(safe-area-inset-bottom,0px)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-project-title"
          onClick={closeNewProjectModal}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-slate-700 bg-slate-900 shadow-xl max-h-[90dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-3">
              <h2 id="new-project-title" className="text-lg font-semibold text-slate-100">
                New project
              </h2>
              <button
                type="button"
                onClick={closeNewProjectModal}
                disabled={newProjectSaving}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={submitNewProject} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-slate-500">Name the customer or site (you can change this later if needed).</p>
              <div>
                <label htmlFor="new-project-name" className="block text-sm text-slate-400 mb-1">
                  Project name
                </label>
                <input
                  id="new-project-name"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                  className="w-full min-h-[48px] px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-base sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  placeholder="e.g. Acme Corp external"
                />
              </div>
              {newProjectErr && <p className="text-red-400 text-sm">{newProjectErr}</p>}
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeNewProjectModal}
                  disabled={newProjectSaving}
                  className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newProjectSaving}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 font-medium hover:bg-emerald-400 disabled:opacity-50"
                >
                  {newProjectSaving ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
