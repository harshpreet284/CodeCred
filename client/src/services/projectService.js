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
