export function transformSessionData(rawData: any): any {
  return {
    ...rawData,
    startTime: new Date(rawData.startTime),
    endTime: new Date(rawData.endTime),
    accuracy: rawData.correctAnswers / rawData.totalQuestions * 100,
  };
}

export function transformExamData(rawData: any): any {
  return {
    ...rawData,
    examDate: new Date(rawData.examDate),
    percentage: (rawData.totalScore / rawData.maxScore) * 100,
  };
}

export function transformWeaknessData(rawData: any): any {
  return {
    ...rawData,
    severity: calculateSeverity(rawData),
    priority: calculatePriority(rawData),
  };
}

function calculateSeverity(data: any): 'high' | 'medium' | 'low' {
  if (data.errorRate > 0.7) return 'high';
  if (data.errorRate > 0.4) return 'medium';
  return 'low';
}

function calculatePriority(data: any): number {
  return data.errorRate * data.importance * 100;
}

export function transformAnalysisResponse(response: any): any {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    analysis: {
      ...response,
      formattedResults: formatResults(response.results)
    }
  };
}

function formatResults(results: any[]): any[] {
  return results.map(result => ({
    ...result,
    confidence: Math.round(result.confidence * 100) / 100,
    displayValue: formatDisplayValue(result.value, result.type)
  }));
}

function formatDisplayValue(value: any, type: string): string {
  switch (type) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'score':
      return value.toFixed(0);
    default:
      return String(value);
  }
}
