import { useState, useEffect } from 'react';
import { createAsset, updateAsset, getChecklistKey } from '../api';

const ASSET_TYPES = [
  { value: 'Unknown', label: 'Unknown', subTypes: null },
  { value: 'Switch', label: 'Switch', subTypes: ['Layer 2', 'Layer 3'] },
  { value: 'Router', label: 'Router', subTypes: null },
  { value: 'Gateway', label: 'Gateway', subTypes: null },
  { value: 'SOHO', label: 'SOHO', subTypes: null },
  { value: 'WIFI', label: 'WIFI', subTypes: null },
  { value: 'WLAN', label: 'WLAN', subTypes: null },
  { value: 'AP', label: 'AP', subTypes: null },
  { value: 'Server', label: 'Server', subTypes: ['Exchange', 'File', 'Domain Controller', 'Linux'] },
  { value: 'Virtual Machine', label: 'Virtual Machine', subTypes: null },
  { value: 'Desktop', label: 'Desktop', subTypes: null },
  { value: 'Laptop', label: 'Laptop', subTypes: null },
  { value: 'TV', label: 'TV', subTypes: null },
  { value: 'Printer', label: 'Printer', subTypes: null },
];

export default function AssetForm({ projectId, projects, asset: editAsset, onSuccess, onCancel }) {
  const [name, setName] = useState(editAsset?.name ?? '');
  const [type, setType] = useState(editAsset?.type ?? '');
  const [subType, setSubType] = useState(editAsset?.subType ?? '');
  const [ip, setIp] = useState(editAsset?.ip ?? '');
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedType = ASSET_TYPES.find((t) => t.value === type);
  const hasSubTypes = selectedType?.subTypes?.length;

  useEffect(() => {
    if (editAsset) {
      setName(editAsset.name ?? '');
      setType(editAsset.type ?? '');
      setSubType(editAsset.subType ?? '');
      setIp(editAsset.ip ?? '');
    } else {
      setName('');
      setType('');
      setSubType('');
      setIp('');
    }
  }, [editAsset]);

  useEffect(() => {
    if (!type) {
      setSubType('');
      setChecklistItems([]);
      return;
    }
    if (hasSubTypes && !subType) {
      setChecklistItems([]);
      return;
    }
    getChecklistKey(type, subType || null)
      .then(({ items }) => setChecklistItems(items || []))
      .catch(() => setChecklistItems([]));
  }, [type, subType, hasSubTypes]);

  const handleTypeChange = (v) => {
    setType(v);
    const t = ASSET_TYPES.find((x) => x.value === v);
    setSubType(t?.subTypes?.[0] || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editAsset && !projectId) {
      setError('Select a project first');
      return;
    }
    if (!type) {
      setError('Select a type');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (editAsset) {
        await updateAsset(editAsset.id, { name, type, subType: subType || null, ip: ip || null });
        onSuccess?.();
        onCancel?.();
      } else {
        await createAsset({ name, type, subType: subType || null, ip: ip || null, projectId });
        setName('');
        setType('');
        setSubType('');
        setIp('');
        onSuccess?.();
      }
    } catch (err) {
      setError(err.message || (editAsset ? 'Failed to update asset' : 'Failed to create asset'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
          placeholder="e.g. SW-CORE-01"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Type *</label>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
          required
        >
          <option value="">Select type...</option>
          {ASSET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {hasSubTypes && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            SubType {type === 'Switch' && '(L2 / L3)'}
          </label>
          <select
            value={subType}
            onChange={(e) => setSubType(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
          >
            {selectedType?.subTypes?.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">IP</label>
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
          placeholder="192.168.1.1"
        />
      </div>

      {checklistItems.length > 0 && (
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <p className="text-sm text-emerald-400 mb-2">Checklist for this asset:</p>
          <ul className="text-sm text-slate-400 space-y-1">
            {checklistItems.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {loading ? (editAsset ? 'Saving...' : 'Adding...') : (editAsset ? 'Save' : 'Add Asset')}
        </button>
        {editAsset && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
