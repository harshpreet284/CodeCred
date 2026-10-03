import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, required: true }
}, { _id: false });

const AnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const EvaluationSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  completeness: { type: String, enum: ['incomplete', 'partial', 'complete'], required: true },
  feedback: { type: String, required: true },
  unsupportedClaims: [{ type: String }]
}, { _id: false });

const KnowledgeGapSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  gap: { type: String, required: true },
  recommendation: { type: String, required: true }
}, { _id: false });

const InterviewSessionSchema = new mongoose.Schema({
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectAnalysis', required: true },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress', required: true },
  questions: { type: [QuestionSchema], default: [] },
  answers: { type: [AnswerSchema], default: [] },
  evaluations: { type: [EvaluationSchema], default: [] },
  knowledgeGaps: { type: [KnowledgeGapSchema], default: [] }
}, { timestamps: true });

export const InterviewSession = mongoose.model('InterviewSession', InterviewSessionSchema);
