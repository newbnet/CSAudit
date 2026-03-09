import { useState } from 'react';
import { uploadNmap, uploadNessus, uploadOpenvas } from '../api';

export default function UploadComponent({ projectId, projects, onProjectChange, onSuccess }) {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('nmap');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) {
      setError('Select a project first');
      return;
    }
    if (!file) {
      setError('Select a file');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const fn = format === 'nmap' ? uploadNmap : format === 'openvas' ? uploadOpenvas : uploadNessus;
      const data = await fn(file, projectId);
      setMessage(data.message || `Imported ${data.imported} findings`);
      setFile(null);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects?.find((p) => p.id === projectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
        <label className="block text-sm font-medium text-slate-300 mb-2">Target project (customer/site)</label>
        <p className="text-xs text-slate-500 mb-2">Select the project to avoid mixing data between customers.</p>
        <select
          value={projectId}
          onChange={(e) => onProjectChange?.(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none mb-2"
        >
          <option value="">Select project...</option>
          {(projects || []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          Projects: {(projects || []).map((p) => p.name).join(', ') || 'None'}
        </p>
        {selectedProject && (
          <p className="text-emerald-400 text-sm font-medium mt-2">
            Uploading to: {selectedProject.name}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
        >
          <option value="nmap">Nmap (XML)</option>
          <option value="openvas">OpenVAS (CSV)</option>
          <option value="nessus">Nessus (CSV)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">File</label>
        <input
          type="file"
          accept={format === 'nmap' ? '.xml' : '.csv,.txt'}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-emerald-500/20 file:text-emerald-400"
        />
      </div>

      {message && <p className="text-emerald-400 text-sm">{message}</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !file}
        className="px-6 py-2 rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Uploading...' : 'Upload'}
      </button>

      <p className="text-slate-500 text-xs">
        {format === 'nmap'
          ? 'Upload Nmap XML output (-oX). Hosts and open ports will be imported as vulnerabilities.'
          : format === 'openvas'
          ? 'Upload OpenVAS CSV (CSV Results or CSV Hosts). Expects columns: Host/IP, Severity, Name.'
          : 'Upload Nessus CSV export. Expects columns: Host, Risk, Name.'}
      </p>
    </form>
  );
}
