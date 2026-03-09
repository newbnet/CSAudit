import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAssets, getProjects, createProject } from '../api';
import AssetForm from '../components/AssetForm';
import UploadComponent from '../components/UploadComponent';
import AssetList from '../components/AssetList';

export default function AuditorDashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assets');
  const [editingAsset, setEditingAsset] = useState(null);

  useEffect(() => {
    getProjects()
      .then((list) => {
        setProjects(list);
        setProjectId((prev) => (prev ? prev : list[0]?.id || ''));
      })
      .catch(console.error);
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-400">COD-DATA · Auditor</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              >
                {projects.length === 0 ? (
                  <option value="" disabled>No projects yet</option>
                ) : (
                  projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={async () => {
                  const name = window.prompt('New project name (e.g. company or site):');
                  if (!name?.trim()) return;
                  try {
                    const p = await createProject(name.trim());
                    setProjects((prev) => [...prev, p]);
                    setProjectId(p.id);
                  } catch (err) {
                    alert(err.message);
                  }
                }}
                className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30"
              >
                + New
              </button>
            </div>
          <span className="text-slate-500 text-sm">{user?.email}</span>
          <Link
            to="/auditor/users"
            className="text-sm text-slate-400 hover:text-emerald-400"
          >
            Users
          </Link>
          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-emerald-400"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="border-b border-slate-700 flex gap-4 px-4">
        <button
          onClick={() => { setActiveTab('assets'); setEditingAsset(null); }}
          className={`py-3 px-2 border-b-2 transition-colors ${
            activeTab === 'assets'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          {editingAsset ? 'Edit Asset' : 'Add Asset'}
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`py-3 px-2 border-b-2 transition-colors ${
            activeTab === 'upload'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Upload Nmap/Nessus
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`py-3 px-2 border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Assets ({assets.length})
        </button>
      </nav>

      <main className="p-6 max-w-4xl mx-auto">
        {activeTab === 'assets' && (
          <AssetForm
            projectId={projectId}
            projects={projects}
            asset={editingAsset}
            onSuccess={() => { refreshAssets(); setEditingAsset(null); }}
            onCancel={() => setEditingAsset(null)}
          />
        )}
        {activeTab === 'upload' && (
          <UploadComponent projectId={projectId} projects={projects} onProjectChange={setProjectId} onSuccess={refreshAssets} />
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
                  <p className="text-slate-500 text-sm">{assets.length} assets · Click to expand details</p>
                </div>
                <AssetList
                  assets={assets}
                  onEdit={(a) => { setEditingAsset(a); setActiveTab('assets'); }}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
