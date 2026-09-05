import { Outlet } from 'react-router-dom';
import { Button } from '../ui/Button';

export function CodeCredLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <a href="/" className="font-bold text-lg tracking-tight">CodeCred</a>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="/" className="hover:text-zinc-50 transition-colors">Analysis</a>
            <a href="/" className="hover:text-zinc-50 transition-colors">History</a>
            <Button variant="ghost" className="text-zinc-400">Sign In</Button>
          </nav>
        </div>
      </header>

      {/* Main Content (Outlet allows nested routes to render here) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
