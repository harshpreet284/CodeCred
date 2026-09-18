import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generateQuestions } from '../../services/projectService';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function InterviewSession() {
  const { analysisId } = useParams();
  const [questions, setQuestions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await generateQuestions(analysisId);
      setQuestions(result.questions || []);
      setAnswers({});
    } catch (err) {
      setError(err.message || 'Failed to generate questions.');
      setQuestions(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // We wrap fetchQuestions in an IIFE to respect the mounting check
    // even though it's bound to the component scope.
    const initialize = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await generateQuestions(analysisId);
        if (isMounted) {
          setQuestions(result.questions || []);
          setAnswers({});
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to generate questions.');
          setQuestions(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();
    
    return () => { isMounted = false; };
  }, [analysisId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
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
            <Button variant="primary" onClick={fetchQuestions}>Retry</Button>
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

      <div className="space-y-6">
        {questions.map((q, index) => (
          <Panel key={q.id || index} title={`Question ${index + 1}`}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                {q.category && <Badge variant="secondary">{q.category}</Badge>}
                {q.difficulty && <Badge variant="neutral">{q.difficulty}</Badge>}
              </div>
              <p className="text-zinc-100 text-base">{q.text}</p>
              
              <div className="pt-2">
                <textarea
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500 text-zinc-50 rounded-md px-3 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 resize-y min-h-[120px]"
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              </div>
            </div>
          </Panel>
        ))}
      </div>
      
      <div className="pt-6 flex justify-between border-t border-zinc-800">
        <Link to={`/projects/${analysisId}`}>
          <Button variant="ghost">Cancel Interview</Button>
        </Link>
        {/* Answer submission/evaluation is out of scope for Task 10.4 */}
      </div>
    </div>
  );
}
