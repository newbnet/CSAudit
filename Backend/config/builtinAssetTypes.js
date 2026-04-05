/** Default device types (no customer data). Auditors can add project-specific labels and optionally share labels only. */
const BUILTIN_ASSET_TYPES = [
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

module.exports = { BUILTIN_ASSET_TYPES };
