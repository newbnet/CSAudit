import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { refreshSession } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PendingDashboard() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [checking, setChecking] = useState(false);

  const checkAccess = async () => {
    setNote('');
    setChecking(true);
    try {
      const data = await refreshSession();
      login(data);
      if (data.user.role === 'pending') {
        setNote('Still pending — your auditor has not assigned a role yet.');
      } else {
        navigate(data.user.role === 'auditor' ? '/auditor' : '/dashboard', { replace: true });
      }
    } catch (e) {
      setNote(e.message || 'Could not refresh session');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/cod-data-logo.png" alt="" className="h-9 w-9 object-contain brightness-110" />
          <span className="font-semibold text-emerald-400">COD-DATA</span>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="text-sm text-slate-400 hover:text-emerald-400"
        >
          Sign out
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-100">Account pending</h1>
          <p className="text-slate-400 leading-relaxed">
            Signed in as <strong className="text-slate-300">{user?.email}</strong>. Your account does not have project
            access yet. An <strong className="text-slate-300">auditor</strong> must assign your role (end user or auditor)
            and, for end users, which projects you can see.
          </p>
          <p className="text-slate-500 text-sm">
            When an auditor has assigned your role, use the button below to load your new access without signing out.
          </p>
          <button
            type="button"
            disabled={checking}
            onClick={checkAccess}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Check for access'}
          </button>
          {note && <p className="text-amber-400/90 text-sm">{note}</p>}
          <Link to="/" className="inline-block text-emerald-400 hover:underline text-sm">
            ← Home
          </Link>
        </div>
      </main>
    </div>
  );
}
