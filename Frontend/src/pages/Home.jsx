import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!loading && user && user.role !== 'pending') {
      const dest =
        user.role === 'owner' ? '/owner' : user.role === 'auditor' ? '/auditor' : '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (user && user.role !== 'pending') return null;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-emerald-500 focus:text-slate-900 focus:font-medium"
      >
        Skip to content
      </a>
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-md pt-[max(0.5rem,env(safe-area-inset-top,0px))]"
        aria-label="Primary"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0" onClick={() => setMenuOpen(false)}>
            <img
              src="/cod-data-logo.png"
              alt=""
              className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 object-contain brightness-110 contrast-110"
            />
            <span className="text-lg sm:text-xl font-bold text-emerald-400 tracking-tight group-hover:text-emerald-300 transition-colors truncate">
              COD-DATA
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#built-for" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
              Who it&apos;s for
            </a>
            <a href="#resources" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
              Resources
            </a>
            <Link to="/terms" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">
              Privacy
            </Link>
            {user?.role === 'pending' ? (
              <>
                <Link
                  to="/pending"
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                >
                  Account status
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            {menuOpen ? (
              <span className="text-lg leading-none" aria-hidden>
                ×
              </span>
            ) : (
              <span className="text-sm font-semibold tracking-tight" aria-hidden>
                Menu
              </span>
            )}
          </button>
        </div>

        {menuOpen && (
          <div
            id="mobile-nav-menu"
            className="md:hidden border-t border-slate-800/80 bg-slate-950/98 px-4 py-4 space-y-1 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
          >
            <a
              href="#features"
              className="block min-h-[44px] flex items-center text-slate-300 hover:text-emerald-400 border-b border-slate-800/80"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#built-for"
              className="block min-h-[44px] flex items-center text-slate-300 hover:text-emerald-400 border-b border-slate-800/80"
              onClick={() => setMenuOpen(false)}
            >
              Who it&apos;s for
            </a>
            <a
              href="#resources"
              className="block min-h-[44px] flex items-center text-slate-300 hover:text-emerald-400 border-b border-slate-800/80"
              onClick={() => setMenuOpen(false)}
            >
              Resources
            </a>
            <Link
              to="/terms"
              className="block min-h-[44px] flex items-center text-slate-300 hover:text-emerald-400 border-b border-slate-800/80"
              onClick={() => setMenuOpen(false)}
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="block min-h-[44px] flex items-center text-slate-300 hover:text-emerald-400 border-b border-slate-800/80"
              onClick={() => setMenuOpen(false)}
            >
              Privacy
            </Link>
            {user?.role === 'pending' ? (
              <>
                <Link
                  to="/pending"
                  className="block min-h-[44px] flex items-center font-medium text-amber-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Account status
                </Link>
                <button
                  type="button"
                  className="block w-full text-left min-h-[44px] flex items-center text-slate-400"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block min-h-[44px] flex items-center font-medium text-emerald-400"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </nav>

      {user?.role === 'pending' && (
        <div className="fixed top-[73px] left-0 right-0 z-40 border-b border-amber-500/25 bg-amber-950/40 px-4 sm:px-6 py-2 text-center text-sm text-amber-200/95">
          Signed in as {user.email}. Waiting for an auditor to assign access —{' '}
          <Link to="/pending" className="underline font-medium text-amber-100 hover:text-white">
            open account status
          </Link>
        </div>
      )}

      {/* Hero */}
      <section
        id="main-content"
        className={`relative pb-20 sm:pb-24 px-4 sm:px-6 overflow-hidden ${user?.role === 'pending' ? 'pt-36 sm:pt-40' : 'pt-28 sm:pt-32'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-slate-800/60 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] mb-8">
            <img src="/cod-data-logo.png" alt="COD-DATA" className="h-24 w-24 md:h-32 md:w-32 object-contain brightness-110" />
          </div>
          <p className="text-emerald-400/90 text-sm font-medium tracking-wider uppercase mb-4">
            Cybersecurity Oversight & Defense
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-slate-100 leading-tight mb-6">
            Vulnerability management
            <br />
            <span className="text-emerald-400">that scales with your organization</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track assets, import scan results, and deliver clear dashboards to stakeholders. 
            Built for consultants, auditors, and security teams managing multiple clients or sites.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25"
            >
              Get started
            </Link>
            <a href="#features" className="px-8 py-4 rounded-xl border border-slate-600 text-slate-300 font-medium hover:border-emerald-500/50 hover:text-emerald-400 transition-all">
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">Everything you need to stay ahead</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From scan import to stakeholder reporting, COD-DATA streamlines your vulnerability workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Multi-project isolation',
                desc: 'Separate data by customer, site, or engagement. No mixing, no mistakes.',
                icon: '📁',
              },
              {
                title: 'Nmap & OpenVAS import',
                desc: 'Import Nmap XML, OpenVAS CSV, and Nessus CSV. Automatic asset type detection reduces manual tagging.',
                icon: '🔍',
              },
              {
                title: 'Audit checklists',
                desc: 'Type-specific checklists for switches, servers, WiFi, and more. Track compliance at a glance.',
                icon: '✓',
              },
              {
                title: 'Improvement tracking',
                desc: 'End users see vulnerability trends over time. Prove progress to leadership.',
                icon: '📈',
              },
              {
                title: 'Role-based access',
                desc: 'Auditors manage assets; end users view dashboards. Assign projects per user.',
                icon: '👤',
              },
              {
                title: 'Open-source friendly',
                desc: 'Works with Nmap, OpenVAS, and Nessus. Your tools, your data.',
                icon: '🔓',
              },
              {
                title: 'Protective DNS',
                desc: 'DNS-layer security blocks malicious domains, phishing, and malware before they reach your network. First line of defense.',
                icon: '🛡️',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all"
              >
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="built-for" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">Built for security professionals</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Whether you're auditing one site or managing dozens of clients, COD-DATA adapts to your workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
              <h3 className="font-semibold text-emerald-400 mb-2">Consultants & auditors</h3>
              <p className="text-slate-400 text-sm">One project per client. Import scans, tag assets, run checklists. Deliver dashboards that show progress.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
              <h3 className="font-semibold text-emerald-400 mb-2">Internal security teams</h3>
              <p className="text-slate-400 text-sm">Organize by site or business unit. Give stakeholders access only to their data. Track improvement over time.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
              <h3 className="font-semibold text-emerald-400 mb-2">MSPs & MSSPs</h3>
              <p className="text-slate-400 text-sm">Multi-tenant by design. Assign end users to specific projects. Scale without mixing customer data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources / Useful info */}
      <section id="resources" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">Resources & related tools</h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-3">
              Practical guidance to strengthen your security posture and compliance—plus other COD-DATA apps
              that live on their own subdomains.
            </p>
            <p className="text-slate-500 text-sm max-w-2xl mx-auto">
              <span className="text-emerald-400/90 font-medium">This platform</span> is vulnerability management and
              audits. Tools like GearGuard are for everyday maintenance and hobbies; they are not security-dashboard
              software and use <strong className="text-slate-400">their own branding and sign-in</strong> when you
              follow the link.
            </p>
          </div>

          {/* Projects */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            <a
              href="https://cod-data.com"
              className="group p-6 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-emerald-500/50 transition-all flex items-center gap-4"
            >
              <span className="text-3xl">🛡️</span>
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 group-hover:text-emerald-300 mb-1">COD-DATA</h3>
                <p className="text-slate-400 text-sm">Vulnerability management and audit platform</p>
                <span className="text-emerald-500/80 text-sm mt-2 inline-block group-hover:underline">cod-data.com →</span>
              </div>
            </a>
            <a
              href="https://grab.cod-data.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-emerald-500/50 transition-all flex items-center gap-4"
            >
              <span className="text-3xl">📥</span>
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 group-hover:text-emerald-300 mb-1">Grab</h3>
                <p className="text-slate-400 text-sm">Video downloader</p>
                <span className="text-emerald-500/80 text-sm mt-2 inline-block group-hover:underline">grab.cod-data.com →</span>
              </div>
            </a>
            <a
              href="https://spectra.cod-data.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-emerald-500/50 transition-all flex items-center gap-4"
            >
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 group-hover:text-emerald-300 mb-1">Spectra</h3>
                <p className="text-slate-400 text-sm">Spectrum & frequency analyzer</p>
                <span className="text-emerald-500/80 text-sm mt-2 inline-block group-hover:underline">spectra.cod-data.com →</span>
              </div>
            </a>
            <a
              href="https://gearguard.cod-data.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl border border-amber-500/35 bg-gradient-to-br from-slate-950/90 to-amber-950/20 hover:border-amber-400/55 transition-all flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <span className="text-3xl shrink-0" aria-hidden>
                🔧
              </span>
              <div className="min-w-0 text-left">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-amber-500/90 mb-1">
                  Separate app · own sign-in
                </p>
                <h3 className="text-lg font-semibold text-amber-400 group-hover:text-amber-300 mb-1">GearGuard</h3>
                <p className="text-slate-400 text-sm leading-snug">
                  Track maintenance for hobbies, vehicles, and gear—oil changes, service logs, mileage, and reminders.
                  Built for daily upkeep, not security assessments.
                </p>
                <span className="text-amber-500/90 text-sm mt-2 inline-block group-hover:underline">
                  gearguard.cod-data.com →
                </span>
              </div>
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <article className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">Scan best practices</h3>
              <ul className="text-slate-400 text-sm space-y-2">
                <li>• Run Nmap with <code className="text-slate-500 font-mono text-xs">-sV -O</code> for service and OS detection</li>
                <li>• Export Nessus as CSV for compatibility</li>
                <li>• Schedule scans regularly; track changes over time</li>
              </ul>
            </article>
            <article className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">Common frameworks</h3>
              <ul className="text-slate-400 text-sm space-y-2">
                <li>• CIS Controls — prioritized security actions</li>
                <li>• NIST CSF — identify, protect, detect, respond, recover</li>
                <li>• ISO 27001 — information security management</li>
              </ul>
            </article>
            <article className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">Severity levels</h3>
              <ul className="text-slate-400 text-sm space-y-2">
                <li>• Critical — immediate exploitation risk</li>
                <li>• High — significant impact if exploited</li>
                <li>• Medium — should be remediated promptly</li>
                <li>• Low / Info — context and hardening</li>
              </ul>
            </article>
            <article className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">Protective DNS</h3>
              <ul className="text-slate-400 text-sm space-y-2">
                <li>• Blocks malicious domains before resolution</li>
                <li>• Stops phishing, malware C2, and botnet traffic</li>
                <li>• Zero-trust first line of defense at the DNS layer</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Ready to streamline your vulnerability workflow?</h2>
          <p className="text-slate-400 mb-8">
            Sign in to manage assets, import scans, and deliver dashboards your stakeholders will actually use.
          </p>
          <Link
            to="/login"
            className="inline-block px-8 py-4 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 sm:py-12 px-4 sm:px-6 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/cod-data-logo.png" alt="" className="h-7 w-7 object-contain opacity-90 brightness-110" />
            <span className="text-slate-500 text-sm">COD-DATA · Cybersecurity Oversight & Defense</span>
          </div>
          <div className="flex flex-wrap gap-6 justify-center">
            <a href="#features" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Features</a>
            <a href="#built-for" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Who it's for</a>
            <a href="#resources" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Resources</a>
            <Link to="/terms" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Terms</Link>
            <Link to="/privacy" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Privacy</Link>
            <Link to="/login" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
