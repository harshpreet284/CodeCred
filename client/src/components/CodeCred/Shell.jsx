import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import { analyzeProject } from '../../services/projectService';

export function Shell() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await analyzeProject(url);
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight mb-2">Analyze Repository</h1>
          <p className="text-zinc-400 max-w-2xl text-lg">
            Submit a public GitHub repository for deterministic technical analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Submission</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <Input 
                id="repo-url" 
                label="GitHub Repository URL" 
                placeholder="https://github.com/username/repo" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                error={error}
                disabled={isLoading}
              />
              <Button type="submit" variant="primary" loading={isLoading} disabled={isLoading || !url.trim()}>
                {isLoading ? 'Analyzing...' : 'Analyze Repository'}
              </Button>
            </form>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Analysis Result</h2>
            {result ? (
              <Panel title={`Analysis complete: ${result.repository.name}`}>
                <div className="space-y-4 text-sm text-zinc-300">
                  <p><strong className="text-zinc-100">Analysis ID:</strong> {result.analysisId}</p>
                  <p><strong className="text-zinc-100">Owner:</strong> {result.repository.owner}</p>
                  <p><strong className="text-zinc-100">Languages:</strong> {result.analysis?.summary?.languages?.join(', ') || 'None detected'}</p>
                  
                  {result.analysis?.analysisMetadata?.limitations?.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                      <strong className="text-amber-500 block mb-1">Limitations</strong>
                      <ul className="list-disc list-inside text-amber-400/80 space-y-1">
                        {result.analysis.analysisMetadata.limitations.map((limit, idx) => (
                          <li key={idx}>{limit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <p className="text-emerald-400 font-mono text-xs">
                      Successfully saved snapshot to database.
                    </p>
                  </div>
                </div>
              </Panel>
            ) : (
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-500 text-center">
                Submit a repository to see results.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
