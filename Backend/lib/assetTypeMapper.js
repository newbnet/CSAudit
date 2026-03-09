/**
 * Smart mapping: infer asset type/subType from scan data (vendor, OS, ports, hostname).
 * Used when importing Nmap/Nessus to reduce manual tagging.
 */
function inferAssetType(finding) {
  const vendor = (finding.vendor || '').toLowerCase();
  const osName = (finding.osMatch?.name || finding.osVendor || '').toLowerCase();
  const hostname = (finding.hostname || '').toLowerCase();
  const ports = (finding.ports || []).map((p) => String(p));
  const portSet = new Set(ports);

  const has = (...p) => p.some((port) => portSet.has(String(port)));

  // Enterprise network vendors → Switch or Router
  const enterpriseVendors = ['cisco', 'juniper', 'arista', 'brocade', 'extreme'];
  if (enterpriseVendors.some((v) => vendor.includes(v))) {
    return { type: 'Switch', subType: 'Layer 3' };
  }

  // SOHO vendors (home/small office routers)
  const sohoVendors = ['netgear', 'tp-link', 'd-link', 'linksys', 'asus', 'tenda', 'mikrotik'];
  if (sohoVendors.some((v) => vendor.includes(v))) {
    return { type: 'SOHO', subType: null };
  }

  // WIFI AP vendors
  const wifiVendors = ['ubiquiti', 'aruba', 'ruckus', 'cambium', 'meraki'];
  if (wifiVendors.some((v) => vendor.includes(v))) {
    return { type: 'AP', subType: null };
  }

  // Printer ports: 9100 (JetDirect), 515 (LPD), 631 (IPP)
  if (has('9100') || has('515') || has('631')) {
    return { type: 'Printer', subType: null };
  }

  // Hostname hints
  if (/\b(gateway|_gateway|gw)\b/.test(hostname) || hostname === 'gateway') {
    return { type: 'Gateway', subType: null };
  }
  if (/\b(router|rt-|rt_)\b/.test(hostname)) {
    return { type: 'Router', subType: null };
  }
  if (/\b(switch|sw-|sw_)\b/.test(hostname)) {
    return { type: 'Switch', subType: 'Layer 2' };
  }
  if (/\b(server|srv-|srv_|dc-|exchange)\b/.test(hostname)) {
    if (hostname.includes('exchange')) return { type: 'Server', subType: 'Exchange' };
    if (osName.includes('linux') || osName.includes('ubuntu') || osName.includes('debian') || osName.includes('centos') || osName.includes('rhel')) {
      return { type: 'Server', subType: 'Linux' };
    }
    return { type: 'Server', subType: 'File' };
  }
  if (/\b(ap-|ap_|access.?point)\b/.test(hostname)) {
    return { type: 'AP', subType: null };
  }
  if (/\b(wlan|wireless)\b/.test(hostname)) {
    return { type: 'WLAN', subType: null };
  }
  if (/\b(wifi)\b/.test(hostname)) {
    return { type: 'WIFI', subType: null };
  }

  // Virtual Machine detection (VMware, VirtualBox, Xen, KVM guest)
  if (osName.includes('vmware') || osName.includes('virtualbox') || osName.includes('xen') || osName.includes('kvm') || osName.includes('hyper-v') || osName.includes('virtual machine')) {
    return { type: 'Virtual Machine', subType: null };
  }

  // Apple TV / media devices → TV
  if (osName.includes('apple tv') || osName.includes('roku') || osName.includes('fire tv')) {
    return { type: 'TV', subType: null };
  }

  // iPhone sync port → Laptop (mobile)
  if (has('62078')) {
    return { type: 'Laptop', subType: null };
  }

  // Apple vendor + common ports → Laptop or Desktop
  if (vendor.includes('apple')) {
    return { type: 'Laptop', subType: null };
  }

  // Server-like port combinations
  const serverPorts = ['22', '80', '443', '445', '53', '3389', '3128', '111', '7000', '9080'];
  const serverPortCount = serverPorts.filter((p) => portSet.has(p)).length;
  if (serverPortCount >= 3) {
    if (has('3128')) return { type: 'Server', subType: 'File' };
    if (osName.includes('exchange') || hostname.includes('exchange')) return { type: 'Server', subType: 'Exchange' };
    if (osName.includes('domain') || osName.includes('dc')) return { type: 'Server', subType: 'Domain Controller' };
    if (osName.includes('linux') || osName.includes('ubuntu') || osName.includes('debian') || osName.includes('centos') || osName.includes('rhel')) {
      return { type: 'Server', subType: 'Linux' };
    }
    return { type: 'Server', subType: 'File' };
  }

  // Windows + fewer ports → Desktop
  if (osName.includes('windows') && !osName.includes('server') && ports.length <= 4) {
    return { type: 'Desktop', subType: null };
  }

  // Linux with SSH only or minimal ports → could be embedded/switch or Linux server
  if (osName.includes('linux') && has('22') && ports.length <= 3) {
    return { type: 'Server', subType: 'Linux' };
  }

  return { type: 'Unknown', subType: null };
}

module.exports = { inferAssetType };
