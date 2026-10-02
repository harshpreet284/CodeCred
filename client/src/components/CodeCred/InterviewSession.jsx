import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInterview, evaluateAnswers } from '../../services/projectService';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function InterviewSession() {
  const { analysisId, sessionId } = useParams();
  const [questions, setQuestions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState('');
  const [validationError, setValidationError] = useState('');

  const [evaluations, setEvaluations] = useState(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('in_progress');

  const fetchSession = async () => {
    setIsLoading(true);
    setError('');
    try {
      const session = await getInterview(analysisId, sessionId);
      setQuestions(session.questions || []);
      setSessionStatus(session.status);

      const initialAnswers = {};
      if (session.answers && session.answers.length > 0) {
        session.answers.forEach(a => {
          initialAnswers[a.questionId] = a.answer;
        });
      }
      setAnswers(initialAnswers);

      if (session.status === 'completed') {
        const evalMap = {};
        if (session.evaluations) {
          session.evaluations.forEach(ev => {
            evalMap[ev.questionId] = ev;
          });
        }
        setEvaluations(evalMap);
        setKnowledgeGaps(session.knowledgeGaps || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve the interview session.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [analysisId, sessionId]);

  const handleAnswerChange = (questionId, value) => {
    if (sessionStatus === 'completed') return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    setValidationError('');
    setEvaluationError('');

    for (const q of questions) {
      const ans = answers[q.id];
      if (!ans || ans.trim() === '') {
        setValidationError('Please answer all questions before submitting.');
        return;
      }
    }

    setIsEvaluating(true);
    try {
      const sessionData = questions.map(q => ({
        question: q,
        answer: answers[q.id]
      }));

      const result = await evaluateAnswers(analysisId, sessionId, sessionData);
      
      const evalMap = {};
      result.evaluations.forEach(ev => {
        evalMap[ev.questionId] = ev;
      });
      setEvaluations(evalMap);
      setKnowledgeGaps(result.knowledgeGaps || []);
      setSessionStatus('completed');
    } catch (err) {
      setEvaluationError(err.message || 'An error occurred during evaluation.');
    } finally {
      setIsEvaluating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
        <p>Generating questions based on repository evidence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Generation Failed</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <Link to={`/projects/${analysisId}`}>
              <Button variant="secondary">Back to Report</Button>
            </Link>
            <Button variant="primary" onClick={fetchSession}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h2 className="text-xl font-bold text-zinc-100 mb-2">No Questions Generated</h2>
          <p className="text-zinc-400 mb-6">The analysis did not yield any specific questions.</p>
          <Link to={`/projects/${analysisId}`}>
            <Button variant="primary">Back to Report</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 mb-2">Technical Interview</h1>
        <p className="text-zinc-400 text-sm">
          Please answer the following questions based on your repository implementation.
        </p>
      </div>

      {validationError && (
        <div className="bg-amber-900/30 border border-amber-800/50 text-amber-200 px-4 py-3 rounded-md text-sm">
          {validationError}
        </div>
      )}

      {evaluationError && (
        <div className="bg-red-900/30 border border-red-800/50 p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-red-200 text-sm">{evaluationError}</div>
          <Button variant="primary" onClick={handleSubmit} disabled={isEvaluating}>
            Retry Submission
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, index) => {
          const evalResult = evaluations ? evaluations[q.id] : null;
          return (
            <Panel key={q.id || index} title={`Question ${index + 1}`}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  {q.category && <Badge variant="secondary">{q.category}</Badge>}
                  {q.difficulty && <Badge variant="neutral">{q.difficulty}</Badge>}
                </div>
                <p className="text-zinc-100 text-base">{q.text}</p>
                
                <div className="pt-2">
                  <textarea
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500 text-zinc-50 rounded-md px-3 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 resize-y min-h-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Type your answer here..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    disabled={isEvaluating || !!evaluations}
                  />
                </div>

                {evalResult && (
                  <div className="mt-4 p-4 rounded-md bg-zinc-800/50 border border-zinc-700 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {evalResult.isCorrect ? (
                        <Badge variant="primary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Correct
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                          Incorrect
                        </Badge>
                      )}
                      
                      <Badge variant="neutral" className="capitalize">
                        {evalResult.completeness}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {evalResult.feedback}
                    </div>

                    {evalResult.unsupportedClaims && evalResult.unsupportedClaims.length > 0 && (
                      <div className="mt-4 bg-amber-900/20 border border-amber-800/40 rounded-md p-3">
                        <h4 className="text-amber-400 text-sm font-semibold mb-2">Unsupported Claims</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {evalResult.unsupportedClaims.map((claim, idx) => (
                            <li key={idx} className="text-amber-200/90 text-sm">{claim}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      {knowledgeGaps && (
        <Panel title="Knowledge Gaps & Study Recommendations" className="mt-8">
          {knowledgeGaps.length === 0 ? (
            <div className="text-zinc-300">
              <p>Great job! No major knowledge gaps were identified based on your answers.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {knowledgeGaps.map((gap, index) => (
                <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-md p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-amber-400 bg-amber-400/10 border-amber-400/20">
                      {gap.topic}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-zinc-200 font-semibold mb-1">Identified Gap</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">{gap.gap}</p>
                  </div>
                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-1 text-sm">Recommendation</h4>
                    <p className="text-sm text-emerald-200/80 leading-relaxed">{gap.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
      
      <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-800 mt-8">
        <Link to={`/projects/${analysisId}`}>
          <Button variant="ghost" disabled={isEvaluating}>
            {evaluations ? 'Return to Report' : 'Cancel Interview'}
          </Button>
        </Link>
        
        {!evaluations && (
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={isEvaluating}
          >
            {isEvaluating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                Evaluating answers...
              </span>
            ) : (
              'Submit Answers'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
