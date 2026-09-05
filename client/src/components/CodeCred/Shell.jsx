import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';

export function Shell() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="font-bold text-lg tracking-tight">CodeCred</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-zinc-50 transition-colors">Analysis</a>
            <a href="#" className="hover:text-zinc-50 transition-colors">History</a>
            <Button variant="ghost" className="text-zinc-400">Sign In</Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        <div className="mb-10 border-b border-zinc-800 pb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Visual System Demo</h1>
          <p className="text-zinc-400 max-w-2xl text-lg">
            "Know your code. Defend your work." — This is the foundational application shell and component system.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Typography & Colors */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Typography & Colors</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">Heading 3</h3>
                <p className="text-zinc-400 mt-1">Primary text is zinc-50, secondary is zinc-400. The font is Inter.</p>
              </div>
              <div className="p-4 bg-zinc-900 rounded-md border border-zinc-800">
                <code className="font-mono text-sm text-emerald-400">
                  {'//'} This is technical monospace text (JetBrains Mono)<br />
                  const status = "verified";
                </code>
              </div>
            </div>
          </section>

          {/* Buttons */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Analyze Repository</Button>
              <Button variant="secondary">View Evidence</Button>
              <Button variant="ghost">Cancel</Button>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button variant="primary" loading>Processing</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </section>

          {/* Inputs */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Form Controls</h2>
            <div className="space-y-4 max-w-md">
              <Input 
                id="repo-url" 
                label="GitHub Repository URL" 
                placeholder="https://github.com/username/repo" 
              />
              <Input 
                id="error-demo" 
                label="Invalid Input" 
                placeholder="Invalid data" 
                error="Repository not found or is private."
                defaultValue="https://github.com/private/repo"
              />
            </div>
          </section>

          {/* Panels & Status */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Panels & Status</h2>
            <Panel title="Technical Evidence Detected">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">React framework</span>
                  <Badge variant="success">Detected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Automated testing</span>
                  <Badge variant="warning">Partial Evidence</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database schema</span>
                  <Badge variant="error">Missing</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Docker configuration</span>
                  <Badge variant="neutral">Not Found</Badge>
                </div>
              </div>
            </Panel>
          </section>

        </div>
      </main>
    </div>
  );
}
