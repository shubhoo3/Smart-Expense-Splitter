export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
            S
          </span>
          <div>
            <h1 className="text-sm font-semibold tracking-tight sm:text-base">
              Smart Expense Splitter
            </h1>
            <p className="text-[11px] text-slate-500">
              Track shared expenses and settle up with ease
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
