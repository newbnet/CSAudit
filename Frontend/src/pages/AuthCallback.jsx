import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { completeGoogleOAuth } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const nonce = searchParams.get('nonce');
    if (!nonce) {
      setError('Missing sign-in session. Start again from the login page.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await completeGoogleOAuth(nonce);
        if (cancelled) return;
        login(data);
        const dest =
          data.user.role === 'owner'
            ? '/owner'
            : data.user.role === 'auditor'
              ? '/auditor'
              : data.user.role === 'pending'
                ? '/pending'
                : '/dashboard';
        navigate(dest, { replace: true });
      } catch (e) {
        if (!cancelled) setError(e.message || 'Google sign-in failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {error ? (
          <>
            <p className="text-red-400 mb-6">{error}</p>
            <Link to="/login" className="text-emerald-400 hover:underline">
              Back to sign in
            </Link>
          </>
        ) : (
          <p className="text-slate-400 animate-pulse">Completing sign-in…</p>
        )}
      </div>
    </div>
  );
}
