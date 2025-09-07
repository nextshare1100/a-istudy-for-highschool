export const ANALYSIS_PROMPTS = {
  performancePrediction: `
    Based on the following learning data, predict the student's future performance:
    Current trend: {currentTrend}
    Insights: {insights}
    External factors: {externalFactors}
    Similar users data: {similarUsersData}
    
    Provide a prediction score (0-100) and confidence level.
  `,
  
  weaknessAnalysis: `
    Analyze the following study session data to identify learning weaknesses:
    Sessions: {sessions}
    Error patterns: {errorPatterns}
    
    Identify the top weaknesses and suggest improvement strategies.
  `,
  
  studyRecommendation: `
    Based on the student's performance data:
    Weaknesses: {weaknesses}
    Goals: {goals}
    Available time: {availableTime}
    
    Create a personalized study plan with specific recommendations.
  `
};

export function formatPrompt(template: string, data: Record<string, any>): string {
  let formatted = template;
  Object.entries(data).forEach(([key, value]) => {
    formatted = formatted.replace(
      new RegExp(`\\{${key}\\}`, 'g'), 
      JSON.stringify(value)
    );
  });
  return formatted;
}
