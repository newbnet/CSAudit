/**
 * Audit checklist requirements by asset type/subType.
 * Maps to keys in db.json auditChecklists.
 */
const CHECKLIST_KEYS = {
  'Switch-Layer 2': ['Management VLAN', 'Port Security (MAC limiting)', 'Unused ports disabled'],
  'Switch-Layer 3': ['Inter-VLAN routing ACLs', 'SSH instead of Telnet', 'Routing Protocol Auth'],
  'WIFI': ['WPA3 Status', 'Guest Network Isolation', 'AP count vs coverage'],
  'Server-Exchange': ['Patch level (CU)', 'OWA External exposure', 'MFA status'],
  'Server-Linux': ['Patch level verified', 'SSH hardening', 'Firewall rules configured'],
  'Desktop-Laptop': ['BitLocker status', 'EDR/Antivirus version', 'Local Admin rights audit'],
  'Virtual Machine': ['Isolation verified', 'Snapshots/backup status', 'Resource limits configured'],
};

function getChecklistKey(type, subType) {
  if (type === 'Switch') return subType === 'Layer 2' ? 'Switch-Layer 2' : 'Switch-Layer 3';
  if (type === 'WIFI') return 'WIFI';
  if (type === 'Server' && subType === 'Exchange') return 'Server-Exchange';
  if (type === 'Server' && subType === 'Linux') return 'Server-Linux';
  if (type === 'Virtual Machine') return 'Virtual Machine';
  if (type === 'Desktop' || type === 'Laptop') return 'Desktop-Laptop';
  return null;
}

module.exports = { CHECKLIST_KEYS, getChecklistKey };
