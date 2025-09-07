export function validateAnalysisInput(input: any): boolean {
  if (!input || typeof input !== 'object') {
    return false;
  }
  
  if (!input.userId || typeof input.userId !== 'string') {
    return false;
  }
  
  if (!input.data || !Array.isArray(input.data)) {
    return false;
  }
  
  return true;
}

export function validateSessionData(session: any): boolean {
  const requiredFields = ['id', 'userId', 'startTime', 'endTime', 'duration'];
  return requiredFields.every(field => field in session);
}

export function validateExamData(exam: any): boolean {
  const requiredFields = ['id', 'userId', 'examDate', 'totalScore', 'maxScore'];
  return requiredFields.every(field => field in exam);
}

export function validateAnalysisRequest(request: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!request.userId) {
    errors.push('userId is required');
  }

  if (!request.type) {
    errors.push('analysis type is required');
  }

  if (!request.data || !Array.isArray(request.data)) {
    errors.push('data must be an array');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
