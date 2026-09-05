import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectAnalysis } from '../../services/projectService';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

/**
 * Renders a list of evidence indicator objects from the deterministic analysis.
 * Each indicator has the shape: { type, name?, evidence: { type, source: { path, field }, detail } }
 */
function IndicatorList({ indicators }) {
  if (!indicators || indicators.length === 0) {
    return <p className="text-sm text-zinc-500 italic">No evidence detected in retrieved material.</p>;
  }
  return (
    <ul className="space-y-2">
      {indicators.map((ind, i) => (
        <li key={i} className="text-sm text-zinc-300">
          <span className="text-zinc-100">{ind.name || ind.type?.replace(/_/g, ' ')}</span>
          {ind.evidence && (
            <span className="text-zinc-500 ml-2 text-xs font-mono">
              {ind.evidence.source?.path && `(${ind.evidence.source.path})`}
            </span>
          )}
          {ind.evidence?.detail && (
            <p className="text-zinc-400 text-xs mt-0.5 italic">{ind.evidence.detail}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Renders a section row with a detected/not-detected status.
 * Uses honest absence-of-evidence language — "Not Detected" means the deterministic
 * analysis found no indicators in retrieved material, not that the capability is absent.
 */
function EvidenceSection({ label, indicators }) {
  const hasEvidence = indicators && indicators.length > 0;
  return (
    <div className="border-b border-zinc-800/50 py-3 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <span className="font-medium text-zinc-200">{label}</span>
        {hasEvidence
          ? <Badge variant="success">Detected</Badge>
          : <Badge variant="neutral">Not Detected</Badge>
        }
      </div>
      {hasEvidence ? (
        <div className="text-sm text-zinc-400 bg-zinc-950/50 rounded p-2 border border-zinc-800/50">
          <IndicatorList indicators={indicators} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500 italic">No evidence detected in retrieved material.</p>
      )}
    </div>
  );
}

export function EvidenceReport() {
  const { analysisId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchAnalysis() {
      try {
        const result = await getProjectAnalysis(analysisId);
        if (isMounted) {
          setData(result);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load report.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAnalysis();
    return () => { isMounted = false; };
  }, [analysisId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
        <p>Retrieving Snapshot...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Report Not Found</h2>
          <p className="text-zinc-400 mb-6">{error || 'The analysis you requested does not exist.'}</p>
          <Link to="/">
            <Button variant="primary">Submit a new repository</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { repository, analysis } = data;
  const {
    summary,
    structure,
    dependencies,
    api,
    database,
    authentication,
    testing,
    documentation,
    deployment,
    analysisMetadata
  } = analysis;

  // Languages: [{ name, evidence: [] }] — display names only as badges
  const languageNames = summary?.languages?.map(l => l.name).filter(Boolean) || [];

  // Frameworks: [{ name, evidence: [] }]
  const frameworkNames = summary?.frameworks?.map(f => f.name).filter(Boolean) || [];

  // Libraries: [{ name, evidence: [] }]
  const libraryNames = summary?.libraries?.map(l => l.name).filter(Boolean) || [];

  // Structure directories: [{ path, evidence: {...} }]
  const directoryPaths = structure?.directories?.map(d => d.path).filter(Boolean) || [];

  // Entry points: [{ path, evidence: {...} }]
  const entryPoints = structure?.entryPoints?.map(ep => ep.path).filter(Boolean) || [];

  // Manifests: [{ path, evidence: {...} }]
  const manifests = dependencies?.manifests?.map(m => m.path).filter(Boolean) || [];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="border-b border-zinc-800 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{repository.name}</h1>
          <Badge variant="default" className="text-xs">
            Snapshot: {new Date(data.createdAt).toLocaleDateString()}
          </Badge>
        </div>
        <p className="text-zinc-400 text-lg">
          {repository.owner}/{repository.name} &middot; {repository.defaultBranch}
        </p>
        {languageNames.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {languageNames.map(lang => (
              <Badge key={lang} variant="secondary">{lang}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Retrieval Limitations — shown when analysis coverage was incomplete */}
      {analysisMetadata?.limitations?.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <h3 className="text-amber-500 font-semibold mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Retrieval Limitations
          </h3>
          <ul className="list-disc list-inside text-sm text-amber-400/80 space-y-1">
            {analysisMetadata.limitations.map((limit, idx) => (
              <li key={idx}>{limit}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-500/60 mt-3 italic">
            Absence of evidence below may reflect these retrieval limits rather than actual absence in the repository.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Ecosystem */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Ecosystem</h2>

          <Panel title="Frameworks & Libraries">
            <div className="space-y-4">
              {frameworkNames.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Frameworks</h4>
                  <div className="flex flex-wrap gap-2">
                    {frameworkNames.map(fw => <Badge key={fw} variant="primary">{fw}</Badge>)}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">No recognized frameworks detected in retrieved material.</p>
              )}
              {libraryNames.length > 0 && (
                <div className="pt-4 border-t border-zinc-800/50">
                  <h4 className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Libraries</h4>
                  <div className="flex flex-wrap gap-2">
                    {libraryNames.map(lib => <Badge key={lib} variant="neutral">{lib}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Dependency Manifests">
            {manifests.length > 0 ? (
              <ul className="list-disc list-inside text-sm space-y-1">
                {manifests.map(path => (
                  <li key={path} className="font-mono text-emerald-400/90 text-xs">{path}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500 italic">No dependency manifests found in retrieved material.</p>
            )}
          </Panel>
        </section>

        {/* Structure */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Structure</h2>

          <Panel title="Structural Evidence">
            <div className="space-y-4">
              {entryPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Entry Points</h4>
                  <div className="flex flex-wrap gap-2">
                    {entryPoints.map(ep => (
                      <code key={ep} className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-emerald-400/90">
                        {ep}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              <div className={entryPoints.length > 0 ? 'pt-4 border-t border-zinc-800/50' : ''}>
                <h4 className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Key Directories</h4>
                {directoryPaths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {directoryPaths.slice(0, 15).map(dir => (
                      <code key={dir} className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-300">
                        {dir}/
                      </code>
                    ))}
                    {directoryPaths.length > 15 && (
                      <span className="text-xs text-zinc-500 px-2 py-1">+{directoryPaths.length - 15} more</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 italic">No key directories identified in retrieved material.</p>
                )}
              </div>
            </div>
          </Panel>
        </section>

        {/* Systems & Data */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Systems & Data</h2>
          <Panel title="Database & API">
            <div className="space-y-1">
              <EvidenceSection label="Database Integrations" indicators={database?.indicators} />
              <EvidenceSection label="API / HTTP Usage" indicators={api?.indicators} />
            </div>
          </Panel>
        </section>

        {/* Quality & Security */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Quality & Security</h2>

          <Panel title="Testing & Authentication">
            <div className="space-y-1">
              <EvidenceSection label="Authentication / Security" indicators={authentication?.indicators} />
              <EvidenceSection label="Automated Testing" indicators={testing?.indicators} />
            </div>
          </Panel>

          <Panel title="Deployment & Docs">
            <div className="space-y-1">
              <EvidenceSection label="Deployment / CI/CD" indicators={deployment?.indicators} />
              <EvidenceSection label="Documentation" indicators={documentation?.indicators} />
            </div>
          </Panel>
        </section>

      </div>

      {/* Analysis metadata footer */}
      <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-600 flex items-center justify-between">
        <span>Analysis ID: <code className="font-mono text-zinc-500">{data.analysisId}</code></span>
        <span>Version: {analysisMetadata?.analysisVersion}</span>
      </div>

    </div>
  );
}
