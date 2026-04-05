import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login, getAuthMethods } from '../api';
import { useAuth } from '../context/AuthContext';

function oauthErrorLabel(code, passwordLogin) {
  const map = {
    google_denied: 'Google sign-in was cancelled.',
    oauth_state_invalid: 'Sign-in session expired. Please try again.',
    google_email_unverified: 'Your Google account email is not verified.',
    google_domain_not_allowed: 'This Google account is not allowed for this site.',
  };
  if (code === 'google_oauth_failed') {
    return passwordLogin
      ? 'Google sign-in failed. Try again or use email and password.'
      : 'Google sign-in failed. Please try again.';
  }
  return map[code];
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [methods, setMethods] = useState(null);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    getAuthMethods().then(setMethods);
  }, []);

  const googleOAuth = methods?.googleOAuth ?? false;
  const passwordLogin = methods?.passwordLogin ?? true;

  useEffect(() => {
    const code = searchParams.get('error');
    if (!code) return;
    const msg = oauthErrorLabel(code, passwordLogin);
    if (!msg) return;
    setError(msg);
    const next = new URLSearchParams(searchParams);
    next.delete('error');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, passwordLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(email, password);
      authLogin(data);
      navigate(
        data.user.role === 'owner'
          ? '/owner'
          : data.user.role === 'auditor'
            ? '/auditor'
            : data.user.role === 'pending'
              ? '/pending'
              : '/dashboard'
      );
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const startGoogle = () => {
    window.location.assign('/api/auth/google');
  };

  if (methods === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  const misconfigured = !passwordLogin && !googleOAuth;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="text-slate-500 hover:text-emerald-400 text-sm mb-6 inline-block">
          ← Back to home
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <img src="/cod-data-logo.png" alt="COD-DATA" className="h-12 w-12 object-contain brightness-110" />
          <h1 className="text-2xl font-bold text-emerald-400">COD-DATA</h1>
        </div>
        <p className="text-slate-500 text-sm mb-8">Cybersecurity Oversight & Defense</p>

        {misconfigured && (
          <p className="text-amber-400 text-sm mb-6">
            Sign-in is not configured: password login is off but Google OAuth is not enabled. Contact an administrator.
          </p>
        )}

        {googleOAuth && (
          <>
            <button
              type="button"
              onClick={startGoogle}
              disabled={misconfigured}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-md bg-white text-slate-800 font-medium border border-slate-200 hover:bg-slate-50 transition-colors mb-6 disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
            {passwordLogin && (
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">Or email</span>
                </div>
              </div>
            )}
          </>
        )}

        {passwordLogin && (
          <>
            <p className="text-slate-500 text-sm mb-4">
              No account?{' '}
              <Link to="/register" className="text-emerald-400 hover:underline">
                Create one
              </Link>
              {methods && !methods.selfServicePasswordRegister && (
                <span className="text-slate-600"> (invitation link required)</span>
              )}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full py-2 rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition-colors"
              >
                Sign in
              </button>
            </form>
          </>
        )}

        {!passwordLogin && (
          <div className="space-y-4">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <p className="text-slate-500 text-sm">
              Have an invitation?{' '}
              <Link to="/register" className="text-emerald-400 hover:underline">
                Complete registration
              </Link>
            </p>
          </div>
        )}

        {googleOAuth && (
          <p className="text-slate-600 text-xs mt-4 leading-relaxed">
            Google sign-in uses minimal account permissions (identity and email only).
            {passwordLogin
              ? ' Password login remains available as a backup when enabled by the server.'
              : ' Password sign-in is disabled for this site.'}
          </p>
        )}

        <p className="text-slate-600 text-xs mt-6 text-center">
          <Link to="/terms" className="hover:text-emerald-500/90">
            Terms
          </Link>
          <span className="mx-2 text-slate-700">·</span>
          <Link to="/privacy" className="hover:text-emerald-500/90">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}
