import { GRO10X_MUTED } from "../lib/tokens";

export default function Gro10xFeed() {
  return (
    <div className="max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight">Feed</h1>
        <p className={`text-xs ${GRO10X_MUTED}`}>What your network is up to</p>
      </header>
      <div className="p-6 text-center text-sm text-slate-400">
        Posts from your company and connected workspaces will appear here.
        <br />
        <span className="text-[#33E1E4]">Tip: ask Growth Agent to post on your company's behalf.</span>
      </div>
    </div>
  );
}
