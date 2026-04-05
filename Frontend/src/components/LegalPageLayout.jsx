import { Link } from 'react-router-dom';

export default function LegalPageLayout({ title, children }) {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-300 antialiased">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10 pt-[max(0px,env(safe-area-inset-top,0px))]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/cod-data-logo.png"
              alt="COD-DATA"
              className="h-9 w-9 object-contain brightness-110"
            />
            <span className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
              COD-DATA
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/terms" className="text-slate-400 hover:text-emerald-400 transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-slate-400 hover:text-emerald-400 transition-colors">
              Privacy
            </Link>
            <Link to="/login" className="text-emerald-400/90 hover:text-emerald-300 transition-colors">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12 pb-[max(6rem,env(safe-area-inset-bottom,0px)+4rem)]">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">{title}</h1>
        <div
          className="
          text-[0.9375rem] leading-relaxed text-slate-400
          [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-200 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2:first-of-type]:mt-0
          [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1
          [&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-emerald-300
          [&_strong]:text-slate-400
        "
        >
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 pb-[max(2rem,env(safe-area-inset-bottom,0px)+1rem)]">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-6 justify-center text-sm text-slate-500">
          <Link to="/" className="hover:text-emerald-400 transition-colors">
            Home
          </Link>
          <Link to="/terms" className="hover:text-emerald-400 transition-colors">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-emerald-400 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
