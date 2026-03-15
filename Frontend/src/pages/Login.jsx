import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(email, password);
      authLogin(data);
      navigate(data.user.role === 'auditor' ? '/auditor' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="text-slate-500 hover:text-emerald-400 text-sm mb-4 inline-block">← Back to home</Link>
        <h1 className="text-2xl font-bold text-emerald-400 mb-2">COD-DATA</h1>
        <p className="text-slate-500 text-sm mb-8">Cybersecurity Oversight & Defense</p>
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
      </div>
    </div>
  );
}
