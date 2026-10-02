const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (baseUrl.endsWith('/') && path.startsWith('/')) {
    return baseUrl + path.slice(1);
  }
  return baseUrl + path;
};

export async function analyzeProject(repositoryUrl) {
  const response = await fetch(getApiUrl('/api/projects/analyze'), {
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
}

export async function getProjectAnalysis(analysisId) {
  const response = await fetch(getApiUrl(`/api/projects/${analysisId}`));
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'An unexpected error occurred retrieving the analysis.');
  }

  return data.data;
}

export async function createInterview(analysisId) {
  const response = await fetch(getApiUrl(`/api/projects/${analysisId}/interviews`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'An unexpected error occurred creating the interview.');
  }

  return data.data;
}

export async function getInterview(analysisId, sessionId) {
  const response = await fetch(getApiUrl(`/api/projects/${analysisId}/interviews/${sessionId}`));
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'An unexpected error occurred retrieving the interview.');
  }

  return data.data;
}

export async function evaluateAnswers(analysisId, sessionId, sessionData) {
  const response = await fetch(getApiUrl(`/api/projects/${analysisId}/interviews/${sessionId}/evaluate`), {
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

  return data.data;
}
