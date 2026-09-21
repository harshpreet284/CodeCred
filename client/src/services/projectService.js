export async function analyzeProject(repositoryUrl) {
  try {
    const response = await fetch('/api/projects/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ repositoryUrl })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'An unexpected error occurred during analysis.');
    }

    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function getProjectAnalysis(analysisId) {
  try {
    const response = await fetch(`/api/projects/${analysisId}`);
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'An unexpected error occurred retrieving the analysis.');
    }

    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function generateQuestions(analysisId) {
  try {
    const response = await fetch(`/api/projects/${analysisId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'An unexpected error occurred generating questions.');
    }

    return data.data;
  } catch (error) {
    throw error;
  }
}

export async function evaluateAnswers(analysisId, sessionData) {
  try {
    const response = await fetch(`/api/projects/${analysisId}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionData })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'An unexpected error occurred evaluating answers.');
    }
    
    if (!data.data || !Array.isArray(data.data.evaluations)) {
      throw new Error('Malformed evaluation response from server.');
    }
    
    for (const ev of data.data.evaluations) {
      if (!ev.questionId) {
        throw new Error('Malformed evaluation response: missing questionId.');
      }
    }

    return data.data;
  } catch (error) {
    throw error;
  }
}
