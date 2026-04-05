/**
 * Shared chrome for authenticated app surfaces: sticky header, safe areas, consistent max-width.
 */
export function DashboardShell({ eyebrow, title, actions, toolbar, tabBar, children, mainClassName = '' }) {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col antialiased">
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/[0.97] backdrop-blur-md pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p>
              <h1 className="text-lg sm:text-xl font-bold text-emerald-400 tracking-tight">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>
          </div>
          {toolbar}
        </div>
        {tabBar}
      </header>
      <main
        className={`flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] ${mainClassName}`}
      >
        {children}
      </main>
    </div>
  );
}

/** Minimum touch target ~44px height on coarse pointers; normal on desktop */
export const dashTouchLink =
  'inline-flex items-center justify-center min-h-[44px] px-3 sm:min-h-0 sm:py-1 text-sm text-slate-400 hover:text-emerald-400 transition-colors rounded-lg sm:rounded-none active:bg-slate-800/50 sm:active:bg-transparent';

export const dashTouchButton =
  'inline-flex items-center justify-center min-h-[44px] px-4 sm:min-h-0 sm:py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800/80 hover:border-slate-500 hover:text-emerald-400 transition-colors';
