import { ProjectAnalysis } from '../models/ProjectAnalysis.js';
import { AppError } from '../utils/AppError.js';

/**
 * Saves a deterministic analysis snapshot to MongoDB
 * @param {Object} analysisPayload - The normalized Task 6 analysis output
 * @returns {Promise<Object>} The saved Mongoose document
 */
export async function saveAnalysis(analysisPayload) {
  try {
    const projectAnalysis = new ProjectAnalysis(analysisPayload);
    const saved = await projectAnalysis.save();
    return saved;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new AppError(`Analysis Validation Failed: ${error.message}`, 400, 'VALIDATION_ERROR');
    }
    throw new AppError(`Persistence failed: ${error.message}`, 500, 'PERSISTENCE_ERROR');
  }
}

/**
 * Retrieves a specific analysis snapshot by its MongoDB _id
 * @param {String} id - The MongoDB _id of the snapshot
 * @returns {Promise<Object>} The found Mongoose document
 */
export async function getAnalysisById(id) {
  try {
    const analysis = await ProjectAnalysis.findById(id);
    if (!analysis) {
      throw new AppError(`Analysis with ID ${id} not found`, 404, 'ANALYSIS_NOT_FOUND');
    }
    return analysis;
  } catch (error) {
    if (error.code === 'ANALYSIS_NOT_FOUND') {
      throw error;
    }
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      throw new AppError(`Invalid Analysis ID format`, 400, 'INVALID_ID_FORMAT');
    }
    throw new AppError(`Retrieval failed: ${error.message}`, 500, 'RETRIEVAL_ERROR');
  }
}
