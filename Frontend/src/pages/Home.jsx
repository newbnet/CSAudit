import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'auditor' ? '/auditor' : '/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-emerald-400 tracking-tight">
            COD-DATA
          </Link>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Features</a>
            <a href="#built-for" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Who it's for</a>
            <a href="#resources" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Resources</a>
            <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-emerald-400/90 text-sm font-medium tracking-wider uppercase mb-4">
            Cybersecurity Oversight & Defense
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-100 leading-tight mb-6">
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
      <section id="features" className="py-24 px-6">
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
      <section id="built-for" className="py-20 px-6">
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
      <section id="resources" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">Cybersecurity resources</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Practical guidance to strengthen your security posture and compliance.
            </p>
          </div>

          {/* Projects */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
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
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
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
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-slate-500 text-sm">COD-DATA · Cybersecurity Oversight & Defense</span>
          <div className="flex gap-6">
            <a href="#features" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Features</a>
            <a href="#built-for" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Who it's for</a>
            <a href="#resources" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Resources</a>
            <Link to="/login" className="text-slate-500 hover:text-emerald-400 text-sm transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
