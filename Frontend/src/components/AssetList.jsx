import { useState } from 'react';

const PORT_SERVICES = {
  22: 'SSH',
  53: 'DNS',
  80: 'HTTP',
  81: 'HTTP-Alt',
  111: 'RPC',
  139: 'NetBIOS',
  443: 'HTTPS',
  445: 'SMB',
  3128: 'Proxy',
  3001: 'Node',
  7000: 'Cassandra',
  9080: 'HTTP-Proxy',
  62078: 'iPhone Sync',
};

function getServiceLabel(port, vuln) {
  if (vuln?.openPorts) {
    const p = vuln.openPorts.find((x) => x.port === String(port));
    return p?.service || PORT_SERVICES[port] || port;
  }
  return PORT_SERVICES[port] || port;
}

export default function AssetList({ assets, onEdit }) {
  const [expanded, setExpanded] = useState(null);

  const toggle = (id) => setExpanded((e) => (e === id ? null : id));

  const severityColor = (s) => {
    const v = (s || '').toLowerCase();
    if (v === 'critical') return 'bg-red-500/20 text-red-400 border-red-500/40';
    if (v === 'high') return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    if (v === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    if (v === 'low') return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
  };

  return (
    <div className="space-y-2">
      {assets.map((a) => {
        const latestVuln = a.vulnerabilities?.[a.vulnerabilities.length - 1];
        const ports = latestVuln?.ports || [];
        const openPorts = latestVuln?.openPorts || [];
        const isExpanded = expanded === a.id;

        return (
          <div
            key={a.id}
            className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden"
          >
            <button
              onClick={() => toggle(a.id)}
              className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-slate-800/80 transition-colors"
            >
              <span className="text-slate-400">{isExpanded ? '▼' : '▶'}</span>
              <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-4">
                <div>
                  <div className="text-emerald-400 font-medium truncate">{a.name}</div>
                  {a.hostname && a.hostname !== a.name && (
                    <div className="text-xs text-slate-500 truncate">{a.hostname}</div>
                  )}
                </div>
                <div className="text-slate-300 text-sm">
                  {a.ip || '-'}
                  {(a.additionalIPs || []).length > 0 && (
                    <span className="text-slate-500 text-xs ml-1">+{(a.additionalIPs || []).length}</span>
                  )}
                </div>
                <div className="text-slate-400 text-sm">{a.type}</div>
                <div className="text-slate-400 text-sm">{a.auditStatus}</div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs border ${severityColor(latestVuln?.severity)}`}>
                    {ports.length} open
                  </span>
                  <span className="text-slate-500 text-xs">{a.vulnerabilities?.length || 0} imports</span>
                </div>
                <div className="text-xs text-slate-500">
                  {latestVuln?.importedAt ? new Date(latestVuln.importedAt).toLocaleDateString() : '-'}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-slate-700/50">
                <div className="mt-3 space-y-3">
                  {(a.mac || a.vendor || (a.additionalIPs || []).length > 0 || latestVuln?.mac || latestVuln?.vendor || latestVuln?.osMatch || latestVuln?.osVendor || openPorts.some((p) => p.product)) && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Host info</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                        {(a.additionalIPs || []).length > 0 && (
                          <div className="sm:col-span-2">
                            <span className="text-slate-500">All IPs:</span>{' '}
                            <span className="font-mono text-slate-300">
                              {[a.ip, ...(a.additionalIPs || [])].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        {(a.mac || latestVuln?.mac) && (
                          <div>
                            <span className="text-slate-500">MAC:</span>{' '}
                            <span className="font-mono text-slate-300">{a.mac || latestVuln.mac}</span>
                          </div>
                        )}
                        {(a.vendor || latestVuln?.vendor) && (
                          <div>
                            <span className="text-slate-500">Vendor:</span>{' '}
                            <span className="text-slate-300">{a.vendor || latestVuln.vendor}</span>
                          </div>
                        )}
                        {((latestVuln?.osMatch?.name) || latestVuln?.osVendor) && (
                          <div>
                            <span className="text-slate-500">OS:</span>{' '}
                            <span className="text-slate-300">
                              {latestVuln.osMatch?.name || latestVuln.osVendor || '-'}
                              {latestVuln.osMatch?.accuracy && ` (${latestVuln.osMatch.accuracy}%)`}
                            </span>
                          </div>
                        )}
                        {openPorts.some((p) => p.product) && (
                          <div>
                            <span className="text-slate-500">Products:</span>{' '}
                            <span className="text-slate-300">
                              {[...new Set(openPorts.map((p) => p.product).filter(Boolean))].join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Open ports & services</h4>
                    <div className="flex flex-wrap gap-2">
                      {openPorts.length > 0 ? (
                        openPorts.map((p) => (
                          <span
                            key={p.port}
                            className="px-2 py-1 rounded bg-slate-700/80 text-slate-300 text-sm font-mono"
                            title={[p.product, p.version, p.extrainfo].filter(Boolean).join(' ')}
                          >
                            {p.port}/{p.protocol}: {p.service || p.port}
                          </span>
                        ))
                      ) : (
                        ports.map((port) => (
                          <span
                            key={port}
                            className="px-2 py-1 rounded bg-slate-700/80 text-slate-300 text-sm font-mono"
                          >
                            {port}: {getServiceLabel(port, latestVuln)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {onEdit && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEdit(a); }}
                        className="px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30"
                      >
                        Edit asset
                      </button>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Import history</h4>
                    <div className="space-y-1 text-sm">
                      {a.vulnerabilities?.map((v, i) => (
                        <div key={v.id || i} className="flex items-center gap-4 text-slate-400">
                          <span className="text-slate-500">
                            {new Date(v.importedAt).toLocaleString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${severityColor(v.severity)}`}>
                            {v.severity || 'info'}
                          </span>
                          <span>
                            {v.source} · {(v.ports || (v.openPorts || []).map((p) => p.port || p)).join(', ') || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
