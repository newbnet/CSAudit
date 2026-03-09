import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAssets, getProjects, getScanHistory } from '../api';

export default function EndUserDashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [assets, setAssets] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setScanHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getAssets(projectId), getScanHistory(projectId)])
      .then(([a, h]) => {
        setAssets(a);
        setScanHistory(h);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const vulns = assets.flatMap((a) =>
    (a.vulnerabilities || []).map((v) => ({
      ...v,
      assetName: a.name,
      assetIp: a.ip,
    }))
  );

  const bySeverity = {
    critical: vulns.filter((v) => (v.severity || '').toLowerCase() === 'critical'),
    high: vulns.filter((v) => (v.severity || '').toLowerCase() === 'high'),
    medium: vulns.filter((v) => (v.severity || '').toLowerCase() === 'medium'),
    low: vulns.filter((v) => (v.severity || '').toLowerCase() === 'low'),
    info: vulns.filter((v) => (v.severity || '').toLowerCase() === 'info'),
  };

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/40',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    low: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-emerald-400">COD-DATA · Dashboard</h1>
        <div className="flex items-center gap-4">
          {projects.length > 0 && (
            <span className="text-slate-500 text-sm">
              {projects.length > 1 ? (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <span className="text-emerald-400/80">Project: {projects[0]?.name}</span>
              )}
            </span>
          )}
          <span className="text-slate-500 text-sm">{user?.email}</span>
          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-emerald-400"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Vulnerability Overview</h2>

        {scanHistory.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Improvement Over Time</h3>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 overflow-x-auto">
              <div className="flex gap-4 items-end min-w-max pb-2" style={{ minHeight: 120 }}>
                {[...scanHistory].reverse().map((h) => {
                  const total = (h.counts?.critical || 0) + (h.counts?.high || 0) + (h.counts?.medium || 0) + (h.counts?.low || 0) + (h.counts?.info || 0);
                  const maxTotal = Math.max(...scanHistory.map((x) => (x.counts?.critical || 0) + (x.counts?.high || 0) + (x.counts?.medium || 0) + (x.counts?.low || 0) + (x.counts?.info || 0)), 1);
                  const pct = (total / maxTotal) * 100;
                  const date = new Date(h.importedAt);
                  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
                  return (
                    <div key={h.id} className="flex flex-col items-center gap-1">
                      <div className="text-xs text-slate-500">{total}</div>
                      <div
                        className="w-10 rounded-t bg-emerald-500/60 hover:bg-emerald-500/80 transition-colors"
                        style={{ height: Math.max(20, pct) }}
                        title={`${label}: ${total} findings (${h.source})`}
                      />
                      <div className="text-xs text-slate-500 whitespace-nowrap">{label}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-slate-500 text-xs mt-2">Scan history — lower bars indicate fewer findings over time</p>
            </div>
          </section>
        )}

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                ['critical', bySeverity.critical.length],
                ['high', bySeverity.high.length],
                ['medium', bySeverity.medium.length],
                ['low', bySeverity.low.length],
                ['info', bySeverity.info.length],
              ].map(([sev, count]) => (
                <div
                  key={sev}
                  className={`rounded-lg border p-4 ${severityColors[sev] || severityColors.info}`}
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm capitalize">{sev}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Findings by device</h3>
              {vulns.length === 0 ? (
                <p className="text-slate-500">No vulnerabilities reported yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-700">
                        <th className="pb-2 pr-4">Device</th>
                        <th className="pb-2 pr-4">IP</th>
                        <th className="pb-2 pr-4">Severity</th>
                        <th className="pb-2 pr-4">Source</th>
                        <th className="pb-2">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vulns.map((v) => (
                        <tr key={v.id || v.assetName + v.ip} className="border-b border-slate-700/50">
                          <td className="py-3 pr-4">{v.assetName}</td>
                          <td className="py-3 pr-4">{v.assetIp || v.ip || '-'}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 rounded text-xs ${severityColors[(v.severity || 'info').toLowerCase()] || severityColors.info}`}>
                              {v.severity || 'info'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">{v.source || '-'}</td>
                          <td className="py-3">{v.name || v.ports?.join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
