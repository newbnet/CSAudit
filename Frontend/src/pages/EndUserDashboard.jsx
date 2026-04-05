import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAssets, getProjects, getScanHistory } from '../api';
import { DashboardShell, dashTouchLink } from '../components/DashboardShell';

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
    <DashboardShell
      eyebrow="End user"
      title="Vulnerability overview"
      actions={
        <>
          <span className="text-slate-500 text-sm truncate max-w-[min(100%,12rem)] sm:max-w-xs">{user?.email}</span>
          <button type="button" onClick={logout} className={dashTouchLink}>
            Sign out
          </button>
        </>
      }
      toolbar={
        projects.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {projects.length > 1 ? (
              <label className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:gap-2 sm:text-sm">
                <span className="shrink-0 text-slate-400">Project</span>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="min-h-[44px] sm:min-h-0 w-full sm:w-auto max-w-md px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="text-sm text-emerald-400/90">Project: {projects[0]?.name}</span>
            )}
          </div>
        ) : null
      }
    >
      {scanHistory.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Improvement over time</h3>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 overflow-x-auto tabs-scroll">
            <div className="flex gap-4 items-end min-w-max pb-2" style={{ minHeight: 120 }}>
              {[...scanHistory].reverse().map((h) => {
                const total =
                  (h.counts?.critical || 0) +
                  (h.counts?.high || 0) +
                  (h.counts?.medium || 0) +
                  (h.counts?.low || 0) +
                  (h.counts?.info || 0);
                const maxTotal = Math.max(
                  ...scanHistory.map(
                    (x) =>
                      (x.counts?.critical || 0) +
                      (x.counts?.high || 0) +
                      (x.counts?.medium || 0) +
                      (x.counts?.low || 0) +
                      (x.counts?.info || 0)
                  ),
                  1
                );
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
            {[
              ['critical', bySeverity.critical.length],
              ['high', bySeverity.high.length],
              ['medium', bySeverity.medium.length],
              ['low', bySeverity.low.length],
              ['info', bySeverity.info.length],
            ].map(([sev, count]) => (
              <div
                key={sev}
                className={`rounded-lg border p-3 sm:p-4 ${severityColors[sev] || severityColors.info}`}
              >
                <div className="text-xl sm:text-2xl font-bold">{count}</div>
                <div className="text-xs sm:text-sm capitalize">{sev}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">Findings by device</h3>
            {vulns.length === 0 ? (
              <p className="text-slate-500">No vulnerabilities reported yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-1 px-1 tabs-scroll rounded-lg border border-slate-800">
                <table className="w-full text-sm min-w-[36rem]">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-800">
                      <th className="pb-2 pr-4">Device</th>
                      <th className="pb-2 pr-4">IP</th>
                      <th className="pb-2 pr-4">Severity</th>
                      <th className="pb-2 pr-4">Source</th>
                      <th className="pb-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vulns.map((v) => (
                      <tr key={v.id || v.assetName + v.ip} className="border-b border-slate-800/50">
                        <td className="py-3 pr-4 align-top">{v.assetName}</td>
                        <td className="py-3 pr-4 align-top">{v.assetIp || v.ip || '-'}</td>
                        <td className="py-3 pr-4 align-top">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs ${
                              severityColors[(v.severity || 'info').toLowerCase()] || severityColors.info
                            }`}
                          >
                            {v.severity || 'info'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 align-top">{v.source || '-'}</td>
                        <td className="py-3 align-top break-words max-w-[12rem] sm:max-w-none">{v.name || v.ports?.join(', ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
