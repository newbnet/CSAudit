import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getProjects } from '../api';
import { DashboardShell, dashTouchLink } from '../components/DashboardShell';

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loadErr, setLoadErr] = useState('');

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((e) => setLoadErr(e.message || 'Failed to load projects'));
  }, []);

  return (
    <DashboardShell
      eyebrow="Platform owner"
      title="COD-DATA"
      actions={
        <>
          <span className="text-slate-500 text-sm truncate max-w-[min(100%,14rem)] sm:max-w-xs">{user?.email}</span>
          <button type="button" onClick={logout} className={dashTouchLink}>
            Sign out
          </button>
        </>
      }
    >
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Your role</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          You manage <strong className="text-slate-300">auditor accounts</strong> and see{' '}
          <strong className="text-slate-300">project names only</strong> for oversight. You do not open customer
          assets, scans, or vulnerabilities—those stay isolated to each auditor and the users they invite.
        </p>
      </section>

      <section className="flex flex-col gap-4 mb-8 sm:mb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/auditor"
            className="block p-4 sm:p-5 rounded-xl border border-cyan-500/35 bg-cyan-500/10 hover:bg-cyan-500/15 transition-colors min-h-[44px]"
          >
            <h3 className="font-semibold text-cyan-300 mb-1">My audit projects</h3>
            <p className="text-sm text-slate-400">
              Open the auditor workspace for projects where <strong className="text-slate-300">you</strong> are the
              primary owner—assets, uploads, scans, and guest auditors. Other auditors&apos; customer data stays
              hidden.
            </p>
          </Link>
          <Link
            to="/owner/users"
            className="block p-4 sm:p-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors min-h-[44px]"
          >
            <h3 className="font-semibold text-emerald-400 mb-1">Users & invitations</h3>
            <p className="text-sm text-slate-400">
              Create auditors, pending accounts, invite auditors by link, and manage end users across projects.
            </p>
          </Link>
          <Link
            to="/"
            className="block p-4 sm:p-5 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800/80 transition-colors sm:col-span-2 lg:col-span-1 min-h-[44px]"
          >
            <h3 className="font-semibold text-slate-300 mb-1">Public home</h3>
            <p className="text-sm text-slate-500">Open the marketing / sign-in page.</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Projects (metadata)</h2>
        {loadErr && <p className="text-amber-400 text-sm mb-2">{loadErr}</p>}
        {!loadErr && projects.length === 0 && (
          <p className="text-slate-500 text-sm">No projects yet. Auditors create projects when they start work.</p>
        )}
        <ul className="space-y-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center px-4 py-3 rounded-lg border border-slate-800 bg-slate-900/50 text-sm"
            >
              <span className="font-medium text-slate-200">{p.name}</span>
              <span className="text-slate-500 text-xs font-mono break-all sm:break-normal sm:text-right">{p.ownerUserId || '—'}</span>
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
