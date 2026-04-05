import { useState, useEffect } from 'react';
import {
  createAsset,
  updateAsset,
  getChecklistKey,
  getAssetTypeCatalog,
  createCustomAssetType,
} from '../api';

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

export default function AssetForm({
  projectId,
  projects,
  asset: editAsset,
  readOnly = false,
  onSuccess,
  onCancel,
}) {
  const [name, setName] = useState(editAsset?.name ?? '');
  const [type, setType] = useState(editAsset?.type ?? '');
  const [subType, setSubType] = useState(editAsset?.subType ?? '');
  const [ip, setIp] = useState(editAsset?.ip ?? '');
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extraTypes, setExtraTypes] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [shareType, setShareType] = useState(false);
  const [typeMsg, setTypeMsg] = useState('');

  useEffect(() => {
    getAssetTypeCatalog()
      .then((cat) => {
        const c = (cat.community || []).map((t) => ({
          value: t.value || t.label,
          label: `${t.label} (community)`,
          subTypes: null,
          source: 'community',
        }));
        const p = (cat.privateTemplates || []).map((t) => ({
          value: t.value || t.label,
          label: `${t.label} (mine)`,
          subTypes: null,
          source: 'private',
        }));
        setExtraTypes([...c, ...p]);
      })
      .catch(() => setExtraTypes([]));
  }, []);

  const builtinSelected = ASSET_TYPES.find((t) => t.value === type);
  const hasSubTypes = builtinSelected?.subTypes?.length;

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
    if (readOnly) return;
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

  const handleCreateCustomType = async (e) => {
    e.preventDefault();
    if (readOnly || !projectId || !newLabel.trim()) return;
    setTypeMsg('');
    try {
      await createCustomAssetType({
        label: newLabel.trim(),
        description: newDesc.trim(),
        projectId,
        shareWithCommunity: shareType,
      });
      setTypeMsg(shareType ? 'Type added and shared (label only) with other auditors.' : 'Custom type added for this project.');
      setNewLabel('');
      setNewDesc('');
      setShareType(false);
      const cat = await getAssetTypeCatalog();
      const c = (cat.community || []).map((t) => ({
        value: t.value || t.label,
        label: `${t.label} (community)`,
        subTypes: null,
      }));
      const p = (cat.privateTemplates || []).map((t) => ({
        value: t.value || t.label,
        label: `${t.label} (mine)`,
        subTypes: null,
      }));
      setExtraTypes([...c, ...p]);
    } catch (err) {
      setTypeMsg(err.message || 'Failed');
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      {readOnly && (
        <p className="text-cyan-200/90 text-sm p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/30">
          Read-only: you cannot add or edit assets on this project.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={readOnly}
            className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            placeholder="e.g. SW-CORE-01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Type *</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            disabled={readOnly}
            className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            required
          >
            <option value="">Select type...</option>
            <optgroup label="Built-in">
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </optgroup>
            {extraTypes.length > 0 && (
              <optgroup label="Custom & community (labels only — no customer data)">
                {extraTypes.map((t) => (
                  <option key={`${t.source}-${t.value}`} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            )}
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
              disabled={readOnly}
              className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            >
              {builtinSelected?.subTypes?.map((s) => (
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
            disabled={readOnly}
            className="w-full px-4 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
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

        {!readOnly && (
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-md bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              {loading ? (editAsset ? 'Saving...' : 'Adding...') : editAsset ? 'Save' : 'Add Asset'}
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
        )}
      </form>

      {!readOnly && projectId && (
        <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/40 space-y-3">
          <h3 className="text-sm font-medium text-slate-300">New device label for this project</h3>
          <p className="text-xs text-slate-500">
            Adds a selectable type name. You may share <strong className="text-slate-400">only the label</strong> with
            other auditors for consistency—no IPs, hostnames, or scan data are shared.
          </p>
          <form onSubmit={handleCreateCustomType} className="space-y-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 text-sm"
              placeholder="e.g. Industrial PLC"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 text-sm"
              placeholder="Short description (optional)"
            />
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={shareType}
                onChange={(e) => setShareType(e.target.checked)}
                className="rounded border-slate-600 text-emerald-500"
              />
              Share label with community of auditors
            </label>
            {typeMsg && <p className="text-emerald-400/90 text-xs">{typeMsg}</p>}
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md bg-slate-600 text-slate-100 text-sm hover:bg-slate-500"
            >
              Save type
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
