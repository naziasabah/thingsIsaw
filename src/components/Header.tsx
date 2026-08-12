export default function Header() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-start justify-between px-6 py-6 sm:px-10 sm:py-8">
      <span className="pointer-events-auto font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-black sm:text-xs">
        Lumiere Archive
      </span>
      <div className="pointer-events-auto text-right font-mono text-[9px] uppercase leading-[1.9] tracking-[0.2em] text-black/45 sm:text-[10px]">
        <div>Issue 01</div>
        <div>Curated Selection</div>
      </div>
    </header>
  );
}
