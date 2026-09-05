import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Panel } from '../ui/Panel';
import { analyzeProject } from '../../services/projectService';

export function Shell() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await analyzeProject(url);
      navigate(`/projects/${data.analysisId}`);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
          <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">How it works</h2>
          <Panel title="Deterministic Analysis">
            <div className="space-y-4 text-sm text-zinc-300">
              <p>
                CodeCred clones your repository and executes an evidence-based deterministic analysis without relying on AI hallucination or arbitrary scoring.
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Parses package manifests and configuration files.</li>
                <li>Identifies frameworks, libraries, databases, and APIs natively.</li>
                <li>Provides verifiable source references for all findings.</li>
              </ul>
            </div>
          </Panel>
        </section>
      </div>
    </>
  );
}
