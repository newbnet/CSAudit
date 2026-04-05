import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerAccount, getInvitePreview, getAuthMethods } from '../api';
import { useAuth } from '../context/AuthContext';

function postLoginPath(role) {
  if (role === 'owner') return '/owner';
  if (role === 'auditor') return '/auditor';
  if (role === 'pending') return '/pending';
  return '/dashboard';
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || '';
  const navigate = useNavigate();
  const { user, login: authLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [authMethods, setAuthMethods] = useState(null);

  useEffect(() => {
    getAuthMethods().then(setAuthMethods);
  }, []);

  useEffect(() => {
    if (user) {
      navigate(postLoginPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!inviteToken) {
      setInviteInfo({ valid: false });
      return;
    }
    getInvitePreview(inviteToken).then(setInviteInfo);
  }, [inviteToken]);

  useEffect(() => {
    if (inviteInfo?.valid && inviteInfo.email) {
      setEmail(inviteInfo.email);
    }
  }, [inviteInfo]);

  const googleOnly = authMethods && !authMethods.selfServicePasswordRegister;
  const inviteValid = Boolean(inviteInfo?.valid);
  const inviteLoading = inviteToken && inviteInfo === null;
  const inviteInvalid = inviteToken && inviteInfo && !inviteInfo.valid;
  const showPasswordForm = !googleOnly || inviteValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (googleOnly && inviteValid) {
      const hasPwd = password.length > 0 || confirm.length > 0;
      if (hasPwd) {
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          return;
        }
        if (password !== confirm) {
          setError('Passwords do not match');
          return;
        }
      }
    } else {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match');
        return;
      }
    }

    try {
      const data = await registerAccount({
        email: email.trim(),
        password: googleOnly && inviteValid && !password ? '' : password,
        name: name.trim() || undefined,
        inviteToken: inviteValid ? inviteToken : undefined,
      });
      authLogin(data);
      navigate(postLoginPath(data.user.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  if (authMethods === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="text-slate-500 hover:text-emerald-400 text-sm mb-6 inline-block">
          ← Back to sign in
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <img src="/cod-data-logo.png" alt="COD-DATA" className="h-12 w-12 object-contain brightness-110" />
          <h1 className="text-2xl font-bold text-emerald-400">Create account</h1>
        </div>

        {inviteLoading && <p className="text-slate-500 text-sm mb-6">Checking invitation…</p>}

        {googleOnly && !inviteToken && (
          <div className="text-slate-400 text-sm mb-6 space-y-3">
            <p>
              Open registration is disabled on this site. Sign in with{' '}
              <strong className="text-slate-300">Google</strong> from the login page to start with a limited account, or
              ask an auditor for an invitation link.
            </p>
            <Link
              to="/login"
              className="inline-block text-emerald-400 hover:underline font-medium"
            >
              Go to sign in
            </Link>
          </div>
        )}

        {googleOnly && inviteInvalid && (
          <div className="text-slate-400 text-sm mb-6 space-y-3">
            <p className="text-amber-400">This invitation link is invalid or expired.</p>
            <p>Request a new link from an auditor, or sign in with Google if you already have an account.</p>
            <Link to="/login" className="inline-block text-emerald-400 hover:underline font-medium">
              Go to sign in
            </Link>
          </div>
        )}

        {!googleOnly && inviteInvalid && (
          <p className="text-amber-400 text-sm mb-6">
            This invitation link is invalid or expired. You can still register below; an auditor will assign access
            later.
          </p>
        )}
        {inviteValid && (
          <p className="text-emerald-400/90 text-sm mb-6">
            You were invited as <strong>{inviteInfo.role === 'auditor' ? 'Auditor' : 'End user'}</strong>. Complete
            registration with the email on the invitation.
            {googleOnly && (
              <span className="block mt-2 text-slate-400">
                Password is optional; you can sign in with Google after accepting the invite.
              </span>
            )}
          </p>
        )}
        {!inviteToken && !googleOnly && (
          <p className="text-slate-500 text-sm mb-6">
            New accounts start with <strong className="text-slate-400">limited access</strong> until an auditor assigns
            your role and projects.
          </p>
        )}

        {showPasswordForm && !(googleOnly && inviteInvalid) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={Boolean(inviteValid)}
                className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none read-only:opacity-80"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password{googleOnly && inviteValid ? ' (optional)' : ''}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
                placeholder={googleOnly && inviteValid ? 'Leave blank to use Google only' : 'At least 8 characters'}
                required={!(googleOnly && inviteValid)}
                minLength={googleOnly && inviteValid ? undefined : 8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
                required={!(googleOnly && inviteValid)}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition-colors"
            >
              {inviteValid ? 'Accept invitation' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
