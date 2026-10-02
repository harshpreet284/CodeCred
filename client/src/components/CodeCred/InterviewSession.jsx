import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInterview, evaluateAnswers } from '../../services/projectService';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';

export function InterviewSession() {
  const { analysisId, sessionId } = useParams();
  const [questions, setQuestions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const { showToast } = useToast();

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
    for (const q of questions) {
      const ans = answers[q.id];
      if (!ans || ans.trim() === '') {
        showToast('Please answer all questions before submitting.', 'error');
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
      showToast(err.message || 'An error occurred during evaluation.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="border-b border-zinc-800 pb-6">
          <Skeleton className="h-10 w-2/3 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Session Load Failed"
        description={error}
        actionText="Back to Report"
        actionTo={`/projects/${analysisId}`}
      />
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <EmptyState
        title="No Questions Generated"
        description="The analysis did not yield any specific questions."
        actionText="Back to Report"
        actionTo={`/projects/${analysisId}`}
      />
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
